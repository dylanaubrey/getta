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
 * @param {Object} config
 * @return {Object}
 */
export const mockFetch = function mockFetch({ batch, resource }) {
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

  if (!isArray(resource) || batch) {
    const url = `${baseURL}${path}/${ids}`;
    urls.push(url);
    fetchMock.mock(url, { body, headers }, { name: url });
  } else {
    resource.forEach((value) => {
      urls.push(data[value].url);

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
  return { options: { batch: true }, path, resource };
};

/**
 *
 * @param {Object} config
 * @return {Object}
 */
export const setupTest = function setupTest({ batch, resource }) {
  const { urls } = mockFetch({ batch, resource });
  const getta = new Getta({ baseURL, cachemapOptions, newInstance: true });

  getta.shortcut('get', 'getProducts', {
    path, options: { batch, bodyParser: body => ({ data: body }) },
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
