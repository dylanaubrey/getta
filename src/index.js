import Cachemap from 'cachemap';
import { castArray, flatten, isFunction } from 'lodash';
import uuidV1 from 'uuid/v1';
import logger from './logger';

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
    batchLimit = '20',
    /**
     *
     * Optional function used to parse the body of
     * a response prior the client returning it.
     * The client requires any data returned to be
     * on a property of 'data' and any errors returned
     * to be on a property of 'errors'.
     *
     * @type {Function}
     */
    bodyParser = null,
    /**
     *
     * Optional function used to parse the data of
     * a response prior the client returning it.
     *
     * @type {Function}
     */
    dataParser = null,
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
      throw new Error('baseURL is mandatory properties for a rest client.');
    }

    this._baseURL = baseURL;
    this._batchLimit = batchLimit;
    this._bodyParser = bodyParser;
    this._cache = new Cachemap(cachemapOptions);
    this._dataParser = dataParser;
    this._disableCaching = disableCaching;
    this._headers = headers;
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

    if (!fetchMatch) {
      tracker.fetching.push({ fetchID: activeFetchID, value: resource });
      return {};
    }

    const promises = [];
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
   * @param {Object} options
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
      const limit = batchLimit || this._batchLimit;
      resource.batched = resource.active;

      if (tracker.active.length && resource.batched.length < limit) {
        for (let i = tracker.active.length - 1; i >= 0; i -= 1) {
          resource.batched.push(tracker.active[i].value);
          tracker.fetching.push({ fetchID, value: tracker.active[i].value });

          this._updatePendingRequests(
            { fetchID, resource: tracker.active[i].value }, requestID, path,
          );

          tracker.active.splice(i, 1);
          if (resource.batched.length === limit) break;
        }
      }
    }

    return { promises, skip };
  }

  /**
   *
   * @private
   * @param {Array<string>} resource
   * @return {Array<Array>}
   */
  _batchResource(resource) {
    const batches = [];
    const countLimit = Math.ceil(resource.length / this._batchLimit);
    let count = 0;
    let start = 0;
    let stop = this._batchLimit;

    do {
      batches.push(resource.slice(start, stop));
      start += this._batchLimit;
      stop += this._batchLimit;
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
   * @param {Object} options
   * @return {Array<Object>}
   */
  _buildEndpoints({ path, resource, queryParams }, { batch }) {
    let endpoint = resource ? `${path}/{resource}` : path;
    if (queryParams) endpoint += this._buildQueryString(queryParams);
    if (!resource) return [{ endpoint }];
    return this._populateResource(endpoint, batch ? resource.batched : resource.active, batch);
  }

  /**
   *
   * @private
   * @param {Object} context
   * @return {Promise}
   */
  async _checkCache({ path, resource, queryParams }) {
    if (this._disableCaching) return {};
    const endpoints = this._buildEndpoints({ path, resource, queryParams }, { batch: false });
    const promises = [];

    endpoints.forEach(({ endpoint, values }) => {
      promises.push(this._checkEntry(endpoint, values, resource));
    });

    const data = await Promise.all(promises);
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

    if (data && resource) {
      const index = resource.active.findIndex(val => val === value);
      if (index !== -1) resource.active.splice(index, 1);
    }

    return data || null;
  }

  /**
   *
   * @private
   * @param {Object} context
   * @return {Object}
   */
  _dedupRequest({ path, resource, fetchID, requestID }) {
    const tracker = this._getTracker(requestID, path);

    if (!tracker.active.length) {
      tracker.active = resource.active.map(value => ({ fetchID, value }));
      return {};
    }

    const promises = [];

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
   * @param {string} method
   * @param {string} endpoint
   * @param {string|Array<string>} values
   * @param {Object} context
   * @param {Object} options
   * @return {Promise}
   */
  async _fetch(method, endpoint, values, context, options) {
    let res, errors;

    try {
      logger.info(`${this._name} fetching: ${endpoint}`, context);
      const headers = options.headers ? { ...this._headers, ...options.headers } : this._headers;

      res = await fetch(`${this._baseURL}${endpoint}`, {
        method,
        headers: new Headers(headers),
      });
    } catch (err) {
      errors = err;
      logger.error(err);
    }

    if (errors) {
      this._resolveRequests({ errors }, values, context);
      return { errors };
    }

    let body = await res.json();
    const bodyParser = options.bodyParser || this._bodyParser;
    body = isFunction(bodyParser) ? bodyParser(body, context) : body;

    if (body.errors) {
      this._resolveRequests({ errors: body.errors }, values, context);
      return { errors: body.errors };
    }

    const dataParser = options.dataParser || this._dataParser;
    const data = isFunction(dataParser) ? dataParser(body.data, context, res.headers) : body.data;
    if (!values) return data;
    this._resolveRequests({ data }, values, context);
    return this._resolveResource(data, context);
  }

  /**
   *
   * @private
   * @param {string} requestID
   * @param {string} path
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
    return tracker[path];
  }

  /**
   *
   * @private
   * @param {string} endpoint
   * @param {Array<string>} resource
   * @param {boolean} batch
   * @return {Array<Object>}
   */
  _populateResource(endpoint, resource, batch) {
    const regex = /{resource}/;
    const endpoints = [];

    if (!batch) {
      resource.forEach((value) => {
        endpoints.push({ endpoint: endpoint.replace(regex, value), values: value });
      });
    } else if (resource.length <= this._batchLimit) {
      endpoints.push({ endpoint: endpoint.replace(regex, resource.join(',')), values: resource });
    } else {
      this._batchResource(resource).forEach((group) => {
        endpoints.push({ endpoint: endpoint.replace(regex, group.join(',')), values: group });
      });
    }

    return endpoints;
  }

  /**
   *
   * @private
   * @param {Object|Array<Object>} res
   * @param {string|Array<string>} values
   * @param {Object} context
   * @return {void}
   */
  async _resolveRequests(res, values, { fetchID, requestID, path, resource, queryParams }) {
    if (!values) return;
    const { fetching, pending } = this._getTracker(requestID, path);
    const data = castArray(res.data);
    values = castArray(values);

    values.forEach((value) => {
      const index = fetching.findIndex(obj => obj.value === value);
      if (index !== -1) fetching.splice(index, 1);

      const match = res.errors
          ? { errors: res.errors } : data.find(obj => obj[resource.key] === value);

      if (!res.errors && match) this._setCache(path, value, queryParams, match);
      if (!pending[value]) return;

      for (let i = pending[value].length - 1; i >= 0; i -= 1) {
        if (pending[value][i].fetchID === fetchID) {
          pending[value][i].resolve(res);
          pending[value].splice(i, 1);
        }
      }
    });
  }

  /**
   *
   * @private
   * @param {Object|Array<Object>} data
   * @param {Object} context
   * @return {Object|Array<Object>}
   */
  _resolveResource(data, { resource }) {
    const filtered = [];

    resource.active.forEach((value) => {
      const match = data.find(obj => obj[resource.key] === value);
      if (match) filtered.push(match);
    });

    return filtered;
  }

  /**
   *
   * @private
   * @param {string} path
   * @param {string} resource
   * @param {Object} queryParams
   * @param {Object} data
   * @return {Promise}
   */
  async _setCache(path, resource, queryParams, data) {
    if (this._disableCaching) return;
    const endpoints = this._buildEndpoints({ path, resource, queryParams }, { batch: false });

    try {
      this._cache.set(endpoints[0], data);
    } catch (err) {
      logger.error(err);
    }
  }

  /**
   *
   * @private
   * @param {string} path
   * @param {Object} resource
   * @param {Object} queryParams
   * @param {Object} context
   * @return {Object}
   */
  _setContext(path, resource, queryParams, context) {
    if (resource) {
      const key = Object.keys(resource)[0];
      resource = { active: castArray(resource[key]), batched: [], pending: [], key };
    }

    return { ...{ path, resource, queryParams, fetchID: uuidV1() }, ...context };
  }

  /**
   *
   * @private
   * @param {Array<Function>} pending
   * @param {string} context
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
   * @param {Object} ids
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
   * @return {Promise}
   */
  async get({ path, resource = null, queryParams = null, options = {}, context = {} } = {}) {
    if (!path) return null;
    context = this._setContext(path, resource, queryParams, context);
    const check = await this._checkCache(context);
    if (check.skip) return check.data;
    let promises, skip;

    if (resource) {
      const dedup = this._dedupRequest(context);

      const batch = await new Promise((resolve) => {
        setImmediate(() => {
          resolve(this._batchRequest(context, options));
        });
      });

      promises = [...dedup.promises, ...batch.promises];
      skip = batch.skip;
    }

    if (!skip) {
      const endpoints = this._buildEndpoints(context, options);

      endpoints.forEach(({ endpoint, values }) => {
        promises.push(this._fetch(endpoint, values, context, options));
      });
    }

    const data = flatten(await Promise.all(promises));
    return [...data, ...check.data];
  }
}
