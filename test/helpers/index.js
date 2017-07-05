import fetchMock from 'fetch-mock';
import data from '../data';

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
 * @param {string} id
 * @return {Object}
 */
export const mockFetch = function mockFetch(id) {
  return fetchMock.mock(data[id].url, { body: data[id].body });
};
