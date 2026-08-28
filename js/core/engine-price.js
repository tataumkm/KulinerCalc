export function priceDiffPercent(oldPrice, newPrice) {
  if (!(oldPrice > 0)) return null;
  return ((newPrice - oldPrice) / oldPrice) * 100;
}

export function summarizePriceDiff(oldPrice, newPrice) {
  const pct = priceDiffPercent(oldPrice, newPrice);
  if (pct === null) return { pct: null, direction: null, label: null };
  const direction = pct === 0 ? "flat" : pct > 0 ? "up" : "down";
  return { pct, direction, label: `${direction === "up" ? "naik" : direction === "down" ? "turun" : "tetap"}` };
}
