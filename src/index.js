import { castArray, flatten, isArray, isFunction, isPlainObject } from 'lodash';
import uuidV1 from 'uuid/v1';
import logger from './logger';

const instances = {};

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
     * Optional function used to parse the body of
     * a response prior the client returning it.
     * The client requires any data returned to be
     * on a property of 'data' and any errors return
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
     * Url to which to make requests.
     *
     * @type {string}
     */
    endpoint,
    /**
     * Key identifier of the asset(s) being requested.
     *
     * @type {string}
     */
    identifier = 'id',
    /**
     * Any headers to be sent with the requset.
     *
     * @type {Object}
     */
    headers = null,
    /**
     * Optional key identifier if the multi query
     * dentifier is not the same as the identifier.
     *
     * @type {string}
     */
    multiQueryIdentifier = null,
    /**
     * How many assets can be matched together in
     * the same request. If null, then the client
     * will not support multi query.
     *
     * @type {number}
     */
    multiQueryLimit = null,
    /**
     * Name of the client.
     *
     * @type {string}
     */
    name,
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
    /**
     * Optional name to be used in place of 'type' as
     * the placeholder name in the enndpoint, if
     * client endpoint supports different types.
     *
     * @type {string}
     */
    typeAlias = null,
    /**
     * Optional array of supported types.
     *
     * @type {Array<string>}
     */
    types = [],
  } = {}) {
    if (instances[name] && !newInstance) {
      return instances[name];
    }

    if (!endpoint || !name) {
      throw new Error('Endpoint, name and types are mandatory properties for a rest client.');
    }

    this._bodyParser = bodyParser;
    this._dataParser = dataParser;
    this._endpoint = endpoint;
    this._identifier = identifier;
    this._multiQueryIdentifier = multiQueryIdentifier;
    this._multiQueryLimit = multiQueryLimit;
    this._name = name;
    this._headers = headers;
    this._requests = tracker;
    this._typeAlias = typeAlias;
    this._types = types;
    instances[name] = this;
    return instances[name];
  }

  /**
   *
   * @private
   * @param {Object} requests
   * @param {string} idValue
   * @param {Object} context
   * @param {string} type
   * @return {Object}
   */
  _addToFetch(requests, idValue, { fetchID, requestID, values }, type) {
    const index = requests.active.findIndex(obj => obj.value === idValue);
    let activeMatch;

    if (index !== -1) {
      activeMatch = requests.active.splice(index, 1)[0];
    }

    const fetchMatch = requests.fetching.find(obj => obj.value === idValue);
    const activeFetchID = isPlainObject(activeMatch) ? activeMatch.fetchID : fetchID;
    const promises = [];
    let isPending = false;

    if (!fetchMatch) {
      requests.fetching.push({ fetchID: activeFetchID, value: idValue });
    } else {
      requests.pending[idValue] = requests.pending[idValue] || [];

      promises.push(this._setPendingRequest(
        requests.pending[idValue], { fetchID: fetchMatch.fetchID },
      ));

      this._updatePendingRequests(
        { fetchID: fetchMatch.fetchID, value: idValue }, requestID, type,
      );

      values = values.filter(value => value !== idValue);
      isPending = true;
    }

    return { isPending, promises };
  }

  /**
   *
   * @private
   * @param {Object} args
   * @param {Object} context
   * @param {string} type
   * @return {Object}
   */
  _batchRequest(args, { fetchID, requestID, values }, type) {
    const requests = this._getRequestMeta(requestID, type);
    const idValues = args[this._identifier];
    let promises = [];

    for (let i = idValues.length - 1; i >= 0; i -= 1) {
      const res = this._addToFetch(requests, idValues[i], { fetchID, requestID, values }, type);
      promises = promises.concat(res.promises);

      if (res.isPending) {
        idValues.splice(i, 1);
      }
    }

    const skip = !idValues.length;

    if (!skip && this._multiQueryLimit) {
      if (requests.active.length && idValues.length < this._multiQueryLimit) {
        for (let i = requests.active.length - 1; i >= 0; i -= 1) {
          idValues.push(requests.active[i].value);
          requests.fetching.push({ fetchID, value: requests.active[i].value });

          this._updatePendingRequests(
            { fetchID, value: requests.active[i].value }, requestID, type,
          );

          requests.active.splice(i, 1);

          if (idValues.length === this._multiQueryLimit) {
            break;
          }
        }
      }
    }

    args[this._identifier] = idValues;
    return { promises, skip };
  }

  /**
   *
   * @private
   * @param {Array<string>} values
   * @return {Array<Array>}
   */
  _batchValues(values) {
    const batches = [];
    const countLimit = Math.ceil(values.length / this._multiQueryLimit);
    let counter = 0;
    let start = 0;
    let stop = this._multiQueryLimit;

    do {
      batches.push(values.slice(start, stop));
      start += this._multiQueryLimit;
      stop += this._multiQueryLimit;
      counter += 1;
    } while (counter < countLimit);

    return batches;
  }

  /**
   *
   * @private
   * @param {Object} args
   * @param {string} type
   * @return {Array<Object>}
   */
  _buildURLs(args, type) {
    let endpoint = this._endpoint;
    const queryIndex = endpoint.indexOf('?');

    if (queryIndex !== -1) {
      endpoint = this._populateQueryString(endpoint, args);
    }

    if (type) {
      endpoint = this._populateType(endpoint, type);
    }

    return this._populateIdentifier(endpoint, args);
  }

  /**
   *
   * @private
   * @param {Object} args
   * @param {Object} context
   * @param {string} [type]
   * @return {Object}
   */
  _dedupRequest(args, context, type) {
    const requests = this._getRequestMeta(context.requestID, type);
    const idValues = args[this._identifier];

    if (!requests.active) {
      requests.active = idValues.map(value => ({ fetchID: context.fetchID, value }));
      return {};
    }

    const promises = [];

    for (let i = idValues.length - 1; i >= 0; i -= 1) {
      const match = requests.active.find(obj => obj.value === idValues[i]);

      if (match) {
        requests.pending[idValues[i]] = requests.pending[idValues[i]] || [];

        promises.push(this._setPendingRequest(
          requests.pending[idValues[i]], { fetchID: match.fetchID },
        ));

        context.values = context.values.filter(value => value !== idValues[i]);
        idValues.splice(i, 1);
      }
    }

    const skip = !idValues.length;

    if (!skip) {
      requests.active = [
        ...requests.active, ...idValues.map(value => ({ fetchID: context.fetchID, value })),
      ];
    }

    args[this._identifier] = idValues;
    return { promises, skip };
  }

  /**
   *
   * @private
   * @param {string} url
   * @param {string|Array<string>} values
   * @param {Object} context
   * @param {string} type
   * @return {Promise}
   */
  async _fetch(url, values, context, type) {
    let res, errors;

    try {
      logger.info(`${this._name} fetching: ${url}`, context);
      res = await fetch(url, { headers: new Headers(this._headers) });
    } catch (err) {
      errors = err;
      logger.error(err);
    }

    if (errors) {
      this._resolveRequests({ errors }, values, context, type);
      return { errors };
    }

    let body = await res.json();
    body = isFunction(this._bodyParser) ? this._bodyParser(body, type) : body;

    if (body.errors) {
      this._resolveRequests({ errors: body.errors }, values, context, type);
      return { errors: body.errors };
    }

    let data;

    if (isFunction(this._dataParser)) {
      data = this._dataParser(body.data, type, res.headers);
    } else {
      data = body.data;
    }

    this._resolveRequests({ data }, values, context, type);
    return this._filterContextData(data, context);
  }

  /**
   *
   * @private
   * @param {Object|Array<Object>} data
   * @param {Object} context
   * @return {Object|Array<Object>}
   */
  _filterContextData(data, { values }) {
    const filtered = [];

    if (!isArray(data)) {
      return data;
    }

    values.forEach((value) => {
      const match = data.find(obj => obj[this._identifier] === value);

      if (match) {
        filtered.push(match);
      }
    });

    return filtered;
  }

  /**
   *
   * @private
   * @param {string} requestID
   * @param {string} type
   * @return {string}
   */
  _getRequestMeta(requestID, type) {
    let requests;

    if (requestID) {
      requests = this._requests[requestID];

      if (!requests) {
        this._requests[requestID] = {};
        requests = this._requests[requestID];
      }
    } else {
      requests = this._requests;

      if (!requests) {
        this._requests = {};
        requests = this._requests;
      }
    }

    let requestsType;

    if (type) {
      requestsType = requests[type];

      if (!requestsType) {
        requests[type] = {};
        requestsType = requests[type];
      }
    }

    const meta = requestsType || requests;

    if (!meta.fetching) {
      meta.fetching = [];
    }

    if (!meta.pending) {
      meta.pending = {};
    }

    return meta;
  }

  /**
   *
   * @private
   * @param {string} endpoint
   * @param {Object} args
   * @return {Array<string>}
   */
  _populateIdentifier(endpoint, args) {
    const regex = new RegExp(`{${this._multiQueryIdentifier || this._identifier}}`);
    const match = endpoint.match(regex);
    const urls = [];

    if (match) {
      const idValues = args[this._identifier];
      const multiQuery = !!this._multiQueryLimit;

      if (!multiQuery) {
        idValues.forEach((value) => {
          urls.push({ url: endpoint.replace(regex, value), values: value });
        });
      } else if (idValues.length <= this._multiQueryLimit) {
        urls.push({ url: endpoint.replace(regex, idValues.join(',')), values: idValues });
      } else {
        this._batchValues(idValues).forEach((batch) => {
          urls.push({ url: endpoint.replace(regex, batch.join(',')), values: batch });
        });
      }
    }

    return urls;
  }

  /**
   *
   * @private
   * @param {string} endpoint
   * @param {Object} args
   * @return {string}
   */
  _populateQueryString(endpoint, args) {
    const regex = /\?(.*)?/;
    const match = endpoint.match(regex);

    if (!match) {
      return endpoint;
    }

    const queryString = match[1];
    const params = queryString.split('&');
    let paramCount = 0;
    let populatedQueryString = '';

    Object.keys(args).forEach((key) => {
      const param = params.find(value => !!value.match(new RegExp(`${key}=.*`)));

      if (!param || !param.match(new RegExp(`{.*(${key}|${args[key]}).*}`))) {
        return;
      }

      paramCount += 1;
      const prefix = paramCount === 1 ? '?' : '&';
      populatedQueryString += `${prefix}${key}=${args[key]}`;
    });

    return endpoint.replace(regex, populatedQueryString);
  }

  /**
   *
   * @private
   * @param {string} endpoint
   * @param {string} type
   * @return {string}
   */
  _populateType(endpoint, type) {
    const key = this._typeAlias || 'type';
    return endpoint.replace(new RegExp(`{${key}}`), type);
  }

  /**
   *
   * @private
   * @param {Object|Array<Object>} data
   * @param {string|Array<string>} values
   * @param {Object} context
   * @param {string} type
   * @return {void}
   */
  async _resolveRequests({ data, errors }, values, { fetchID, requestID }, type) {
    const { fetching, pending } = this._getRequestMeta(requestID, type);
    data = castArray(data);
    values = castArray(values);

    values.forEach((value) => {
      const index = fetching.findIndex(obj => obj.value === value);

      if (index !== -1) {
        fetching.splice(index, 1);
      }

      let res;

      if (errors) {
        res = { errors };
      } else {
        res = data.find(obj => obj[this._identifier] === value);
      }

      if (pending[value]) {
        for (let i = pending[value].length - 1; i >= 0; i -= 1) {
          if (pending[value][i].fetchID === fetchID) {
            pending[value][i].resolve(res);
            pending[value].splice(i, 1);
          }
        }
      }
    });
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
   * @param {Object} args
   * @param {Object} context
   * @return {void}
   */
  _parseIdentifier(args, context) {
    let idValues = args[this._identifier];
    idValues = castArray(idValues);
    args[this._identifier] = idValues;
    context.values = [...idValues];
  }

  /**
   *
   * @private
   * @param {Object} ids
   * @param {string} requestID
   * @param {string} type
   * @return {void}
   */
  _updatePendingRequests({ fetchID, value }, requestID, type) {
    const { pending } = this._getRequestMeta(requestID, type);

    if (value && pending[value]) {
      pending[value].forEach((obj) => {
        if (fetchID) {
          obj.fetchID = fetchID;
        }
      });
    }
  }

  /**
   *
   * @param {Object} args
   * @param {Object} [context]
   * @return {Promise}
   */
  async fetch(args, context = {}) {
    const _context = { ...{ fetchID: uuidV1(), requestID: null }, ...context };
    this._parseIdentifier(args, _context);
    const type = args.type;
    let { promises = [], skip } = this._dedupRequest(args, _context, type);

    const res = await new Promise((resolve) => {
      setImmediate(() => {
        resolve(this._batchRequest(args, _context, type));
      });
    });

    if (res.promises.length) {
      promises = promises.concat(res.promises);
    }

    if (res.skip) {
      skip = res.skip;
    }

    if (!skip) {
      const urls = this._buildURLs(args, type);

      if (!urls.length) {
        return null;
      }

      urls.forEach(({ url, values }) => {
        promises.push(this._fetch(url, values, _context, type));
      });
    }

    const data = await Promise.all(promises);
    return flatten(data);
  }
}
