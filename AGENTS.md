# KulinerCalc

Cost & pricing management web app for Indonesian F&B UMKM. Phases 1-9 implemented (engine tested; Fase 10-11 what-if & polish skipped), PRD blueprint is the source of truth.

## Data layer swap (GAS vs local)

- Calculation engine lives in `js/core/*.js` (framework-free, testable in Node via `npm test` and in browser).
- The data/storage layer is abstracted in `js/data/backend.js`, which re-exports either:
  - `js/data/store.js` — localStorage-backed (default demo, `DATA_BACKEND = "local"`)
  - `js/data/api.js` — `fetch()` calls to the GAS Web App endpoint (`DATA_BACKEND = "gas"` + `GAS_API_URL` in `js/config.js`).
- `js/data/state.js` imports only from `./backend.js`, so swapping backend needs **one env change** + no engine rewrite. To deploy with GAS: set `DATA_BACKEND = "gas"` and `GAS_API_URL`, then build the frontend into `dist/` or host `index.html` directly; paste `backend/Code.gs` into the Apps Script project bound to the Sheets file and deploy as `"Anyone, even anonymous"` Web App.
- GAS `doPost`/`doGet` route via `body.action`. See `backend/Code.gs` `handle()`. Local mode needs no server.
- Run: `npm test` (all suites); `node -e "require('http')..."` or `npx serve .` for preview.

## Tech stack (from PRD)

- Frontend: HTML + Tailwind CSS + vanilla modular JS
- Backend: Google Apps Script
- Database: Google Sheets
- Hosting: GAS Web App or frontend host + GAS API

## Critical constraints

- **Language:** Indonesian for all UI text, currency formatting (Rp), number formatting.
- **Calculation engine must be separate from UI.** Never put formulas in event handlers.
- **Direct HPP vs Full Cost:** always show both, never replace one with the other.
- **Never hardcode platform fees.** All fees/promo percentages are user-configurable.
- **Simulations never modify master data.** Temporary in-memory only.
- **Price history is append-only.** Never overwrite old prices.
- **ID strategy:** prefixed IDs (`ING-000001`, `MENU-000001`, etc.), never use names as primary keys.
- **No POS, accounting, inventory, or payment gateway in MVP.**

## Build order (PRD §44)

Follow the 11-phase sequence in the PRD. Do not build across phases in a single prompt. Test calculation engine after each phase before proceeding.

## Development principles (PRD §46)

1. Read project structure before editing files.
2. Don't delete working features without reason.
3. Follow existing schema/domain model.
4. Unit test every business formula.
5. Responsive design required.
6. After each phase: summary + test results.

## MVP acceptance scenario (PRD §43)

Use this as the integration test for MVP completion: Kopi Susu Gula Aren recipe → HPP → GoFood channel (22% fee) → Rp15.000 price → apply merchant-funded 20% discount → change susu price Rp22.000→Rp24.200 → verify price history, recalc HPP, impact analysis, margin warning, price recommendation.

## Formulas to verify (PRD §7, §19-20)

- `effective_cost = quantity × cost_per_usage_unit × (1 + waste_percent / 100)`
- Channel fee: `commission + payment_fee + tax + marketing_fee` (all on selling price)
- `margin = (price - cost) / price` (NOT markup)
- Buy X Get Y: `effective_revenue_per_unit = total_paid / total_units_out`

## Developer commands

- `npm test` — runs all suites: `engine-test`, `state-test`, `recipe-test`, `menu-test`, `channel-test`, `promo-test`, `pricing-test`, `ui-smoke-test`.
- Preview: host the repo root (e.g. `npx serve .`) and open `index.html` (mobile-first). Default mode is **local** (localStorage); no server needed for demo.
- Engine tests run in Node; view smoke tests use a tiny DOM stub (real interaction verified in browser).
- `npm run lint`/`npm run typecheck`/`npm run format` do **not** exist yet (Fase 11 skipped). Run `node --check <file>` on changed JS; GAS syntax: `node --check backend/Code.gs` (copy to `.js` first — Node won't read `.gs`).

## Backend swap (GAS) — exact steps

1. Set `.env`/manual: in `js/config.js`, `DATA_BACKEND = "gas"`, `GAS_API_URL = "<your GAS web-app URL>"`.
2. Create a Google Sheet with tabs matching `SHEET_NAMES` in `backend/Code.gs`.
3. In Apps Script bound to that Sheet, paste `backend/Code.gs`, replace `CODE_PLACEHOLDER` if any (none), save.
4. Deploy → New deployment → "Web app" → execute as **Me**, "Anyone, even anonymous".
5. Run `initSheets` once: `POST {"action":"initSheets"}` to seed sheets + `_Seq`.
6. Host `index.html` from the same origin (or allow CORS) so `api.js` can `fetch(GAS_API_URL, {mode:"cors"})`.
7. All fees/promo stay user-configurable via UI; the GAS `handle()` mirrors the same formulas as `js/core/`.
