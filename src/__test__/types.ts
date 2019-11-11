import { FetchMockStatic } from "fetch-mock";
import { Getta } from "../main";

export interface TearDownTestParams {
  fetchMock: FetchMockStatic;
  restClient: Getta;
}
