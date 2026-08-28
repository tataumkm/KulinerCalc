import { backend as localBackend, seedIfEmpty } from "./store.js";
import { GAS_API_URL } from "../config.js";

const writeActions = {
  ingredients: "addIngredient",
  packagings: "addPackaging",
  packagingSets: "addPackagingSet",
  recipes: null,
  recipeItems: null,
  menus: null,
  channels: "addChannel",
  menuPrices: "setMenuPrice",
  promotions: "addPromotion",
  ingredientPriceHistory: null,
};

export async function gasCall(action, data) {
  const url = GAS_API_URL || (typeof location !== "undefined" ? location.href : "");
  const res = await fetch(url, {
    method: "POST",
    mode: "cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, data }),
  });
  const json = await res.json();
  if (!json.ok) throw new Error((json.errors || ["GAS error"]).join(" · "));
  return json;
}

export const backend = {
  async load(namespace) {
    const data = await gasCall("get" + capitalize(namespace));
    return data.ok ? data.data : [];
  },
  async save(ns, value) {
    if (writeActions[ns] == null) return;
    await gasCall(writeActions[ns], normalize(ns, value));
  },
  clear() { localBackend.clear(); },
  namespaces: localBackend.namespaces,
  seedIfEmpty: seedIfEmpty,
  gasCall,
};

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function normalize(ns, value) {
  return value;
}
