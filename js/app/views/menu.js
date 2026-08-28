import { el, money, num, pct, input, select, btn, card, fieldBlock, toast } from "../ui.js";
import { getState, addMenu, updateMenu, deleteMenu, listMenus } from "../../data/state.js";

export function renderMenu(main, opts = {}) {
  const menus = listMenus();
  const list = el("div", { class: "space-y-2" }, menus.length
    ? menus.map((m) => menuCard(m))
    : [el("p", { class: "text-sm text-gray-500 text-center py-6", text: "Belum ada menu. Buat menu dari resep + kemasan." })]);

  main.append(
    el("div", { class: "space-y-3" }, [
      el("p", { class: "text-sm text-gray-600", text: "Daftarkan menu. Direct HPP = HPP bahan + HPP kemasan. Margin dihitung dari harga offline." }),
      list,
      btn("+ Tambah menu", "btn-accent w-full", () => openMenuForm(main, null)),
    ])
  );

  if (opts.open) openMenuForm(main, menus.find((m) => m.id === opts.open));
}

function healthBadge(health) {
  const map = {
    healthy: ["Sehat", "badge-good"],
    review: ["Review", "badge-warn"],
    risk: ["Bahaya", "badge-bad"],
    loss: ["Rugi", "badge-bad"],
    "no-price": ["Tanpa harga", "badge-muted"],
  };
  const [label, cls] = map[health.key] || ["?", "badge-muted"];
  return el("span", { class: `badge ${cls}`, text: label });
}

function menuCard(m) {
  const breakdown = el("div", { class: "mt-2 space-y-0.5 text-xs" }, [
    el("div", { class: "flex justify-between" }, [
      el("span", { class: "text-gray-500", text: "HPP bahan" }),
      el("span", { class: "font-mono-kc", text: money(m.ingredientCost) }),
    ]),
    el("div", { class: "flex justify-between" }, [
      el("span", { class: "text-gray-500", text: "Kemasan (" + (m.packagingSetName || "tanpa") + ")" }),
      el("span", { class: "font-mono-kc", text: money(m.packagingCost) }),
    ]),
    el("div", { class: "flex justify-between border-t border-ink/20 pt-0.5 mt-0.5 font-bold" }, [
      el("span", {}, "Direct HPP"),
      el("span", { class: "font-mono-kc", text: money(m.directHPP) }),
    ]),
  ]);

  const head = el("div", { class: "flex items-start justify-between gap-2" }, [
    el("div", {}, [
      el("h3", { class: "font-bold text-lg leading-tight", text: m.name }),
      el("p", { class: "text-xs text-gray-500", text: (m.category || "menu") + " · " + (m.recipeName || "tanpa resep") }),
    ]),
    healthBadge(m.health),
  ]);

  const priceRow = el("div", { class: "flex items-center justify-between mt-2 brutal-sm p-2 bg-[var(--paper)]" }, [
    el("div", {}, [
      el("p", { class: "text-[0.62rem] uppercase font-bold text-gray-500", text: "Harga offline" }),
      el("p", { class: "font-mono-kc font-bold text-lg leading-none", text: m.sellingPrice != null ? money(m.sellingPrice) : "—" }),
    ]),
    el("div", { class: "text-right" }, [
      el("p", { class: "text-[0.62rem] uppercase font-bold text-gray-500", text: "Margin" }),
      el("p", { class: "font-mono-kc font-bold text-lg leading-none", text: m.margin != null ? pct(m.margin) : "—" }),
    ]),
  ]);

  const actions = el("div", { class: "flex items-center gap-2 mt-2 pt-2 border-t-2 border-ink/20" }, [
    btn("Edit", "text-xs btn-paper", () => openMenuForm(document.querySelector("main"), m)),
    btn("Hapus", "text-xs btn-paper", () => onDelete(m)),
  ]);

  return card([head, breakdown, priceRow, actions], "bg-white");
}

function onDelete(m) {
  if (!confirm(`Hapus menu ${m.name}?`)) return;
  const res = deleteMenu(m.id);
  if (!res.ok) return toast(res.errors.join(" · "), "bad");
  toast("Menu dihapus");
  renderMenu(document.querySelector("main"));
}

function sheet(children, title) {
  const overlay = el("div", { class: "fixed inset-0 bg-black/40 z-40", onclick: () => overlay.remove() });
  const panel = el("div", { class: "sheet max-h-[85dvh] overflow-auto" }, [
    el("div", { class: "flex items-center justify-between mb-3 sticky top-0 bg-[var(--paper)] z-10 pb-2" }, [
      el("h2", { class: "font-bold text-lg", text: title }),
      btn("Tutup", "text-xs btn-paper", () => overlay.remove()),
    ]),
    ...children,
  ]);
  overlay.append(panel);
  document.body.append(overlay);
  return { overlay, panel };
}

function openMenuForm(main, menu) {
  const s = getState();
  const isEdit = !!menu;
  const recipes = s.recipes;
  const sets = s.packagingSets;
  if (recipes.length === 0) {
    const { overlay } = sheet([
      el("p", { class: "text-sm text-gray-600 py-2", text: "Buat resep terlebih dahulu sebelum menambah menu." }),
      btn("Tutup", "btn-paper w-full", () => overlay.remove()),
    ], "Tambah menu");
    return;
  }

  const name = input({ value: menu?.name || "", placeholder: "mis. Kopi Susu Aren" });
  const category = input({ value: menu?.category || "", placeholder: "mis. Kopi" });
  const recipe = select(recipes.map((r) => [r.id, r.name]), { value: menu?.recipeId || recipes[0].id });
  const pkgSet = select(sets.map((st) => [st.id, st.name]), { value: menu?.packagingSetId || "" });
  const price = input({ type: "number", value: menu?.sellingPrice ?? "", min: 0, placeholder: "mis. 15000" });

  const { overlay } = sheet([
    name,
    category,
    fieldBlock("Resep", recipe),
    fieldBlock("Set kemasan", pkgSet, "Pilih set untuk hitung harga kemasan (opsional)."),
    fieldBlock("Harga offline (Rp)", price),
    btn(isEdit ? "Simpan menu" : "Tambah menu", "btn-accent w-full mt-2", () => {
      const data = {
        name: name.value,
        category: category.value,
        recipeId: recipe.value,
        packagingSetId: pkgSet.value || null,
        sellingPrice: price.value,
      };
      const res = isEdit ? updateMenu(menu.id, data) : addMenu(data);
      if (!res.ok) return toast(res.errors.join(" · "), "bad");
      overlay.remove();
      toast(isEdit ? "Menu diperbarui" : "Menu ditambahkan", "good");
      renderMenu(document.querySelector("main"));
    }),
  ], isEdit ? "Edit menu" : "Tambah menu");
}
