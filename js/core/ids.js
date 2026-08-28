export const ID_PREFIXES = {
  ingredient: "ING",
  recipe: "REC",
  menu: "MENU",
  packaging: "PKG",
  packagingSet: "PKGSET",
  channel: "CHN",
  promotion: "PRM",
  operatingCost: "OPC",
  business: "BIZ",
  priceHistory: "PRH",
  menuPrice: "MPR",
  formula: "FML",
};

const PAD = 6;

export function nextId(prefixKey, lastUsedNumber = 0) {
  if (!ID_PREFIXES[prefixKey]) {
    throw new Error(`Unknown ID prefix key: ${prefixKey}`);
  }
  const n = (lastUsedNumber || 0) + 1;
  return `${ID_PREFIXES[prefixKey]}-${String(n).padStart(PAD, "0")}`;
}

export function parseIdNumber(id) {
  const m = /-(\d+)$/.exec(String(id || ""));
  return m ? parseInt(m[1], 10) : 0;
}

export function maxNumber(ids = []) {
  return ids.reduce((max, id) => Math.max(max, parseIdNumber(id)), 0);
}
