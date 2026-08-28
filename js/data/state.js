import { backend, seedIfEmpty } from "./backend.js";
import { buildSeed } from "./seed.js";
import { nextId } from "../core/ids.js";
import { calculateCostPerUsageUnit, applyPriceChange } from "../core/engine-ingredient.js";
import { calculateCostPerUnit, packagingSetTotal } from "../core/engine-packaging.js";
import { calcRecipeHPP } from "../core/engine-recipe.js";
import { calcDirectHPP, calcMarginFromPrice, menuHealth, validateMenu } from "../core/engine-menu.js";
import { calcChannelFee, calcNetRevenue, validateChannel } from "../core/engine-channel.js";
import { calcEstimatedProfit } from "../core/engine-profit.js";
import { validatePromotion, effectiveDiscount, buyXGetY } from "../core/engine-promotion.js";
import { summarizePriceDiff } from "../core/engine-price.js";
import { recommendPrice, minPrice, marginBreakdown, priceBreakdown } from "../core/engine-pricing.js";

let state = null;

export function initState() {
  seedIfEmpty(buildSeed());
  state = {
    business: backend.load("business"),
    settings: backend.load("settings"),
    ingredients: backend.load("ingredients") || [],
    ingredientPriceHistory: backend.load("ingredientPriceHistory") || [],
    packagings: backend.load("packagings") || [],
    packagingSets: backend.load("packagingSets") || [],
    packagingSetItems: backend.load("packagingSetItems") || {},
    recipes: backend.load("recipes") || [],
    recipeItems: backend.load("recipeItems") || {},
    menus: backend.load("menus") || [],
    channels: backend.load("channels") || [],
    menuPrices: backend.load("menuPrices") || [],
    promotions: backend.load("promotions") || [],
    seq: backend.load("seq") || {},
  };
  return state;
}

export function getState() {
  if (!state) initState();
  return state;
}

export function snapshot() {
  return JSON.parse(JSON.stringify(getState()));
}

function persist() {
  backend.save("business", state.business);
  backend.save("settings", state.settings);
  backend.save("ingredients", state.ingredients);
  backend.save("ingredientPriceHistory", state.ingredientPriceHistory);
  backend.save("packagings", state.packagings);
  backend.save("packagingSets", state.packagingSets);
  backend.save("packagingSetItems", state.packagingSetItems);
  backend.save("recipes", state.recipes);
  backend.save("recipeItems", state.recipeItems);
  backend.save("menus", state.menus);
  backend.save("channels", state.channels);
  backend.save("menuPrices", state.menuPrices);
  backend.save("promotions", state.promotions);
  backend.save("seq", state.seq);
}

function bumpSeq(key) {
  const n = (state.seq[key] || 0) + 1;
  state.seq[key] = n;
  return n;
}

export function save() {
  persist();
}

export function catalogIngredient(id) {
  return getState().ingredients.find((i) => i.id === id);
}

export function addIngredient(data) {
  const s = getState();
  data.id = data.id || nextId("ingredient", bumpSeq("ingredient"));
  data.createdAt = data.createdAt || new Date().toISOString();
  data.updatedAt = new Date().toISOString();
  const calc = calculateCostPerUsageUnit(data);
  if (!calc.ok) return { ok: false, errors: calc.errors };
  data.costPerUsageUnit = calc.costPerUsageUnit;
  data.conversionNote = calc.conversionNote;
  s.ingredients.push(data);
  persist();
  return { ok: true, ingredient: data };
}

export function updateIngredient(id, patch) {
  const s = getState();
  const idx = s.ingredients.findIndex((i) => i.id === id);
  if (idx < 0) return { ok: false, errors: ["Bahan tidak ditemukan"] };
  const merged = { ...s.ingredients[idx], ...patch, updatedAt: new Date().toISOString() };
  const calc = calculateCostPerUsageUnit(merged);
  if (!calc.ok) return { ok: false, errors: calc.errors };
  merged.costPerUsageUnit = calc.costPerUsageUnit;
  merged.conversionNote = calc.conversionNote;
  s.ingredients[idx] = merged;
  persist();
  return { ok: true, ingredient: merged };
}

export function changeIngredientPrice(id, newPrice, meta = {}) {
  const s = getState();
  const idx = s.ingredients.findIndex((i) => i.id === id);
  if (idx < 0) return { ok: false, errors: ["Bahan tidak ditemukan"] };
  const cur = s.ingredients[idx];
  const res = applyPriceChange(cur, newPrice, meta);
  if (!res.ok) return res;
  s.ingredients[idx] = res.ingredient;
  const n = bumpSeq("priceHistory");
  s.ingredientPriceHistory.push({
    id: meta.priceHistoryId || nextId("priceHistory", n),
    ingredientId: id,
    date: (meta.date || new Date().toISOString().slice(0, 10)),
    supplier: meta.supplier || cur.supplier || "",
    purchaseQty: meta.purchaseQty || cur.purchaseQty,
    purchaseUnit: meta.purchaseUnit || cur.purchaseUnit,
    price: Number(newPrice),
    unitCost: res.ingredient.costPerUsageUnit,
    notes: meta.notes || "",
  });
  persist();
  return { ok: true, ingredient: res.ingredient, historyId: s.ingredientPriceHistory[s.ingredientPriceHistory.length - 1].id };
}

export function deleteIngredient(id) {
  const s = getState();
  const before = s.ingredients.length;
  s.ingredients = s.ingredients.filter((i) => i.id !== id);
  if (s.ingredients.length === before) return { ok: false, errors: ["Bahan tidak ditemukan"] };
  persist();
  return { ok: true };
}

export function priceHistoryFor(ingredientId) {
  return getState()
    .ingredientPriceHistory.filter((h) => h.ingredientId === ingredientId)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

export function addPackaging(data) {
  const s = getState();
  data.id = data.id || nextId("packaging", bumpSeq("packaging"));
  data.createdAt = data.createdAt || new Date().toISOString();
  data.updatedAt = new Date().toISOString();
  const calc = calculateCostPerUnit(data);
  if (!calc.ok) return { ok: false, errors: calc.errors };
  data.costPerUnit = calc.costPerUnit;
  s.packagings.push(data);
  persist();
  return { ok: true, packaging: data };
}

export function updatePackaging(id, patch) {
  const s = getState();
  const idx = s.packagings.findIndex((p) => p.id === id);
  if (idx < 0) return { ok: false, errors: ["Kemasan tidak ditemukan"] };
  const merged = { ...s.packagings[idx], ...patch, updatedAt: new Date().toISOString() };
  const calc = calculateCostPerUnit(merged);
  if (!calc.ok) return { ok: false, errors: calc.errors };
  merged.costPerUnit = calc.costPerUnit;
  s.packagings[idx] = merged;
  persist();
  return { ok: true, packaging: merged };
}

export function deletePackaging(id) {
  const s = getState();
  const before = s.packagings.length;
  s.packagings = s.packagings.filter((p) => p.id !== id);
  if (s.packagings.length === before) return { ok: false, errors: ["Kemasan tidak ditemukan"] };
  persist();
  return { ok: true };
}

export function addPackagingSet(name, items) {
  const s = getState();
  const set = { id: nextId("packagingSet", bumpSeq("packagingSet")), name, createdAt: new Date().toISOString() };
  s.packagingSets.push(set);
  s.packagingSetItems[set.id] = items.map((it) => ({ ...it }));
  persist();
  return { ok: true, packagingSet: set };
}

export function setTotalFor(setId) {
  const s = getState();
  const set = s.packagingSets.find((x) => x.id === setId);
  if (!set) return { total: 0, lines: [] };
  const items = s.packagingSetItems[set.id] || [];
  const catalog = Object.fromEntries(s.packagings.map((p) => [p.id, p]));
  return packagingSetTotal(set, items, catalog);
}

export function listPackagingSets() {
  const s = getState();
  return s.packagingSets.map((set) => ({ ...set, ...setTotalFor(set.id) }));
}

function ingredientCatalog() {
  return Object.fromEntries(getState().ingredients.map((i) => [i.id, i]));
}

export function calcHPP(recipeId) {
  const s = getState();
  const recipe = s.recipes.find((r) => r.id === recipeId);
  if (!recipe) return { ok: false, errors: ["Resep tidak ditemukan"], totalIngredientCost: 0, lines: [] };
  const items = s.recipeItems[recipe.id] || [];
  const wasteDefault = s.settings.wasteDefault != null ? s.settings.wasteDefault : 0;
  return calcRecipeHPP(recipe, items, ingredientCatalog(), wasteDefault);
}

export function listRecipesWithHPP() {
  const s = getState();
  return s.recipes.map((r) => {
    const calc = calcHPP(r.id);
    return { ...r, ...calc, ingredientCount: (s.recipeItems[r.id] || []).length };
  });
}

export function getRecipeItems(recipeId) {
  return getState().recipeItems[recipeId] || [];
}

export function addRecipe(name, description, items) {
  const s = getState();
  const recipe = {
    id: nextId("recipe", bumpSeq("recipe")),
    name: name.trim(),
    description: (description || "").trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const mapped = (items || []).map((it) => ({
    ingredientId: it.ingredientId,
    quantity: Number(it.quantity),
    unit: it.unit,
    wastePercent: it.wastePercent != null && it.wastePercent !== "" ? Number(it.wastePercent) : null,
  }));
  s.recipes.push(recipe);
  s.recipeItems[recipe.id] = mapped;
  const calc = calcHPP(recipe.id);
  if (!calc.ok) {
    s.recipes = s.recipes.filter((r) => r.id !== recipe.id);
    delete s.recipeItems[recipe.id];
    return { ok: false, errors: calc.errors };
  }
  persist();
  return { ok: true, recipe, ...calc };
}

export function updateRecipe(id, name, description, items) {
  const s = getState();
  const idx = s.recipes.findIndex((r) => r.id === id);
  if (idx < 0) return { ok: false, errors: ["Resep tidak ditemukan"] };
  s.recipes[idx].name = name.trim();
  s.recipes[idx].description = (description || "").trim();
  s.recipes[idx].updatedAt = new Date().toISOString();
  s.recipeItems[id] = (items || []).map((it) => ({
    ingredientId: it.ingredientId,
    quantity: Number(it.quantity),
    unit: it.unit,
    wastePercent: it.wastePercent != null && it.wastePercent !== "" ? Number(it.wastePercent) : null,
  }));
  const calc = calcHPP(id);
  if (!calc.ok) {
    return { ok: false, ...calc };
  }
  persist();
  return { ok: true, recipe: s.recipes[idx], ...calc };
}

export function deleteRecipe(id) {
  const s = getState();
  const before = s.recipes.length;
  s.recipes = s.recipes.filter((r) => r.id !== id);
  if (s.recipes.length === before) return { ok: false, errors: ["Resep tidak ditemukan"] };
  delete s.recipeItems[id];
  persist();
  return { ok: true };
}

function menuDirectHPP(menu) {
  const s = getState();
  const hpp = calcHPP(menu.recipeId);
  const pkg = menu.packagingSetId ? setTotalFor(menu.packagingSetId) : { total: 0 };
  return { ...calcDirectHPP(hpp.totalIngredientCost, pkg.total), ingredientOk: hpp.ok, hppErrors: hpp.errors };
}

export function memoMenu(menu) {
  const s = getState();
  const calc = menuDirectHPP(menu);
  const price = Number(menu.sellingPrice);
  const margin = price > 0 ? calcMarginFromPrice(price, calc.directHPP) : null;
  return {
    ...menu,
    ...calc,
    recipeName: s.recipes.find((r) => r.id === menu.recipeId)?.name || "",
    packagingSetName: s.packagingSets.find((p) => p.id === menu.packagingSetId)?.name || "",
    margin,
    health: menuHealth(margin, s.settings),
  };
}

export function listMenus() {
  return getState().menus.map((m) => memoMenu(m));
}

export function addMenu(data) {
  const s = getState();
  const menu = {
    id: nextId("menu", bumpSeq("menu")),
    name: data.name.trim(),
    category: (data.category || "").trim(),
    recipeId: data.recipeId,
    packagingSetId: data.packagingSetId || null,
    sellingPrice: data.sellingPrice != null && data.sellingPrice !== "" ? Number(data.sellingPrice) : null,
    status: data.status || "active",
    description: (data.description || "").trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const errs = validateMenu(menu, !!s.recipes.find((r) => r.id === menu.recipeId), menu.packagingSetId == null ? undefined : !!s.packagingSets.find((p) => p.id === menu.packagingSetId));
  if (errs.length) return { ok: false, errors: errs };
  s.menus.push(menu);
  persist();
  return { ok: true, menu: memoMenu(menu) };
}

export function updateMenu(id, patch) {
  const s = getState();
  const idx = s.menus.findIndex((m) => m.id === id);
  if (idx < 0) return { ok: false, errors: ["Menu tidak ditemukan"] };
  const merged = { ...s.menus[idx], ...patch, name: (patch.name ?? s.menus[idx].name).trim(), updatedAt: new Date().toISOString() };
  if (patch.sellingPrice != null) merged.sellingPrice = patch.sellingPrice !== "" ? Number(patch.sellingPrice) : null;
  const errs = validateMenu(merged, !!s.recipes.find((r) => r.id === merged.recipeId), merged.packagingSetId == null ? undefined : !!s.packagingSets.find((p) => p.id === merged.packagingSetId));
  if (errs.length) return { ok: false, errors: errs };
  s.menus[idx] = merged;
  persist();
  return { ok: true, menu: memoMenu(merged) };
}

export function deleteMenu(id) {
  const s = getState();
  const before = s.menus.length;
  s.menus = s.menus.filter((m) => m.id !== id);
  if (s.menus.length === before) return { ok: false, errors: ["Menu tidak ditemukan"] };
  persist();
  return { ok: true };
}

export function addChannel(data) {
  const s = getState();
  const errs = validateChannel(data);
  if (errs.length) return { ok: false, errors: errs };
  const channel = {
    id: nextId("channel", bumpSeq("channel")),
    name: data.name.trim(),
    commissionPercent: Number(data.commissionPercent) || 0,
    paymentFeePercent: Number(data.paymentFeePercent) || 0,
    fixedFee: Number(data.fixedFee) || 0,
    taxPercent: Number(data.taxPercent) || 0,
    marketingFeePercent: Number(data.marketingFeePercent) || 0,
    status: data.status || "active",
  };
  s.channels.push(channel);
  persist();
  return { ok: true, channel };
}

export function updateChannel(id, patch) {
  const s = getState();
  const idx = s.channels.findIndex((c) => c.id === id);
  if (idx < 0) return { ok: false, errors: ["Channel tidak ditemukan"] };
  const merged = { ...s.channels[idx], ...patch, name: (patch.name ?? s.channels[idx].name).trim() };
  const errs = validateChannel(merged);
  if (errs.length) return { ok: false, errors: errs };
  s.channels[idx] = merged;
  persist();
  return { ok: true, channel: merged };
}

export function deleteChannel(id) {
  const s = getState();
  const before = s.channels.length;
  s.channels = s.channels.filter((c) => c.id !== id);
  if (s.channels.length === before) return { ok: false, errors: ["Channel tidak ditemukan"] };
  s.menuPrices = s.menuPrices.filter((p) => p.channelId !== id);
  persist();
  return { ok: true };
}

export function channelById(id) {
  return getState().channels.find((c) => c.id === id);
}

export function getMenuPrice(menuId, channelId) {
  return getState().menuPrices.find((p) => p.menuId === menuId && p.channelId === channelId);
}

export function setMenuPrice(menuId, channelId, price) {
  const s = getState();
  const existing = s.menuPrices.find((p) => p.menuId === menuId && p.channelId === channelId);
  if (existing) {
    existing.sellingPrice = Number(price);
    existing.updatedAt = new Date().toISOString();
  } else {
    s.menuPrices.push({
      id: nextId("menuPrice", bumpSeq("menuPrice")),
      menuId,
      channelId,
      sellingPrice: Number(price),
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  persist();
  return { ok: true };
}

export function channelProfit(menu, channelId) {
  const s = getState();
  const channel = s.channels.find((c) => c.id === channelId);
  if (!channel) return { ok: false, errors: ["Channel tidak ditemukan"], profit: null, marginNet: null };
  const p = getMenuPrice(menu.id, channelId);
  const price = p ? Number(p.sellingPrice) : Number(menu.sellingPrice);
  if (!(price > 0)) return { ok: false, errors: ["Harga belum diatur"], profit: null, marginNet: null };
  const calc = calcNetRevenue(price, channel);
  const directHPP = Number(menu.directHPP);
  const profit = calc.netRevenue - directHPP;
  const marginNet = price > 0 ? (profit / price) * 100 : null;
  return { ok: true, channel, price, ...calc, directHPP, profit, marginNet };
}

export function allChannelProfits(menu) {
  const s = getState();
  return s.channels.filter((c) => c.status !== "inactive").map((c) => {
    const r = channelProfit(menu, c.id);
    return { channelId: c.id, channelName: c.name, ...r };
  });
}

export function addPromotion(data) {
  const s = getState();
  const errs = validatePromotion(data);
  if (errs.length) return { ok: false, errors: errs };
  const promo = {
    id: nextId("promotion", bumpSeq("promotion")),
    name: data.name.trim(),
    type: data.type,
    funding: data.funding || "merchant",
    discountPercent: data.discountPercent != null ? Number(data.discountPercent) : null,
    discountAmount: data.discountAmount != null ? Number(data.discountAmount) : null,
    specialPrice: data.specialPrice != null && data.specialPrice !== "" ? Number(data.specialPrice) : null,
    buyX: data.buyX != null ? Number(data.buyX) : null,
    getY: data.getY != null ? Number(data.getY) : null,
    merchantShare: data.merchantShare != null ? Number(data.merchantShare) : null,
    platformShare: data.platformShare != null ? Number(data.platformShare) : null,
    minimumPurchase: data.minimumPurchase != null ? Number(data.minimumPurchase) : 0,
    status: data.status || "active",
  };
  s.promotions.push(promo);
  persist();
  return { ok: true, promotion: promo };
}

export function updatePromotion(id, patch) {
  const s = getState();
  const idx = s.promotions.findIndex((p) => p.id === id);
  if (idx < 0) return { ok: false, errors: ["Promo tidak ditemukan"] };
  const merged = { ...s.promotions[idx], ...patch, name: (patch.name ?? s.promotions[idx].name).trim() };
  const errs = validatePromotion(merged);
  if (errs.length) return { ok: false, errors: errs };
  s.promotions[idx] = merged;
  persist();
  return { ok: true, promotion: merged };
}

export function deletePromotion(id) {
  const s = getState();
  const before = s.promotions.length;
  s.promotions = s.promotions.filter((p) => p.id !== id);
  if (s.promotions.length === before) return { ok: false, errors: ["Promo tidak ditemukan"] };
  persist();
  return { ok: true };
}

export function profitBreakdown(menu, channelId, promoId, opts = {}) {
  const s = getState();
  const channel = s.channels.find((c) => c.id === channelId);
  if (!channel) return { ok: false, errors: ["Channel tidak ditemukan"] };
  const mp = getMenuPrice(menu.id, channelId);
  const price = mp ? Number(mp.sellingPrice) : Number(menu.sellingPrice);
  if (!(price > 0)) return { ok: false, errors: ["Harga belum diatur"] };
  const promo = s.promotions.find((p) => p.id === promoId && p.status === "active");
  if (promoId && !promo) return { ok: false, errors: ["Promo tidak ditemukan / nonaktif"] };

  const directHPP = Number(menu.directHPP);
  const unitCount = opts.unitCount || 1;

  if (promo && promo.type === "buy_x_get_y") {
    const x = Number(promo.buyX) || 1;
    const y = Number(promo.getY) || 0;
    const b = buyXGetY(x, y, price);
    const perUnit = calcEstimatedProfit({
      price: b.effectiveRevenuePerUnit,
      channel,
      promo: null,
      directHPP,
      unitCount: b.totalUnitsOut,
    });
    return {
      ok: true,
      promo,
      type: "buy_x_get_y",
      buyX: x,
      getY: y,
      totalUnitsOut: b.totalUnitsOut,
      totalPaid: b.totalPaid,
      effectiveRevenuePerUnit: b.effectiveRevenuePerUnit,
      orderDirectHPP: directHPP * b.totalUnitsOut,
      orderProfit: perUnit.netRevenue - directHPP * b.totalUnitsOut,
      orderMargin: (perUnit.netRevenue - directHPP * b.totalUnitsOut) / b.totalPaid * 100,
      channel,
      price,
    };
  }

  const discountRaw = promo ? effectiveDiscount(promo, price, unitCount) : 0;
  const res = calcEstimatedProfit({
    price,
    channel,
    promo,
    merchantDiscountRaw: discountRaw,
    directHPP,
    unitCount,
  });
  return {
    ok: true,
    promo: promo || null,
    channel,
    price,
    directHPP,
    ...res,
    funding: promo ? promo.funding : null,
  };
}

export function recommendForMenu(menuId, channelId, promoId, targetMargin = 35) {
  const s = getState();
  const menu = s.menus.find((m) => m.id === menuId);
  if (!menu) return { ok: false, errors: ["Menu tidak ditemukan"] };
  const m = memoMenu(menu);
  const channel = s.channels.find((c) => c.id === channelId);
  if (!channel) return { ok: false, errors: ["Channel tidak ditemukan"] };
  const promo = promoId ? s.promotions.find((p) => p.id === promoId && p.status === "active") : null;
  const rec = recommendPrice({ directHPP: m.directHPP, channel, promo, targetMargin });
  const min = minPrice({ directHPP: m.directHPP, channel, promo });
  return { ok: true, menu: m, channel, promo: promo || null, ...rec, minPrice: min };
}

export function menusUsingIngredient(ingredientId) {
  const s = getState();
  const recipeIds = s.recipes.filter((r) => (s.recipeItems[r.id] || []).some((it) => it.ingredientId === ingredientId)).map((r) => r.id);
  return s.menus.filter((m) => recipeIds.includes(m.recipeId)).map((m) => m.id);
}

export function ingredientCostChanges() {
  const s = getState();
  return s.ingredients.map((ing) => {
    const hist = priceHistoryFor(ing.id).sort((a, b) => (a.date < b.date ? -1 : 1));
    if (hist.length < 2) {
      return { ...ing, oldPrice: null, newPrice: null, pct: null, impactedMenus: menusUsingIngredient(ing.id) };
    }
    const oldPrice = hist[hist.length - 2].price;
    const newPrice = hist[hist.length - 1].price;
    return { ...ing, oldPrice, newPrice, pct: summarizePriceDiff(oldPrice, newPrice).pct, impactedMenus: menusUsingIngredient(ing.id) };
  });
}

export function channelProfitability() {
  const s = getState();
  const menus = listMenus();
  const rows = [];
  for (const ch of s.channels.filter((c) => c.status !== "inactive")) {
    let revenue = 0, fee = 0, promo = 0, hpp = 0, profit = 0;
    let count = 0;
    for (const m of menus) {
      const mp = getMenuPrice(m.id, ch.id);
      if (!mp || !(mp.sellingPrice > 0)) continue;
      count++;
      const r = profitBreakdown(m, ch.id, null);
      revenue += Number(mp.sellingPrice);
      fee += r.channelFee;
      promo += 0;
      hpp += m.directHPP;
      profit += r.profit;
    }
    rows.push({ channelId: ch.id, channelName: ch.name, menuCount: count, revenue, fee, promo, hpp, profit, margin: revenue > 0 ? (profit / revenue) * 100 : null });
  }
  return rows;
}
