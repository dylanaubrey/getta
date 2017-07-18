import fetchMock from 'fetch-mock';
import { isArray } from 'lodash';
import data from '../data';
import { localStorageMock } from '../mocks';
import Getta from '../../src';

/**
 *
 * @type {string}
 */
export const baseURL = 'https://www.tesco.com/direct/rest/';

/**
 *
 * @type {Object}
 */
export const cachemapOptions = { localStorageOptions: { mock: localStorageMock } };

/**
 *
 * @type {string}
 */
export const path = 'content/catalog/product';

/**
 *
 * @type {Object}
 */
export const defaultHeaders = { 'Cache-Control': 'public, max-age=6000', Etag: '33a64df551425fcc55e4d42a148795d9f25f89d4' };

/**
 *
 * @param {Object} queryParams
 * @return {string}
 */
export const buildQueryString = function buildQueryString(queryParams) {
  let queryString = '';
  let paramCount = 0;

  Object.keys(queryParams).forEach((key) => {
    paramCount += 1;
    const prefix = paramCount === 1 ? '?' : '&';
    queryString += `${prefix}${key}=${queryParams[key]}`;
  });

  return queryString;
};

/**
 *
 * @param {Object} config
 * @param {boolean} config.batch
 * @param {string} config.method
 * @param {Object} config.queryParams
 * @param {Array<string>} config.resource
 * @return {Array<string>}
 */
export const mock = function mock({ batch, headers, method, queryParams, resource }) {
  let body, ids;

  if (batch) {
    body = [];

    resource.forEach((value) => {
      body.push(data[value].body);
    });

    ids = resource.join(',');
  } else if (!isArray(resource)) {
    body = data[resource].body;
    ids = resource;
  }

  const queryString = !queryParams ? '' : buildQueryString(queryParams);
  const urls = [];

  if (!isArray(resource) || batch) {
    const url = `${baseURL}${path}/${ids}${queryString}`;
    urls.push(url);
    fetchMock.mock(url, { body, headers: headers || defaultHeaders }, { name: url });
  } else {
    resource.forEach((value) => {
      urls.push(`${data[value].url}${queryString}`);

      fetchMock.mock(
        data[value].url,
        { body: data[value].body, headers: headers || defaultHeaders },
        { method, name: data[value].url },
      );
    });
  }

  return urls;
};

/**
 *
 * @param {Object} config
 * @param {string} config.method
 * @param {Array<string>} config.resource
 * @return {string}
 */
export const mockAll = function mockAll({ headers, method, resource }) {
  const body = [];

  resource.forEach((value) => {
    body.push(data[value].body);
  });

  const url = `${baseURL}${path}`;
  fetchMock.mock(url, { body, headers: headers || defaultHeaders }, { method, name: url });
  return url;
};

/**
 *
 * @param {Object} config
 * @param {boolean} config.batch
 * @param {Object} config.headers
 * @param {Array<string>} config.resource
 * @return {Object}
 */
export const mockDelete = function mockDelete({ batch, headers, resource }) {
  return mock({ batch, headers, method: 'delete', resource });
};

/**
 *
 * @param {Object} config
 * @param {boolean} config.batch
 * @param {Object} config.headers
 * @param {Object} config.queryParams
 * @param {Array<string>} config.resource
 * @return {Object}
 */
export const mockGet = function mockGet({ batch, headers, queryParams, resource }) {
  return mock({ batch, headers, method: 'get', queryParams, resource });
};

/**
 *
 * @param {Object} config
 * @param {Object} config.headers
 * @param {Array<string>} config.resource
 * @return {Object}
 */
export const mockDeleteAll = function mockDeleteAll({ headers, resource }) {
  return mockAll({ headers, method: 'delete', resource });
};

/**
 *
 * @param {Object} config
 * @param {Object} config.headers
 * @param {Array<string>} config.resource
 * @return {Object}
 */
export const mockGetAll = function mockGetAll({ headers, resource }) {
  return mockAll({ headers, method: 'get', resource });
};

/**
 *
 * @param {Object} config
 * @param {Array<string>} config.resource
 * @return {string}
 */
export const mockPost = function mockPost({ headers, resource }) {
  let body;

  if (isArray(resource)) {
    body = [];

    resource.forEach((value) => {
      body.push(data[value].body);
    });
  } else {
    body = data[resource].body;
  }

  const url = `${baseURL}${path}`;
  fetchMock.mock(url, { body, headers: headers || defaultHeaders }, { method: 'post', name: url });
  return url;
};

/**
 *
 * @param {Object} resource
 * @return {Object}
 */
export const productArgs = function productArgs(resource) {
  return { options: { batch: true }, path, resource };
};

/**
 *
 * @param {Object} config
 * @param {boolean} config.batch
 * @param {Object} config.headers
 * @param {boolean} config.newInstance
 * @param {Array<string>} config.resource
 * @return {Object}
 */
export const setupDelete = function setupDelete({ batch, headers, newInstance = true, resource }) {
  const urls = mockDelete({ batch, headers, resource });
  const getta = new Getta({ baseURL, cachemapOptions, newInstance });
  getta.shortcut('delete', 'deleteProduct', { options: { batch }, path });
  return { getta, urls };
};

/**
 *
 * @param {Object} config
 * @param {Object} config.headers
 * @param {boolean} config.newInstance
 * @param {Array<string>} config.resource
 * @return {Object}
 */
export const setupDeleteAll = function setupDeleteAll({ headers, newInstance = true, resource }) {
  const url = mockDeleteAll({ headers, resource });
  const getta = new Getta({ baseURL, cachemapOptions, newInstance });
  getta.shortcut('delete', 'deleteProduct', { path });
  return { getta, url };
};

/**
 *
 * @param {Object} config
 * @param {boolean} config.batch
 * @param {Object} config.headers
 * @param {boolean} config.newInstance
 * @param {Object} config.queryParams
 * @param {Array<string>} config.resource
 * @return {Object}
 */
export const setupGet = function setupGet({
  batch, headers, newInstance = true, queryParams, resource,
}) {
  const urls = mockGet({ batch, headers, queryParams, resource });
  const getta = new Getta({ baseURL, cachemapOptions, newInstance });
  getta.shortcut('get', 'getProduct', { options: { batch }, path, queryParams });
  return { getta, urls };
};

/**
 *
 * @param {Object} config
 * @param {Object} config.headers
 * @param {boolean} config.newInstance
 * @param {Array<string>} config.resource
 * @return {Object}
 */
export const setupGetAll = function setupGetAll({ headers, newInstance = true, resource }) {
  const url = mockGetAll({ headers, resource });
  const getta = new Getta({ baseURL, cachemapOptions, newInstance });
  getta.shortcut('get', 'getProduct', { path });
  return { getta, url };
};

/**
 *
 * @param {Object} config
 * @param {Object} config.headers
 * @param {boolean} config.newInstance
 * @param {Array<string>} config.resource
 * @return {Object}
 */
export const setupPost = function setupPost({ headers, newInstance = true, resource }) {
  const url = mockPost({ headers, resource });
  const getta = new Getta({ baseURL, cachemapOptions, newInstance });
  getta.shortcut('post', 'postProduct', { path });
  return { getta, url };
};

/**
 *
 * @param {Object} a
 * @param {Object} b
 * @return {number}
 */
export const sortValues = function sortValues(a, b) {
  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  return 0;
};
