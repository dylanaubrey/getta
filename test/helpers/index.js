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
 * @return {Object}
 */
export const mockFetch = function mockFetch({ batch, path, queryParams, resource }) {
  let body, ids;
  const urls = [];

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

  const headers = { 'Cache-Control': 'public, max-age=60' };
  queryParams = queryParams ? buildQueryString(queryParams) : '';

  if (!isArray(resource) || batch) {
    const url = `${baseURL}${path}/${ids}${queryParams}`;
    urls.push(url);
    fetchMock.mock(url, { body, headers }, { name: url });
  } else {
    resource.forEach((value) => {
      urls.push(`${data[value].url}${queryParams}`);

      fetchMock.mock(
        data[value].url, { body: data[value].body, headers }, { name: data[value].url },
      );
    });
  }

  return { fetchMock, urls };
};

/**
 *
 * @param {Object} resource
 * @return {Object}
 */
export const productArgs = function productArgs(resource) {
  return {
    options: { batch: true, bodyParser: body => ({ data: body }) },
    path: 'content/catalog/product',
    resource,
  };
};

/**
 *
 * @param {Object} config
 * @return {Object}
 */
export const setupTest = function setupTest({ batch, path, queryParams, resource }) {
  const { urls } = mockFetch({ batch, path, queryParams, resource });
  const getta = new Getta({ baseURL, cachemapOptions, newInstance: true });

  getta.shortcut('get', 'getProducts', {
    path, options: { batch, bodyParser: body => ({ data: body }), queryParams },
  });

  return { fetchMock, getta, urls };
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
