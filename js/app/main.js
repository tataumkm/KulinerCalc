import { renderChrome } from "./layout.js";
import { renderDashboard } from "./views/dashboard.js";
import { renderBahan } from "./views/bahan.js";
import { renderKemasan } from "./views/kemasan.js";
import { renderResep } from "./views/resep.js";
import { renderMenu } from "./views/menu.js";
import { renderChannel } from "./views/channel.js";
import { renderPromo } from "./views/promo.js";
import { renderReports } from "./views/reports.js";
import { renderHarga } from "./views/harga.js";
import { renderMore } from "./views/more.js";
import { initState } from "../data/state.js";

const ROUTES = { dashboard: renderDashboard, bahan: renderBahan, resep: renderResep, menu: renderMenu, promo: renderPromo, channel: renderChannel, reports: renderReports, kemasan: renderKemasan, harga: renderHarga, more: renderMore };

let current = "dashboard";

export function navigate(id, opts = {}) {
  current = id;
  const app = document.getElementById("app");
  const main = renderChrome(app, id, navigate);
  const render = ROUTES[id] || renderDashboard;
  render(main, opts, navigate);
  window.scrollTo(0, 0);
}

export function route() {
  return current;
}

initState();
const start = new URLSearchParams(location.hash.slice(1)).get("view") || "dashboard";
navigate(start in ROUTES ? start : "dashboard");
