import Cachemap from 'cachemap';
import { castArray, flatten, get, merge } from 'lodash';
import uuidV1 from 'uuid/v1';
import { getResponseGroup, sleep } from './helpers';
import logger from './logger';

require('es6-promise').polyfill();
require('isomorphic-fetch');

let instance;

/**
 *
 * The getta rest client
 */
export default class RestClient {
  /**
   *
   * @constructor
   * @param {Object} config
   * @return {RestClient}
   */
  constructor({
    /**
     *
     * Base url to which to make requests.
     *
     * @type {string}
     */
    baseURL,
    /**
     * How many assets can be batched together in
     * the same request.
     *
     * @type {number}
     */
    batchLimit = 20,
    /**
     *
     * Optional function used to parse the body of
     * a response prior the client returning it.
     *
     * @param {any} body
     * @return {Object}
     */
    bodyParser = body => ({ data: body }),
    /**
     *
     * Optional configuration to be passed to the
     * cachemap module.
     *
     * @type {Object}
     */
    cachemapOptions = {},
    /**
     *
     * Disables caching of responses against request url.
     *
     * @type {boolean}
     */
    disableCaching = false,
    /**
     * Any headers to be sent with requests, such as
     * authentication headers.
     *
     * @type {Object}
     */
    headers = {},
    /**
     * Whether to create a new instance of a
     * client or return the existing instance.
     *
     * @type {boolean}
     */
    newInstance = false,
    /**
     * Response stream reader to use.
     *
     * @type {string}
     */
    streamReader = 'json',
  } = {}) {
    if (instance && !newInstance) return instance;
    if (!baseURL) throw new Error('baseURL is a mandatory property for a rest client.');
    this._baseURL = baseURL;
    this._batchLimit = batchLimit;
    this._bodyParser = bodyParser;

    this._cache = new Cachemap(
      merge({ name: 'getta cachemap', redisOptions: { db: 0 } }, cachemapOptions),
    );

    this._disableCaching = disableCaching;
    this._headers = headers;
    this._streamReader = streamReader;
    instance = this;
    return instance;
  }

  /**
   *
   * @private
   * @type {Object}
   */
  _tracker = {};

  /**
   *
   * @private
   * @param {Object} context
   * @param {string} context.method
   * @param {string} context.path
   * @param {Object} context.resource
   * @param {string} context.fetchID
   * @param {Object} options
   * @param {boolean} options.batch
   * @param {number} options.batchLimit
   * @return {Object}
   */
  _batchRequest({ fetchID, method, path, resource }, { batch, batchLimit }) {
    const tracker = this._getTracker(path, method);
    let promises = [];

    for (let i = resource.active.length - 1; i >= 0; i -= 1) {
      const dedup = this._dedupFetch(resource.active[i], tracker, { fetchID, method, path });
      promises = [...promises, ...dedup.promises];
      if (dedup.pending) resource.pending = [...resource.pending, ...resource.active.splice(i, 1)];
    }

    const skip = !resource.active.length;

    if (!skip && batch) {
      resource.batched = [...resource.active];

      if (tracker.active.length && resource.batched.length < batchLimit) {
        for (let i = tracker.active.length - 1; i >= 0; i -= 1) {
          resource.batched.push(tracker.active[i].value);
          tracker.fetching.push({ fetchID, value: tracker.active[i].value });
          this._updatePendingRequests(tracker.active[i].value, { fetchID, method, path });
          tracker.active.splice(i, 1);
          if (resource.batched.length === batchLimit) break;
        }
      }
    }

    return { promises, skip };
  }

  /**
   *
   * @private
   * @param {Array<string>} resource
   * @param {number} batchLimit
   * @return {Array<Array>}
   */
  _batchResource(resource, batchLimit) {
    const batches = [];
    const countLimit = Math.ceil(resource.length / batchLimit);
    let count = 0;
    let start = 0;
    let stop = batchLimit;

    do {
      batches.push(resource.slice(start, stop));
      start += batchLimit;
      stop += batchLimit;
      count += 1;
    } while (count < countLimit);

    return batches;
  }

  /**
   *
   * @private
   * @param {Object} queryParams
   * @return {string}
   */
  _buildQueryString(queryParams) {
    let queryString = '';
    let paramCount = 0;

    Object.keys(queryParams).forEach((key) => {
      paramCount += 1;
      const prefix = paramCount === 1 ? '?' : '&';
      queryString += `${prefix}${key}=${queryParams[key]}`;
    });

    return queryString;
  }

  /**
   *
   * @private
   * @param {Object} context
   * @param {string} context.path
   * @param {Object} context.queryParams
   * @param {Array<string>} context.resource
   * @param {Object} [options]
   * @param {boolean} [options.batch]
   * @param {number} [options.batchLimit]
   * @return {Array<Object>}
   */
  _buildEndpoints({ path, queryParams, resource }, { batch, batchLimit } = {}) {
    let endpoint = resource ? `${path}/{resource}` : path;
    if (queryParams) endpoint += this._buildQueryString(queryParams);
    if (!resource) return [{ endpoint }];
    return this._populateResource(endpoint, resource, batch, batchLimit);
  }

  /**
   *
   * @private
   * @param {string} endpoint
   * @return {Promise}
   */
  async _checkCache(endpoint) {
    if (this._disableCaching) return {};
    let cacheability, data;

    try {
      cacheability = await this._cache.has(endpoint);
      if (cacheability) data = await this._cache.get(endpoint);
    } catch (err) {
      logger.error(err);
    }

    return { cacheability, data };
  }

  /**
   *
   * @private
   * @param {Object} context
   * @param {string} context.method
   * @param {string} context.path
   * @param {Object} context.resource
   * @param {string} context.fetchID
   * @return {Object}
   */
  _dedupActive({ method, path, resource, fetchID }) {
    const tracker = this._getTracker(path, method);
    const promises = [];

    if (!tracker.active.length) {
      tracker.active = resource.active.map(value => ({ fetchID, value }));
      return { promises };
    }

    for (let i = resource.active.length - 1; i >= 0; i -= 1) {
      const match = tracker.active.find(obj => obj.value === resource.active[i]);

      if (match) {
        if (!tracker.pending[resource.active[i]]) tracker.pending[resource.active[i]] = [];

        promises.push(this._setPendingRequest(
          tracker.pending[resource.active[i]], match.fetchID, fetchID,
        ));

        resource.pending = [...resource.pending, ...resource.active.splice(i, 1)];
      }
    }

    if (resource.active.length) {
      tracker.active = [...tracker.active, ...resource.active.map(value => ({ fetchID, value }))];
    }

    return { promises };
  }

  /**
   *
   * @private
   * @param {string} resource
   * @param {Object} tracker
   * @param {Array<string>} tracker.active
   * @param {Array<string>} tracker.fetching
   * @param {Object} tracker.pending
   * @param {Object} context
   * @param {string} context.method
   * @param {string} context.fetchID
   * @param {string} context.path
   * @return {Object}
   */
  _dedupFetch(resource, { active, fetching, pending }, { method, fetchID, path }) {
    const index = active.findIndex(obj => obj.value === resource);
    const activeMatch = (index !== -1) ? active.splice(index, 1)[0] : null;
    const activeFetchID = activeMatch ? activeMatch.fetchID : fetchID;
    const fetchMatch = fetching.find(obj => obj.value === resource);
    const promises = [];

    if (!fetchMatch) {
      fetching.push({ fetchID: activeFetchID, value: resource });
      return { promises };
    }

    if (!pending[resource]) pending[resource] = [];

    promises.push(this._setPendingRequest(
      pending[resource], fetchMatch.fetchID, activeFetchID,
    ));

    this._updatePendingRequests(resource, { fetchID: fetchMatch.fetchID, method, path });
    return { pending: true, promises };
  }

  /**
   *
   * @private
   * @param {string} endpoint
   * @param {Array<string>} values
   * @param {Object} context
   * @param {Object} options
   * @return {Promise}
   */
  async _delete(endpoint, values, context, options) {
    const method = 'DELETE';
    const fetchOptions = { headers: new Headers(options.headers), method };
    const metadata = { errors: [], resource: values };
    const { data } = await this._fetch(method, endpoint, fetchOptions, context, options, metadata);
    return data;
  }

  /**
   *
   * @private
   * @param {string} endpoint
   * @return {Promise}
   */
  async _deleteCacheEntry(endpoint) {
    if (this._disableCaching) return;

    try {
      this._cache.delete(endpoint);
    } catch (err) {
      logger.error(err);
    }
  }

  /**
   *
   * @private
   * @param {string} method
   * @param {string} endpoint
   * @param {Object} fetchOptions
   * @param {Object} context
   * @param {Object} options
   * @param {Object} metadata
   * @return {Promise}
   */
  async _fetch(method, endpoint, fetchOptions, context, options, metadata) {
    let res, errors;

    try {
      logger.info(`${method}: ${this._baseURL}${endpoint}`);
      res = await fetch(`${this._baseURL}${endpoint}`, fetchOptions);
    } catch (err) {
      errors = err;
      logger.error(errors);
    }

    if (errors) {
      errors = castArray(errors);
      return this._resolveFetch(context, options, res, { endpoint, errors });
    }

    const { ok, status, statusText } = res;
    const responseGroup = getResponseGroup(status);
    const _metadata = { ...metadata, endpoint, method, ok, responseGroup, status, statusText };

    if (responseGroup === 'redirection' && res.headers.get('location')) {
      return this._handleRedirect(method, fetchOptions, context, options, res, _metadata);
    }

    if (responseGroup === 'serverError') {
      return this._handleRetry(
        method, endpoint, fetchOptions, context, options, res, _metadata,
      );
    }

    return this._resolveFetch(context, options, res, _metadata);
  }

  /**
   *
   * @private
   * @param {string} endpoint
   * @param {Array<string>} values
   * @param {Object} context
   * @param {Object} options
   * @param {string} resourceKey
   * @return {Promise}
   */
  async _get(endpoint, values, context, options, resourceKey) {
    const cache = await this._checkCache(endpoint);
    const { cacheability } = cache;
    let res, fromCache;

    if (!cacheability || cacheability.noCache || !cacheability.check()) {
      const headers = { ...options.headers };
      const etag = cacheability && cacheability.etag;
      if (etag) headers['If-None-Match'] = etag;
      const method = 'GET';
      const fetchOptions = { headers: new Headers(headers), method };
      const metadata = { errors: [], resource: values };
      res = await this._fetch(method, endpoint, fetchOptions, context, options, metadata);
    } else {
      fromCache = true;
      const requests = this._getRequestsTracker(context.path, context.method, context.fetchID);
      requests.push({ endpoint, fromCache, resource: values });
    }

    const metadata = res ? res.metadata : {};
    const data = fromCache || metadata.status === 304 ? cache.data : res.data;
    if (metadata.ok || metadata.status === 304) this._setCacheEntry(endpoint, data, res.headers);
    if (metadata.status === 404) this._deleteCacheEntry(endpoint);
    const castData = data ? castArray(data) : [];
    if (values.length) this._resolveRequests(resourceKey, values, castData, context, metadata);
    if (!context.resource) return castData;
    return this._resolveResource(resourceKey, context.resource.active, castData);
  }

  /**
   *
   * @private
   * @param {string} path
   * @param {string} method
   * @param {string} fetchID
   * @return {string}
   */
  _getRequestsTracker(path, method, fetchID) {
    const { requests } = this._getTracker(path, method);
    if (!requests[fetchID]) requests[fetchID] = [];
    return requests[fetchID];
  }

  /**
   *
   * @private
   * @param {string} path
   * @param {string} method
   * @return {string}
   */
  _getTracker(path, method) {
    return this._tracker[path][method];
  }

  /**
   *
   * @private
   * @param {string} method
   * @param {Object} fetchOptions
   * @param {Object} context
   * @param {Object} options
   * @param {Object} res
   * @param {Object} metadata
   * @return {Promise}
   */
  async _handleRedirect(method, fetchOptions, context, options, res, metadata) {
    if (!metadata.redirects) metadata.redirects = 1;

    if (metadata.redirects === 5) {
      metadata.errors.push('The request exceeded the maximum number of redirects.');
      return this._resolveFetch(context, options, res, metadata);
    }

    metadata.redirects += 1;
    const redirectMethod = metadata.status === 303 ? 'GET' : method;
    const location = res.headers.get('location');
    return this._fetch(redirectMethod, location, fetchOptions, context, options, metadata);
  }

  /**
   *
   * @private
   * @param {string} method
   * @param {string} endpoint
   * @param {Object} fetchOptions
   * @param {Object} context
   * @param {Object} options
   * @param {Object} res
   * @param {Object} metadata
   * @return {Promise}
   */
  async _handleRetry(method, endpoint, fetchOptions, context, options, res, metadata) {
    if (!metadata.retries) {
      metadata.retries = 1;
      metadata.retryTimer = 100;
    }

    if (metadata.retries === 3) return this._resolveFetch(context, options, res, metadata);
    metadata.retries += 1;
    metadata.retryTimer *= 2;
    await sleep(metadata.retryTimer);
    return this._fetch(method, endpoint, fetchOptions, context, options, metadata);
  }

  /**
   *
   * @private
   * @param {string} endpoint
   * @param {Array<string>} resource
   * @param {boolean} batch
   * @param {number} batchLimit
   * @return {Array<Object>}
   */
  _populateResource(endpoint, resource, batch, batchLimit) {
    const regex = /{resource}/;
    const endpoints = [];

    if (!batch) {
      resource.forEach((value) => {
        endpoints.push({ endpoint: endpoint.replace(regex, value), values: value });
      });
    } else if (resource.length <= batchLimit) {
      endpoints.push({ endpoint: endpoint.replace(regex, resource.sort().join(',')), values: resource });
    } else {
      this._batchResource(resource, batchLimit).forEach((group) => {
        endpoints.push({ endpoint: endpoint.replace(regex, group.sort().join(',')), values: group });
      });
    }

    return endpoints;
  }

  /**
   *
   * @private
   * @param {string} endpoint
   * @param {any} body
   * @param {Object} context
   * @param {Object} options
   * @return {Promise}
   */
  async _post(endpoint, body, context, options) {
    const method = 'POST';
    const fetchOptions = { body, headers: new Headers(options.headers), method };
    const metadata = { errors: [], resource: [] };
    const { data } = await this._fetch(method, endpoint, fetchOptions, context, options, metadata);
    return data;
  }

  /**
   *
   * @private
   * @param {Array<Promise>} promises
   * @param {Object} context
   * @param {string} context.fetchID
   * @param {string} context.method
   * @param {string} context.path
   * @return {Object}
   */
  async _resolveData(promises, { fetchID, method, path }) {
    const data = flatten(await Promise.all(promises)).filter(value => !!value);
    const metadata = this._getRequestsTracker(path, method, fetchID);
    return { data, metadata };
  }

  /**
   *
   * @private
   * @param {Object} context
   * @param {Object} options
   * @param {Object} res
   * @param {Object} metadata
   * @return {Promise}
   */
  async _resolveFetch(context, options, res, metadata) {
    const requests = this._getRequestsTracker(context.path, context.method, context.fetchID);

    if (!res) {
      requests.push(metadata);
      return { metadata };
    }

    const headers = res.headers;

    if (!headers.get('content-type')) {
      requests.push(metadata);
      return { headers, metadata };
    }

    const parsed = options.bodyParser(await res[options.streamReader](), context, metadata);

    if (parsed.errors) {
      const errors = castArray(parsed.errors);
      metadata.errors = [...metadata.errors, ...errors];
    }

    requests.push(metadata);
    return { data: parsed.data, headers, metadata };
  }

  /**
   *
   * @private
   * @param {string} resourceKey
   * @param {Array<string>} values
   * @param {Array<any>} data
   * @param {Object} context
   * @param {string} context.fetchID
   * @param {string} context.method
   * @param {string} context.path
   * @param {Object} metadata
   * @return {void}
   */
  async _resolveRequests(resourceKey, values, data, { fetchID, method, path }, metadata) {
    const { fetching, pending } = this._getTracker(path, method);

    values.forEach((value) => {
      const index = fetching.findIndex(obj => obj.value === value);
      if (index !== -1) fetching.splice(index, 1);
      const match = data.find(obj => get(obj, [resourceKey], null) === value);
      if (!pending[value]) return;

      for (let i = pending[value].length - 1; i >= 0; i -= 1) {
        if (pending[value][i].batchID === fetchID) {
          const _fetchID = pending[value][i].fetchID;
          const requests = this._getRequestsTracker(path, method, _fetchID);
          requests.push({ batched: true, ...metadata });
          pending[value][i].resolve(match);
          pending[value].splice(i, 1);
        }
      }
    });
  }

  /**
   *
   * @private
   * @param {string} key
   * @param {Array<string>} values
   * @param {Array<Object>} data
   * @return {Array<Object>}
   */
  _resolveResource(key, values, data) {
    const filtered = [];

    values.forEach((value) => {
      const match = data.find(obj => get(obj, [key], null) === value);
      if (match) filtered.push(match);
    });

    return filtered;
  }

  /**
   *
   * @private
   * @param {string} endpoint
   * @param {Array<Object>} data
   * @param {Headers} headers
   * @return {Promise}
   */
  async _setCacheEntry(endpoint, data, headers) {
    if (this._disableCaching) return;

    try {
      this._cache.set(endpoint, data, { cacheHeaders: {
        cacheControl: headers.get('cache-control'),
        etag: headers.get('etag'),
      } });
    } catch (err) {
      logger.error(err);
    }
  }

  /**
   *
   * @private
   * @param {string} method
   * @param {string} path
   * @param {string|Array<string>} resource
   * @param {Object} queryParams
   * @return {Object}
   */
  _setContext(method, path, resource, queryParams) {
    let _resource = null;

    if (resource) {
      const values = castArray(resource);
      _resource = method === 'GET' ? { active: values, batched: [], pending: [] } : { values };
    }

    return { method, path, resource: _resource, queryParams, fetchID: uuidV1() };
  }

  /**
   *
   * @private
   * @param {Object} options
   * @return {Object}
   */
  _setOptions(options) {
    const defaultOptions = {
      batchLimit: this._batchLimit,
      bodyParser: this._bodyParser,
      headers: { ...this._headers },
      streamReader: this._streamReader,
    };

    return merge(defaultOptions, options);
  }

  /**
   *
   * @private
   * @param {string} path
   * @param {string} method
   * @return {void}
   */
  _setTracker(path, method) {
    if (get(this._tracker, [path, method], null)) return;
    this._tracker[path] = {};
    this._tracker[path][method] = { active: [], fetching: [], pending: {}, requests: {} };
  }

  /**
   *
   * @private
   * @param {Array<Object>} pending
   * @param {string} batchID
   * @param {string} fetchID
   * @return {Promise}
   */
  _setPendingRequest(pending, batchID, fetchID) {
    return new Promise((resolve) => {
      pending.push({ batchID, fetchID, resolve });
    });
  }

  /**
   *
   * @private
   * @param {string} method
   * @param {string} path
   * @param {string|Array<string>} resource
   * @param {Object} queryParams
   * @param {Object} options
   * @return {Object}
   */
  _setupRequest(method, path, resource, queryParams, options) {
    this._setTracker(path, method);
    const context = this._setContext(method, path, resource, queryParams);
    const _options = this._setOptions(options);
    return { context, _options };
  }

  /**
   *
   * @private
   * @param {string} resource
   * @param {Object} context
   * @param {string} context.fetchID
   * @param {string} context.method
   * @param {string} context.path
   * @return {void}
   */
  _updatePendingRequests(resource, { fetchID, method, path }) {
    const { pending } = this._getTracker(path, method);

    if (pending[resource]) {
      pending[resource].forEach((obj) => {
        obj.batchID = fetchID;
      });
    }
  }

  /**
   *
   * @param {Object} config
   * @param {Object} [config.options]
   * @param {string} config.path
   * @param {Object} [config.queryParams]
   * @param {string|Array<string>} [config.resource]
   * @return {Promise}
   */
  async delete({ options = {}, path, queryParams = null, resource = null } = {}) {
    if (!path) return null;
    const { context, _options } = this._setupRequest('DELETE', path, resource, queryParams, options);

    const endpoints = this._buildEndpoints({
      path, queryParams, resource: resource ? context.resource.values : null,
    }, _options);

    const promises = [];

    endpoints.forEach(({ endpoint, values }) => {
      const castValues = values ? castArray(values) : [];
      promises.push(this._delete(endpoint, castValues, context, _options));
    });

    return this._resolveData(promises, context);
  }

  /**
   *
   * @param {Object} config
   * @param {Object} [config.options]
   * @param {string} config.path
   * @param {Object} [config.queryParams]
   * @param {string|Array<string>} [config.resource]
   * @param {string} [config.resourceKey]
   * @return {Promise}
   */
  async get({ options = {}, path, queryParams = null, resource = null, resourceKey = 'id' } = {}) {
    if (!path) return null;
    const { context, _options } = this._setupRequest('GET', path, resource, queryParams, options);
    let endpointsResource, skip;
    let promises = [];

    if (resource) {
      const dedup = this._dedupActive(context);

      const batch = await new Promise((resolve) => {
        setImmediate(() => {
          resolve(this._batchRequest(context, _options));
        });
      });

      endpointsResource = _options.batch ? context.resource.batched : context.resource.active;
      promises = [...dedup.promises, ...batch.promises];
      skip = batch.skip;
    }

    if (!skip) {
      const endpoints = this._buildEndpoints({
        path, queryParams, resource: endpointsResource,
      }, _options);

      endpoints.forEach(({ endpoint, values }) => {
        const castValues = values ? castArray(values) : [];
        promises.push(this._get(endpoint, castValues, context, _options, resourceKey));
      });
    }

    return this._resolveData(promises, context);
  }

  /**
   *
   * @param {Object} config
   * @param {any} config.body
   * @param {Object} [config.options]
   * @param {string} config.path
   * @param {Object} [config.queryParams]
   * @param {string|Array<string>} [config.resource]
   * @return {Promise}
   */
  async post({ body, options = {}, path, queryParams = null, resource = null } = {}) {
    if (!path || !body) return null;
    const { context, _options } = this._setupRequest('POST', path, resource, queryParams, options);
    const endpoints = this._buildEndpoints({ path, queryParams });
    const promises = [];

    endpoints.forEach(({ endpoint }) => {
      promises.push(this._post(endpoint, body, context, _options));
    });

    return this._resolveData(promises, context);
  }

  /**
   *
   * @param {string} method
   * @param {string} name
   * @param {Object} baseConfig
   * @return {void}
   */
  shortcut(method, name, baseConfig) {
    const methods = ['get', 'head', 'patch', 'post', 'put', 'delete'];
    if (!methods.find(value => value === method)) return;

    /**
     *
     * @param {Object} [config]
     * @return {void}
     */
    this[name] = (config = {}) => this[method](merge({}, baseConfig, config));
  }
}
