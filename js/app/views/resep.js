import { el, money, num, input, select, btn, card, fieldBlock, toast } from "../ui.js";
import { getState, addRecipe, updateRecipe, deleteRecipe, listRecipesWithHPP, getRecipeItems } from "../../data/state.js";

export function renderResep(main, opts = {}) {
  const recipes = listRecipesWithHPP();
  const list = el("div", { class: "space-y-2" }, recipes.length
    ? recipes.map((r) => recipeCard(r))
    : [el("p", { class: "text-sm text-gray-500 text-center py-6", text: "Belum ada resep. Buat resep untuk menghitung HPP." })]);

  main.append(
    el("div", { class: "space-y-3" }, [
      el("p", { class: "text-sm text-gray-600", text: "Buat resep/BOM dari bahan baku. HPP dihitung otomatis termasuk waste per bahan." }),
      list,
      btn("+ Buat resep", "btn-accent w-full", () => openResepForm(main, null)),
    ])
  );

  if (opts.open) openResepForm(main, recipes.find((r) => r.id === opts.open));
}

function recipeCard(r) {
  const head = el("div", { class: "flex items-center justify-between" }, [
    el("h3", { class: "font-bold text-lg", text: r.name }),
    el("span", { class: "font-mono-kc font-bold text-lg", text: money(r.totalIngredientCost) }),
  ]);
  const meta = el("p", { class: "text-xs text-gray-500", text: `${r.ingredientCount} bahan · HPP bahan (termasuk waste)` });
  const items = el("div", { class: "mt-2 divide-y divide-ink/20" }, r.lines.length
    ? r.lines.map((l) =>
        el("div", { class: "py-1.5 flex items-center justify-between text-sm" }, [
          el("div", {}, [
            el("span", { class: "font-semibold", text: l.name }),
            el("span", { class: "text-xs text-gray-500 ml-2", text: `${num(l.quantity)} ${l.unit}` }),
          ]),
          el("span", { class: "font-mono-kc text-xs text-gray-700", text: money(l.effectiveCost) }),
        ])
      )
    : [el("p", { class: "py-2 text-sm text-gray-500", text: "Tidak ada bahan." })]);

  const actions = el("div", { class: "flex items-center gap-2 mt-2 pt-2 border-t-2 border-ink/20" }, [
    btn("Edit", "text-xs btn-paper", () => openResepForm(document.querySelector("main"), r)),
    btn("Hapus", "text-xs btn-paper", () => onDelete(r)),
    el("span", { class: "ml-auto text-[0.62rem] text-gray-500", text: "waste default " + (getState().settings.wasteDefault ?? 0) + "%" }),
  ]);

  return card([head, meta, items, actions], "bg-white");
}

function onDelete(r) {
  if (!confirm(`Hapus resep ${r.name}? Tindakan ini permanen.`)) return;
  const res = deleteRecipe(r.id);
  if (!res.ok) return toast(res.errors.join(" · "), "bad");
  toast("Resep dihapus");
  renderResep(document.querySelector("main"));
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

function openResepForm(main, recipe) {
  const s = getState();
  const isEdit = !!recipe;
  const cat = s.ingredients.filter((i) => i.status !== "inactive");
  if (cat.length === 0) {
    const { overlay } = sheet([
      el("p", { class: "text-sm text-gray-600 py-2", text: "Tambahkan bahan terlebih dahulu sebelum membuat resep." }),
      btn("Tutup", "btn-paper w-full", () => overlay.remove()),
    ], "Buat resep");
    return;
  }

  const name = input({ value: recipe?.name || "", placeholder: "mis. Kopi Susu Gula Aren" });
  const desc = input({ value: recipe?.description || "", placeholder: "Deskripsi (opsional)" });
  const rowsWrap = el("div", { class: "space-y-2" });
  const liveTotal = el("p", { class: "font-mono-kc font-bold", text: money(0) });
  const totalHost = el("div", { class: "flex items-center justify-between brutal-sm p-3 bg-white mb-2" }, [
    el("span", { class: "font-bold", text: "Total HPP bahan" }),
    liveTotal,
  ]);

  function recompute() {
    const items = collect();
    let total = 0;
    for (const row of rowsWrap.children) {
      const ing = cat.find((i) => i.id === row.querySelector("select")?.value);
      const qty = Number(row.querySelector("input[data-kc=qty]")?.value || 0);
      const wasteVal = row.querySelector("input[data-kc=waste]")?.value;
      const waste = wasteVal === "" ? (s.settings.wasteDefault ?? 0) : Number(wasteVal);
      if (ing && qty > 0) total += qty * ing.costPerUsageUnit * (1 + waste / 100);
    }
    liveTotal.textContent = money(total);
  }

  function addRow(ingId = "", quantity = "", wasteVal = "") {
    const sel = select(cat.map((i) => [i.id, i.name]), { value: ingId });
    const qty = input({ type: "number", value: quantity, min: 0, step: "any", placeholder: "Qty", class: "field w-20", dataset: { kc: "qty" } });
    const waste = input({ type: "number", value: wasteVal, min: 0, step: "any", placeholder: "%", class: "field w-14", dataset: { kc: "waste" } });
    sel.addEventListener("change", recompute);
    qty.addEventListener("input", recompute);
    waste.addEventListener("input", recompute);
    const row = el("div", { class: "flex items-center gap-1.5 brutal-sm p-2 bg-white" }, [
      el("div", { class: "flex-1 min-w-0" }, [sel]),
      qty,
      waste,
      btn("×", "text-xs btn-paper", () => { row.remove(); recompute(); }),
    ]);
    rowsWrap.append(row);
  }

  const initial = isEdit ? getRecipeItems(recipe.id) : [];
  if (initial.length) initial.forEach((it, i) => addRow(it.ingredientId, it.quantity, it.wastePercent));
  else addRow();

  const addRowBtn = btn("+ Tambah bahan", "text-xs btn-paper w-full", () => addRow());
  addRowBtn.addEventListener("click", recompute);
  recompute();

  function collect() {
    return [...rowsWrap.children].map((row) => {
      const sel = row.querySelector("select");
      const qty = row.querySelector("input[data-kc=qty]");
      const waste = row.querySelector("input[data-kc=waste]");
      return {
        ingredientId: sel.value,
        quantity: Number(qty.value),
        unit: cat.find((i) => i.id === sel.value)?.usageUnit || "",
        wastePercent: waste.value,
      };
    }).filter((it) => it.ingredientId && it.quantity > 0);
  }

  const { overlay } = sheet([
    name,
    desc,
    fieldBlock("Bahan", el("div", {}, [rowsWrap, addRowBtn]), "Qty + waste % per baris. Kosongkan waste = pakai default."),
    totalHost,
    btn(isEdit ? "Simpan resep" : "Simpan & hitung HPP", "btn-accent w-full", () => {
      const items = collect();
      if (!name.value.trim()) return toast("Nama resep wajib diisi", "bad");
      if (!items.length) return toast("Minimal 1 bahan", "bad");
      const res = isEdit ? updateRecipe(recipe.id, name.value, desc.value, items) : addRecipe(name.value, desc.value, items);
      if (!res.ok) return toast(res.errors.join(" · "), "bad");
      overlay.remove();
      toast(isEdit ? "Resep diperbarui" : "Resep & HPP tersimpan", "good");
      renderResep(document.querySelector("main"));
    }),
  ], isEdit ? "Edit resep" : "Buat resep");
}
