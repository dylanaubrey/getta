import Cachemap from 'cachemap';
import { castArray, flatten, get, isArray, isString, merge } from 'lodash';
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
    cachemapOptions,
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
    this._cache = new Cachemap(cachemapOptions);
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
   * @param {string} path
   * @param {Object} tracker
   * @param {string} resource
   * @param {string} fetchID
   * @param {string} requestID
   * @return {Object}
   */
  _addToFetch(path, tracker, resource, fetchID, requestID) {
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
      const added = this._addToFetch(path, tracker, resource.active[i], fetchID, requestID);
      promises = [...promises, ...added.promises];
      if (added.pending) resource.pending = [...resource.pending, ...resource.active.splice(i, 1)];
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
   * @param {Object} context
   * @param {string} context.path
   * @param {Object} context.resource
   * @param {Object} context.queryParams
   * @return {Promise}
   */
  async _checkCache({ path, resource, queryParams }) {
    if (this._disableCaching) return {};

    const endpoints = this._buildEndpoints({
      path, resource: resource ? resource.active : null, queryParams,
    });

    const promises = [];

    endpoints.forEach(({ endpoint, values }) => {
      promises.push(this._checkEntry(endpoint, values, resource));
    });

    let data = await Promise.all(promises);
    data = data.filter(value => !!value);
    const skip = (resource && !resource.active.length) || (!resource && data.length);
    return { data, skip };
  }

  /**
   *
   * @private
   * @param {string} endpoint
   * @param {string} value
   * @param {Object} resource
   * @return {Object}
   */
  async _checkEntry(endpoint, value, resource) {
    let data;

    try {
      if (await this._cache.has(endpoint)) data = await this._cache.get(endpoint);
    } catch (err) {
      logger.error(err);
    }

    // TODO: Check if Etag was returned and if so, send request
    // to server to validate whether cache is still valid.

    if (data && resource) {
      const index = resource.active.findIndex(val => val === value);
      if (index !== -1) resource.active.splice(index, 1);
    }

    return data;
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
  _dedupRequest({ path, resource, fetchID, requestID }) {
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
   * @param {string} endpoint
   * @param {Array<string>} values
   * @param {Object} context
   * @param {Object} options
   * @param {string} resourceKey
   * @return {Promise}
   */
  async _delete(endpoint, values, context, options, resourceKey) {
    const res = await this._fetch('DELETE', endpoint, context, options);
    if (res.errors) return res.errors;

    if (res.data) {
      const data = castArray(res.data);
      this._deleteCache(data, context.path, context.queryParams, resourceKey);
    }

    return res.data;
  }

  /**
   *
   * @private
   * @param {Array<Object>} data
   * @param {string} path
   * @param {Object} queryParams
   * @param {string} key
   * @return {Promise}
   */
  async _deleteCache(data, path, queryParams, key) {
    if (this._disableCaching) return;

    data.forEach((value) => {
      if (!get(value, [key], null)) return;
      const endpoints = this._buildEndpoints({ path, queryParams, resource: [value[key]] });
      if (!get(endpoints, [0, 'endpoint'], null)) return;

      try {
        this._cache.delete(endpoints[0].endpoint);
      } catch (err) {
        logger.error(err);
      }
    });
  }

  /**
   *
   * @private
   * @param {string} method
   * @param {string} endpoint
   * @param {Object} context
   * @param {Object} options
   * @param {any} content
   * @return {Promise}
   */
  async _fetch(method, endpoint, context, options, content) {
    let res, errors;

    try {
      logger.info(`${method}: ${this._baseURL}${endpoint}`);
      let _content;
      if (content && !isString(content)) _content = JSON.stringify(content);

      res = await fetch(`${this._baseURL}${endpoint}`, {
        body: _content, headers: new Headers(options.headers), method,
      });
    } catch (err) {
      errors = err;
      logger.error(err);
    }

    if (errors) return { errors, status: res.status };
    let body = await res[options.streamReader]();
    body = options.bodyParser(body, context);
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
    const res = await this._fetch('GET', endpoint, context, options);
    const data = res.data ? castArray(res.data) : [];
    const errors = res.errors;
    const _values = values ? castArray(values) : [];
    this._resolveRequests({ data, errors }, _values, context, resourceKey);
    if (errors) return errors;

    if (data.length) {
      this._setCache(data, res.headers, context.path, context.queryParams, resourceKey);
    }

    if (!context.resource) return data;
    return this._resolveResource(data, resourceKey, context.resource.active);
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
   * @param {Object} context
   * @param {Object} options
   * @param {any} body
   * @param {string} resourceKey
   * @return {Promise}
   */
  async _post(endpoint, context, options, body, resourceKey) {
    const res = await this._fetch('POST', endpoint, context, options, body);
    if (res.errors) return res.errors;

    if (res.data) {
      this._setCache(castArray(res.data), res.headers, context.path, null, resourceKey);
    }

    return res.data;
  }

  /**
   *
   * @private
   * @param {Object} res
   * @param {Array<Object>} res.data
   * @param {Object} res.errors
   * @param {string|Array<string>} values
   * @param {Object} context
   * @param {string} context.fetchID
   * @param {string} context.requestID
   * @param {string} context.path
   * @param {string} resourceKey
   * @return {void}
   */
  async _resolveRequests({ data, errors }, values, { fetchID, requestID, path }, resourceKey) {
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
   * @param {Object|Array<Object>} data
   * @param {string} key
   * @param {Array<string>} values
   * @return {Array<Object>}
   */
  _resolveResource(data, key, values) {
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
   * @param {Array<Object>} data
   * @param {Headers} headers
   * @param {string} path
   * @param {Object} queryParams
   * @param {string} key
   * @return {Promise}
   */
  async _setCache(data, headers, path, queryParams, key) {
    if (this._disableCaching) return;

    data.forEach((value) => {
      if (!get(value, [key], null)) return;
      const endpoints = this._buildEndpoints({ path, queryParams, resource: [value[key]] });
      if (!get(endpoints, [0, 'endpoint'], null)) return;

      try {
        this._cache.set(endpoints[0].endpoint, value, { cacheHeaders: {
          cacheControl: headers.get('Cache-Control'),
          etag: headers.get('Etag'),
        } });
      } catch (err) {
        logger.error(err);
      }
    });
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
   * @param {string} [config.resourceKey]
   * @return {Promise}
   */
  async delete({
    context = {},
    options = {},
    path,
    queryParams = null,
    resource = null,
    resourceKey = 'id',
  } = {}) {
    if (!path) return null;
    const _context = this._setContext('DELETE', path, resource, queryParams, context);
    const _options = this._setOptions(options);

    const endpoints = this._buildEndpoints({
      path, queryParams, resource: resource ? _context.resource.values : null,
    }, _options);

    const promises = [];

    endpoints.forEach(({ endpoint, values }) => {
      promises.push(this._delete(endpoint, values, _context, _options, resourceKey));
    });

    let res = flatten(await Promise.all(promises));
    res = res.filter(value => !!value);
    return res;
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
  async get({
    context = {},
    options = {},
    path,
    queryParams = null,
    resource = null,
    resourceKey = 'id',
  } = {}) {
    if (!path) return null;
    const _context = this._setContext('GET', path, resource, queryParams, context);
    const _options = this._setOptions(options);
    const check = await this._checkCache(_context);
    if (check.skip) return check.data;
    let endpointsResource, skip;
    let promises = [];

    if (resource) {
      const dedup = this._dedupRequest(_context);

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

    let data = flatten(await Promise.all(promises));
    if (check.data.length) data = [...data, ...check.data];
    data = data.filter(value => !!value);
    return data;
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
  async post({
    body,
    context = {},
    options = {},
    path,
    queryParams = null,
    resource = null,
    resourceKey = 'id',
  } = {}) {
    if (!path || !body) return null;
    const _context = this._setContext('POST', path, resource, queryParams, context);
    const _options = this._setOptions(options);
    const endpoints = this._buildEndpoints({ path, queryParams });
    const promises = [];

    endpoints.forEach(({ endpoint }) => {
      promises.push(this._post(endpoint, _context, _options, body, resourceKey));
    });

    let data = flatten(await Promise.all(promises));
    data = data.filter(value => !!value);
    return data;
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
    this[name] = (config = {}) => this[method](merge(baseConfig, config));
  }
}
