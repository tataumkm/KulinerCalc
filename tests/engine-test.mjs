import { nextId, maxNumber } from "../js/core/ids.js";
import { convert, convertToBase } from "../js/core/units.js";
import { calculateCostPerUsageUnit, validateIngredient } from "../js/core/engine-ingredient.js";
import { calculateCostPerUnit, packagingSetTotal } from "../js/core/engine-packaging.js";
import { priceDiffPercent, summarizePriceDiff } from "../js/core/engine-price.js";

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    passed++;
  } else {
    failed++;
    console.error("FAIL:", msg);
  }
}

function approx(a, b, eps = 0.001) {
  return Math.abs(a - b) < eps;
}

let n = -1;
const rnd = () => ++n;
const known = { "ING-000001": 1 };

assert(nextId("ingredient", rnd()) === "ING-000001", "nextId pads to 6 digits");
assert(maxNumber(["ING-000001", "ING-000012"]) === 12, "maxNumber finds max");
assert(convert(1, "Kg", "Gram") === 1000, "Kg->Gram");
assert(convert(1, "Liter", "ml") === 1000, "Liter->ml");
assert(convert(2, "Dus", "Pcs") === 24, "Dus->Pcs (12 each)");

const kopi = {
  name: "Kopi Arabica",
  purchaseUnit: "Kg",
  purchaseQty: 1,
  purchasePrice: 120000,
  usageUnit: "Gram",
};
const k = calculateCostPerUsageUnit(kopi);
assert(k.ok, "kopi valid");
assert(approx(k.costPerUsageUnit, 120), `kopi cost/gram = 120, got ${k.costPerUsageUnit}`);

const susu = {
  name: "Susu",
  purchaseUnit: "Liter",
  purchaseQty: 1,
  purchasePrice: 22000,
  usageUnit: "ml",
};
const s = calculateCostPerUsageUnit(susu);
assert(approx(s.costPerUsageUnit, 22), `susu cost/ml = 22, got ${s.costPerUsageUnit}`);

const dus = {
  name: "Cup pack",
  purchaseUnit: "Dus",
  purchaseQty: 1,
  purchasePrice: 96000,
  usageUnit: "Pcs",
};
const d = calculateCostPerUsageUnit(dus);
assert(approx(d.costPerUsageUnit, 8000), `dus cost/pcs = 8000, got ${d.costPerUsageUnit}`);

const cup = {
  name: "Cup",
  unit: "Pcs",
  purchaseQty: 1,
  purchasePrice: 800,
};
const pc = calculateCostPerUnit(cup);
assert(approx(pc.costPerUnit, 800), `cup cost/unit = 800, got ${pc.costPerUnit}`);

const set = { id: "PKGSET-000001", name: "Set" };
const catalog = { "PKG-000001": { id: "PKG-000001", name: "Cup", costPerUnit: 800 } };
const setTotal = packagingSetTotal(set, [{ packagingId: "PKG-000001", quantity: 1 }], catalog);
assert(approx(setTotal.total, 800), `set total = 800, got ${setTotal.total}`);

assert(approx(priceDiffPercent(22000, 24200), 10), "price diff 22000->24200 = +10%");
const sd = summarizePriceDiff(22000, 24200);
assert(sd.direction === "up" && sd.pct === 10, "summarize price diff up +10%");

const bad = { name: "", purchasePrice: 0, purchaseQty: 0 };
assert(validateIngredient(bad).length >= 3, "invalid ingredient caught");

console.log(`\nPASS ${passed} / ${passed + failed}`);
process.exit(failed ? 1 : 0);
