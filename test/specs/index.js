import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import sinonChai from 'sinon-chai';
import data from '../data';
import { mockFetch, productArgs } from '../helpers';
import { localStorageMock } from '../mocks';
import Getta from '../../src';

chai.use(dirtyChai);
chai.use(sinonChai);

const baseURL = 'https://www.tesco.com/direct/rest/';
const cachemapOptions = { localStorageOptions: { mock: localStorageMock } };

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

describe('when one resource is requested successfully', () => {
  let fetchMock, getta, res;
  const resource = '136-7317';
  const path = 'content/catalog/product';

  before(() => {
    const mock = mockFetch({ baseURL, path, resource });
    fetchMock = mock.fetchMock;
    process.env.WEB_ENV = true;
    getta = new Getta({ baseURL, cachemapOptions, newInstance: true });
  });

  after(() => {
    fetchMock.restore();
    delete process.env.WEB_ENV;
  });

  beforeEach(async () => {
    res = await getta.get(productArgs({ id: resource }));
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

describe('when one resource is requested successfully using a shortcut', () => {
  let fetchMock, getta, res;
  const resource = '136-7317';
  const path = 'content/catalog/product';

  before(() => {
    const mock = mockFetch({ baseURL, path, resource });
    fetchMock = mock.fetchMock;
    process.env.WEB_ENV = true;
    getta = new Getta({ baseURL, cachemapOptions, newInstance: true });

    getta.shortcut('get', 'getProducts', {
      path, options: { batch: true, bodyParser: body => ({ data: body }) },
    });
  });

  after(() => {
    fetchMock.restore();
    delete process.env.WEB_ENV;
  });

  beforeEach(async () => {
    res = await getta.getProducts({ resource: { id: resource } });
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

describe('when one resource is successfully requested from cache', () => {
  let fetchMock, getta, res, urls;
  const resource = '136-7317';
  const path = 'content/catalog/product';

  before(async () => {
    const mock = mockFetch({ baseURL, path, resource });
    fetchMock = mock.fetchMock;
    urls = mock.urls;
    process.env.WEB_ENV = true;
    getta = new Getta({ baseURL, cachemapOptions, newInstance: true });

    getta.shortcut('get', 'getProducts', {
      path, options: { batch: true, bodyParser: body => ({ data: body }) },
    });

    await getta.getProducts({ resource: { id: resource } });
  });

  after(async () => {
    fetchMock.restore();
    delete process.env.WEB_ENV;
    await getta._cache.clear();
  });

  beforeEach(async () => {
    fetchMock.reset();
    res = await getta.getProducts({ resource: { id: resource } });
  });

  it('should return the requested data', () => {
    expect(res[0]).to.eql(data[resource].body);
  });

  it('should not have fetched the data from the server', async () => {
    expect(fetchMock.called(urls[0])).to.be.false();
  });
});

describe('when multiple resources are successfully requested in a batch', () => {
  let fetchMock, getta, res;
  const resource = ['136-7317', '180-1387', '183-3905', '202-3315'];
  const path = 'content/catalog/product';

  before(() => {
    const mock = mockFetch({ baseURL, batch: true, path, resource });
    fetchMock = mock.fetchMock;
    process.env.WEB_ENV = true;
    getta = new Getta({ baseURL, cachemapOptions, newInstance: true });

    getta.shortcut('get', 'getProducts', {
      path, options: { batch: true, bodyParser: body => ({ data: body }) },
    });
  });

  after(() => {
    fetchMock.restore();
    delete process.env.WEB_ENV;
  });

  beforeEach(async () => {
    res = await getta.getProducts({ resource: { id: resource } });
  });

  afterEach(async () => {
    await getta._cache.clear();
  });

  it('should return the requested data', () => {
    expect(res.length).to.eql(4);
  });
});
