import { DEFAULT_PATH_TEMPLATE_CALLBACK, DEFAULT_PATH_TEMPLATE_REGEX } from "./constants";

describe("DEFAULT_PATH_TEMPLATE_CALLBACK", () => {
  it("SHOULD populate the path template correctly", () => {
    const path = "/direct/rest/inventory/{type}/{id,+}?format={brief|standard}";
    const data = { "brief|standard": "standard", "id,+": "136-7317", type: "product" };
    const output = "/direct/rest/inventory/product/136-7317?format=standard";
    expect(DEFAULT_PATH_TEMPLATE_CALLBACK(path, data, DEFAULT_PATH_TEMPLATE_REGEX)).toBe(output);
  });
});
