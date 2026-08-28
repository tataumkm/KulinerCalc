const PREFIX = "kulcalc:";
const NAMESPACES = [
  "business",
  "settings",
  "ingredients",
  "ingredientPriceHistory",
  "packagings",
  "packagingSets",
  "packagingSetItems",
  "recipes",
  "recipeItems",
  "menus",
  "channels",
  "menuPrices",
  "promotions",
  "seq",
];

function read(namespace) {
  try {
    const raw = localStorage.getItem(PREFIX + namespace);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(namespace, value) {
  localStorage.setItem(PREFIX + namespace, JSON.stringify(value));
}

export const store = {
  load(namespace) {
    if (!NAMESPACES.includes(namespace)) return null;
    return read(namespace);
  },
  save(namespace, value) {
    if (!NAMESPACES.includes(namespace)) return;
    write(namespace, value);
  },
  clear() {
    for (const ns of NAMESPACES) localStorage.removeItem(PREFIX + ns);
  },
  namespaces: NAMESPACES,
};

export function seedIfEmpty(seedData) {
  for (const [ns, value] of Object.entries(seedData)) {
    if (store.load(ns) == null && value != null) store.save(ns, value);
  }
}

export const backend = store;
