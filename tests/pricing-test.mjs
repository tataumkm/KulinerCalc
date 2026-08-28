import { recommendPrice, roundPrice, minPrice, marginBreakdown, priceBreakdown } from "../js/core/engine-pricing.js";

let passed = 0, failed = 0;
const assert = (c, m) => { if (c) passed++; else { failed++; console.error("FAIL:", m); } };
const approx = (a, b, e = 0.01) => Math.abs(a - b) < e;
const gofood = { commissionPercent: 22, paymentFeePercent: 0, taxPercent: 0, marketingFeePercent: 0, fixedFee: 0 };
const merchant20 = { type: "percentage", funding: "merchant", discountPercent: 20 };

const r = recommendPrice({ directHPP: 6088.8, channel: gofood, promo: merchant20, targetMargin: 35 });
assert(r.price === 22500, `recommend price w/ 20% promo = 22500, got ${r.price}`);
assert(approx(r.breakdown.margin, 35.34, 0.1), `margin ~35% at 22500, got ${r.breakdown.margin}`);
assert(r.breakdown.merchantDiscount === 4500, "merchant discount 4500");
assert(approx(r.breakdown.channelFee, 3960), "fee 3960");
assert(approx(r.breakdown.profit, 7951.2), `profit ~7951, got ${r.breakdown.profit}`);

const noPromo = recommendPrice({ directHPP: 6088.8, channel: gofood, promo: null, targetMargin: 35 });
assert(noPromo.price === 14500, `recommend w/o promo = 14500, got ${noPromo.price}`);

const tooHighFee = recommendPrice({ directHPP: 1000, channel: { ...gofood, commissionPercent: 90 }, promo: { type: "percentage", funding: "merchant", discountPercent: 50 }, targetMargin: 35 });
assert(tooHighFee.price === null && tooHighFee.reason, "unsolvable case flagged");

assert(roundPrice(12300, 500) === 12500, "round to nearest 500 up");
assert(roundPrice(1200, 500) === 1500, "round up past floor");

const mp = minPrice({ directHPP: 6088.8, channel: gofood, promo: null });
assert(approx(mp, 7807, 1), `min price ~7807 (6088.8/0.78), got ${mp}`);

const bd = marginBreakdown(15000, { directHPP: 6088.8, channel: gofood, promo: merchant20 });
assert(approx(bd.merchantDiscount, 3000), "20% merchant discount on 15000 = 3000");
assert(approx(bd.channelFee, 2640), "fee on discounted 12000 = 2640");
assert(approx(bd.netRevenue, 9360), "net 9360");
assert(approx(bd.profit, 3271.2), "profit 3271.2 (acceptance)");
assert(approx(bd.margin, 21.808, 0.01), "margin 21.8%");

const bd2 = priceBreakdown(15000, { directHPP: 6088.8, channel: gofood, promo: merchant20 });
assert(bd2.margin != null, "priceBreakdown works");

console.log(`\nPASS ${passed} / ${passed + failed}`);
process.exit(failed ? 1 : 0);
