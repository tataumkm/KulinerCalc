/**
 * KulinerCalc — Google Apps Script backend
 * Database: Google Sheets (1 sheet per namespace, see SCHEMA)
 * Shares the same domain model & formulas as frontend engine.
 * This file must be pasted into the Apps Script editor (Code.gs).
 */
const SHEET_NAMES = [
  "Business",
  "Settings",
  "Ingredients",
  "IngredientPriceHistory",
  "Packagings",
  "PackagingSets",
  "PackagingSetItems",
  "Recipes",
  "RecipeItems",
  "Menus",
  "Channels",
  "MenuPrices",
  "Promotions",
];

const COLUMNS = {
  Business: ["id", "name", "businessType", "currency", "targetMarginDefault", "wasteDefault", "monthlySalesTarget", "createdAt"],
  Settings: ["healthyMarginThreshold", "reviewMarginThreshold", "currency", "wasteDefault"],
  Ingredients: ["id", "name", "category", "purchaseUnit", "purchaseQty", "purchasePrice", "usageUnit", "conversion", "costPerUsageUnit", "conversionNote", "supplier", "status", "createdAt", "updatedAt"],
  IngredientPriceHistory: ["id", "ingredientId", "date", "supplier", "purchaseQty", "purchaseUnit", "price", "unitCost", "notes"],
  Packagings: ["id", "name", "category", "unit", "purchaseQty", "purchasePrice", "costPerUnit", "supplier", "status", "createdAt", "updatedAt"],
  PackagingSets: ["id", "name", "createdAt"],
  PackagingSetItems: ["id", "packagingSetId", "packagingId", "quantity"],
  Recipes: ["id", "name", "description", "createdAt", "updatedAt"],
  RecipeItems: ["id", "recipeId", "ingredientId", "quantity", "unit", "wastePercent"],
  Menus: ["id", "name", "category", "recipeId", "packagingSetId", "sellingPrice", "status", "description", "createdAt", "updatedAt"],
  Channels: ["id", "name", "commissionPercent", "paymentFeePercent", "fixedFee", "taxPercent", "marketingFeePercent", "status"],
  MenuPrices: ["id", "menuId", "channelId", "sellingPrice", "status", "createdAt", "updatedAt"],
  Promotions: ["id", "name", "type", "funding", "discountPercent", "discountAmount", "specialPrice", "buyX", "getY", "merchantShare", "platformShare", "minimumPurchase", "status"],
};

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ app: "KulinerCalc", status: "ok" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const body = e.postData.contents ? JSON.parse(e.postData.contents) : {};
  try {
    const result = handle(body);
    return json_(result);
  } catch (err) {
    return json_({ ok: false, errors: [String(err)] });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function handle(body) {
  switch (body.action) {
    case "initSheets": start_(); return { ok: true };
    case "getIngredients": return { ok: true, data: readAll_("Ingredients") };
    case "addIngredient": return addIngredient_(body.data);
    case "changeIngredientPrice": return changeIngredientPrice_(body.data);
    case "getPriceHistory": return { ok: true, data: readAll_("IngredientPriceHistory").filter((r) => r.ingredientId === body.data.ingredientId) };
    case "getPackagings": return { ok: true, data: readAll_("Packagings") };
    case "addPackaging": return addPackaging_(body.data);
    case "getRecipes": return { ok: true, data: readAll_("Recipes") };
    case "getRecipeItems": return { ok: true, data: readAll_("RecipeItems").filter((r) => r.recipeId === body.data.recipeId) };
    case "addRecipe": return addRecipe_(body.data);
    case "getMenus": return { ok: true, data: readAll_("Menus") };
    case "addMenu": return addMenu_(body.data);
    case "getChannels": return { ok: true, data: readAll_("Channels") };
    case "addChannel": return addChannel_(body.data);
    case "setMenuPrice": return setMenuPrice_(body.data);
    case "getPromotions": return { ok: true, data: readAll_("Promotions") };
    case "addPromotion": return addPromotion_(body.data);
    case "getReportData": return { ok: true, data: { channels: readAll_("Channels"), menus: readAll_("Menus"), promotions: readAll_("Promotions") } };
    case "getBusiness": return { ok: true, data: readAll_("Business")[0] || null };
    default: return { ok: false, errors: [`Unknown action: ${body.action}`] };
  }
}

function start_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  for (const name of SHEET_NAMES) {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, COLUMNS[name].length).setValues([COLUMNS[name]]);
      sheet.setFrozenRows(1);
    }
  }
  ensureSeq_(ss);
  ensureBusinessSeed_(ss);
}

function ensureSeq_(ss) {
  let sheet = ss.getSheetByName("_Seq");
  if (!sheet) sheet = ss.insertSheet("_Seq");
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, 2).setValues([["namespace", "lastNumber"]]);
    sheet.setFrozenRows(1);
    sheet.getRange(2, 1, 2, 2).setValues([["ingredient", 0], ["recipe", 0]]);
  }
}

function ensureBusinessSeed_(ss) {
  const sheet = ss.getSheetByName("Business");
  if (sheet.getLastRow() <= 1) {
    sheet.appendRow(["BIZ-000001", "Kedai Aroma", "Kedai Kopi", "IDR", 35, 3, 2000, new Date().toISOString()]);
  }
}

function nextSheetId_(namespace, prefix) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const seq = ss.getSheetByName("_Seq");
  const row = colIndex_(seq, namespace);
  const val = Number(seq.getRange(row, 2).getValue()) + 1;
  seq.getRange(row, 2).setValue(val);
  return prefix + "-" + String(val).padStart(6, "0");
}

function colIndex_(sheet, namespace) {
  const last = sheet.getLastRow();
  for (let r = 2; r <= last; r++) {
    if (sheet.getRange(r, 1).getValue() === namespace) return r;
  }
  sheet.appendRow([namespace, 0]);
  return sheet.getLastRow();
}

// ---- Ingredient cost (mirror frontend engine-ingredient) ----
function costPerUsageUnit_(ing) {
  const purchaseQty = Number(ing.purchaseQty);
  const purchasePrice = Number(ing.purchasePrice);
  if (!(purchaseQty > 0) || !(purchasePrice > 0)) throw new Error("Harga/Qty pembelian tidak valid");
  let usageTotal;
  if (ing.purchaseUnit === "Dus" || ing.purchaseUnit === "Karton") {
    const per = ing.purchaseUnit === "Dus" ? 12 : 24;
    usageTotal = purchaseQty * (Number(ing.conversion) > 0 ? Number(ing.conversion) : per);
  } else if (ing.purchaseUnit === "Kg") {
    usageTotal = purchaseQty * 1000;
  } else if (ing.purchaseUnit === "Liter") {
    usageTotal = purchaseQty * 1000;
  } else {
    usageTotal = purchaseQty;
  }
  return purchasePrice / usageTotal;
}

function addIngredient_(data) {
  const id = nextSheetId_("ingredient", "ING");
  const row = [
    id, data.name, data.category || "", data.purchaseUnit, Number(data.purchaseQty),
    Number(data.purchasePrice), data.usageUnit, data.conversion != null ? Number(data.conversion) : "",
    costPerUsageUnit_(data), "", data.supplier || "", data.status || "active",
    new Date().toISOString(), new Date().toISOString(),
  ];
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Ingredients").appendRow(row);
  return { ok: true, data: { id } };
}

function changeIngredientPrice_(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Ingredients");
  const hist = ss.getSheetByName("IngredientPriceHistory");
  const values = sheet.getDataRange().getValues();
  for (let r = 1; r < values.length; r++) {
    if (values[r][0] === data.ingredientId) {
      const price = Number(data.price);
      const row = values[r];
      row[5] = price; // purchasePrice
      const ing = {
        name: row[1], purchaseUnit: row[3], purchaseQty: row[4], purchasePrice: price,
        usageUnit: row[6], conversion: row[7],
      };
      row[8] = costPerUsageUnit_(ing); // costPerUsageUnit
      sheet.getRange(r + 1, 1, 1, row.length).setValues([row]);
      hist.appendRow([
        "PRH-" + String(hist.getLastRow()).padStart(6, "0"),
        data.ingredientId, data.date || new Date().toISOString().slice(0, 10),
        data.supplier || row[10] || "", row[4], row[3], price, row[8], data.notes || "",
      ]);
      return { ok: true, data: { id: data.ingredientId, costPerUsageUnit: row[8] } };
    }
  }
  return { ok: false, errors: ["Bahan tidak ditemukan"] };
}

function addPackaging_(data) {
  const id = "PKG-" + String(SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Packagings").getLastRow() + 1).padStart(6, "0");
  const cost = Number(data.purchasePrice) / Number(data.purchaseQty);
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Packagings").appendRow([
    id, data.name, data.category || "", data.unit, Number(data.purchaseQty),
    Number(data.purchasePrice), cost, data.supplier || "", data.status || "active",
    new Date().toISOString(), new Date().toISOString(),
  ]);
  return { ok: true, data: { id } };
}

function addRecipe_(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const recSheet = ss.getSheetByName("Recipes");
  const itemSheet = ss.getSheetByName("RecipeItems");
  const id = nextSheetId_("recipe", "REC");
  const now = new Date().toISOString();
  recSheet.appendRow([id, data.name, data.description || "", now, now]);
  const items = data.items || [];
  let row = itemSheet.getLastRow() + 1;
  for (const it of items) {
    itemSheet.appendRow(["RI-" + String(row++).padStart(6, "0"), id, it.ingredientId, Number(it.quantity), it.unit || "", it.wastePercent != null ? Number(it.wastePercent) : ""]);
  }
  return { ok: true, data: { id }, hpp: recipeHPP_(id) };
}

function recipeHPP_(recipeId) {
  const ings = ingredientCostMap_();
  const items = readAll_("RecipeItems").filter((r) => r.recipeId === recipeId);
  let total = 0;
  for (const it of items) {
    const ing = ings[it.ingredientId];
    if (!ing) continue;
    const base = Number(it.quantity) * Number(ing.costPerUsageUnit);
    const w = it.wastePercent === "" ? 0 : Number(it.wastePercent);
    total += base * (1 + w / 100);
  }
  return { totalIngredientCost: total, lineCount: items.length };
}

function ingredientCostMap_() {
  return Object.fromEntries(readAll_("Ingredients").map((i) => [i.id, i]));
}

function addMenu_(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Menus");
  const id = "MENU-" + String(sheet.getLastRow() + 1).padStart(6, "0");
  const now = new Date().toISOString();
  sheet.appendRow([id, data.name, data.category || "", data.recipeId, data.packagingSetId || "", data.price != null ? Number(data.price) : "", data.status || "active", data.description || "", now, now]);
  const directHPP = menuDirectHPP_(data.recipeId, data.packagingSetId);
  return { ok: true, data: { id }, directHPP };
}

function menuDirectHPP_(recipeId, packagingSetId) {
  const hpp = recipeHPP_(recipeId);
  let packagingCost = 0;
  if (packagingSetId) {
    const items = readAll_("PackagingSetItems").filter((r) => r.packagingSetId === packagingSetId);
    const pkgs = Object.fromEntries(readAll_("Packagings").map((p) => [p.id, p]));
    for (const it of items) {
      const p = pkgs[it.packagingId];
      if (!p) continue;
      packagingCost += Number(it.quantity) * (Number(p.costPerUnit) || 0);
    }
  }
  return {
    ingredientCost: hpp.totalIngredientCost,
    packagingCost,
    directHPP: hpp.totalIngredientCost + packagingCost,
  };
}

function addChannel_(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Channels");
  const id = "CHN-" + String(sheet.getLastRow() + 1).padStart(6, "0");
  sheet.appendRow([
    id, data.name,
    Number(data.commissionPercent) || 0,
    Number(data.paymentFeePercent) || 0,
    Number(data.fixedFee) || 0,
    Number(data.taxPercent) || 0,
    Number(data.marketingFeePercent) || 0,
    data.status || "active",
  ]);
  return { ok: true, data: { id } };
}

function setMenuPrice_(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("MenuPrices");
  const existing = readAll_("MenuPrices").find((r) => r.menuId === data.menuId && r.channelId === data.channelId);
  const now = new Date().toISOString();
  if (existing) {
    const values = sheet.getDataRange().getValues();
    for (let r = 1; r < values.length; r++) {
      if (values[r][0] === existing.id) {
        values[r][3] = Number(data.price);
        values[r][5] = now;
        sheet.getRange(r + 1, 1, 1, values[0].length).setValues([values[r]]);
        break;
      }
    }
  } else {
    sheet.appendRow(["MPR-" + String(sheet.getLastRow() + 1).padStart(6, "0"), data.menuId, data.channelId, Number(data.price), "active", now, now]);
  }
  return { ok: true };
}

function addPromotion_(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Promotions");
  const id = "PRM-" + String(sheet.getLastRow() + 1).padStart(6, "0");
  sheet.appendRow([
    id, data.name, data.type, data.funding || "merchant",
    data.discountPercent != null ? Number(data.discountPercent) : "",
    data.discountAmount != null ? Number(data.discountAmount) : "",
    data.specialPrice != null ? Number(data.specialPrice) : "",
    data.buyX != null ? Number(data.buyX) : "",
    data.getY != null ? Number(data.getY) : "",
    data.merchantShare != null ? Number(data.merchantShare) : "",
    data.platformShare != null ? Number(data.platformShare) : "",
    data.minimumPurchase != null ? Number(data.minimumPurchase) : 0,
    data.status || "active",
  ]);
  return { ok: true, data: { id } };
}

function readAll_(name) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  const cols = COLUMNS[name] || [];
  if (values.length < 2) return [];
  const rows = [];
  for (let r = 1; r < values.length; r++) {
    const obj = {};
    for (let c = 0; c < cols.length; c++) obj[cols[c]] = values[r][c];
    rows.push(obj);
  }
  return rows;
}
