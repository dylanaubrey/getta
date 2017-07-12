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
 * @param {boolean} config.batch
 * @param {Array<string>} config.resource
 * @return {Object}
 */
export const mockGet = function mockGet({ batch, resource }) {
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

  return { urls };
};

/**
 *
 * @param {Object} config
 * @param {Array<string>} config.resource
 * @return {Object}
 */
export const mockGetAll = function mockGetAll({ resource }) {
  const body = [];

  resource.forEach((value) => {
    body.push(data[value].body);
  });

  const headers = { 'Cache-Control': 'public, max-age=60' };
  const url = `${baseURL}${path}`;
  fetchMock.mock(url, { body, headers }, { name: url });
  return { url };
};

/**
 *
 * @param {Object} config
 * @param {Array<string>} config.resource
 * @return {Object}
 */
export const mockPost = function mockPost({ resource }) {
  let body;

  if (isArray(resource)) {
    body = [];

    resource.forEach((value) => {
      body.push(data[value].body);
    });
  } else {
    body = data[resource].body;
  }

  const headers = { 'Cache-Control': 'public, max-age=60' };
  const url = `${baseURL}${path}`;
  fetchMock.mock(url, { body, headers }, { method: 'post', name: url });
  return { url };
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
 * @param {Array<string>} config.resource
 * @return {Object}
 */
export const setupGet = function setupGet({ batch, resource }) {
  const { urls } = mockGet({ batch, resource });
  const getta = new Getta({ baseURL, cachemapOptions, newInstance: true });
  getta.shortcut('get', 'getProducts', { path, options: { batch } });
  return { fetchMock, getta, urls };
};

/**
 *
 * @param {Object} config
 * @param {Array<string>} config.resource
 * @return {Object}
 */
export const setupGetAll = function setupGetAll({ resource }) {
  const { url } = mockGetAll({ resource });
  const getta = new Getta({ baseURL, cachemapOptions, newInstance: true });
  getta.shortcut('get', 'getProducts', { path });
  return { fetchMock, getta, url };
};

/**
 *
 * @param {Object} config
 * @param {Array<string>} config.resource
 * @return {Object}
 */
export const setupPost = function setupPost({ resource }) {
  const { url } = mockPost({ resource });
  const getta = new Getta({ baseURL, cachemapOptions, newInstance: true });
  getta.shortcut('post', 'postProducts', { path });
  return { fetchMock, getta, url };
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
