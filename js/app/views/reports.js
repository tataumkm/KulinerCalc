import { el, money, num, pct, select, card, fieldBlock, badge } from "../ui.js";
import { getState, listMenus, channelProfitability, ingredientCostChanges, recommendForMenu, profitBreakdown, getMenuPrice } from "../../data/state.js";

const REPORTS = [
  ["menu", "Profitabilitas menu"],
  ["ingredient", "Perubahan biaya bahan"],
  ["channel", "Profitabilitas channel"],
  ["price", "Rekomendasi harga"],
];

const HEAD = {
  menu: ["Nama", "HPP", "Harga", "Fee", "Promo", "Profit", "Margin", "Status"],
  ingredient: ["Bahan", "Harga lama", "Harga baru", "Perubahan %", "Menu terdampak"],
  channel: ["Channel", "Revenue", "Fee", "Promo", "HPP", "Profit", "Margin", "Status"],
};

const th = (h) => el("th", { class: "text-left p-1.5 pb-1 text-[0.6rem] uppercase", text: h });
const tr = (cells) => el("tr", {}, cells);
const td = (content) => el("td", { class: "p-1.5 align-top", children: content });

function reportTable(title, labels, rows) {
  return card([
    el("h2", { class: "font-bold text-lg mb-2", text: title }),
    el("div", { class: "overflow-x-auto" }, [
      el("table", { class: "w-full text-xs" }, [
        el("thead", { class: "bg-[var(--paper)]" }, [tr(labels.map(th))]),
        el("tbody", { class: "divide-y divide-ink/10" }, rows),
      ]),
    ]),
  ], "bg-white");
}

function healthByStatus(h) {
  const map = { healthy: ["badge-good", "Sehat"], review: ["badge-warn", "Review"], risk: ["badge-bad", "Bahaya"], loss: ["badge-bad", "Rugi"], "no-price": ["badge-muted", "Tanpa harga"] };
  const [cls, label] = map[h.key] || ["badge-muted", h.label || "?"];
  return badge(label, cls);
}

export function renderReports(main, opts = {}) {
  const s = getState();
  const key = opts.report || "menu";
  const menus = listMenus();
  const channels = s.channels.filter((c) => c.status !== "inactive");

  const nav = el("div", { class: "brutal-sm mb-3 p-1 bg-white grid grid-cols-2 gap-1 text-xs" },
    REPORTS.map(([k, label]) =>
      el("button", {
        class: `btn ${k === key ? "btn-accent" : "btn-paper"} text-[0.65rem] w-full`,
        onclick: () => renderReports(document.querySelector("main"), { report: k }),
      }, label)
    )
  );

  let body;
  if (key === "menu") body = menuProfitReport(menus);
  else if (key === "ingredient") body = ingredientChangeReport();
  else if (key === "channel") body = channelReport();
  else if (key === "price") body = priceReport(menus, channels, s);

  main.append(el("div", { class: "space-y-3" }, [
    nav,
    el("p", { class: "text-xs text-gray-600", text: `Menu: ${num(menus.length)} · channel: ${num(channels.length)} · bahan: ${num(s.ingredients.length)}` }),
    body,
  ]));
}

function row(cells) {
  return tr(cells.map(td));
}

function bestPerChannelProfit(menu) {
  const s = getState();
  let best = null;
  for (const c of s.channels.filter((c) => c.status !== "inactive")) {
    const r = profitBreakdown(menu, c.id, null);
    const profit = r.ok ? r.profit : 0;
    const fee = r.ok ? r.channelFee : 0;
    if (best === null || profit > best.profit) best = { channelName: c.name, fee, profit };
  }
  return best || { channelName: "—", fee: 0, profit: 0 };
}

function menuProfitReport(menus) {
  const rows = menus.map((m) => {
    const best = bestPerChannelProfit(m);
    return row([
      [el("span", { class: "font-semibold block", text: m.name }),
       el("span", { class: "text-[0.62rem] text-gray-500 block", text: m.health.label })],
      [money(m.directHPP)],
      [money(m.sellingPrice != null ? m.sellingPrice : 0), el("span", { class: "block text-gray-400", text: "offline" })],
      [money(best.fee), el("span", { class: "text-[0.62rem] text-gray-500 block", text: best.channelName })],
      el("span", { class: "text-[0.62rem] text-gray-500", text: "—" }),
      [money(best.profit), el("span", { class: "text-[0.62rem] text-gray-500 block", text: best.channelName })],
      [m.margin != null ? pct(m.margin) : "—"],
      [healthByStatus(m.health)],
    ]);
  });
  return reportTable("Profitabilitas menu (HPP + margin offline + profit terbaik per channel)", HEAD.menu, rows);
}

function ingredientChangeReport() {
  const rows = ingredientCostChanges().map((ing) => row([
    [el("span", { class: "font-semibold block", text: ing.name }),
     el("span", { class: "text-[0.62rem] text-gray-500 block", text: ing.usageUnit })],
    ing.oldPrice != null ? [money(ing.oldPrice)] : ["—"],
    ing.newPrice != null ? [money(ing.newPrice)] : ["—"],
    ing.pct != null
      ? [pct(ing.pct, 1), el("span", { class: "block text-" + (ing.pct >= 0 ? "red" : "emerald") + "-600", text: ing.pct > 0 ? "naik" : "turun" })]
      : ["—"],
    el("span", { class: "text-[0.62rem] text-gray-500", text: `${num((ing.impactedMenus || []).length)} menu` }),
  ]));
  return reportTable("Perubahan biaya bahan", HEAD.ingredient, rows);
}

function channelReport() {
  const rows = channelProfitability().map((c) => row([
    [el("span", { class: "font-semibold block", text: c.channelName })],
    [money(c.revenue)],
    [money(c.fee)],
    [money(c.promo)],
    [money(c.hpp)],
    [money(c.profit)],
    [c.margin != null ? pct(c.margin) : "—"],
    [badge(c.profit > 0 ? "Sehat" : "Rugi", c.profit > 0 ? "badge-good" : "badge-bad")],
  ]));
  return reportTable("Profitabilitas channel", HEAD.channel, rows);
}

function priceReport(menus, channels, s) {
  const menuSel = select(menus.map((m) => [m.id, m.name]), { value: menus[0]?.id || "" });
  const chSel = select(channels.map((c) => [c.id, c.name]), { value: channels[0]?.id || "" });
  const out = el("div", { class: "space-y-2" });

  function recalc() {
    const menu = menus.find((m) => m.id === menuSel.value);
    const ch = channels.find((c) => c.id === chSel.value);
    if (!menu || !ch) {
      out.replaceChildren(el("p", { class: "text-sm text-gray-500", text: "Pilih menu & channel." }));
      return;
    }
    const r = recommendForMenu(menu.id, ch.id, null, s.business?.targetMarginDefault ?? 35);
    out.replaceChildren(
      card([
        el("div", { class: "grid grid-cols-2 gap-1 text-xs" }, [
          cell("Direct HPP", money(menu.directHPP)),
          cell("Harga sekarang", money(getMenuPriceNow(menu.id, ch.id, menu.sellingPrice))),
          cell("Harga minimum", money(r.minPrice)),
          cell("Rekomendasi", money(r.price)),
        ]),
      ], "bg-white")
    );
  }

  menuSel.addEventListener("change", recalc);
  chSel.addEventListener("change", recalc);
  recalc();

  return el("div", { class: "space-y-2" }, [
    el("div", { class: "grid grid-cols-2 gap-2" }, [fieldBlock("Menu", menuSel), fieldBlock("Channel", chSel)]),
    out,
  ]);
}

function cell(label, value) {
  return el("div", {}, [
    el("span", { class: "text-gray-500", text: label }),
    el("span", { class: "font-mono-kc block font-bold", text: value }),
  ]);
}

function getMenuPriceNow(menuId, channelId, fallback) {
  const p = getMenuPrice(menuId, channelId);
  return p ? p.sellingPrice : fallback;
}
