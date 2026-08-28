export const UNIT_GROUPS = {
  mass: ["Gram", "Kg"],
  volume: ["ml", "Liter"],
  count: ["Pcs", "Dus", "Karton"],
};

export const BASE_UNITS = {
  Gram: "Gram",
  Kg: "Gram",
  ml: "ml",
  Liter: "ml",
  Pcs: "Pcs",
  Dus: "Pcs",
  Karton: "Pcs",
};

export const BASE_FACTOR = {
  Gram: 1,
  Kg: 1000,
  ml: 1,
  Liter: 1000,
  Pcs: 1,
  Dus: 12,
  Karton: 24,
};

export function isKnownUnit(unit) {
  return unit in BASE_UNITS;
}

export function belongsToSameGroup(a, b) {
  for (const group of Object.values(UNIT_GROUPS)) {
    if (group.includes(a) && group.includes(b)) return true;
  }
  return false;
}

export function baseUnitFor(unit) {
  return BASE_UNITS[unit] || unit;
}

export function baseCountForGroup(unit) {
  return BASE_FACTOR[unit] || 1;
}

export function convertToBase(quantity, unit) {
  if (!belongsToSameGroup(unit, unit)) {
    throw new Error(`Satuan tidak dikenal: ${unit}`);
  }
  const factor = BASE_FACTOR[unit] || 1;
  return quantity * factor;
}

export function convert(quantity, fromUnit, toUnit) {
  if (fromUnit === toUnit) return quantity;
  if (!belongsToSameGroup(fromUnit, toUnit)) {
    throw new Error(`Konversi tidak valid: ${fromUnit} -> ${toUnit}`);
  }
  const base = convertToBase(quantity, fromUnit);
  const factorTo = BASE_FACTOR[toUnit] || 1;
  return base / factorTo;
}

export const CONVERSION_LABELS = {
  "Kg->Gram": "1 Kg = 1.000 Gram",
  "Liter->ml": "1 Liter = 1.000 ml",
  "Dus->Pcs": "1 Dus = 12 Pcs",
  "Karton->Pcs": "1 Karton = 24 Pcs",
};
