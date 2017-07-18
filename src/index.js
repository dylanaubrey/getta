import Cachemap from 'cachemap';
import { castArray, flatten, isArray, merge } from 'lodash';
import uuidV1 from 'uuid/v1';
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
     * The client requires any data returned to be
     * on a property of 'data' and any errors returned
     * to be on a property of 'errors'.
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
    /**
     * Optional reference object used to store
     * request information against a unique
     * identifier on the context.
     *
     * @type {Object}
     */
    tracker = {},
  } = {}) {
    if (instance && !newInstance) {
      return instance;
    }

    if (!baseURL) {
      throw new Error('baseURL is a mandatory property for a rest client.');
    }

    this._baseURL = baseURL;
    this._batchLimit = batchLimit;
    this._bodyParser = bodyParser;

    this._cache = new Cachemap(
      merge({ name: 'getta cachemap', redisOptions: { db: 0 } }, cachemapOptions),
    );

    this._disableCaching = disableCaching;
    this._headers = headers;
    this._streamReader = streamReader;
    this._tracker = tracker;
    instance = this;
    return instance;
  }

  /**
   *
   * @private
   * @param {Object} context
   * @param {string} context.path
   * @param {Object} context.resource
   * @param {string} context.fetchID
   * @param {string} context.requestID
   * @param {Object} options
   * @param {boolean} options.batch
   * @param {number} options.batchLimit
   * @return {Object}
   */
  _batchRequest({ path, resource, fetchID, requestID }, { batch, batchLimit }) {
    const tracker = this._getTracker(requestID, path);

    let promises = [];

    for (let i = resource.active.length - 1; i >= 0; i -= 1) {
      const dedup = this._dedupFetch(path, tracker, resource.active[i], fetchID, requestID);
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

          this._updatePendingRequests(
            { fetchID, resource: tracker.active[i].value }, requestID, path,
          );

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
   * @param {string} context.path
   * @param {Object} context.resource
   * @param {string} context.fetchID
   * @param {string} context.requestID
   * @return {Object}
   */
  _dedupActive({ path, resource, fetchID, requestID }) {
    const tracker = this._getTracker(requestID, path);
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
          tracker.pending[resource.active[i]], { fetchID: match.fetchID },
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
   * @param {string} path
   * @param {Object} tracker
   * @param {string} resource
   * @param {string} fetchID
   * @param {string} requestID
   * @return {Object}
   */
  _dedupFetch(path, tracker, resource, fetchID, requestID) {
    const index = tracker.active.findIndex(obj => obj.value === resource);
    const activeMatch = (index !== -1) ? tracker.active.splice(index, 1)[0] : null;
    const activeFetchID = activeMatch ? activeMatch.fetchID : fetchID;
    const fetchMatch = tracker.fetching.find(obj => obj.value === resource);
    const promises = [];

    if (!fetchMatch) {
      tracker.fetching.push({ fetchID: activeFetchID, value: resource });
      return { promises };
    }

    if (!tracker.pending[resource]) tracker.pending[resource] = [];

    promises.push(this._setPendingRequest(
      tracker.pending[resource], { fetchID: fetchMatch.fetchID },
    ));

    this._updatePendingRequests({ fetchID: fetchMatch.fetchID, resource }, requestID, path);
    return { pending: true, promises };
  }

  /**
   *
   * @private
   * @param {string} endpoint
   * @param {Object} context
   * @param {Object} options
   * @return {Promise}
   */
  async _delete(endpoint, context, options) {
    const method = 'DELETE';
    const fetchOptions = { headers: new Headers(options.headers), method };
    const { data, errors } = await this._fetch(method, endpoint, fetchOptions, context, options);
    return errors || data;
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
   * @return {Promise}
   */
  async _fetch(method, endpoint, fetchOptions, context, options) {
    let res, errors;

    try {
      logger.info(`${method}: ${this._baseURL}${endpoint}`);
      res = await fetch(`${this._baseURL}${endpoint}`, fetchOptions);
    } catch (err) {
      errors = err;
      logger.error(errors);
    }

    if (errors) return { errors, status: res.status };
    const body = options.bodyParser(await res[options.streamReader](), context);
    if (body.errors) return { errors: body.errors, status: res.status };
    return { data: body.data, headers: res.headers, status: res.status };
  }

  /**
   *
   * @private
   * @param {string} endpoint
   * @param {string|Array<string>} values
   * @param {Object} context
   * @param {Object} options
   * @param {string} resourceKey
   * @return {Promise}
   */
  async _get(endpoint, values, context, options, resourceKey) {
    const cache = await this._checkCache(endpoint);
    const { cacheability } = cache;
    let res;

    if (!cacheability || cacheability.noCache || !cacheability.check()) {
      const headers = options.headers;
      const etag = cacheability && cacheability.etag;
      if (etag) headers['If-None-Match'] = etag;
      const method = 'GET';
      const fetchOptions = { headers: new Headers(headers), method };
      res = await this._fetch(method, endpoint, fetchOptions, context, options);
    }

    let data = !res || res.status === '304' ? cache.data : res.data;
    const errors = res && res.errors;
    if (res && !errors) this._setCacheEntry(endpoint, data, res.headers);
    if (errors && res.status === '404') this._deleteCacheEntry(endpoint);
    data = data ? castArray(data) : [];
    const _values = values ? castArray(values) : [];
    this._resolveRequests(resourceKey, _values, { data, errors }, context);
    if (errors) return errors;
    if (!context.resource) return data;
    return this._resolveResource(resourceKey, context.resource.active, data);
  }

  /**
   *
   * @private
   * @param {string} requestID
   * @param {string} path
   * @param {string} method
   * @return {string}
   */
  _getTracker(requestID, path) {
    if (requestID && !this._tracker[requestID]) this._tracker[requestID] = {};
    let tracker = requestID ? this._tracker[requestID] : this._tracker;
    if (!tracker[path]) tracker[path] = {};
    tracker = tracker[path];
    if (!tracker.active) tracker.active = [];
    if (!tracker.fetching) tracker.fetching = [];
    if (!tracker.pending) tracker.pending = {};
    return tracker;
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
    const { data, errors } = await this._fetch(method, endpoint, fetchOptions, context, options);
    return errors || data;
  }

  /**
   *
   * @private
   * @param {string} resourceKey
   * @param {string|Array<string>} values
   * @param {Object} res
   * @param {Array<Object>} res.data
   * @param {Object} res.errors
   * @param {Object} context
   * @param {string} context.fetchID
   * @param {string} context.requestID
   * @param {string} context.path
   * @return {void}
   */
  async _resolveRequests(resourceKey, values, { data, errors }, { fetchID, requestID, path }) {
    if (!values.length) return;
    const { fetching, pending } = this._getTracker(requestID, path);

    values.forEach((value) => {
      const index = fetching.findIndex(obj => obj.value === value);
      if (index !== -1) fetching.splice(index, 1);
      const match = errors || data.find(obj => obj[resourceKey] === value);
      if (!pending[value]) return;

      for (let i = pending[value].length - 1; i >= 0; i -= 1) {
        if (pending[value][i].fetchID === fetchID) {
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
   * @param {Object|Array<Object>} data
   * @return {Array<Object>}
   */
  _resolveResource(key, values, data) {
    const filtered = [];

    values.forEach((value) => {
      const match = data.find(obj => obj[key] === value);
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
        cacheControl: headers.get('Cache-Control'),
        etag: headers.get('Etag'),
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
   * @param {Object} context
   * @return {Object}
   */
  _setContext(method, path, resource, queryParams, context) {
    let _resource = null;

    if (resource) {
      const values = isArray(resource) ? [...resource] : resource;

      if (method === 'GET') {
        _resource = { active: castArray(values), batched: [], pending: [] };
      } else {
        _resource = { values: castArray(values) };
      }
    }

    return { ...{ path, resource: _resource, queryParams, fetchID: uuidV1() }, ...context };
  }

  /**
   *
   * @param {Object} options
   * @return {Object}
   */
  _setOptions(options) {
    const defaultOptions = {
      batchLimit: this._batchLimit,
      bodyParser: this._bodyParser,
      headers: this._headers,
      streamReader: this._streamReader,
    };

    return merge(defaultOptions, options);
  }

  /**
   *
   * @private
   * @param {Array<Function>} pending
   * @param {Object} context
   * @param {string} context.fetchID
   * @return {Promise}
   */
  _setPendingRequest(pending, { fetchID }) {
    return new Promise((resolve) => {
      pending.push({ fetchID, resolve });
    });
  }

  /**
   *
   * @private
   * @param {Object} context
   * @param {string} context.fetchID
   * @param {string} context.resource
   * @param {string} requestID
   * @param {string} path
   * @return {void}
   */
  _updatePendingRequests({ fetchID, resource }, requestID, path) {
    const { pending } = this._getTracker(requestID, path);

    if (pending[resource]) {
      pending[resource].forEach((obj) => {
        obj.fetchID = fetchID;
      });
    }
  }

  /**
   *
   * @param {Object} config
   * @param {Object} [config.context]
   * @param {Object} [config.options]
   * @param {string} config.path
   * @param {Object} [config.queryParams]
   * @param {Object} [config.resource]
   * @return {Promise}
   */
  async delete({ context = {}, options = {}, path, queryParams = null, resource = null } = {}) {
    if (!path) return null;
    const _context = this._setContext('DELETE', path, resource, queryParams, context);
    const _options = this._setOptions(options);

    const endpoints = this._buildEndpoints({
      path, queryParams, resource: resource ? _context.resource.values : null,
    }, _options);

    const promises = [];

    endpoints.forEach(({ endpoint }) => {
      promises.push(this._delete(endpoint, _context, _options));
    });

    return flatten(await Promise.all(promises)).filter(value => !!value);
  }

  /**
   *
   * @param {Object} config
   * @param {Object} [config.context]
   * @param {Object} [config.options]
   * @param {string} config.path
   * @param {Object} [config.queryParams]
   * @param {string|Array<string>} [config.resource]
   * @param {string} [config.resourceKey]
   * @return {Promise}
   */
  async get({ context = {}, options = {}, path, queryParams = null, resource = null, resourceKey = 'id' } = {}) {
    if (!path) return null;
    const _context = this._setContext('GET', path, resource, queryParams, context);
    const _options = this._setOptions(options);
    let endpointsResource, skip;
    let promises = [];

    if (resource) {
      const dedup = this._dedupActive(_context);

      const batch = await new Promise((resolve) => {
        setImmediate(() => {
          resolve(this._batchRequest(_context, _options));
        });
      });

      endpointsResource = _options.batch ? _context.resource.batched : _context.resource.active;
      promises = [...dedup.promises, ...batch.promises];
      skip = batch.skip;
    }

    if (!skip) {
      const endpoints = this._buildEndpoints({
        path, queryParams, resource: endpointsResource,
      }, _options);

      endpoints.forEach(({ endpoint, values }) => {
        promises.push(this._get(endpoint, values, _context, _options, resourceKey));
      });
    }

    return flatten(await Promise.all(promises)).filter(value => !!value);
  }

  /**
   *
   * @param {Object} config
   * @param {any} config.body
   * @param {Object} [config.context]
   * @param {Object} [config.options]
   * @param {string} config.path
   * @param {Object} [config.queryParams]
   * @param {Object} [config.resource]
   * @param {string} [config.resourceKey]
   * @return {Promise}
   */
  async post({ body, context = {}, options = {}, path, queryParams = null, resource = null } = {}) {
    if (!path || !body) return null;
    const _context = this._setContext('POST', path, resource, queryParams, context);
    const _options = this._setOptions(options);
    const endpoints = this._buildEndpoints({ path, queryParams });
    const promises = [];

    endpoints.forEach(({ endpoint }) => {
      promises.push(this._post(endpoint, body, _context, _options));
    });

    return flatten(await Promise.all(promises)).filter(value => !!value);
  }

  /**
   *
   * @param {string} method
   * @param {string} name
   * @param {Object} baseConfig
   * @return {void}
   */
  shortcut(method, name, baseConfig) {
    const methods = ['get', 'post', 'put', 'delete'];
    if (!methods.find(value => value === method)) return;

    /**
     *
     * @param {Object} [config]
     * @return {void}
     */
    this[name] = (config = {}) => this[method](merge({}, baseConfig, config));
  }
}
