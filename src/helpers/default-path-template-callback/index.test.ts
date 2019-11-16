import defaultPathTemplateCallback from ".";
import { defaultPath, defaultPathTemplateData } from "../../__test__/helpers";
import { DEFAULT_PATH_TEMPLATE_REGEX } from "../../constants";

describe("defaultPathTemplateCallback", () => {
  it("SHOULD populate the path template correctly", () => {
    expect(defaultPathTemplateCallback(defaultPath, defaultPathTemplateData, DEFAULT_PATH_TEMPLATE_REGEX)).toBe(
      "/direct/rest/content/catalog/product/136-7317?format=standard",
    );
  });
});
