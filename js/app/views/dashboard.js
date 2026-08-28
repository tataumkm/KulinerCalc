import { el, money, num, pct, card } from "../ui.js";
import { getState, listPackagingSets, listRecipesWithHPP, listMenus } from "../../data/state.js";

export function renderDashboard(main, opts = {}, onNav) {
  const s = getState();
  const ings = s.ingredients;
  const packagings = s.packagings;
  const sets = listPackagingSets();
  const recipes = listRecipesWithHPP();
  const menus = listMenus();

  const biz = s.business;

  const statCards = el("div", { class: "grid grid-cols-2 gap-3" }, [
    statCard("Bahan aktif", num(ings.filter((i) => i.status !== "inactive").length), "tint-yellow"),
    statCard("Resep", num(recipes.length), "tint-mint"),
    statCard("Menu", num(menus.length), "tint-blue"),
    statCard("Target margin", `${biz?.targetMarginDefault ?? 35}%`, "tint-pink"),
  ]);

  const recentHistory = [...s.ingredientPriceHistory].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 4);
  const historyList = el("div", { class: "divide-y divide-ink/20" }, recentHistory.length
    ? recentHistory.map((h) => {
        const ing = s.ingredients.find((i) => i.id === h.ingredientId);
        return el("div", { class: "py-2 flex items-center justify-between" }, [
          el("span", { class: "font-semibold", text: ing ? ing.name : h.ingredientId }),
          el("span", { class: "font-mono-kc text-sm", text: money(h.price) }),
        ]);
      })
    : [el("p", { class: "py-3 text-sm text-gray-500", text: "Belum ada riwayat harga." })]
  );

  main.append(
    el("div", { class: "space-y-4" }, [
      heroBlock(biz),
      statCards,
      card([ el("h2", { class: "font-bold text-lg mb-1", text: "Menu & direct HPP" }), menuSummary(menus, onNav) ]),
      card([ el("h2", { class: "font-bold text-lg mb-1", text: "Resep & HPP bahan" }), recipeSummary(recipes, onNav) ]),
      card([ el("h2", { class: "font-bold text-lg mb-1", text: "Bahan terkini" }), ingredientSummary(ings, onNav) ]),
      card([ el("h2", { class: "font-bold text-lg mb-1", text: "Riwayat harga terakhir" }), historyList ]),
      card([ el("h2", { class: "font-bold text-lg mb-1", text: "Kemasan & set" }), packagingSummary(packagings, sets, onNav) ]),
      el("div", { class: "pt-1 text-center" }, [
        el("p", { class: "text-xs text-gray-400", text: "KulinerCalc v0.3 · fase 1-5 · data tersimpan lokal" }),
      ]),
    ])
  );
}

function menuSummary(menus, onNav) {
  if (!menus.length) return el("p", { class: "text-sm text-gray-500", text: "Belum ada menu." });
  return el("div", { class: "divide-y divide-ink/20" }, menus.map((m) =>
    el("button", {
      class: "w-full py-2 flex items-center justify-between text-left brutal-press2",
      onclick: () => onNav("menu", { open: m.id }),
    }, [
      el("div", {}, [
        el("p", { class: "font-semibold", text: m.name }),
        el("p", { class: "text-[0.65rem] text-gray-500", text: "HPP " + money(m.directHPP) }),
      ]),
      el("div", { class: "text-right" }, [
        el("p", { class: "font-mono-kc text-sm font-bold", text: m.margin != null ? pct(m.margin) : "—" }),
        el("span", { class: `badge ${m.health.key === "healthy" ? "badge-good" : m.health.key === "review" ? "badge-warn" : m.health.key === "risk" || m.health.key === "loss" ? "badge-bad" : "badge-muted"}`, text: m.health.label }),
      ]),
    ])
  ));
}

function recipeSummary(recipes, onNav) {
  if (!recipes.length) return el("p", { class: "text-sm text-gray-500", text: "Belum ada resep." });
  return el("div", { class: "divide-y divide-ink/20" }, recipes.map((r) =>
    el("button", {
      class: "w-full py-2 flex items-center justify-between text-left brutal-press2",
      onclick: () => onNav("resep", { open: r.id }),
    }, [
      el("span", { class: "font-semibold", text: r.name }),
      el("span", { class: "font-mono-kc text-sm font-bold", text: money(r.totalIngredientCost) }),
    ])
  ));
}

function heroBlock(biz) {
  return el("div", { class: "brutal bg-[var(--accent)] text-white p-4 tile-tint-yellow" }, [
    el("p", { class: "text-[0.7rem] uppercase font-bold tracking-widest", text: "Usaha · " + (biz ? biz.name : "Belum diatur") }),
    el("h1", { class: "font-display text-2xl font-bold leading-tight mt-1", text: "Cek apakah menu kamu benar-benar untung." }),
    el("p", { class: "text-sm mt-2 opacity-90", text: "Rantai profit lengkap: gross, diskon, fee, net, profit per menu & channel." }),
  ]);
}

function statCard(label, value, tint) {
  return el("div", { class: `tile p-3 tile-${tint}` }, [
    el("p", { class: "text-[0.65rem] font-bold uppercase tracking-wider", text: label }),
    el("p", { class: "font-mono-kc text-2xl font-bold mt-1", text: value }),
  ]);
}

function ingredientSummary(ings, onNav) {
  if (!ings.length) return el("p", { class: "text-sm text-gray-500", text: "Belum ada bahan. Tambahkan dari menu Bahan." });
  return el("div", { class: "divide-y divide-ink/20" }, ings.slice(0, 5).map((i) =>
    el("button", {
      class: "w-full py-2 flex items-center justify-between text-left brutal-press2",
      onclick: () => onNav("bahan", { focus: i.id }),
    }, [
      el("span", { class: "font-semibold", text: i.name }),
      el("span", { class: `font-mono-kc text-sm ${smallTextClass(i)}`, text: "Rp" + num(i.costPerUsageUnit) + "/" + i.usageUnit }),
    ])
  ));
}

function smallTextClass(i) {
  return i.status === "inactive" ? "text-gray-400 line-through" : "text-gray-700";
}

function packagingSummary(packagings, sets, onNav) {
  const list = el("div", { class: "space-y-2" }, [
    ...packagings.slice(0, 3).map((p) =>
      el("div", { class: "flex items-center justify-between text-sm" }, [
        el("span", { class: "font-semibold", text: p.name }),
        el("span", { class: "font-mono-kc", text: money(p.costPerUnit) + "/" + p.unit }),
      ])
    ),
    ...sets.map((st) =>
      el("div", { class: "flex items-center justify-between text-sm" }, [
        el("span", { class: "font-semibold", text: st.name }),
        el("span", { class: "font-mono-kc", text: money(st.total) }),
      ])
    ),
  ]);
  return list;
}
