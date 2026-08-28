export function calcDirectHPP(ingredientHPP, packagingTotal) {
  return {
    ingredientCost: Number(ingredientHPP) || 0,
    packagingCost: Number(packagingTotal) || 0,
    directHPP: (Number(ingredientHPP) || 0) + (Number(packagingTotal) || 0),
  };
}

export function calcMarginFromPrice(price, cost) {
  if (!(price > 0)) return null;
  return ((price - cost) / price) * 100;
}

export function calcMarkupFromPrice(price, cost) {
  if (!(cost > 0)) return null;
  return ((price - cost) / cost) * 100;
}

export function menuHealth(marginPercent, settings) {
  const s = settings || { healthyMarginThreshold: 35, reviewMarginThreshold: 20 };
  if (marginPercent == null) return { key: "no-price", label: "Belum ada harga" };
  if (marginPercent < 0) return { key: "loss", label: "Rugi" };
  if (marginPercent < s.reviewMarginThreshold) return { key: "risk", label: "Bahaya" };
  if (marginPercent < s.healthyMarginThreshold) return { key: "review", label: "Review" };
  return { key: "healthy", label: "Sehat" };
}

export function validateMenu(menu, recipeExists, packagingSetExists) {
  const errors = [];
  if (!menu.name || !menu.name.trim()) errors.push("Nama menu wajib diisi");
  if (!menu.recipeId) errors.push("Menu wajib punya resep");
  if (recipeExists === false) errors.push("Resep tidak ditemukan");
  if (menu.packagingSetId && packagingSetExists === false) errors.push("Set kemasan tidak ditemukan");
  if (menu.sellingPrice != null && !(Number(menu.sellingPrice) > 0)) errors.push("Harga jual harus lebih dari 0");
  return errors;
}
