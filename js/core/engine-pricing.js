import { calcChannelFee, calcNetRevenue } from "./engine-channel.js";
import { effectiveDiscount, merchantDiscountShare } from "./engine-promotion.js";

function feeRate(channel) {
  return (Number(channel.commissionPercent) + Number(channel.paymentFeePercent) + Number(channel.taxPercent) + Number(channel.marketingFeePercent)) / 100;
}
function feeFixed(channel) {
  return Number(channel.fixedFee) || 0;
}

function merchantDiscountRate(promo) {
  if (!promo) return 0;
  if (promo.type === "percentage" && promo.funding === "merchant") {
    return Number(promo.discountPercent || 0) / 100;
  }
  if (promo.type === "percentage" && promo.funding === "split" && promo.merchantShare != null) {
    return (Number(promo.discountPercent || 0) / 100) * (1 - Number(promo.merchantShare) / 100);
  }
  return 0;
}

export function marginBreakdown(price, { directHPP, channel, promo }) {
  const p = Number(price) || 0;
  let merchantDiscount = 0;
  if (promo) {
    merchantDiscount = merchantDiscountShare(promo, effectiveDiscount(promo, p, 1));
  }
  const discountedSales = p - merchantDiscount;
  const netRevenue = calcNetRevenue(discountedSales, channel).netRevenue;
  const profit = netRevenue - Number(directHPP);
  const margin = p > 0 ? (profit / p) * 100 : null;
  return { price: p, gross: p, merchantDiscount, discountedSales, channelFee: calcChannelFee(discountedSales, channel).total, netRevenue, directHPP: Number(directHPP), profit, margin };
}

export function priceBreakdown(price, ctx) {
  return marginBreakdown(price, ctx);
}

export function roundPrice(price, step = 500) {
  const s = step > 0 ? step : 500;
  return Math.max(s, Math.ceil(Number(price) / s) * s);
}

export function minPrice({ directHPP, channel, promo }) {
  const hpp = Number(directHPP) || 0;
  const denom = (1 - merchantDiscountRate(promo)) * (1 - feeRate(channel));
  if (denom <= 0) return hpp + feeFixed(channel) + 1;
  let base = (hpp + feeFixed(channel)) / denom;
  base = Math.ceil(base);
  let p = base;
  for (let i = 0; i < 10000; i++) {
    const bd = marginBreakdown(p, { directHPP: hpp, channel, promo });
    if (bd.profit >= 0) break;
    p += 1;
  }
  return p;
}

export function recommendPrice({ directHPP, channel, promo, targetMargin = 35, targetType = "margin" }) {
  const hpp = Number(directHPP) || 0;
  const fr = feeRate(channel);
  const ff = feeFixed(channel);
  const dM = merchantDiscountRate(promo);

  if (targetType !== "margin") {
    return { price: null, reason: "Target markup/profit solver belum didukung untuk semua promo; gunakan 'margin'.", priceRaw: null, rounded: null, margin: null, profit: null, breakdown: {} };
  }

  const m = (Number(targetMargin) || 0) / 100;
  if (m >= 1) return { price: null, reason: "Target margin tidak boleh >= 100%", priceRaw: null, rounded: null, margin: null, profit: null, breakdown: {} };

  const denom = (1 - dM) * (1 - fr) - m;
  if (denom <= 0) return { price: null, reason: "Fee + promo melebihi target margin (tidak solvable).", priceRaw: null, rounded: null, margin: null, profit: null, breakdown: {} };

  const raw = (hpp + ff) / denom;
  if (!Number.isFinite(raw) || raw <= 0) return { price: null, reason: "Tidak dapat menghitung harga.", priceRaw: null, rounded: null, margin: null, profit: null, breakdown: {} };

  const rounded = roundPrice(raw);
  const breakdown = priceBreakdown(rounded, { directHPP: hpp, channel, promo });
  return {
    price: rounded,
    priceRaw: raw,
    rounded,
    margin: breakdown.margin,
    profit: breakdown.profit,
    breakdown,
  };
}
