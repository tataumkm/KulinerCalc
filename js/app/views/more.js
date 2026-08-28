import { el, num, input, btn, card, fieldBlock, toast } from "../ui.js";
import { getState, save } from "../../data/state.js";

export function renderMore(main, opts = {}, onNav) {
  const s = getState();
  const biz = s.business;
  const st = s.settings;

  const bizName = input({ value: biz?.name || "", placeholder: "Nama usaha" });
  const bizType = input({ value: biz?.businessType || "", placeholder: "mis. Kedai Kopi" });
  const margin = input({ type: "number", value: biz?.targetMarginDefault ?? 35, min: 0, max: 100 });
  const waste = input({ type: "number", value: biz?.wasteDefault ?? 3, min: 0, max: 100, step: "any" });
  const target = input({ type: "number", value: biz?.monthlySalesTarget ?? 2000, min: 0 });

  main.append(
    el("div", { class: "space-y-4" }, [
      card([
        el("h2", { class: "font-bold text-lg mb-2", text: "Master data" }),
        el("div", { class: "grid grid-cols-2 gap-2" }, [
          btn("Bahan baku", "btn-paper w-full text-sm", () => onNav?.("bahan")),
          btn("Kemasan", "btn-paper w-full text-sm", () => onNav?.("kemasan")),
          btn("Channel", "btn-paper w-full text-sm", () => onNav?.("channel")),
          btn("Laporan", "btn-paper w-full text-sm", () => onNav?.("reports")),
          btn("Kalkulator", "btn-paper w-full text-sm", () => onNav?.("harga")),
        ]),
      ]),
      card([
        el("h2", { class: "font-bold text-lg mb-2", text: "Setup usaha" }),
        fieldBlock("Nama usaha", bizName),
        fieldBlock("Jenis usaha", bizType),
        el("div", { class: "grid grid-cols-3 gap-2" }, [
          fieldBlock("Target margin %", margin),
          fieldBlock("Waste default %", waste),
          fieldBlock("Target jual/bln", target),
        ]),
        btn("Simpan setup", "btn-accent w-full mt-2", () => {
          s.business = {
            ...(biz || {}),
            id: biz?.id || "BIZ-000001",
            name: bizName.value.trim(),
            businessType: bizType.value.trim(),
            targetMarginDefault: Number(margin.value),
            wasteDefault: Number(waste.value),
            monthlySalesTarget: Number(target.value),
          };
          s.settings = {
            ...st,
            healthyMarginThreshold: Number(margin.value),
            wasteDefault: Number(waste.value),
          };
          save();
          toast("Setup tersimpan", "good");
          renderMore(document.querySelector("main"));
        }),
      ]),
      card([
        el("h2", { class: "font-bold text-lg mb-2", text: "Tentang & status" }),        el("div", { class: "text-sm space-y-1" }, [
          el("p", {}, ["Bahan aktif: ", el("b", { text: num(s.ingredients.length) })]),
          el("p", {}, ["Resep: ", el("b", { text: num(s.recipes.length) })]),
          el("p", {}, ["Menu: ", el("b", { text: num(s.menus.length) })]),
          el("p", {}, ["Kemasan: ", el("b", { text: num(s.packagings.length) })]),
          el("p", {}, ["Channel: ", el("b", { text: num(s.channels.length) })]),
          el("p", {}, ["Promo: ", el("b", { text: num(s.promotions.length) })]),
          el("p", {}, ["Riwayat harga: ", el("b", { text: num(s.ingredientPriceHistory.length) })]),
        ]),
      ]),
      card([ el("h2", { class: "font-bold text-lg mb-1", text: "Roadmap fase" }),
        el("div", { class: "text-sm space-y-1" }, [
          phaseItem(1, true), phaseItem(2, true), phaseItem(3, true),
          phaseItem(4, true, "Resep & HPP engine"), phaseItem(5, true, "Menu & pricing"),
          phaseItem(6, true, "Channel & fee"), phaseItem(7, true, "Promo & profit"),
          phaseItem(8, true, "Rekomendasi harga"), phaseItem(9, true, "Dashboard & laporan"),
          phaseItem(10, false, "Simulator what-if"),
        ]),
      ]),
    ])
  );
}

function phaseItem(n, done, label) {
  const text = `Fase ${n} — ${label || "selesai"}`;
  return el("div", { class: "flex items-center gap-2" }, [
    el("span", { class: `w-3 h-3 border-2 border-ink ${done ? "bg-emerald-500" : "bg-white"}` }),
    el("span", { class: done ? "font-semibold" : "text-gray-500", text: text }),
  ]);
}
