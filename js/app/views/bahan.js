import { el, money, num, input, select, btn, card, fieldBlock, toast } from "../ui.js";
import { getState, addIngredient, updateIngredient, changeIngredientPrice, deleteIngredient, priceHistoryFor } from "../../data/state.js";
import { UNIT_GROUPS, CONVERSION_LABELS } from "../../core/units.js";
import { summarizePriceDiff } from "../../core/engine-price.js";

const UNITS = [...UNIT_GROUPS.mass, ...UNIT_GROUPS.volume, ...UNIT_GROUPS.count];
const unitOptions = () => UNITS.map((u) => [u, u]);

export function renderBahan(main, opts = {}) {
  const s = getState();
  const ings = s.ingredients;

  const listWrap = el("div", { class: "space-y-2" }, ings.length
    ? ings.map((i) => ingCard(i))
    : [el("p", { class: "text-sm text-gray-500 text-center py-6", text: "Belum ada bahan. Ketuk + untuk menambah." })]);

  const addBtn = btn("+ Tambah bahan", "btn-accent w-full", () => openForm(main, null));

  main.append(
    el("div", { class: "space-y-3" }, [
      el("p", { class: "text-sm text-gray-600", text: "Kelola bahan baku, konversi satuan, dan riwayat harga. Harga lama tidak pernah dihapus." }),
      listWrap,
      addBtn,
    ])
  );

  if (opts.focus) openForm(main, ings.find((i) => i.id === opts.focus));
}

function ingCard(ing) {
  const diff = priceHistoryFor(ing.id).slice(-1)[0];
  const body = [
    el("div", { class: "flex-1 min-w-0" }, [
      el("div", { class: "flex items-center justify-between" }, [
        el("h3", { class: `font-bold ${ing.status === "inactive" ? "line-through text-gray-400" : ""}`, text: ing.name }),
        el("span", { class: "text-[0.6rem] uppercase font-bold text-gray-500", text: ing.category || "umum" }),
      ]),
      el("p", { class: "text-xs text-gray-600 mt-0.5", text: ing.conversionNote || "satuan" }),
    ]),
    el("div", { class: "text-right" }, [
      el("p", { class: "font-mono-kc font-bold text-lg leading-none", text: money(ing.costPerUsageUnit) + "/" + ing.usageUnit }),
      el("p", { class: "text-[0.62rem] text-gray-500 mt-0.5", text: "bahan" }),
    ]),
  ];

  const footer = el("div", { class: "flex items-center gap-2 mt-2 pt-2 border-t-2 border-ink/20" }, [
    btn("Ganti harga", "text-xs btn-paper", () => openPriceChange(ing)),
    btn("Edit", "text-xs btn-paper", () => openForm(main, ing)),
    btn("Hapus", "text-xs btn-paper", () => onDelete(ing)),
    priceDiff(ing),
  ]);

  return card(body.concat([footer]), "bg-white");
}

function priceDiff(ing) {
  const hist = priceHistoryFor(ing.id);
  const second = hist[hist.length - 2];
  const last = hist[hist.length - 1];
  if (!last || !second) return el("span", { class: "ml-auto text-[0.62rem] text-gray-400", text: "belum ada riwayat" });
  const d = summarizePriceDiff(second.price, last.price);
  const sign = d.direction === "up" ? "+" : d.direction === "down" ? "-" : "";
  return el("span", { class: `ml-auto text-[0.66rem] font-mono-kc font-bold ${d.direction === "up" ? "text-red-600" : d.direction === "down" ? "text-emerald-700" : "text-gray-400"}`, text: sign + num(Math.abs(d.pct)) + "%" });
}

function onDelete(ing) {
  if (!confirm(`Hapus ${ing.name}? Tindakan ini permanen.`)) return;
  const res = deleteIngredient(ing.id);
  if (!res.ok) return toast(res.errors.join(", "), "bad");
  toast("Bahan dihapus");
  renderBahan(document.querySelector("main"));
}

function sheet(children, title) {
  const overlay = el("div", { class: "fixed inset-0 bg-black/40 z-40", onclick: () => overlay.remove() });
  const panel = el("div", { class: "sheet" }, [
    el("div", { class: "flex items-center justify-between mb-3" }, [
      el("h2", { class: "font-bold text-lg", text: title }),
      btn("Tutup", "text-xs btn-paper", () => overlay.remove()),
    ]),
    ...children,
  ]);
  overlay.append(panel);
  document.body.append(overlay);
  return { overlay, panel };
}

function openForm(main, ing) {
  const isEdit = !!ing;
  const name = input({ value: ing?.name || "", placeholder: "mis. Kopi Arabica" });
  const category = input({ value: ing?.category || "", placeholder: "mis. Kopi" });
  const pUnit = select(unitOptions(), { value: ing?.purchaseUnit || "Kg" });
  const pQty = input({ type: "number", value: ing?.purchaseQty || 1, min: 0, step: "any" });
  const pPrice = input({ type: "number", value: ing?.purchasePrice || "", min: 0, placeholder: "mis. 120000" });
  const uUnit = select(unitOptions(), { value: ing?.usageUnit || "Gram" });
  const conv = input({ type: "number", value: ing?.conversion || 1, min: 0, step: "any" });
  const supplier = input({ value: ing?.supplier || "", placeholder: "Supplier (opsional)" });
  const status = select([["active", "Aktif"], ["inactive", "Nonaktif"]], { value: ing?.status || "active" });

  const conversionHintHost = el("p", { class: "text-[0.65rem] text-gray-500 mt-1" });
  function updateHint() {
    const key = `${pUnit.value}->${uUnit.value}`;
    conversionHintHost.textContent = CONVERSION_LABELS[key] || (pUnit.value === uUnit.value ? "Satuan sama" : "Pastikan konversi jumlah benar");
  }
  pUnit.addEventListener("change", updateHint);
  uUnit.addEventListener("change", updateHint);
  updateHint();

  const { overlay } = sheet([
    el("form", { class: "space-y-0", onsubmit: (e) => { e.preventDefault(); submit(); } }, [
      fieldBlock("Nama", name),
      fieldBlock("Kategori", category),
      el("div", { class: "grid grid-cols-2 gap-2" }, [
        fieldBlock("Satuan beli", pUnit),
        fieldBlock("Qty beli", pQty),
      ]),
      fieldBlock("Harga beli (Rp)", pPrice),
      el("div", { class: "grid grid-cols-2 gap-2" }, [
        fieldBlock("Satuan pakai", uUnit),
        fieldBlock("Konversi", conv, conversionHintHost),
      ]),
      el("div", { class: "grid grid-cols-2 gap-2" }, [
        fieldBlock("Supplier", supplier),
        fieldBlock("Status", status),
      ]),
      btn(isEdit ? "Simpan perubahan" : "Tambah bahan", "btn-accent w-full mt-3", (e) => { e.preventDefault(); submit(); }),
    ]),
    el("p", { class: "text-[0.62rem] text-gray-400 mt-2", text: "Biaya per satuan pakai dihitung otomatis: harga beli ÷ total kuantitas pakai." }),
  ]);

  function submit() {
    const data = {
      name: name.value.trim(),
      category: category.value.trim(),
      purchaseUnit: pUnit.value,
      purchaseQty: Number(pQty.value),
      purchasePrice: Number(pPrice.value),
      usageUnit: uUnit.value,
      conversion: Number(conv.value),
      supplier: supplier.value.trim(),
      status: status.value,
    };
    const res = isEdit ? updateIngredient(ing.id, data) : addIngredient(data);
    if (!res.ok) return toast(res.errors.join(" · "), "bad");
    overlay.remove();
    toast(isEdit ? "Bahan diperbarui" : "Bahan ditambahkan", "good");
    renderBahan(document.querySelector("main"));
  }
}

function openPriceChange(ing) {
  const newPrice = input({ type: "number", value: ing.purchasePrice, min: 0 });
  const notes = input({ placeholder: "Catatan (opsional)" });
  const hist = priceHistoryFor(ing.id);
  const prev = hist.length ? hist[hist.length - 1] : null;

  const { overlay } = sheet([
    el("p", { class: "text-sm font-bold mb-2", text: ing.name }),
    prev
      ? el("div", { class: "brutal-sm p-2 mb-2 flex justify-between text-sm bg-white" }, [
          el("span", { class: "text-gray-600", text: "Harga lama" }),
          el("span", { class: "font-mono-kc font-bold", text: money(prev.price) }),
        ])
      : null,
    newPrice,
    notes,
    btn("Simpan & catat riwayat", "btn-accent w-full mt-3", () => {
      const v = Number(newPrice.value);
      if (!(v > 0)) return toast("Harga harus lebih dari 0", "bad");
      const res = changeIngredientPrice(ing.id, v, { notes: notes.value.trim() });
      if (!res.ok) return toast(res.errors.join(" · "), "bad");
      overlay.remove();
      toast("Harga diubah & riwayat tersimpan", "good");
      renderBahan(document.querySelector("main"));
    }),
  ]);
}
