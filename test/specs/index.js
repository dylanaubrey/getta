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

  before(() => {
    fetchMock = mockFetch(resource);
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
