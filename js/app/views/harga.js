import { el, money, num, pct, input, select, btn, card, fieldBlock, toast } from "../ui.js";
import { getState, listMenus, recommendForMenu, setMenuPrice } from "../../data/state.js";

export function renderHarga(main, opts = {}) {
  const s = getState();
  const menus = listMenus();
  const channels = s.channels.filter((c) => c.status !== "inactive");
  const promos = s.promotions.filter((p) => p.status === "active")
    .concat([{ id: "", name: "(tanpa promo) aktif" }]);

  const menuSel = select(menus.map((m) => [m.id, m.name]), { value: opts.menuId || menus[0]?.id || "" });
  const channelSel = select(channels.map((c) => [c.id, c.name]), { value: opts.channelId || channels[0]?.id || "" });
  const promoSel = select([["", "Tanpa promo"], ...promos.filter((p) => p.id).map((p) => [p.id, p.name])], { value: "" });
  const target = input({ type: "number", value: s.business?.targetMarginDefault ?? 35, min: 0, max: 100, step: "any", class: "field w-24" });
  const output = el("div", { class: "mt-2" });

  function recalc() {
    const menuId = menuSel.value;
    const channelId = channelSel.value;
    if (!menuId || !channelId) {
      output.replaceChildren(el("p", { class: "text-sm text-gray-500", text: "Pilih menu & channel." }));
      return;
    }
    const r = recommendForMenu(menuId, channelId, promoSel.value || null, Number(target.value));
    if (!r.ok) {
      output.replaceChildren(el("p", { class: "text-sm text-red-600", text: r.errors.join(" · ") }));
      return;
    }
    output.replaceChildren(recoCard(r));
  }

  menuSel.addEventListener("change", recalc);
  channelSel.addEventListener("change", recalc);
  promoSel.addEventListener("change", recalc);
  target.addEventListener("input", recalc);
  recalc();

  main.append(
    el("div", { class: "space-y-3" }, [
      el("p", { class: "text-sm text-gray-600", text: "Rekomendasi harga jual agar mencapai target margin, setelah fee channel & promo." }),
      el("div", { class: "grid grid-cols-2 gap-2" }, [
        fieldBlock("Menu", menuSel),
        fieldBlock("Channel", channelSel),
      ]),
      el("div", { class: "grid grid-cols-2 gap-2" }, [
        fieldBlock("Promo", promoSel),
        fieldBlock("Target margin %", target),
      ]),
      output,
      el("div", { class: "pt-1 text-xs text-gray-500" }, [
        el("p", {}, "Full Cost (dengan overhead) hadir di Fase 2 (biaya operasional). Yang ditampilkan sekarang: Direct HPP."),
        el("p", {}, "Sistem tidak otomatis mengubah harga master; rekomendasi bersifat simulasi sampai Anda set harga."),
      ]),
    ])
  );
}

function recoCard(r) {
  const bd = r.breakdown;
  const rows = [
    ["Direct HPP", r.breakdown.directHPP],
    ["Harga minimum (breakeven)", r.minPrice],
    ["Harga rekomendasi", r.price],
    ["Total fee channel", r.breakdown.channelFee],
    r.breakdown.merchantDiscount ? ["Diskon merchant", -r.breakdown.merchantDiscount] : null,
    ["Net revenue", r.breakdown.netRevenue],
    ["Profit", r.breakdown.profit],
    ["Margin", r.breakdown.margin != null ? pct(r.breakdown.margin) + " (dari harga jual)" : "—"],
  ].filter(Boolean);

  return card([
    el("div", { class: "flex items-center justify-between mb-2" }, [
      el("h3", { class: "font-bold", text: "Rekomendasi: " + money(r.price) }),
      btn("Pakai harga ini", "text-xs btn-accent", () => {
        setPrice(r.menu.id, r.channel.id, r.price);
        toast("Harga diset untuk channel ini", "good");
      }),
    ]),
    el("div", { class: "brutal-sm p-2 bg-[var(--paper)] space-y-0.5 text-xs mb-2" }, rows.map(([label, val]) =>
      el("div", { class: "flex justify-between" }, [
        el("span", { class: "text-gray-600", text: label }),
        el("span", { class: "font-mono-kc font-bold", text: typeof val === "number" ? money(val) : val }),
      ])
    )),
    el("p", { class: "text-[0.62rem] text-gray-400", text: `Margin sasaran ${pct(r.margin)}% • breakeven ${money(r.minPrice)}` }),
  ], "bg-white");
}

function setPrice(menuId, channelId, price) {
  setMenuPrice(menuId, channelId, price);
}
