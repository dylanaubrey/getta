import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import { flatten } from 'lodash';
import sinonChai from 'sinon-chai';
import data, { getValues } from '../data';

import {
  baseURL,
  cachemapOptions,
  mockGet,
  productArgs,
  setupGet,
  setupGetAll,
  setupPost,
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
    let fetchMock, getta, res;
    const resource = '136-7317';

    before(() => {
      const setup = setupGet({ resource });
      fetchMock = setup.fetchMock;
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
      expect(res[0]).to.eql(data[resource].body);
    });

    it('should cache the data against the endpoint', async () => {
      expect(await getta._cache.size()).to.eql(1);
      const entry = await getta._cache.get(`content/catalog/product/${resource}`);
      expect(entry).to.eql(data[resource].body);
    });
  });

  describe('when one resource is requested from the server using a shortcut', () => {
    let fetchMock, getta, res;
    const resource = '136-7317';

    before(() => {
      const setup = setupGet({ resource });
      fetchMock = setup.fetchMock;
      getta = setup.getta;
    });

    after(() => {
      fetchMock.restore();
    });

    beforeEach(async () => {
      res = await getta.getProducts({ resource });
    });

    afterEach(async () => {
      await getta._cache.clear();
    });

    it('should return the requested data', () => {
      expect(res[0]).to.eql(data[resource].body);
    });

    it('should cache the data against the endpoint', async () => {
      expect(await getta._cache.size()).to.eql(1);
      const entry = await getta._cache.get(`content/catalog/product/${resource}`);
      expect(entry).to.eql(data[resource].body);
    });
  });

  describe('when one requested resource is in the cache', () => {
    let fetchMock, getta, res, urls;
    const resource = '136-7317';

    before(async () => {
      const setup = setupGet({ resource });
      fetchMock = setup.fetchMock;
      getta = setup.getta;
      urls = setup.urls;
      await getta.getProducts({ resource });
    });

    after(async () => {
      fetchMock.restore();
      await getta._cache.clear();
    });

    beforeEach(async () => {
      fetchMock.reset();
      res = await getta.getProducts({ resource });
    });

    it('should return the requested data', () => {
      expect(res[0]).to.eql(data[resource].body);
    });

    it('should not have fetched the data from the server', async () => {
      expect(fetchMock.called(urls[0])).to.be.false();
    });
  });

  describe('when batched resources are requested from the server', () => {
    let fetchMock, getta, res;
    const resource = ['136-7317', '180-1387', '183-3905', '202-3315'];

    before(() => {
      const setup = setupGet({ batch: true, resource });
      fetchMock = setup.fetchMock;
      getta = setup.getta;
    });

    after(() => {
      fetchMock.restore();
    });

    beforeEach(async () => {
      res = await getta.getProducts({ resource });
    });

    afterEach(async () => {
      await getta._cache.clear();
    });

    it('should return the requested data', () => {
      expect(res).to.eql(getValues());
    });

    it('should cache each data resource against its respective endpoint', async () => {
      expect(await getta._cache.size()).to.eql(4);
      const entries = [];

      resource.forEach((value) => {
        entries.push(getta._cache.get(`content/catalog/product/${value}`));
      });

      expect(await Promise.all(entries)).to.eql(getValues());
    });
  });

  describe('when batched requested resources are returned from the server and cache', () => {
    let fetchMock, getta, res;
    const resource = ['136-7317', '180-1387', '183-3905', '202-3315'];
    const cacheResource = '136-7317';
    const serverResource = ['180-1387', '183-3905', '202-3315'];

    before(() => {
      mockGet({ batch: false, resource: cacheResource });
      const setup = setupGet({ batch: true, resource: serverResource });
      fetchMock = setup.fetchMock;
      getta = setup.getta;
    });

    after(() => {
      fetchMock.restore();
    });

    beforeEach(async () => {
      await getta.getProducts({ resource: cacheResource });
    });

    afterEach(async () => {
      await getta._cache.clear();
      fetchMock.reset();
    });

    it('should return the requested data', async () => {
      res = await getta.getProducts({ resource });
      expect(res.sort(sortValues)).to.eql(getValues());
    });

    it('should cache each data resource against its respective endpoint', async () => {
      expect(await getta._cache.size()).to.eql(1);
      const entry = await getta._cache.get(`content/catalog/product/${cacheResource}`);
      expect(entry).to.eql(data[cacheResource].body);
      await getta.getProducts({ resource });
      expect(await getta._cache.size()).to.eql(4);
      const promises = [];

      resource.forEach((value) => {
        promises.push(getta._cache.get(`content/catalog/product/${value}`));
      });

      const entries = await Promise.all(promises);
      expect(entries.sort(sortValues)).to.eql(getValues());
    });
  });

  describe('when separate resources are batched and requested from the server', () => {
    let fetchMock, getta, res;
    const resource = ['136-7317', '180-1387', '183-3905', '202-3315'];

    before(() => {
      const setup = setupGet({ batch: true, resource });
      fetchMock = setup.fetchMock;
      getta = setup.getta;
    });

    after(() => {
      fetchMock.restore();
    });

    beforeEach(async () => {
      const promises = [];

      resource.forEach((value) => {
        promises.push(getta.getProducts({ resource: value }));
      });

      res = flatten(await Promise.all(promises));
    });

    afterEach(async () => {
      await getta._cache.clear();
      fetchMock.reset();
    });

    it('should return the requested data', async () => {
      expect(res.sort(sortValues)).to.eql(getValues());
    });

    it('should cache each data resource against its respective endpoint', async () => {
      expect(await getta._cache.size()).to.eql(4);
      const promises = [];

      resource.forEach((value) => {
        promises.push(getta._cache.get(`content/catalog/product/${value}`));
      });

      const entries = await Promise.all(promises);
      expect(entries.sort(sortValues)).to.eql(getValues());
    });
  });

  describe('when all resources are requested from the server', () => {
    let fetchMock, getta, res;
    const resource = ['136-7317', '180-1387', '183-3905', '202-3315'];

    before(() => {
      const setup = setupGetAll({ resource });
      fetchMock = setup.fetchMock;
      getta = setup.getta;
    });

    after(() => {
      fetchMock.restore();
    });

    beforeEach(async () => {
      res = await getta.getProducts();
    });

    afterEach(async () => {
      await getta._cache.clear();
      fetchMock.reset();
    });

    it('should return the requested data', async () => {
      expect(res.sort(sortValues)).to.eql(getValues());
    });

    it('should cache each data resource against its respective endpoint', async () => {
      expect(await getta._cache.size()).to.eql(4);
      const promises = [];

      resource.forEach((value) => {
        promises.push(getta._cache.get(`content/catalog/product/${value}`));
      });

      const entries = await Promise.all(promises);
      expect(entries.sort(sortValues)).to.eql(getValues());
    });
  });
});

describe('the .post() method', () => {
  describe('when one resource is created and returned from the server', () => {
    let fetchMock, getta, res;
    const resource = '136-7317';

    before(() => {
      const setup = setupPost({ resource });
      fetchMock = setup.fetchMock;
      getta = setup.getta;
    });

    after(() => {
      fetchMock.restore();
    });

    beforeEach(async () => {
      res = await getta.postProducts({ body: { id: resource } });
    });

    afterEach(async () => {
      await getta._cache.clear();
      fetchMock.reset();
    });

    it('should return the created data', async () => {
      expect(res[0]).to.eql(data[resource].body);
    });

    it('should cache the returned data against its .get() endpoint', async () => {
      expect(await getta._cache.size()).to.eql(1);
      const entry = await getta._cache.get(`content/catalog/product/${resource}`);
      expect(entry).to.eql(data[resource].body);
    });
  });
});
