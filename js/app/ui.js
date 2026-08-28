import { formatIDR, formatNumber, formatPercent } from "../core/money.js";

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === "dataset") Object.assign(node.dataset, v);
    else node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c == null) continue;
    node.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return node;
}

export function btn(label, className, onClick) {
  return el("button", { class: `btn ${className}`, text: label, onclick: onClick });
}

export function card(children, className = "") {
  return el("div", { class: `tile p-3 ${className}` }, children);
}

export function badge(label, tone = "muted") {
  return el("span", { class: `badge badge-${tone}`, text: label });
}

export function fieldBlock(label, input, hint) {
  return el("div", { class: "mb-2" }, [
    el("label", { class: "label", text: label }),
    input,
    hint ? el("p", { class: "text-[0.65rem] text-gray-500 mt-1", text: hint }) : null,
  ]);
}

export function input(attrs = {}) {
  return el("input", { class: "field", ...attrs });
}

export function select(options, attrs = {}) {
  const sel = el("select", { class: "field", ...attrs });
  for (const [val, label] of options) sel.append(el("option", { value: val, text: label }));
  return sel;
}

export function money(v) { return formatIDR(v); }
export function num(v, d) { return formatNumber(v, d); }
export function pct(v, d) { return formatPercent(v, d); }

export function healthBadge(marginPercent) {
  if (marginPercent < 0) return badge("Rugi", "bad");
  if (marginPercent < 20) return badge("Bahaya", "bad");
  if (marginPercent < 35) return badge("Review", "warn");
  return badge("Sehat", "good");
}

export function toast(msg, tone = "ink") {
  const box = document.getElementById("toast-root") || (() => {
    const r = el("div", { id: "toast-root", class: "fixed inset-x-0 top-3 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none" });
    document.body.append(r);
    return r;
  })();
  const t = el("div", { class: `brutal-sm px-4 py-2 text-sm font-bold ${tone === "good" ? "bg-emerald-400" : "bg-white"} max-w-[90%] text-center`, text: msg });
  box.append(t);
  setTimeout(() => t.remove(), 2400);
}
