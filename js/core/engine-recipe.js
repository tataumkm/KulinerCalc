export function validateRecipeItem(item, catalog) {
  const errors = [];
  if (!item.ingredientId) errors.push("Bahan wajib dipilih");
  if (!(item.quantity > 0)) errors.push("Qty resep harus lebih dari 0");
  if (!(Number(item.wastePercent) >= 0)) errors.push("Persentase waste tidak valid");
  if (catalog && !catalog[item.ingredientId]) errors.push("Bahan tidak ditemukan di master");
  return errors;
}

export function calcRecipeItemLine(item, ingredient, wastePercent) {
  const baseCost = item.quantity * ingredient.costPerUsageUnit;
  const wastePct = item.wastePercent != null && item.wastePercent !== "" ? Number(item.wastePercent) : wastePercent;
  const effectiveCost = baseCost * (1 + wastePct / 100);
  return {
    ingredientId: item.ingredientId,
    name: ingredient.name,
    quantity: item.quantity,
    unit: item.unit || ingredient.usageUnit,
    baseCost,
    wastePercent: wastePct,
    wasteCost: effectiveCost - baseCost,
    effectiveCost,
  };
}

export function calcRecipeHPP(recipe, items, catalog, wasteDefault = 0) {
  const errors = [];
  if (!recipe || !recipe.id) {
    return { ok: false, errors: ["Resep tidak valid"], totalIngredientCost: 0, lines: [] };
  }
  if (!items || items.length === 0) {
    return { ok: false, errors: ["Resep tidak punya bahan"], totalIngredientCost: 0, lines: [] };
  }
  const lines = [];
  for (const item of items) {
    const ingredient = catalog[item.ingredientId];
    const verr = validateRecipeItem(item, catalog);
    if (verr.length) return { ok: false, errors: verr, totalIngredientCost: 0, lines: [] };
    lines.push(calcRecipeItemLine(item, ingredient, wasteDefault));
  }
  const totalIngredientCost = lines.reduce((s, l) => s + l.effectiveCost, 0);
  return { ok: true, errors: [], totalIngredientCost, lines };
}

export function sumEffectiveCost(lines) {
  return lines.reduce((s, l) => s + l.effectiveCost, 0);
}
