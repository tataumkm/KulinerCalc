import { calcChannelFee, calcNetRevenue, validateChannel } from "../js/core/engine-channel.js";

const mem = new Map();
globalThis.localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };

let passed = 0, failed = 0;
const assert = (c, m) => { if (c) passed++; else { failed++; console.error("FAIL:", m); } };
const approx = (a, b, e = 0.001) => Math.abs(a - b) < e;

const gofood = { commissionPercent: 22, paymentFeePercent: 2, taxPercent: 3, marketingFeePercent: 1, fixedFee: 500 };
const fee = calcChannelFee(15000, gofood);
assert(approx(fee.commission, 3300), "commission 22% of 15000 = 3300");
assert(approx(fee.paymentFee, 300), "payment 2% = 300");
assert(approx(fee.tax, 450), "tax 3% = 450");
assert(approx(fee.marketingFee, 150), "marketing 1% = 150");
assert(approx(fee.total, 3300 + 300 + 450 + 150 + 500), `total fee = ${3300 + 300 + 450 + 150 + 500}`);
const net = calcNetRevenue(15000, gofood);
assert(approx(net.netRevenue, 15000 - fee.total), "net revenue = price - total fee");

assert(validateChannel({ name: "GoFood", commissionPercent: 150 }).length >= 1, "fee > 100 rejected");
assert(validateChannel({ name: "Offline", commissionPercent: 0 }).length === 0, "valid channel ok");

const { initState, addChannel, updateChannel, setMenuPrice, getMenuPrice, channelProfit } = await import("../js/data/state.js");
initState();
const ch = addChannel({ name: "TestFood", commissionPercent: 20 });
assert(ch.ok, "add channel ok");
assert(/^CHN-\d{6}$/.test(ch.channel.id), "channel id format");
assert(updateChannel(ch.channel.id, { commissionPercent: 25 }).ok, "update channel ok");

setMenuPrice("MENU-000001", "CHN-000002", 15000);
const p = getMenuPrice("MENU-000001", "CHN-000002");
assert(p && approx(p.sellingPrice, 15000), "menu price set on channel");

const r = channelProfit({ id: "MENU-000001", directHPP: 6088.8 }, "CHN-000002");
assert(r.ok, "channel profit ok");
assert(approx(r.commission, 3300), "gofood 22% of 15000 = 3300");
assert(approx(r.total, 3300), "gofood total fee = 3300");
assert(approx(r.netRevenue, 11700), "gofood net = 11700");
assert(approx(r.profit, 11700 - 6088.8), `profit = ${11700 - 6088.8}`);
assert(approx(r.marginNet, (11700 - 6088.8) / 15000 * 100), "margin net on selling price");

console.log(`\nPASS ${passed} / ${passed + failed}`);
process.exit(failed ? 1 : 0);
