import { validatePromotion, effectiveDiscount, merchantDiscountShare, buyXGetY } from "../js/core/engine-promotion.js";
import { calcEstimatedProfit } from "../js/core/engine-profit.js";

const mem = new Map();
globalThis.localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };

let passed = 0, failed = 0;
const assert = (c, m) => { if (c) passed++; else { failed++; console.error("FAIL:", m); } };
const approx = (a, b, e = 0.001) => Math.abs(a - b) < e;

const merchant = { type: "percentage", funding: "merchant", discountPercent: 20 };
assert(approx(effectiveDiscount(merchant, 15000), 3000), "20% merchant discount = 3000");
assert(approx(merchantDiscountShare(merchant, 3000), 3000), "merchant funds all");

const platform = { type: "percentage", funding: "platform", discountPercent: 20 };
assert(approx(merchantDiscountShare(platform, 3000), 0), "platform funds all");

const split = { type: "percentage", funding: "split", merchantShare: 1000 };
assert(approx(merchantDiscountShare(split, 3000), 1000), "split merchant share cap");

assert(validatePromotion({ name: "", type: "percentage", funding: "merchant" }).length >= 1, "empty promo flagged");
assert(validatePromotion({ name: "x", type: "percentage", funding: "merchant", discountPercent: 150 }).length >= 1, ">100% flagged");

const b = buyXGetY(2, 1, 12000);
assert(b.totalUnitsOut === 3, "BXGY 3 units out");
assert(b.totalPaid === 24000, "BXGY paid 24000");
assert(approx(b.effectiveRevenuePerUnit, 8000), "BXGY effective/unit = 8000");

const gofood = { commissionPercent: 22, paymentFeePercent: 0, taxPercent: 0, marketingFeePercent: 0, fixedFee: 0 };
const r = calcEstimatedProfit({ price: 15000, channel: gofood, promo: merchant, merchantDiscountRaw: 3000, directHPP: 6088.8 });
assert(approx(r.gross, 15000), "gross 15000");
assert(approx(r.merchantDiscount, 3000), "merchant discount 3000");
assert(approx(r.discountedSales, 12000), "discounted sales 12000");
assert(approx(r.channelFee, 2640), "fee 22% of 12000 = 2640");
assert(approx(r.netRevenue, 9360), "net 9360");
assert(approx(r.profit, 3271.2), `profit 3271.2, got ${r.profit}`);
assert(approx(r.margin, 3271.2 / 15000 * 100), "margin 21.8%");

const noPromo = calcEstimatedProfit({ price: 15000, channel: gofood, promo: null, directHPP: 6088.8 });
assert(approx(noPromo.profit, 5611.2), "no promo profit 5611.2");
assert(noPromo.promoApplied === false, "no promo not applied");

const { initState, profitBreakdown, addPromotion } = await import("../js/data/state.js");
initState();
const pb = profitBreakdown({ id: "MENU-000001", directHPP: 6088.8 }, "CHN-000002", "PRM-000001");
assert(pb.ok, "state profit breakdown ok");
assert(approx(pb.profit, 3271.2), `state accepted profit = 3271.2, got ${pb.profit}`);
assert(pb.funding === "merchant", "funding merchant");
assert(pb.promoApplied === true, "promo applied");
const nopb = profitBreakdown({ id: "MENU-000001", directHPP: 6088.8 }, "CHN-000002", null);
assert(approx(nopb.profit, 5611.2), "state no promo profit 5611.2");

const bx = profitBreakdown({ id: "MENU-000001", directHPP: 6088.8 }, "CHN-000002", "PRM-000002");
assert(bx.ok && bx.type === "buy_x_get_y", "BXGY breakdown ok");
assert(approx(bx.effectiveRevenuePerUnit, 10000), "BXGY 2 for 15000 = 10000/unit");
assert(approx(bx.totalPaid, 30000), "BXGY total paid 30000");
assert(approx(bx.orderDirectHPP, 6088.8 * 3), "BXGY order HPP = 3x direct");
assert(approx(bx.orderProfit, 30000 - 30000 * 0.22 - 6088.8 * 3), "BXGY order profit");

const np = addPromotion({ name: "Diskon 10", type: "percentage", funding: "merchant", discountPercent: 10 });
assert(np.ok, "add promotion ok");
assert(/^PRM-\d{6}$/.test(np.promotion.id), "promo id format");

console.log(`\nPASS ${passed} / ${passed + failed}`);
process.exit(failed ? 1 : 0);
