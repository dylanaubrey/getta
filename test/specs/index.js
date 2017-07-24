import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import fetchMock from 'fetch-mock';
import { flatten } from 'lodash';
import sinonChai from 'sinon-chai';
import data, { getValues } from '../data';

import {
  baseURL,
  buildQueryString,
  cachemapOptions,
  mockGet,
  path,
  productArgs,
  setupDelete,
  setupDeleteAll,
  setupGet,
  setupGetAll,
  setupPost,
  setupPut,
  setupPutAll,
  sortValues,
} from '../helpers';

import Getta from '../../src';

chai.use(dirtyChai);
chai.use(sinonChai);
process.env.WEB_ENV = true;

describe('when the Getta class is initialised', () => {
  describe('when "baseURL" is pased in as an argument', () => {
    it('should create an instance of the Geta rest client with the default options', () => {
      const getta = new Getta({ baseURL, cachemapOptions });
      expect(getta).to.be.instanceOf(Getta);
    });
  });

  describe('when "baseURL" is not pased in as an argument', () => {
    it('should throw the error: baseURL is a mandatory property for a rest client', () => {
      const initializer = () => new Getta({ newInstance: true });
      expect(initializer).to.throw(Error, 'baseURL is a mandatory property for a rest client.');
    });
  });

  describe('when "newInstance" is not passed in as an argument', () => {
    it('should return the same instance of the Getta class', () => {
      const getta = new Getta({ baseURL, cachemapOptions, newInstance: true });
      const instance = new Getta({ baseURL, cachemapOptions });
      expect(getta).to.eql(instance);
    });
  });

  describe('when "true" is passed in as the "newInstance" argument', () => {
    it('should return the same instance of the Getta class', () => {
      const getta = new Getta({ baseURL, cachemapOptions });
      const instance = new Getta({ baseURL, cachemapOptions, newInstance: true });
      expect(getta).not.to.eql(instance);
    });
  });
});

describe('the .get() method', () => {
  describe('when one resource is requested from the server', () => {
    let getta, res;
    const resource = '136-7317';

    before(() => {
      const setup = setupGet({ resource });
      getta = setup.getta;
    });

    after(() => {
      fetchMock.restore();
    });

    beforeEach(async () => {
      res = await getta.get(productArgs(resource));
    });

    afterEach(async () => {
      await getta._cache.clear();
    });

    it('should return the requested data', () => {
      expect(res.data[0]).to.eql(data[resource].body);
    });

    it('should cache the data against the endpoint', async () => {
      expect(await getta._cache.size()).to.eql(1);
      const entry = await getta._cache.get(`${path}/${resource}`);
      expect(entry).to.eql(data[resource].body);
    });
  });

  describe('when one resource is requested from the server using a shortcut', () => {
    let getta, res;
    const queryParams = { format: 'standard' };
    const resource = '136-7317';

    before(() => {
      const setup = setupGet({ queryParams, resource });
      getta = setup.getta;
    });

    after(() => {
      fetchMock.restore();
    });

    beforeEach(async () => {
      res = await getta.getProduct({ resource });
    });

    afterEach(async () => {
      await getta._cache.clear();
    });

    it('should return the requested data', () => {
      expect(res.data[0]).to.eql(data[resource].body);
    });

    it('should cache the data against the endpoint', async () => {
      expect(await getta._cache.size()).to.eql(1);
      const entry = await getta._cache.get(`${path}/${resource}${buildQueryString(queryParams)}`);
      expect(entry).to.eql(data[resource].body);
    });
  });

  describe('when one requested resource is in the cache', () => {
    describe('when the cached resource is valid', () => {
      let getta, res, urls;
      const resource = '136-7317';

      before(async () => {
        const setup = setupGet({ resource });
        getta = setup.getta;
        urls = setup.urls;
        await getta.getProduct({ resource });
      });

      after(() => {
        fetchMock.restore();
      });

      beforeEach(async () => {
        fetchMock.reset();
        res = await getta.getProduct({ resource });
      });

      it('should return the requested data', () => {
        expect(res.data[0]).to.eql(data[resource].body);
      });

      it('should not have fetched the data from the server', async () => {
        expect(fetchMock.called(urls[0])).to.be.false();
      });
    });

    describe('when the cached resource is expired and server returns not modified header', () => {
      let getta, res;
      const resource = '136-7317';

      before(async () => {
        const etag = '33a64df551425fcc55e4d42a148795d9f25f89d4';
        const notModifiedHeaders = { 'cache-control': 'public, no-cache, max-age=6000', etag };
        const headers = { ...notModifiedHeaders, ...{ 'content-type': 'application/json' } };

        const matcher = (url, opts) => {
          if (!opts.headers) return false;
          return opts.headers.get('if-none-match') === etag;
        };

        fetchMock.mock(matcher, { headers: notModifiedHeaders, status: 304 });
        const setup = setupGet({ headers, resource });
        getta = setup.getta;
        await getta.getProduct({ resource });
      });

      after(() => {
        fetchMock.restore();
      });

      beforeEach(async () => {
        res = await getta.getProduct({ resource });
      });

      it('should return the requested data from the cache', () => {
        expect(res.data[0]).to.eql(data[resource].body);
      });
    });

    describe('when the cached resource is expired and server returns new resource', () => {
      let getta;
      const resource = '136-7317';

      before(async () => {
        const etag = '33a64df551425fcc55e4d42a148795d9f25f89d4';

        const headers = {
          'cache-control': 'public, no-cache, max-age=6000',
          'content-type': 'application/json',
          etag,
        };

        const modifiedHeaders = {
          'cache-control': 'public, no-cache, max-age=10000',
          'content-type': 'application/json',
          etag,
        };

        const matcher = (url, opts) => {
          if (!opts.headers) return false;
          return opts.headers.get('if-none-match') === etag;
        };

        fetchMock.mock(
          matcher, { body: data[resource].body, headers: modifiedHeaders, status: 200 },
        );

        const setup = setupGet({ headers, resource });
        getta = setup.getta;
      });

      after(() => {
        fetchMock.restore();
      });

      beforeEach(async () => {
        await getta.getProduct({ resource });
      });

      afterEach(async () => {
        await getta._cache.clear();
      });

      it('should return the requested data', async () => {
        const res = await getta.getProduct({ resource });
        expect(res.data[0]).to.eql(data[resource].body);
      });

      it('should update the entry in the cache', async () => {
        expect(await getta._cache.size()).to.eql(1);
        let cacheability = await getta._cache.has(`${path}/${resource}`);
        expect(cacheability.maxAge).to.eql(6000);
        await getta.getProduct({ resource });
        expect(await getta._cache.size()).to.eql(1);
        cacheability = await getta._cache.has(`${path}/${resource}`);
        expect(cacheability.maxAge).to.eql(10000);
      });
    });
  });

  describe('when the server returns a 404 for a requested resource', () => {
    let getta;
    const cookie = 'status=404';
    const errors = { message: 'Page not found...' };
    const options = { headers: { cookie } };
    const resource = '136-7317';

    before(async () => {
      const etag = '33a64df551425fcc55e4d42a148795d9f25f89d4';

      const headers = {
        'cache-control': 'public, no-cache, max-age=6000',
        'content-type': 'application/json',
        etag,
      };

      const matcher = (url, opts) => {
        if (!opts.headers) return false;
        return opts.headers.get('cookie') === cookie;
      };

      fetchMock.mock(
        matcher,
        { body: { errors }, status: 404 },
      );

      const setup = setupGet({ headers, resource });
      getta = setup.getta;
    });

    after(() => {
      fetchMock.restore();
    });

    beforeEach(async () => {
      await getta.getProduct({ resource });
    });

    afterEach(async () => {
      await getta._cache.clear();
    });

    it('should return no data and the error metadata', async () => {
      const res = await getta.getProduct({ options, resource });
      expect(res.data.length).to.eql(0);
      expect(res.metadata[0].status).to.eql(404);
    });

    it('should delete the entry in the cache', async () => {
      expect(await getta._cache.size()).to.eql(1);
      await getta.getProduct({ options, resource });
      expect(await getta._cache.size()).to.eql(0);
    });
  });

  describe('when the server redirects the request more than five times', () => {
    let getta, res;
    const cookie = 'status=redirect';
    const message = 'The resource has been permanently moved.';
    const resource = '136-7317';
    const headers = { 'content-type': 'application/json', location: `${baseURL}${path}/${resource}` };
    const options = { headers: { cookie } };

    before(() => {
      const matcher = (url, opts) => {
        if (!opts.headers) return false;
        return opts.headers.get('cookie') === cookie;
      };

      fetchMock.mock(
        matcher,
        { body: { message }, headers, status: 301 },
      );

      const setup = setupGet({ resource });
      getta = setup.getta;
    });

    after(() => {
      fetchMock.restore();
    });

    beforeEach(async () => {
      res = await getta.getProduct({ options, resource });
    });

    it('should return an empty data array', () => {
      expect(res.data.length).to.eql(0);
    });

    it('should return metadata describing the error and the number of redirects', () => {
      expect(res.metadata[0].redirects).to.eql(5);
      expect(res.metadata[0].errors[0]).to.eql('The request exceeded the maximum number of redirects.');
    });
  });

  describe('when the server retries the request more than three times', () => {
    let getta, res;
    const cookie = 'status=retry';
    const message = 'Oops, something went wrong...';
    const resource = '136-7317';
    const headers = { 'content-type': 'application/json', location: `${baseURL}${path}/${resource}` };
    const options = { headers: { cookie } };

    before(() => {
      const matcher = (url, opts) => {
        if (!opts.headers) return false;
        return opts.headers.get('cookie') === cookie;
      };

      fetchMock.mock(
        matcher,
        { body: { message }, headers, status: 500 },
      );

      const setup = setupGet({ resource });
      getta = setup.getta;
    });

    after(() => {
      fetchMock.restore();
    });

    beforeEach(async () => {
      res = await getta.getProduct({ options, resource });
    });

    it('should return an empty data array.', () => {
      expect(res.data.length).to.eql(0);
    });

    it('should return metadata with the number of retries', () => {
      expect(res.metadata[0].retries).to.eql(3);
    });
  });

  describe('when batched resources are requested from the server', () => {
    let getta, res;
    const resource = ['136-7317', '180-1387', '183-3905', '202-3315'];
    const batchOne = ['136-7317', '180-1387'];
    const batchTwo = ['183-3905', '202-3315'];

    before(() => {
      mockGet({ batch: true, resource: batchOne });
      const setup = setupGet({ batch: true, resource: batchTwo });
      getta = setup.getta;
    });

    after(() => {
      fetchMock.restore();
    });

    beforeEach(async () => {
      res = await getta.getProduct({ resource, options: { batchLimit: 2 } });
    });

    afterEach(async () => {
      await getta._cache.clear();
    });

    it('should return the requested data', () => {
      expect(res.data).to.eql(getValues());
    });

    it('should cache each resource set against its respective endpoint', async () => {
      expect(await getta._cache.size()).to.eql(2);
      const promises = [];
      promises.push(getta._cache.get(`${path}/${batchOne.join()}`));
      promises.push(getta._cache.get(`${path}/${batchTwo.join()}`));
      const entries = await Promise.all(promises);
      expect(flatten(entries).sort(sortValues)).to.eql(getValues());
    });
  });

  describe('when batched requested resources are returned from the server and cache', () => {
    let getta, res, urls;
    const resource = ['136-7317', '180-1387', '183-3905', '202-3315'];
    const batchOne = ['136-7317', '180-1387'];
    const batchTwo = ['183-3905', '202-3315'];

    before(() => {
      urls = mockGet({ batch: true, resource: batchOne });
      const setup = setupGet({ batch: true, resource: batchTwo });
      getta = setup.getta;
    });

    after(() => {
      fetchMock.restore();
    });

    beforeEach(async () => {
      await getta.getProduct({ resource: batchOne });
      fetchMock.reset();
    });

    afterEach(async () => {
      await getta._cache.clear();
      fetchMock.reset();
    });

    it('should return the requested data', async () => {
      res = await getta.getProduct({ resource, options: { batchLimit: 2 } });
      expect(res.data.sort(sortValues)).to.eql(getValues());
    });

    it('should cache each data resource set against its respective endpoint', async () => {
      expect(await getta._cache.size()).to.eql(1);
      await getta.getProduct({ resource, options: { batchLimit: 2 } });
      expect(await getta._cache.size()).to.eql(2);
      const promises = [];
      promises.push(getta._cache.get(`${path}/${batchOne.join()}`));
      promises.push(getta._cache.get(`${path}/${batchTwo.join()}`));
      const entries = await Promise.all(promises);
      expect(flatten(entries).sort(sortValues)).to.eql(getValues());
    });

    it('should not have fetched the batchOne data from the server', async () => {
      await getta.getProduct({ resource, options: { batchLimit: 2 } });
      expect(fetchMock.called(urls[0])).to.be.false();
    });
  });

  describe('when separate resources are batched and requested from the server', () => {
    let getta, res;
    const resource = ['136-7317', '180-1387', '183-3905', '202-3315'];

    before(() => {
      const setup = setupGet({ batch: true, resource });
      getta = setup.getta;
    });

    after(() => {
      fetchMock.restore();
    });

    beforeEach(async () => {
      const promises = [];

      resource.forEach((value) => {
        promises.push(getta.getProduct({ resource: value }));
      });

      res = flatten(await Promise.all(promises));
      res = res.map(obj => obj.data[0]);
    });

    afterEach(async () => {
      await getta._cache.clear();
    });

    it('should return the requested data', async () => {
      expect(res.sort(sortValues)).to.eql(getValues());
    });

    it('should cache the data resource set against its endpoint', async () => {
      expect(await getta._cache.size()).to.eql(1);
      const entry = await getta._cache.get(`${path}/${resource.join()}`);
      expect(entry.sort(sortValues)).to.eql(getValues());
    });
  });

  describe('when the same resource is requested in quick succession', () => {
    let getta, res, urls;
    const resource = '136-7317';

    before(() => {
      const setup = setupGet({ resource });
      getta = setup.getta;
      urls = setup.urls;
    });

    after(() => {
      fetchMock.restore();
    });

    beforeEach(async () => {
      fetchMock.reset();
      const promises = [];
      promises.push(getta.getProduct({ resource }));
      promises.push(getta.getProduct({ resource }));
      res = flatten(await Promise.all(promises));
      res = res.map(obj => obj.data[0]);
    });

    afterEach(async () => {
      await getta._cache.clear();
    });

    it('should return the requested data', async () => {
      expect(res).to.eql([data[resource].body, data[resource].body]);
    });

    it('should not have made two requests to the server', async () => {
      expect(fetchMock.calls(urls[0]).length).to.eql(1);
    });
  });

  describe('when all resources are requested from the server', () => {
    let getta, res;
    const resource = ['136-7317', '180-1387', '183-3905', '202-3315'];

    before(() => {
      const setup = setupGetAll({ resource });
      getta = setup.getta;
    });

    after(() => {
      fetchMock.restore();
    });

    beforeEach(async () => {
      res = await getta.getProduct();
    });

    afterEach(async () => {
      await getta._cache.clear();
    });

    it('should return the requested data', async () => {
      expect(res.data.sort(sortValues)).to.eql(getValues());
    });

    it('should cache the resource data set against its endpoint', async () => {
      expect(await getta._cache.size()).to.eql(1);
      const entry = await getta._cache.get(`${path}`);
      expect(entry.sort(sortValues)).to.eql(getValues());
    });
  });
});

describe('the .post() method', () => {
  describe('when one resource is created and returned from the server', () => {
    let getta;
    const resource = '136-7317';

    before(() => {
      const setup = setupPost({ resource });
      getta = setup.getta;
    });

    after(() => {
      fetchMock.restore();
    });

    it('should return the created data', async () => {
      const res = await getta.postProduct({ body: { id: resource } });
      expect(res.data[0]).to.eql(data[resource].body);
    });
  });
});

describe('the .delete() method', () => {
  describe('when one resource is requested to be deleted on the server', () => {
    let getta;
    const resource = '136-7317';

    before(() => {
      const setup = setupDelete({ resource });
      getta = setup.getta;
    });

    after(() => {
      fetchMock.restore();
    });

    it('should return the deleted data', async () => {
      const res = await getta.deleteProduct({ resource });
      expect(res.data[0]).to.eql(data[resource].body);
    });
  });

  describe('when batched resources are requested to be deleted on the server', () => {
    let getta;
    const resource = ['136-7317', '180-1387', '183-3905', '202-3315'];

    before(() => {
      const setup = setupDelete({ batch: true, resource });
      getta = setup.getta;
    });

    after(() => {
      fetchMock.restore();
    });

    it('should return the deleted data', async () => {
      const res = await getta.deleteProduct({ resource });
      expect(res.data.sort(sortValues)).to.eql(getValues());
    });
  });

  describe('when all resources are requested to be deleted on the server', () => {
    let getta;
    const resource = ['136-7317', '180-1387', '183-3905', '202-3315'];

    before(() => {
      const setup = setupDeleteAll({ resource });
      getta = setup.getta;
    });

    after(() => {
      fetchMock.restore();
    });

    it('should return the deleted data', async () => {
      const res = await getta.deleteProduct();
      expect(res.data.sort(sortValues)).to.eql(getValues());
    });
  });
});

describe('the .put() method', () => {
  describe('when one resource is requested to be updated on the server', () => {
    let getta;
    const resource = '136-7317';

    before(() => {
      const setup = setupPut({ resource });
      getta = setup.getta;
    });

    after(() => {
      fetchMock.restore();
    });

    it('should return the updated data', async () => {
      const res = await getta.putProduct({ resource });
      expect(res.data[0]).to.eql(data[resource].body);
    });
  });

  describe('when batched resources are requested to be updated on the server', () => {
    let getta;
    const resource = ['136-7317', '180-1387', '183-3905', '202-3315'];

    before(() => {
      const setup = setupPut({ batch: true, resource });
      getta = setup.getta;
    });

    after(() => {
      fetchMock.restore();
    });

    it('should return the updated data', async () => {
      const res = await getta.putProduct({ resource });
      expect(res.data.sort(sortValues)).to.eql(getValues());
    });
  });

  describe('when all resources are requested to be updated on the server', () => {
    let getta;
    const resource = ['136-7317', '180-1387', '183-3905', '202-3315'];

    before(() => {
      const setup = setupPutAll({ resource });
      getta = setup.getta;
    });

    after(() => {
      fetchMock.restore();
    });

    it('should return the updated data', async () => {
      const res = await getta.putProduct();
      expect(res.data.sort(sortValues)).to.eql(getValues());
    });
  });
});
