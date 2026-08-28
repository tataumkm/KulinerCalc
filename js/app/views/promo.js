import { el, money, num, pct, input, select, btn, card, fieldBlock, toast } from "../ui.js";
import { getState, addPromotion, updatePromotion, deletePromotion, listMenus, profitBreakdown, getMenuPrice, setMenuPrice } from "../../data/state.js";

const TYPE_LABELS = [
  ["percentage", "Diskon %"],
  ["nominal", "Diskon nominal"],
  ["buy_x_get_y", "Beli X Gratis Y"],
  ["special_price", "Harga khusus"],
  ["voucher", "Voucher"],
  ["cashback", "Cashback"],
];
const FUNDING_LABELS = [
  ["merchant", "Merchant"],
  ["platform", "Platform"],
  ["split", "Split"],
];

export function renderPromo(main) {
  const s = getState();
  const promotions = s.promotions;
  const menus = listMenus();

  const list = el("div", { class: "space-y-2" }, promotions.length
    ? promotions.map((p) => promoCard(p))
    : [el("p", { class: "text-sm text-gray-500 text-center py-6", text: "Belum ada promo." })]);

  main.append(
    el("div", { class: "space-y-4" }, [
      el("div", {}, [
        el("p", { class: "text-sm text-gray-600", text: "Buat promo & lihat dampaknya ke profit. Penanggung diskon (merchant/platform/split) sangat memengaruhi profit." }),
        list,
        btn("+ Buat promo", "btn-accent w-full", () => openPromoForm(main, null)),
      ]),
      el("div", { class: "pt-1" }, [
        el("h2", { class: "font-bold text-lg mb-2", text: "Simulator profit" }),
        el("p", { class: "text-xs text-gray-500 mb-2", text: "Gross → diskon merchant → fee channel → net → profit (PRD §19)." }),
        menus.length ? profitSimulator(menus) : el("p", { class: "text-sm text-gray-500", text: "Buat menu terlebih dahulu." }),
      ]),
    ])
  );
}

function promoTypeLabel(p) {
  if (p.type === "percentage") return `${num(p.discountPercent)}% off`;
  if (p.type === "nominal" || p.type === "voucher" || p.type === "cashback") return `${money(p.discountAmount)} off`;
  if (p.type === "buy_x_get_y") return `Beli ${p.buyX} gratis ${p.getY}`;
  if (p.type === "special_price") return `Harga khusus ${money(p.specialPrice)}`;
  return p.type;
}

function promoCard(p) {
  const funding = (FUNDING_LABELS.find((f) => f[0] === p.funding) || [])[1] || p.funding;
  return card([
    el("div", { class: "flex items-center justify-between" }, [
      el("h3", { class: "font-bold", text: p.name }),
      el("span", { class: `badge ${p.status === "active" ? "badge-good" : "badge-muted"}`, text: p.status === "active" ? "aktif" : "nonaktif" }),
    ]),
    el("div", { class: "flex items-center gap-2 mt-1" }, [
      el("span", { class: "badge badge-muted", text: promoTypeLabel(p) }),
      el("span", { class: "badge badge-muted", text: funding }),
    ]),
    el("div", { class: "flex items-center gap-2 mt-2" }, [
      btn("Edit", "text-xs btn-paper", () => openPromoForm(document.querySelector("main"), p)),
      btn("Hapus", "text-xs btn-paper", () => onDelete(p)),
    ]),
  ], "bg-white");
}

function onDelete(p) {
  if (!confirm(`Hapus promo ${p.name}?`)) return;
  const res = deletePromotion(p.id);
  if (!res.ok) return toast(res.errors.join(" · "), "bad");
  toast("Promo dihapus");
  renderPromo(document.querySelector("main"));
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

function openPromoForm(main, promo) {
  const isEdit = !!promo;
  const name = input({ value: promo?.name || "", placeholder: "mis. Diskon 20%" });
  const type = select(TYPE_LABELS, { value: promo?.type || "percentage" });
  const funding = select(FUNDING_LABELS, { value: promo?.funding || "merchant" });
  const discountPercent = input({ type: "number", value: promo?.discountPercent ?? "", min: 0, max: 100, step: "any" });
  const discountAmount = input({ type: "number", value: promo?.discountAmount ?? "", min: 0 });
  const specialPrice = input({ type: "number", value: promo?.specialPrice ?? "", min: 0 });
  const buyX = input({ type: "number", value: promo?.buyX ?? 2, min: 0 });
  const getY = input({ type: "number", value: promo?.getY ?? 1, min: 0 });
  const merchantShare = input({ type: "number", value: promo?.merchantShare ?? "", min: 0 });

  function visible() {
    const t = type.value;
    discountPercent.closest?.(".f-wrap")?.style?.setProperty?.("display", t === "percentage" ? "" : "none");
    discountAmount.closest?.(".f-wrap")?.style?.setProperty?.("display", ["nominal", "voucher", "cashback"].includes(t) ? "" : "none");
    specialPrice.closest?.(".f-wrap")?.style?.setProperty?.("display", t === "special_price" ? "" : "none");
    buyX.closest?.(".f-wrap")?.style?.setProperty?.("display", t === "buy_x_get_y" ? "" : "none");
    getY.closest?.(".f-wrap")?.style?.setProperty?.("display", t === "buy_x_get_y" ? "" : "none");
    merchantShare.closest?.(".f-wrap")?.style?.setProperty?.("display", funding.value === "split" ? "" : "none");
  }
  type.addEventListener("change", visible);
  funding.addEventListener("change", visible);
  visible();

  const wrap = (inputEl, label, hint) => el("div", { class: "f-wrap" }, [fieldBlock(label, inputEl, hint)]);

  const { overlay } = sheet([
    fieldBlock("Nama promo", name),
    el("div", { class: "grid grid-cols-2 gap-2" }, [
      fieldBlock("Tipe", type),
      fieldBlock("Penanggung", funding),
    ]),
    wrap(discountPercent, "Diskon %"),
    wrap(discountAmount, "Diskon nominal (Rp)"),
    wrap(specialPrice, "Harga khusus (Rp)"),
    el("div", { class: "grid grid-cols-2 gap-2" }, [wrap(buyX, "Beli X"), wrap(getY, "Gratis Y")]),
    wrap(merchantShare, "Bagian merchant (Rp)", "Untuk skenario split."),
    btn(isEdit ? "Simpan promo" : "Buat promo", "btn-accent w-full mt-2", () => {
      const data = {
        name: name.value,
        type: type.value,
        funding: funding.value,
        discountPercent: discountPercent.value,
        discountAmount: discountAmount.value,
        specialPrice: specialPrice.value,
        buyX: buyX.value,
        getY: getY.value,
        merchantShare: merchantShare.value,
      };
      const res = isEdit ? updatePromotion(promo.id, data) : addPromotion(data);
      if (!res.ok) return toast(res.errors.join(" · "), "bad");
      overlay.remove();
      toast(isEdit ? "Promo diperbarui" : "Promo dibuat", "good");
      renderPromo(document.querySelector("main"));
    }),
  ], isEdit ? "Edit promo" : "Buat promo");
}

function profitSimulator(menus) {
  const s = getState();
  const activeChannels = s.channels.filter((c) => c.status !== "inactive");
  const activePromos = s.promotions.filter((p) => p.status === "active");
  const menuSel = select(menus.map((m) => [m.id, m.name]), { value: menus[0].id });
  const channelSel = select(activeChannels.map((c) => [c.id, c.name]), { value: activeChannels[0]?.id || "" });
  const promoSel = select([["", "Tanpa promo"], ...activePromos.map((p) => [p.id, p.name])], { value: "" });
  const price = input({ type: "number", value: getMenuPrice(menus[0].id, activeChannels[0]?.id)?.sellingPrice ?? menus[0].sellingPrice ?? "", min: 0 });
  const output = el("div", { class: "mt-2" });

  function recalc() {
    const menu = menus.find((m) => m.id === menuSel.value);
    if (!menu || !channelSel.value) {
      output.replaceChildren(el("p", { class: "text-sm text-gray-500", text: "Pilih menu & channel." }));
      return;
    }
    const v = Number(price.value);
    if (v > 0) setMenuPrice(menu.id, channelSel.value, v);
    const r = profitBreakdown(menu, channelSel.value, promoSel.value || null);
    if (!r.ok) {
      output.replaceChildren(el("p", { class: "text-sm text-red-600", text: r.errors.join(" · ") }));
      return;
    }
    const rows = [
      ["Gross sales", r.gross, true],
      r.promoApplied ? ["Diskon merchant", -r.merchantDiscount, true] : null,
      r.promoApplied ? ["Discounted sales", r.discountedSales, null] : null,
      ["Fee " + r.channel.name, -r.channelFee, true],
      ["Net revenue", r.netRevenue, true],
      ["Direct HPP", -r.directHPP, true],
      ["ESTIMATED PROFIT", r.profit, true],
      ["Margin (dari gross)", r.margin != null ? pct(r.margin) : "—", null],
    ].filter(Boolean);
    output.replaceChildren(rows.map(([label, val, bold], i) =>
      el("div", {
        class: `flex items-center justify-between ${bold ? "font-bold" : ""} ${i === rows.length - 2 ? "border-t-2 border-ink pt-1 mt-1" : ""} ${i === rows.length - 2 || i === rows.length - 3 ? "" : ""}`,
      }, [
        el("span", { class: "text-xs", text: label }),
        el("span", { class: "font-mono-kc text-sm", text: typeof val === "number" ? money(val) : val }),
      ])
    ));
  }

  menuSel.addEventListener("change", () => {
    const menu = menus.find((m) => m.id === menuSel.value);
    price.value = getMenuPrice(menu.id, channelSel.value)?.sellingPrice ?? menu.sellingPrice ?? "";
    recalc();
  });
  channelSel.addEventListener("change", () => {
    const menu = menus.find((m) => m.id === menuSel.value);
    price.value = getMenuPrice(menu.id, channelSel.value)?.sellingPrice ?? "";
    recalc();
  });
  promoSel.addEventListener("change", recalc);
  price.addEventListener("input", recalc);
  recalc();

  return el("div", { class: "brutal-sm p-3 bg-white space-y-2" }, [
    fieldBlock("Menu", menuSel),
    el("div", { class: "grid grid-cols-2 gap-2" }, [
      fieldBlock("Channel", channelSel),
      fieldBlock("Promo", promoSel),
    ]),
    fieldBlock("Harga jual (Rp)", price),
    output,
  ]);
}
