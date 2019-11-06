import Cachemap from "@cachemap/core";
import { Func, StringObjectMap } from "@repodog/types";
import { JsonObject, JsonValue } from "type-fest";

export type FetchMethod = "get" | "post" | "put" | "delete";

export type StreamReader = "arrayBuffer" | "blob" | "formData" | "json" | "text";

export type ShortcutProperties<T extends string | number | symbol> = {
  [K in T]: (...args: any[]) => ResponseDataWithErrors;
};

export interface ConstructorOptions {
  basePath: string;
  bodyParser?: Func;
  cache?: Cachemap;
  enableConditionalRequests?: boolean;
  fetchTimeout?: number;
  headers?: StringObjectMap;
  maxRedirects?: number;
  maxRetries?: number;
  pathTemplateCallback?: PathTemplateCallback;
  pathTemplateRegExp?: RegExp;
  queryParams?: JsonObject;
  requestRetryWait?: number;
  streamReader?: StreamReader;
}

export interface RequestOptions {
  headers?: StringObjectMap;
  method?: FetchMethod;
  pathTemplateData?: StringObjectMap;
  queryParams?: JsonObject;
}

export interface ResponseData {
  data?: JsonValue;
}

export interface ResponseDataWithErrors extends ResponseData {
  errors?: Error[];
}

export type PathTemplateCallback = (path: string, data: StringObjectMap, pathTemplateRegExp: RegExp) => string;

export type PendingRequestResolver = (value?: ResponseDataWithErrors) => void;

export interface PendingRequestResolvers {
  resolve: PendingRequestResolver;
}

export interface RequestTracker {
  active: string[];
  pending: Map<string, PendingRequestResolvers[]>;
}

export interface FetchOptions {
  body?: BodyInit;
  headers: StringObjectMap;
  method: FetchMethod;
  redirects?: number;
  retries?: number;
}

export interface FetchResult extends ResponseDataWithErrors {
  headers?: Headers;
  status?: number;
}

export interface FetchRedirectHandlerOptions extends FetchOptions {
  status: number;
}
