import { FetchMockStatic } from "fetch-mock";
import { PRD_136_7317 } from "./__test__/data";
import { basePath, defaultPath, defaultPathTemplateData, getCache, mockGetRequest } from "./__test__/helpers";
import { GET_METHOD } from "./constants";
import createRestClient, { Getta } from "./main";
import { ShortcutProperties } from "./types";

describe("Getta", () => {
  describe("constructor", () => {
    it("SHOULD return an instance of the Getta class", async () => {
      const restClient = createRestClient({ basePath, cache: await getCache() });
      expect(restClient).toBeInstanceOf(Getta);
    });
  });

  describe("get method", () => {
    let restClient: Getta & ShortcutProperties<"getProduct">;
    let fetchMock: FetchMockStatic;

    beforeAll(async () => {
      restClient = createRestClient<"getProduct">({ basePath, cache: await getCache() });
      restClient.createShortcut("getProduct", defaultPath, { method: GET_METHOD });
    });

    describe("WHEN a resource is requested", () => {
      beforeAll(() => {
        fetchMock = mockGetRequest(defaultPath, PRD_136_7317.body, { pathTemplateData: defaultPathTemplateData });
      });

      afterAll(async () => {
        fetchMock.restore();
        await restClient.cache.clear();
      });

      it("SHOULD return the correct response", async () => {
        expect(await restClient.get(defaultPath, { pathTemplateData: defaultPathTemplateData })).toEqual({
          data: PRD_136_7317.body,
        });
      });
    });

    describe("WHEN a resource is requested with a shortcut", () => {
      beforeAll(() => {
        fetchMock = mockGetRequest(defaultPath, PRD_136_7317.body, { pathTemplateData: defaultPathTemplateData });
      });

      afterAll(() => {
        fetchMock.restore();
      });

      it("SHOULD return the correct response", async () => {
        expect(await restClient.getProduct({ pathTemplateData: defaultPathTemplateData })).toEqual({
          data: PRD_136_7317.body,
        });
      });
    });
  });
});
