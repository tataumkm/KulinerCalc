// Minimal DOM/lifecycle shim to smoke-test view renders without a browser.
const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
};

function makeNode(tag) {
  return {
    tagName: String(tag).toUpperCase(),
    children: [],
    attrs: {},
    dataset: {},
    className: "",
    textContent: "",
    value: "",
    style: {},
    classList: { add() {}, remove() {} },
    addEventListener() {},
    setAttribute(k, v) { this.attrs[k] = v; },
    append(...kids) { for (const k of kids) if (k && k.nodeType) this.children.push(k); if (kids.length === 1 && !kids[0]?.nodeType) this.textContent = String(kids[0]); },
    replaceChildren(...kids) { this.children = kids.filter((k) => k && k.nodeType); },
    remove() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
    nodeType: 1,
  };
}
globalThis.document = {
  createElement: (tag) => makeNode(tag),
  createTextNode: (t) => ({ nodeType: 3, textContent: String(t) }),
  body: makeNode("body"),
  getElementById: () => makeNode("div"),
  addEventListener() {},
};
globalThis.window = { scrollTo() {} };
globalThis.confirm = () => true;

const { initState } = await import("../js/data/state.js");
initState();

const { renderDashboard } = await import("../js/app/views/dashboard.js");
const { renderBahan } = await import("../js/app/views/bahan.js");
const { renderResep } = await import("../js/app/views/resep.js");
const { renderMenu } = await import("../js/app/views/menu.js");
const { renderChannel } = await import("../js/app/views/channel.js");
const { renderPromo } = await import("../js/app/views/promo.js");
const { renderReports } = await import("../js/app/views/reports.js");
const { renderKemasan } = await import("../js/app/views/kemasan.js");
const { renderHarga } = await import("../js/app/views/harga.js");
const { renderMore } = await import("../js/app/views/more.js");
const { renderChrome } = await import("../js/app/layout.js");

let passed = 0, failed = 0;
const assert = (c, m) => { if (c) passed++; else { failed++; console.error("FAIL:", m); } };

const app = makeNode("div");
const main = renderChrome(app, "dashboard", () => {});
assert(main, "chrome renders main");

const views = { dashboard: renderDashboard, bahan: renderBahan, resep: renderResep, menu: renderMenu, promo: renderPromo, channel: renderChannel, reports: renderReports, kemasan: renderKemasan, harga: renderHarga, more: renderMore };
for (const [name, fn] of Object.entries(views)) {
  const m = makeNode("main");
  let threw = false;
  try { fn(m); } catch (e) { threw = true; console.error(`EXC ${name}:`, e.message); }
  assert(!threw, `${name} view renders without throw`);
}

console.log(`\nPASS ${passed} / ${passed + failed}`);
process.exit(failed ? 1 : 0);
