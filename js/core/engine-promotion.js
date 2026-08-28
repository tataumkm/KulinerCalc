export const PROMO_TYPES = [
  "percentage",
  "nominal",
  "buy_x_get_y",
  "bundle",
  "voucher",
  "minimum_purchase",
  "special_price",
  "cashback",
];

export const FUNDING_TYPES = ["merchant", "platform", "split"];

export function validatePromotion(promo) {
  const errors = [];
  if (!promo.name || !promo.name.trim()) errors.push("Nama promo wajib diisi");
  if (!PROMO_TYPES.includes(promo.type)) errors.push("Tipe promo tidak valid");
  if (!FUNDING_TYPES.includes(promo.funding)) errors.push("Penanggung diskon tidak valid");
  if (promo.discountPercent != null) {
    const v = Number(promo.discountPercent);
    if (v < 0 || v > 100) errors.push("Diskon % harus 0–100");
  }
  if (promo.discountAmount != null && Number(promo.discountAmount) < 0) errors.push("Diskon nominal tidak boleh negatif");
  return errors;
}

export function effectiveDiscount(promo, price, unitCount = 1) {
  switch (promo.type) {
    case "percentage":
      return (Number(price) || 0) * (Number(promo.discountPercent) || 0) / 100 * unitCount;
    case "nominal":
    case "voucher":
    case "cashback":
      return (Number(promo.discountAmount) || 0) * unitCount;
    case "special_price": {
      const sp = Number(promo.specialPrice);
      if (!(sp > 0) || sp >= price) return 0;
      return ((Number(price) || 0) - sp) * unitCount;
    }
    default:
      return 0;
  }
}

export function merchantDiscountShare(promo, discount) {
  if (promo.funding === "merchant") return discount;
  if (promo.funding === "platform") return 0;
  if (promo.funding === "split" && promo.merchantShare != null) {
    const share = Number(promo.merchantShare);
    if (!(share > 0)) return 0;
    return Math.min(share, discount);
  }
  return 0;
}

export function buyXGetY(x, y, unitPrice) {
  const totalUnitsOut = x + y;
  const totalPaid = x * unitPrice;
  return {
    totalUnitsOut,
    totalPaid,
    effectiveRevenuePerUnit: totalUnitsOut > 0 ? totalPaid / totalUnitsOut : 0,
    freeUnits: y,
  };
}
