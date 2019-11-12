import { PathTemplateCallback, RequestOptions } from "../../types";

export interface BuildEndpointOptions extends Omit<RequestOptions, "headers"> {
  pathTemplateCallback: PathTemplateCallback;
  pathTemplateRegExp: RegExp;
}
