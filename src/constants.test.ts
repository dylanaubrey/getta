import { defaultPath, defaultPathTemplateData } from "./__test__/helpers";
import { DEFAULT_PATH_TEMPLATE_CALLBACK, DEFAULT_PATH_TEMPLATE_REGEX } from "./constants";

describe("DEFAULT_PATH_TEMPLATE_CALLBACK", () => {
  it("SHOULD populate the path template correctly", () => {
    expect(DEFAULT_PATH_TEMPLATE_CALLBACK(defaultPath, defaultPathTemplateData, DEFAULT_PATH_TEMPLATE_REGEX)).toBe(
      "/direct/rest/content/catalog/product/136-7317?format=standard",
    );
  });
});
