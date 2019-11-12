import fetchMock, { MockRequest } from "fetch-mock";
import md5 from "md5";
import { PRD_136_7317 } from "./__test__/data";
import {
  basePath,
  defaultEtag,
  defaultHeaders,
  defaultPath,
  defaultPathTemplateData,
  defaultPayload,
  getCache,
  idPathTemplateData,
  mockRequest,
  pathTemplateDataWithoutID,
  tearDownTest,
} from "./__test__/helpers";
import {
  COOKIE_HEADER,
  DELETE_METHOD,
  GET_METHOD,
  IF_NONE_MATCH_HEADER,
  LOCATION_HEADER,
  MAX_REDIRECTS_EXCEEDED_ERROR,
  MAX_RETRIES_EXCEEDED_ERROR,
  POST_METHOD,
  RESOURCE_NOT_FOUND_ERROR,
} from "./constants";
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
    let response: ResponseDataWithErrors | ResponseDataWithErrors[];

    beforeAll(async () => {
      restClient = createRestClient<"getProduct">({ basePath, cache: await getCache() });

      restClient.createShortcut("getProduct", defaultPath, {
        method: GET_METHOD,
        pathTemplateData: pathTemplateDataWithoutID,
      });
    });

    describe("WHEN a resource is requested", () => {
      beforeAll(async () => {
        mockRequest(
          defaultPath,
          PRD_136_7317.body,
          { pathTemplateData: defaultPathTemplateData },
          ({ endpoint, ...rest }) => {
            fetchMock.get(endpoint, rest);
          },
        );

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
        mockRequest(
          defaultPath,
          PRD_136_7317.body,
          { pathTemplateData: defaultPathTemplateData },
          ({ endpoint, ...rest }) => {
            fetchMock.get(endpoint, rest);
          },
        );

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
          mockRequest(
            defaultPath,
            PRD_136_7317.body,
            { pathTemplateData: defaultPathTemplateData },
            ({ endpoint, ...rest }) => {
              fetchMock.get(endpoint, rest);
            },
          );

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
          return headers && headers[IF_NONE_MATCH_HEADER] === defaultEtag;
        }

        async function invalidCacheEntryTestSetup() {
          mockRequest(
            defaultPath,
            PRD_136_7317.body,
            { headers: { "cache-control": "public, max-age=1" }, pathTemplateData: defaultPathTemplateData },
            ({ endpoint, ...rest }) => {
              fetchMock.get(endpoint, rest);
            },
          );

          await restClient.getProduct({ pathTemplateData: idPathTemplateData });
          await delay(1000);

          fetchMock.restore();
        }

        describe("WHEN the response returns not modified status code", () => {
          beforeAll(async () => {
            await invalidCacheEntryTestSetup();

            mockRequest(
              defaultPath,
              PRD_136_7317.body,
              { pathTemplateData: defaultPathTemplateData },
              ({ headers }) => {
                fetchMock.mock(matcher, { headers, status: 304 });
              },
            );

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

        describe("WHEN the response returns the resource", () => {
          beforeAll(async () => {
            await invalidCacheEntryTestSetup();

            mockRequest(
              defaultPath,
              PRD_136_7317.body,
              { pathTemplateData: defaultPathTemplateData },
              ({ body, headers }) => {
                fetchMock.mock(matcher, { body, headers, status: 200 });
              },
            );

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

        describe("WHEN the response returns a 404", () => {
          beforeAll(async () => {
            await invalidCacheEntryTestSetup();

            mockRequest(defaultPath, {}, { pathTemplateData: defaultPathTemplateData }, ({ body, headers }) => {
              fetchMock.mock(matcher, { body, headers, status: 404 });
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
              data: {},
              errors: [new Error(RESOURCE_NOT_FOUND_ERROR)],
            });
          });
        });
      });
    });

    describe("WHEN a request is redirected more than five times", () => {
      const REDIRECT_COOKIE_FLAG = "status=redirect";

      function matcher(url: string, { headers }: MockRequest) {
        return headers && headers[COOKIE_HEADER] === REDIRECT_COOKIE_FLAG;
      }

      beforeAll(async () => {
        mockRequest(
          defaultPath,
          {},
          { headers: { [LOCATION_HEADER]: basePath }, pathTemplateData: defaultPathTemplateData },
          ({ body, headers }) => {
            fetchMock.mock(matcher, { body, headers, status: 301 });
          },
        );

        response = await restClient.getProduct({
          headers: { [COOKIE_HEADER]: REDIRECT_COOKIE_FLAG },
          pathTemplateData: idPathTemplateData,
        });
      });

      afterAll(async () => {
        await tearDownTest({ fetchMock, restClient });
      });

      it("SHOULD have made five requests", () => {
        expect(fetchMock.calls().length).toBe(5);
      });

      it("SHOULD return the correct response", () => {
        expect(response).toEqual({
          errors: [new Error(`${MAX_REDIRECTS_EXCEEDED_ERROR} 5.`)],
        });
      });
    });

    describe("WHEN a request is retried more than three times", () => {
      const RETRY_COOKIE_FLAG = "status=retry";

      function matcher(url: string, { headers }: MockRequest) {
        return headers && headers[COOKIE_HEADER] === RETRY_COOKIE_FLAG;
      }

      beforeAll(async () => {
        mockRequest(defaultPath, {}, { pathTemplateData: defaultPathTemplateData }, ({ body, headers }) => {
          fetchMock.mock(matcher, { body, headers, status: 500 });
        });

        response = await restClient.getProduct({
          headers: { [COOKIE_HEADER]: RETRY_COOKIE_FLAG },
          pathTemplateData: idPathTemplateData,
        });
      });

      afterAll(async () => {
        await tearDownTest({ fetchMock, restClient });
      });

      it("SHOULD have made three requests", () => {
        expect(fetchMock.calls().length).toBe(3);
      });

      it("SHOULD return the correct response", () => {
        expect(response).toEqual({
          errors: [new Error(`${MAX_RETRIES_EXCEEDED_ERROR} 3.`)],
        });
      });
    });

    describe("WHEN the same resource is requested in quick succession", () => {
      beforeAll(async () => {
        mockRequest(
          defaultPath,
          PRD_136_7317.body,
          { pathTemplateData: defaultPathTemplateData },
          ({ endpoint, ...rest }) => {
            fetchMock.get(endpoint, rest);
          },
        );

        response = await Promise.all([
          restClient.get(defaultPath, { pathTemplateData: defaultPathTemplateData }),
          restClient.get(defaultPath, { pathTemplateData: defaultPathTemplateData }),
        ]);
      });

      afterAll(async () => {
        await tearDownTest({ fetchMock, restClient });
      });

      it("SHOULD have made one request", () => {
        expect(fetchMock.calls().length).toBe(1);
      });

      it("SHOULD return the correct response", () => {
        expect(response).toEqual([
          {
            data: PRD_136_7317.body,
          },
          {
            data: PRD_136_7317.body,
          },
        ]);
      });
    });

    describe("WHEN a request times out", () => {
      // TODO
    });
  });

  describe("post method", () => {
    let restClient: Getta & ShortcutProperties<"postProduct">;
    let response: ResponseDataWithErrors | ResponseDataWithErrors[];

    beforeAll(async () => {
      restClient = createRestClient<"postProduct">({ basePath, cache: await getCache() });

      restClient.createShortcut("postProduct", defaultPath, {
        method: POST_METHOD,
        pathTemplateData: pathTemplateDataWithoutID,
      });
    });

    describe("WHEN a resource is requested", () => {
      beforeAll(async () => {
        mockRequest(
          defaultPath,
          PRD_136_7317.body,
          { pathTemplateData: defaultPathTemplateData },
          ({ endpoint, ...rest }) => {
            fetchMock.post(endpoint, rest);
          },
        );

        response = await restClient.post(defaultPath, {
          body: defaultPayload,
          pathTemplateData: defaultPathTemplateData,
        });
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
        mockRequest(
          defaultPath,
          PRD_136_7317.body,
          { pathTemplateData: defaultPathTemplateData },
          ({ endpoint, ...rest }) => {
            fetchMock.post(endpoint, rest);
          },
        );

        response = await restClient.postProduct({ body: defaultPayload, pathTemplateData: idPathTemplateData });
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
  });

  describe("delete method", () => {
    let restClient: Getta & ShortcutProperties<"deleteProduct">;
    let response: ResponseDataWithErrors | ResponseDataWithErrors[];
    let requestHash: string;

    beforeAll(async () => {
      restClient = createRestClient<"deleteProduct">({ basePath, cache: await getCache() });

      restClient.createShortcut("deleteProduct", defaultPath, {
        method: DELETE_METHOD,
        pathTemplateData: pathTemplateDataWithoutID,
      });
    });

    describe("WHEN a resource is requested to be deleted", () => {
      beforeAll(async () => {
        mockRequest(
          defaultPath,
          PRD_136_7317.body,
          { pathTemplateData: defaultPathTemplateData },
          ({ endpoint, ...rest }) => {
            requestHash = md5(endpoint);
            fetchMock.get(endpoint, rest);
          },
        );

        response = await restClient.get(defaultPath, { pathTemplateData: defaultPathTemplateData });
        fetchMock.restore();

        mockRequest(defaultPath, {}, { pathTemplateData: defaultPathTemplateData }, ({ endpoint, ...rest }) => {
          fetchMock.delete(endpoint, rest);
        });

        response = await restClient.delete(defaultPath, { pathTemplateData: defaultPathTemplateData });
      });

      afterAll(async () => {
        await tearDownTest({ fetchMock, restClient });
      });

      it("SHOULD have made one request", () => {
        expect(fetchMock.calls().length).toBe(1);
      });

      it("SHOULD return the correct response", () => {
        expect(response).toEqual({
          data: {},
        });
      });

      it("SHOULD delete any matching cache entry", async () => {
        expect(await restClient.cache.has(requestHash)).toBe(false);
      });
    });

    describe("WHEN a resource is requested to be deleted with a shortcut", () => {
      beforeAll(async () => {
        mockRequest(
          defaultPath,
          PRD_136_7317.body,
          { pathTemplateData: defaultPathTemplateData },
          ({ endpoint, ...rest }) => {
            requestHash = md5(endpoint);
            fetchMock.get(endpoint, rest);
          },
        );

        response = await restClient.get(defaultPath, { pathTemplateData: defaultPathTemplateData });
        fetchMock.restore();

        mockRequest(defaultPath, {}, { pathTemplateData: defaultPathTemplateData }, ({ endpoint, ...rest }) => {
          fetchMock.delete(endpoint, rest);
        });

        response = await restClient.deleteProduct({ pathTemplateData: idPathTemplateData });
      });

      afterAll(async () => {
        await tearDownTest({ fetchMock, restClient });
      });

      it("SHOULD have made one request", () => {
        expect(fetchMock.calls().length).toBe(1);
      });

      it("SHOULD return the correct response", () => {
        expect(response).toEqual({
          data: {},
        });
      });

      it("SHOULD delete any matching cache entry", async () => {
        expect(await restClient.cache.has(requestHash)).toBe(false);
      });
    });
  });
});
