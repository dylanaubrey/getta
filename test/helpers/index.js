import fetchMock from 'fetch-mock';
import { isArray } from 'lodash';
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
 * @param {Object} config
 * @return {Object}
 */
export const mockFetch = function mockFetch({ baseURL, batch, path, resource }) {
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

  if (!isArray(resource) || batch) {
    const url = `${baseURL}${path}/${ids}`;
    urls.push(url);

    fetchMock.mock(
      url,
      { body, headers: { 'Cache-Control': 'public, max-age=60', hash: true } },
      { name: url },
    );
  } else {
    resource.forEach((value) => {
      urls.push(data[value].url);

      fetchMock.mock(
        data[value].url,
        { body: data[value].body, headers: { 'Cache-Control': 'public, max-age=60', hash: true } },
        { name: data[value].url },
      );
    });
  }

  return { fetchMock, urls };
};
