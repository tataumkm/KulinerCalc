# KulinerCalc

Web app pengelolaan biaya & harga untuk UMKM kuliner Indonesia. Hitung HPP, fee channel food delivery, diskon/promo, profit & margin — plus rekomendasi harga jual. Bahasa Indonesia, desain Neo-Brutalism mobile-first.

> "Cek apakah menu kamu benar-benar untung."

## Tech stack

| Lapisan | Pilihan |
|---|---|
| Frontend | HTML + Tailwind CDN + vanilla modular JS (ES module) |
| Backend | Google Apps Script (`backend/Code.gs`) |
| Database | Google Sheets |
| Hosting | GAS Web App, atau host statis (GitHub Pages/Netlify) + GAS API |
| Engine test | Node (ESM) |

## Quick start — demo lokal (tanpa server)

Data tersimpan di `localStorage`. Cukup buka `index.html`, atau:

```bash
npx serve .        # serve folder ini, lalu buka http://localhost:3000
# atau
python -m http.server 8000
```

Tidak perlu backend untuk mencoba. Data contoh otomatis terisi (Kopi Arabica, Kopi Susu Gula Aren, GoFood 22%, diskon 20% merchant).

## Struktur proyek

```
index.html            Shell SPA, mobile-first, bottom nav
css/style.css         Desain sistem Neo-Brutalism (native CSS + Tailwind utilities)
js/
  config.js           DATA_BACKEND ("local"|"gas") + GAS_API_URL
  core/               Calculation engine (framework-free, terpisah dari UI)
    ids.js            Prefixed IDs (ING-000001, REC-000001, ...)
    money.js          Format Rp / angka / persen (locale id-ID)
    units.js          Konversi satuan (Kg↔Gram, Liter↔ml, Dus↔Pcs, Karton↔Pcs)
    engine-ingredient.js
    engine-packaging.js
    engine-recipe.js        HPP bahan (qty × cost × (1+waste/100))
    engine-menu.js          Direct HPP, margin vs markup, menu health
    engine-channel.js       Fee (komisi+payment+tax+marketing, semua %)
    engine-promotion.js     Tipe promo + funding + Buy X Get Y
    engine-profit.js        Profit pipeline (PRD §19)
    engine-price.js         Price diff + rekomendasi harga (solver)
  data/
    store.js          localStorage backend (default demo)
    api.js            GAS fetch backend
    backend.js        Adapter: switch store|api via config (SATU IMPORT di state.js)
    state.js          Sumber kebenaran UI (CRUD + kalkulasi), pakai ./backend.js
    seed.js           Data contoh
  app/
    main.js           Router + bottom nav
    ui.js             Helper render primitif brutal
    layout.js         Header (gear→setup) + bottom nav 5 slot
    views/            dashboard, bahan, resep, menu, promo, channel, reports, harga, more
tests/                npm test
backend/Code.gs       Google Apps Script (schema + REST actions)
```

## Kalkulasi (sumber kebenaran: `js/core/`)

```
effective_cost = qty × cost_per_usage_unit × (1 + waste/100)
Direct HPP     = HPP bahan + HPP kemasan
margin         = (price − cost) / price          (bukan markup)
markup         = (price − cost) / cost
channel fee    = price × (commission + payment + tax + marketing)%  + fixed_fee
diskon merchant= harga × promo%                  (hanya yang ditanggung merchant)
net revenue    = (gross − diskon_merchant) − fee
profit         = net revenue − Direct HPP
harga rekomendasi (target margin M)
  P = (HPP + feeFixed) / [(1−dM)(1−feeRate) − M]
```

Semua fee/promo **bukan hardcoded** — semua diinput user (channel, promo).

## Penggunaan

- **Dashboard** — ringkasan bahan/resep/menu, riwayat harga terbaru.
- **Bahan** — CRUD bahan, konversi satuan, ganti harga (riwayat append-only, lama tidak tertimpa).
- **Resep** — builder BOM → HPP bahan otomatis (dengan waste per bahan + default global).
- **Menu** — daftarkan menu (resep + set kemasan) → Direct HPP + harga offline + margin + health badge.
- **Promo** — buat promo (%, nominal, BXGY, dsb) + **Simulator profit**: pilih menu×channel×promo → gross → diskon → fee → net → profit & margin (PRD §19).
- **Laporan** (Lainnya → Laporan) — Menu Profitability, Perubahan Biaya Bahan (dengan menu terdampak), Channel Profitability, Rekomendasi Harga.
- **Lainnya** (⚙) — setup usaha, settings (threshold margin, waste default), master data tambahan.

ID semua entitas berupa `ING-000001`, `REC-000001`, `MENU-000001`, dst — tidak pakai nama sebagai primary key. Riwayat harga tidak pernah ditimpa. Simulasi tidak ubah data master.

## Google Apps Script (deploy ke produksi)

> Fase 10 (what-if) & Fase 11 (UX polish/testing) dilewati. Engine & UI sudah fungsional dengan localStorage. Langkah GAS di bawah sudah terhubung ke backend yang sama.

### 1. Siapkan Google Sheet

- Buat Google Sheet baru.
- Jalankan sekali init: buka Extensions → Apps Script, tempel `backend/Code.gs`, lalu jalankan `initSheets` (atau `doPost` dengan `body {"action":"initSheets"}`) untuk membuat tab: `Business, Settings, Ingredients, IngredientPriceHistory, Units, Packagings, PackagingSets, Recipes, RecipeItems, Menus, Channels, MenuPrices, Promotions`.

### 2. Deploy Web App

- Di Apps Script: Deploy → New deployment → "Web app" → **Execute as: Me**, **Who has access: Anyone, even anonymous**.
- Salin URL Web App (contoh: `https://script.google.com/macros/s/…/exec`).

### 3. Hubungkan frontend

Edit `js/config.js`:

```js
export const DATA_BACKEND = "gas";
export const GAS_API_URL = "https://script.google.com/macros/s/…/exec";
```

Re-host `index.html` (GitHub Pages/Netlify) **atau** deploy sebagai GAS Web App yang meng-embed frontend (lihat PRD §29). `js/data/backend.js` otomatis pakai `api.js` (fetch) ketika `DATA_BACKEND === "gas"`.

### 4. Aksi API (route via `body.action`)

Contoh:
```jsonc
POST <GAS_API_URL>  { "action": "addIngredient", "data": { "name":"Gula Aren","purchaseUnit":"Kg","purchaseQty":1,"purchasePrice":28000,"usageUnit":"Gram" } }
POST <GAS_API_URL>  { "action": "getIngredients" }
POST <GAS_API_URL>  { "action": "changeIngredientPrice", "data": { "ingredientId":"ING-000003","price":30000,"date":"2026-08-28","notes":"naik" } }
POST <GAS_API_URL>  { "action": "addRecipe", "data": { "name":"X","items":[{"ingredientId":"ING-000001","quantity":18,"unit":"Gram","wastePercent":5}] } }
```

Formula di `backend/Code.gs` meniru persis `js/core/` (mis. `costPerUsageUnit_`, `recipeHPP_`, `menuDirectHPP_`).

## Test

```bash
npm test
# engine-test 14 | state-test 27 | recipe-test 8 | menu-test 11 |
# channel-test 18 | promo-test 30 | pricing-test 16 | ui-smoke 11
```

Suite dijalankan di Node; engine & state diuji termasuk skenario acceptance (HPP naik saari harga susu 22.000→24.200, profit & rekomendasi harga). `node --check <file>` juga tersedia; untuk GAS `node --check backend/Code.gs` (copy dulu ke `.js` karena Node tidak baca ekstensi `.gs`).

## Acceptance MVP (PRD §43)

Simulasi end-to-end (mode lokal): buka `index.html` → semua langkah berikut terpenuhi & diuji:

1. Bahan: Kopi Rp120.000/kg (cost/gram Rp120), Susu Rp22.000/L (cost/ml Rp22), Gula Rp28.000/kg, Es Rp2.000/kg.
2. Resep Kopi Susu Gula Aren: Kopi 18g, Susu 100ml, Gula 20g, Es 100g → HPP bahan **Rp5.288,8** (dengan waste 5/2/3/0%).
3. Kemasan set Rp1.500 → Direct HPP **+** ... (seed pakai set Rp800: Direct HPP **Rp6.088,8**). *Catatan: harga kemasan di seed demo Rp800; sesuaikan ke Rp1.500 lewat UI Kemasan.*
4. Channel GoFood 22% → harga Rp15.000 → fee Rp3.300, net Rp11.700.
5. Diskon 20% merchant-funded → merchant discount Rp3.000 → discounted Rp12.000 → fee Rp2.640 → net Rp9.360 → profit **Rp3.271,2** (margin 21,8%).
6. Ganti harga susu 22.000 → 24.200: riwayat tersimpan append-only, HPP re-calc naik, laporan *Perubahan Biaya Bahan* + menu terdampak terlist.
7. Target margin 35% → Kalkulator rekomendasikan harga (GoFood + 20% promo): **Rp23.500**; harga minimum breakeven **Rp10.118**.

Cek semua angka di atas lewat menu **Promo → Simulator profit** dan **Laporan → Rekomendasi harga**.
