import Cacheability from "cacheability";
import { get } from "lodash";

export default function isCacheabilityValid(cacheability: Cacheability) {
  const noCache = get(cacheability, ["metadata", "cacheControl", "noCache"], false);
  return !noCache && cacheability.checkTTL();
}
