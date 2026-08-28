import { calcRecipeItemLine, calcRecipeHPP } from "../js/core/engine-recipe.js";

let passed = 0, failed = 0;
const assert = (c, m) => { if (c) passed++; else { failed++; console.error("FAIL:", m); } };
const approx = (a, b, e = 0.001) => Math.abs(a - b) < e;

const catalog = {
  "ING-000001": { id: "ING-000001", name: "Kopi", costPerUsageUnit: 120, usageUnit: "Gram" },
  "ING-000002": { id: "ING-000002", name: "Susu", costPerUsageUnit: 22, usageUnit: "ml" },
  "ING-000003": { id: "ING-000003", name: "Gula Aren", costPerUsageUnit: 28, usageUnit: "Gram" },
  "ING-000004": { id: "ING-000004", name: "Es", costPerUsageUnit: 2, usageUnit: "Gram" },
};

const line = calcRecipeItemLine({ ingredientId: "ING-000001", quantity: 18 }, catalog["ING-000001"], 5);
assert(approx(line.baseCost, 2160), "kopi base = 2160");
assert(approx(line.effectiveCost, 2268), "kopi effective (5% waste) = 2268");
assert(approx(line.wasteCost, 108), "kopi waste cost = 108");

const recipe = { id: "REC-000001", name: "Kopi Susu Gula Aren" };
const items = [
  { ingredientId: "ING-000001", quantity: 18, wastePercent: 5 },
  { ingredientId: "ING-000002", quantity: 100, wastePercent: 2 },
  { ingredientId: "ING-000003", quantity: 20, wastePercent: 3 },
  { ingredientId: "ING-000004", quantity: 100, wastePercent: 0 },
];
const res = calcRecipeHPP(recipe, items, catalog, 3);
assert(res.ok, "recipe valid");
assert(approx(res.totalIngredientCost, 2268 + 2244 + 576.8 + 200), `HPP bahan total = 5288.8, got ${res.totalIngredientCost}`);

const empty = calcRecipeHPP(recipe, [], catalog, 3);
assert(!empty.ok && empty.errors.length, "empty recipe rejected");

const unknown = calcRecipeHPP(recipe, [{ ingredientId: "XXX", quantity: 5 }], catalog, 3);
assert(!unknown.ok, "unknown ingredient rejected");

const noWaste = calcRecipeItemLine({ ingredientId: "ING-000004", quantity: 100, wastePercent: null }, catalog["ING-000004"], 5);
assert(approx(noWaste.effectiveCost, 210), "null waste falls back to default 5%");

console.log(`\nPASS ${passed} / ${passed + failed}`);
process.exit(failed ? 1 : 0);
