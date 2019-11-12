import Cacheability from "cacheability";

export default function isCacheabilityValid(cacheability: Cacheability) {
  const noCache = cacheability?.metadata?.cacheControl?.noCache ?? false;
  return !noCache && cacheability.checkTTL();
}
