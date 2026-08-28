import { baseUnitFor, baseCountForGroup, convert } from "./units.js";

export function validateIngredient(ing) {
  const errors = [];
  if (!ing.name || !ing.name.trim()) errors.push("Nama bahan wajib diisi");
  if (!(ing.purchasePrice > 0)) errors.push("Harga pembelian harus lebih dari 0");
  if (!(ing.purchaseQty > 0)) errors.push("Qty pembelian harus lebih dari 0");
  if (!(ing.conversion > 0) && ing.conversion !== undefined)
    errors.push("Konversi harus lebih dari 0");
  return errors;
}

export function calculateCostPerUsageUnit(ing) {
  const errors = validateIngredient(ing);
  if (errors.length) {
    return { ok: false, errors, costPerUsageUnit: null, conversionNote: null };
  }

  let usageQtyTotal;
  let conversionNote;
  const basePurchase = baseUnitFor(ing.purchaseUnit);
  const baseUsage = baseUnitFor(ing.usageUnit);

  if (basePurchase === "Pcs" && baseUsage === "Pcs") {
    const perBundle = ing.conversion || baseCountForGroup(ing.purchaseUnit);
    usageQtyTotal = ing.purchaseQty * perBundle;
    conversionNote = `1 ${ing.purchaseUnit} = ${perBundle} ${ing.usageUnit}`;
  } else {
    const converted = convert(ing.purchaseQty, ing.purchaseUnit, ing.usageUnit);
    usageQtyTotal = converted;
    conversionNote = `${ing.purchaseQty} ${ing.purchaseUnit} = ${converted} ${ing.usageUnit}`;
  }

  return {
    ok: true,
    errors: [],
    costPerUsageUnit: ing.purchasePrice / usageQtyTotal,
    conversionNote,
    usageQtyTotal,
  };
}

export function applyPriceChange(ing, newPurchasePrice, meta = {}) {
  const next = {
    ...ing,
    purchasePrice: Number(newPurchasePrice),
    updatedAt: meta.now || new Date().toISOString(),
  };
  const calc = calculateCostPerUsageUnit(next);
  if (!calc.ok) return { ok: false, errors: calc.errors };
  next.costPerUsageUnit = calc.costPerUsageUnit;
  next.conversionNote = calc.conversionNote;
  return { ok: true, ingredient: next };
}
