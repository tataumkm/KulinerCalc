export function validatePackaging(pkg) {
  const errors = [];
  if (!pkg.name || !pkg.name.trim()) errors.push("Nama kemasan wajib diisi");
  if (!(pkg.purchasePrice > 0)) errors.push("Harga pembelian harus lebih dari 0");
  if (!(pkg.purchaseQty > 0)) errors.push("Qty pembelian harus lebih dari 0");
  return errors;
}

export function calculateCostPerUnit(pkg) {
  const errors = validatePackaging(pkg);
  if (errors.length) return { ok: false, errors, costPerUnit: null };
  return { ok: true, errors: [], costPerUnit: pkg.purchasePrice / pkg.purchaseQty };
}

export function packagingSetTotal(packagingSet, items, catalog) {
  let total = 0;
  const lines = [];
  for (const it of items) {
    const pkg = catalog[it.packagingId];
    if (!pkg) continue;
    const cost = pkg.costPerUnit || calculateCostPerUnit(pkg).costPerUnit;
    const lineCost = cost * it.quantity;
    total += lineCost;
    lines.push({ ...it, costPerUnit: cost, lineCost, name: pkg.name });
  }
  return { total, lines };
}

export function validatePackagingSet(set, items) {
  const errors = [];
  if (!set.name || !set.name.trim()) errors.push("Nama set kemasan wajib diisi");
  if (!items || items.length === 0) errors.push("Set kemasan minimal punya 1 item");
  return errors;
}
