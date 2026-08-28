import { el, toast } from "./ui.js";
import { getState } from "../data/state.js";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "◧" },
  { id: "bahan", label: "Bahan", icon: "◆" },
  { id: "resep", label: "Resep", icon: "◈" },
  { id: "menu", label: "Menu", icon: "▤" },
  { id: "promo", label: "Promo", icon: "⛫" },
];

export function renderChrome(appRoot, current, onNav) {
  const header = el("header", { class: "sticky top-0 z-30 border-b-[3px] border-ink bg-[var(--paper)] px-4 py-3 flex items-center justify-between" }, [
    el("div", { class: "flex items-center gap-2" }, [
      el("span", { class: "w-3 h-3 bg-[var(--accent)] border-2 border-ink" }),
      el("span", { class: "font-display font-bold text-lg tracking-tight", text: "KulinerCalc" }),
    ]),
    titleTag(current),
    el("button", {
      class: "w-9 h-9 grid place-items-center brutal-sm bg-white font-bold text-base",
      text: "⚙",
      title: "Pengaturan & info",
      onclick: () => onNav("more"),
    }),
  ]);

  const main = el("main", { class: "px-4 py-4" });

  const bottom = el("nav", { class: "fixed bottom-0 inset-x-0 z-30 mx-auto max-w-md nav-bottom" }, [
    ...NAV.map((n) =>
      el("button", {
        class: `nav-item ${n.id === current ? "active" : ""}`,
        onclick: () => onNav(n.id),
      }, [
        el("span", { class: "text-xl leading-none", text: n.icon }),
        el("span", {}, n.label),
        el("span", { class: "nav-dot" }),
      ])
    ),
  ]);

  appRoot.replaceChildren(header, main, bottom);
  return main;
}

function titleTag(id) {
  const map = {
    dashboard: "Ringkasan",
    bahan: "Master Bahan",
    resep: "Resep & HPP",
    menu: "Menu & Harga",
    promo: "Promo & Profit",
    channel: "Channel & Fee",
    more: "Pengaturan",
    kemasan: "Kemasan",
  };
  return el("span", { class: "text-[0.7rem] font-bold uppercase tracking-wider text-gray-500", text: map[id] || "" });
}

export function onDataChanged() {
  toast("Data tersimpan ✓", "good");
}

export function state() {
  return getState();
}
