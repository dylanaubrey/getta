import fetchMock, { MockRequest } from "fetch-mock";
import { PRD_136_7317 } from "./__test__/data";
import {
  basePath,
  defaultEtag,
  defaultHeaders,
  defaultPath,
  defaultPathTemplateData,
  getCache,
  idPathTemplateData,
  mockRequest,
  pathTemplateDataWithoutID,
  tearDownTest,
} from "./__test__/helpers";
import { GET_METHOD, IF_NONE_MATCH_HEADER } from "./constants";
import delay from "./helpers/delay";
import createRestClient, { Getta } from "./main";
import { ResponseDataWithErrors, ShortcutProperties } from "./types";

describe("Getta", () => {
  describe("constructor", () => {
    it("SHOULD return an instance of the Getta class", async () => {
      const restClient = createRestClient({ basePath, cache: await getCache() });
      expect(restClient).toBeInstanceOf(Getta);
    });
  });

  describe("get method", () => {
    let restClient: Getta & ShortcutProperties<"getProduct">;
    let response: ResponseDataWithErrors;

    beforeAll(async () => {
      restClient = createRestClient<"getProduct">({ basePath, cache: await getCache() });

      restClient.createShortcut("getProduct", defaultPath, {
        method: GET_METHOD,
        pathTemplateData: pathTemplateDataWithoutID,
      });
    });

    describe("WHEN a resource is requested", () => {
      beforeAll(async () => {
        mockRequest(defaultPath, PRD_136_7317.body, { pathTemplateData: defaultPathTemplateData }, (...args) => {
          fetchMock.get(...args);
        });

        response = await restClient.get(defaultPath, { pathTemplateData: defaultPathTemplateData });
      });

      afterAll(async () => {
        await tearDownTest({ fetchMock, restClient });
      });

      it("SHOULD have made one request", () => {
        expect(fetchMock.calls().length).toBe(1);
      });

      it("SHOULD return the correct response", () => {
        expect(response).toEqual({
          data: PRD_136_7317.body,
        });
      });
    });

    describe("WHEN a resource is requested with a shortcut", () => {
      beforeAll(async () => {
        mockRequest(defaultPath, PRD_136_7317.body, { pathTemplateData: defaultPathTemplateData }, (...args) => {
          fetchMock.get(...args);
        });

        response = await restClient.getProduct({ pathTemplateData: idPathTemplateData });
      });

      afterAll(async () => {
        await tearDownTest({ fetchMock, restClient });
      });

      it("SHOULD have made one request", () => {
        expect(fetchMock.calls().length).toBe(1);
      });

      it("SHOULD return the correct response", () => {
        expect(response).toEqual({
          data: PRD_136_7317.body,
        });
      });
    });

    describe("WHEN a resource is in the cache", () => {
      describe("WHEN the cache entry is valid", () => {
        beforeAll(async () => {
          mockRequest(defaultPath, PRD_136_7317.body, { pathTemplateData: defaultPathTemplateData }, (...args) => {
            fetchMock.get(...args);
          });

          await restClient.getProduct({ pathTemplateData: idPathTemplateData });
          fetchMock.restore();
          response = await restClient.getProduct({ pathTemplateData: idPathTemplateData });
        });

        afterAll(async () => {
          await tearDownTest({ fetchMock, restClient });
        });

        it("SHOULD not have made a request", () => {
          expect(fetchMock.calls().length).toBe(0);
        });

        it("SHOULD return the correct response", () => {
          expect(response).toEqual({
            data: PRD_136_7317.body,
          });
        });
      });

      describe("WHEN the cache entry is invalid", () => {
        function matcher(url: string, { headers }: MockRequest) {
          if (!headers) return false;
          return headers[IF_NONE_MATCH_HEADER] === defaultEtag;
        }

        async function invalidCacheEntryTestSetup() {
          mockRequest(
            defaultPath,
            PRD_136_7317.body,
            { headers: { "cache-control": "public, max-age=1" }, pathTemplateData: defaultPathTemplateData },
            (...args) => {
              fetchMock.get(...args);
            },
          );

          await restClient.getProduct({ pathTemplateData: idPathTemplateData });
          await delay(1000);

          fetchMock.restore();
        }

        describe("WHEN the response returns not modified status code", () => {
          beforeAll(async () => {
            await invalidCacheEntryTestSetup();

            mockRequest(defaultPath, PRD_136_7317.body, { pathTemplateData: defaultPathTemplateData }, path => {
              fetchMock.mock(matcher, { headers: defaultHeaders, status: 304 });
            });

            response = await restClient.getProduct({ pathTemplateData: idPathTemplateData });
          });

          afterAll(async () => {
            await tearDownTest({ fetchMock, restClient });
          });

          it("SHOULD not have made a request", () => {
            expect(fetchMock.calls().length).toBe(1);
          });

          it("SHOULD return the correct response", () => {
            expect(response).toEqual({
              data: PRD_136_7317.body,
            });
          });
        });

        describe("WHEN the response returns the resource", () => {
          beforeAll(async () => {
            await invalidCacheEntryTestSetup();

            mockRequest(
              defaultPath,
              PRD_136_7317.body,
              { pathTemplateData: defaultPathTemplateData },
              (path, { body }) => {
                fetchMock.mock(matcher, { body, headers: defaultHeaders, status: 200 });
              },
            );

            response = await restClient.getProduct({ pathTemplateData: idPathTemplateData });
          });

          afterAll(async () => {
            await tearDownTest({ fetchMock, restClient });
          });

          it("SHOULD not have made a request", () => {
            expect(fetchMock.calls().length).toBe(1);
          });

          it("SHOULD return the correct response", () => {
            expect(response).toEqual({
              data: PRD_136_7317.body,
            });
          });
        });
      });
    });
  });
});
