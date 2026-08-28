export function formatIDR(value) {
  const n = Number.isFinite(Number(value)) ? Number(value) : 0;
  return "Rp" + n.toLocaleString("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function formatNumber(value, digits = 0) {
  const n = Number.isFinite(Number(value)) ? Number(value) : 0;
  return n.toLocaleString("id-ID", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatPercent(value, digits = 1) {
  const n = Number.isFinite(Number(value)) ? Number(value) : 0;
  return n.toLocaleString("id-ID", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }) + "%";
}

export function parseIDR(text) {
  if (typeof text !== "string") return Number(text) || 0;
  const cleaned = text
    .replace(/[Rr][Pp]/, "")
    .replace(/[^0-9.,-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  return parseFloat(cleaned) || 0;
}
