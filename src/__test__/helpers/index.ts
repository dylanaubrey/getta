import Cachemap from "@cachemap/core";
import map from "@cachemap/map";
import fetchMock from "fetch-mock";
import { JsonValue } from "type-fest";
import { DEFAULT_PATH_TEMPLATE_CALLBACK, DEFAULT_PATH_TEMPLATE_REGEX } from "../../constants";
import buildEndpoint from "../../helpers/build-endpoint";
import { RequestOptions } from "../../types";

export const basePath = "https://tesco.com";

export const defaultPath = "/direct/rest/content/catalog/{type}/{id,+}?format={brief|standard}";

export const defaultPathTemplateData = { "brief|standard": "standard", "id,+": "136-7317", type: "product" };

export const idPathTemplateData = { "id,+": "136-7317" };

export const pathTemplateDataWithoutID = { "brief|standard": "standard", type: "product" };

export const defaultHeaders = {
  "cache-control": "public, max-age=6000",
  "content-type": "application/json",
  etag: "33a64df551425fcc55e4d42a148795d9f25f89d4",
};

export async function getCache() {
  return Cachemap.init({
    name: "cachemap",
    store: map(),
  });
}

export function mockGetRequest(
  path: string,
  body: JsonValue,
  { headers = {}, pathTemplateData, queryParams }: RequestOptions = {},
) {
  return fetchMock.get(
    buildEndpoint(basePath, path, {
      pathTemplateCallback: DEFAULT_PATH_TEMPLATE_CALLBACK,
      pathTemplateData,
      pathTemplateRegExp: DEFAULT_PATH_TEMPLATE_REGEX,
      queryParams,
    }),
    {
      body,
      headers: { ...defaultHeaders, ...headers },
    },
  );
}
