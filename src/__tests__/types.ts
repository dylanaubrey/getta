import { StringObject } from "@repodog/types";
import { FetchMockStatic } from "fetch-mock";
import { Getta } from "../main";

export interface TearDownTestParams {
  fetchMock: FetchMockStatic;
  restClient: Getta;
}

export interface MockRequestCallbackParams {
  body?: BodyInit;
  endpoint: string;
  headers: StringObject;
}
