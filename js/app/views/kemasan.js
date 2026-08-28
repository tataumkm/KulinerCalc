import { el, money, num, input, select, btn, card, fieldBlock, toast } from "../ui.js";
import { getState, addPackaging, updatePackaging, deletePackaging, listPackagingSets, addPackagingSet } from "../../data/state.js";

export function renderKemasan(main) {
  const s = getState();
  const packagings = s.packagings;
  const sets = listPackagingSets();

  const list = el("div", { class: "space-y-2" }, packagings.length
    ? packagings.map((p) => pkgCard(p))
    : [el("p", { class: "text-sm text-gray-500 text-center py-6", text: "Belum ada kemasan." })]);

  const setList = el("div", { class: "space-y-2" }, sets.length
    ? sets.map((st) => setCard(st))
    : [el("p", { class: "text-sm text-gray-500 py-2", text: "Belum ada set kemasan." })]);

  main.append(
    el("div", { class: "space-y-4" }, [
      el("div", {}, [
        el("div", { class: "flex items-center justify-between mb-2" }, [
          el("h2", { class: "font-bold text-lg", text: "Kemasan" }),
          btn("+ Kemasan", "text-xs btn-accent", () => openPkgForm(main, null)),
        ]),
        list,
      ]),
      el("div", { class: "pt-1" }, [
        el("div", { class: "flex items-center justify-between mb-2" }, [
          el("h2", { class: "font-bold text-lg", text: "Set kemasan" }),
          btn("+ Set", "text-xs btn-accent", () => openSetForm(main)),
        ]),
        el("p", { class: "text-xs text-gray-500 mb-2", text: "Gabungkan beberapa kemasan jadi satu paket untuk dipakai menu." }),
        setList,
      ]),
    ])
  );
}

function pkgCard(p) {
  return card([
    el("div", { class: "flex items-center justify-between" }, [
      el("h3", { class: "font-bold", text: p.name }),
      el("span", { class: "font-mono-kc font-bold", text: money(p.costPerUnit) + "/" + p.unit }),
    ]),
    el("div", { class: "flex items-center gap-2 mt-2" }, [
      btn("Edit", "text-xs btn-paper", () => openPkgForm(document.querySelector("main"), p)),
      btn("Hapus", "text-xs btn-paper", () => onDeletePkg(p)),
    ]),
  ], "bg-white");
}

function onDeletePkg(p) {
  if (!confirm(`Hapus kemasan ${p.name}?`)) return;
  deletePackaging(p.id);
  toast("Kemasan dihapus");
  renderKemasan(document.querySelector("main"));
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

function openPkgForm(main, pkg) {
  const isEdit = !!pkg;
  const name = input({ value: pkg?.name || "", placeholder: "mis. Cup 16 oz" });
  const category = input({ value: pkg?.category || "", placeholder: "mis. Kemasan" });
  const unit = select([["Pcs", "Pcs"], ["Dus", "Dus"], ["Karton", "Karton"]], { value: pkg?.unit || "Pcs" });
  const qty = input({ type: "number", value: pkg?.purchaseQty || 1, min: 0, step: "any" });
  const price = input({ type: "number", value: pkg?.purchasePrice || "", min: 0, placeholder: "mis. 800" });
  const supplier = input({ value: pkg?.supplier || "", placeholder: "Supplier (opsional)" });

  const { overlay } = sheet([
    el("form", { onsubmit: (e) => { e.preventDefault(); submit(); } }, [
      fieldBlock("Nama", name),
      fieldBlock("Kategori", category),
      el("div", { class: "grid grid-cols-3 gap-2" }, [
        fieldBlock("Satuan", unit),
        fieldBlock("Qty", qty),
        fieldBlock("Harga (Rp)", price),
      ]),
      fieldBlock("Supplier", supplier),
      btn(isEdit ? "Simpan" : "Tambah kemasan", "btn-accent w-full mt-3", (e) => { e.preventDefault(); submit(); }),
    ]),
    el("p", { class: "text-[0.62rem] text-gray-400 mt-2", text: "Biaya per unit = harga ÷ qty." }),
  ]);

  function submit() {
    const data = {
      name: name.value.trim(),
      category: category.value.trim(),
      unit: unit.value,
      purchaseQty: Number(qty.value),
      purchasePrice: Number(price.value),
      supplier: supplier.value.trim(),
    };
    const res = isEdit ? updatePackaging(pkg.id, data) : addPackaging(data);
    if (!res.ok) return toast(res.errors.join(" · "), "bad");
    overlay.remove();
    toast(isEdit ? "Kemasan diperbarui" : "Kemasan ditambahkan", "good");
    renderKemasan(document.querySelector("main"));
  }
}

function setCard(st) {
  return card([
    el("div", { class: "flex items-center justify-between" }, [
      el("h3", { class: "font-bold", text: st.name }),
      el("span", { class: "font-mono-kc font-bold", text: money(st.total) }),
    ]),
    el("p", { class: "text-xs text-gray-500 mt-1", text: `${st.lines.length} item · total per set` }),
  ], "bg-white");
}

function openSetForm(main) {
  const s = getState();
  const name = input({ placeholder: "mis. Set Cup 16 oz" });
  const rowsWrap = el("div", { class: "space-y-2" });
  const addRowBtn = btn("+ Tambah item", "text-xs btn-paper", () => addRow());

  function addRow(packagingId = "", quantity = 1) {
    const psel = select(s.packagings.map((p) => [p.id, p.name]), { value: packagingId });
    const qty = input({ type: "number", value: qty, min: 0, step: "any", class: "field w-20" });
    const row = el("div", { class: "flex items-center gap-2 brutal-sm p-2 bg-white" }, [
      psel,
      qty,
      btn("×", "text-xs btn-paper", () => row.remove()),
    ]);
    rowsWrap.append(row);
  }

  if (s.packagings.length === 0) {
    const { overlay } = sheet([
      el("p", { class: "text-sm text-gray-600 py-2", text: "Tambah kemasan terlebih dahulu sebelum membuat set." }),
      btn("Tutup", "btn-paper w-full", () => overlay.remove()),
    ], "Set kemasan");
    return;
  }

  addRow();

  const { overlay } = sheet([
    name,
    rowsWrap,
    addRowBtn,
    btn("Simpan set", "btn-accent w-full mt-3", () => {
      const items = [...rowsWrap.children].map((row) => {
        const [sel, qty] = row.querySelectorAll("select,input");
        return { packagingId: sel.value, quantity: Number(qty.value) };
      }).filter((it) => it.packagingId && it.quantity > 0);
      if (!name.value.trim()) return toast("Nama set wajib diisi", "bad");
      if (!items.length) return toast("Minimal 1 item", "bad");
      const res = addPackagingSet(name.value.trim(), items);
      if (!res.ok) return toast(res.errors.join(" · "), "bad");
      overlay.remove();
      toast("Set kemasan dibuat", "good");
      renderKemasan(document.querySelector("main"));
    }),
  ], "Buat set kemasan");
}
