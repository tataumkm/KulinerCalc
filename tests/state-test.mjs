const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
};

const { initState, addIngredient, changeIngredientPrice, priceHistoryFor, addPackaging, listPackagingSets, addRecipe, updateRecipe, calcHPP, listRecipesWithHPP, deleteRecipe, addMenu, updateMenu, deleteMenu, listMenus, recommendForMenu } = await import("../js/data/state.js");

let passed = 0;
let failed = 0;
const assert = (cond, msg) => {
  if (cond) passed++;
  else {
    failed++;
    console.error("FAIL:", msg);
  }
};
const approx = (a, b, e = 0.001) => Math.abs(a - b) < e;

initState();

const ing = addIngredient({
  name: "Choco Syrup",
  category: "Pemanis",
  purchaseUnit: "ml",
  purchaseQty: 1000,
  purchasePrice: 50000,
  usageUnit: "ml",
});
assert(ing.ok, "add ingredient ok");
assert(/^ING-\d{6}$/.test(ing.ingredient.id), "auto id format");
assert(approx(ing.ingredient.costPerUsageUnit, 50), `choco cost/ml = 50, got ${ing.ingredient.costPerUsageUnit}`);
assert(ing.ingredient.id !== "ING-000001", "seq advances past seed");

const seedHPP = calcHPP("REC-000001");
assert(seedHPP.ok, "seed recipe HPP ok");
assert(approx(seedHPP.totalIngredientCost, 5288.8), `seed HPP bahan = 5288.8, got ${seedHPP.totalIngredientCost}`);
assert(seedHPP.lines.length === 4, "seed recipe has 4 ingredients");

const before = priceHistoryFor("ING-000002").length;
const chg = changeIngredientPrice("ING-000002", 24200, { notes: "naik harga" });
assert(chg.ok, "price change ok");
assert(priceHistoryFor("ING-000002").length === before + 1, "price history appended (never overwritten)");
assert(approx(priceHistoryFor("ING-000002")[0].price, 105000), "old history preserved first");
const latest = priceHistoryFor("ING-000002").slice(-1)[0];
assert(approx(latest.price, 24200), "latest price recorded");
assert(approx(latest.unitCost, 24.2), "latest unitCost reflects new cost/ml");
assert(approx(chg.ingredient.costPerUsageUnit, 24.2), "ingredient cost updated");

const afterHPP = calcHPP("REC-000001");
assert(approx(afterHPP.totalIngredientCost, 5513.2), `HPP recomputed after susu price change = 5513.2, got ${afterHPP.totalIngredientCost}`);

const p = addPackaging({ name: "Lid", category: "Kemasan", unit: "Pcs", purchaseQty: 1, purchasePrice: 250 });
assert(p.ok, "add packaging ok");
assert(approx(p.packaging.costPerUnit, 250), "lid cost/unit = 250");

const nr = addRecipe("Es Kopi", "baru", [
  { ingredientId: "ING-000001", quantity: 18, unit: "Gram", wastePercent: 5 },
  { ingredientId: "ING-000004", quantity: 100, unit: "Gram", wastePercent: null },
]);
assert(nr.ok, "add recipe ok");
assert(/^REC-\d{6}$/.test(nr.recipe.id), "recipe id format");
assert(approx(nr.totalIngredientCost, 2474), `recipe HPP (es pakai default 3% waste) = 2474, got ${nr.totalIngredientCost}`);

const up = updateRecipe(nr.recipe.id, "Es Kopi Gula", "", [
  { ingredientId: "ING-000001", quantity: 18, unit: "Gram", wastePercent: 5 },
]);
assert(up.ok && up.totalIngredientCost === 2268, "update recipe recalc HPP");

assert(listRecipesWithHPP().length >= 2, "listRecipesWithHPP returns recipes");

const seedMenu = listMenus().find((m) => m.id === "MENU-000001");
assert(seedMenu, "seed menu exists");
assert(approx(seedMenu.ingredientCost, 5513.2), `seed menu ingredient HPP (post price change) = 5513.2, got ${seedMenu.ingredientCost}`);
assert(approx(seedMenu.packagingCost, 800), `seed menu packaging HPP = 800, got ${seedMenu.packagingCost}`);
assert(approx(seedMenu.directHPP, 6313.2), `seed menu direct HPP = 6313.2, got ${seedMenu.directHPP}`);
assert(approx(seedMenu.margin, (15000 - 6313.2) / 15000 * 100), "seed menu margin at 15000");
assert(seedMenu.health.key === "healthy", `seed menu margin 57.9% -> healthy, got ${seedMenu.health.key}`);

const nm = addMenu({ name: "Es Kopi", category: "Minuman", recipeId: nr.recipe.id, sellingPrice: 8000 });
assert(nm.ok, "add menu ok");
assert(/^MENU-\d{6}$/.test(nm.menu.id), "menu id format");
assert(approx(nm.menu.directHPP, 2268), `new menu direct HPP = 2268 (no packaging), got ${nm.menu.directHPP}`);
assert(approx(nm.menu.margin, (8000 - 2268) / 8000 * 100), "new menu margin");

const bad = addMenu({ name: "", recipeId: "XXX", sellingPrice: -5 });
assert(!bad.ok && bad.errors.length, "invalid menu rejected");

const um = updateMenu(nm.menu.id, { sellingPrice: 9000 });
assert(um.ok && approx(um.menu.margin, (9000 - 2268) / 9000 * 100), "menu price update recalc margin");
assert(deleteMenu(nm.menu.id).ok, "delete menu ok");
assert(deleteRecipe(nr.recipe.id).ok, "delete recipe ok");

const reco = recommendForMenu("MENU-000001", "CHN-000002", "PRM-000001", 35);
assert(reco.ok && reco.price === 23500, `state recommend price = 23500 (HPP 6313,2), got ${reco.price}`);
assert(approx(reco.minPrice, 10118, 1), `state min price ~10118 (HPP 6313,2 + 20% promo), got ${reco.minPrice}`);

console.log(`\nPASS ${passed} / ${passed + failed}`);
process.exit(failed ? 1 : 0);
