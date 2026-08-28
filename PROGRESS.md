# Progress Log — KulinerCalc

Log kemajuan pembangunan per fase (PRD §44). Diupdate setiap akhir fase / sesi kerja.

## Cara pakai

- Satu entry per fase/sesi kerja, paling baru di **atas**.
- Format: tanggal + fase/pekerjaan + apa yang selesai + status test.
- Setelah entry, tandai fase selesai di bagian bawah (checklist fase).

---

## Log

### Fase 9 — Dashboard & laporan (2026-08-28)
- **Engine:** reuse `profitBreakdown`/`channelProfitability`/`ingredientCostChanges` (impact analysis).
- **State:** `menusUsingIngredient`, `ingredientCostChanges` (riwayat perubahan harga + menu terdampak), `channelProfitability` (per-channel revenue/fee/profit/margin).
- **Laporan (4 per PRD §25):** Menu Profitability, Ingredient Cost Change, Channel Profitability, Price Recommendation — semua tabel responsive di `views/reports.js`.
- **UI:** view `reports.js` + link di "Lainnya" → **Laporan**. Dashboard sudah menampilkan stat + ringkasan resep/harga. Setup/pengaturan & master-data tambahan (Channel, Kemasan) masih dari "Lainnya".
- **GAS:** read-action tambahan `getPromotions`/`getReportData`.
- **Test:** `npm test` hijau (ui-smoke +1 view). Reports verifikasi struktur impact (menu terdampak saari susu naik).
- Catatan: laporan dihitung dari state lokal; saat beralih ke GAS, `getReportData` + server-side aggregation.

---

### Fase 8 — Price recommendation (2026-08-28)
- **Engine:** `js/core/engine-pricing.js` — `recommendPrice` solver (margin target, tutup bentuk `P = (HPP + feeFixed) / [(1−dM)(1−feeRate) − M]`), `marginBreakdown` (chain PRD §19), `minPrice` breakeven, rounding 500.
- **State:** `recommendForMenu(menu, channel, promo, targetMargin)`; `setMenuPrice` callable langsung dari view.
- **UI:** view `harga.js` (mengganti placeholder) — Kalkulator rekomendasi harga: menu×channel×promo×target margin → harga rekomendasi, min, profit, margin. "Pakai harga ini" set harga/channel. Full Cost tertunda fase biaya operasional.
- **Bugfix:** `marginBreakdown` pakai `calcNetRevenue` (bukan `calcChannelFee` yang tak punya netRevenue); syntax error di harga.js.
- **Acceptance (simulasi):** HPP 6.313,2 (setelah harga susu naik) + GoFood 22% + diskon 20% merchant → rekomendasi **Rp23.500** (margin 35%), min breakeven **Rp10.118**. Tanpa promo → Rp14.500.
- **Test:** suite `pricing-test` 16/16; state-test + rekomendasi; `npm test` semua hijau.

---

### Fase 7 — Promotion engine + profit (2026-08-28)
- **Engine:** `js/core/engine-promotion.js` (tipe %/nominal/voucher/cashback/special/BXGY, funding merchant/platform/split, `buyXGetY` effective_revenue_per_unit = total_paid/total_units_out) + `js/core/engine-profit.js` (pipeline PRD §19: gross → diskon merchant → discounted sales → fee channel → net revenue → − direct HPP → profit).
- **State:** `addPromotion/updatePromotion/deletePromotion`, `profitBreakdown(menu, channelId, promoId)` — komposisi lengkap, termasuk BXGY per order.
- **Seed:** `PRM-000001` Diskon 20% merchant-funded + `PRM-000002` Beli 2 Gratis 1.
- **UI:** view `promo.js` + nav (Dashboard→Bahan→Resep→Menu→Promo); CRUD promo + **Simulator profit** (pilih menu×channel×promo → breakdown lengkap). Channel CRUD pindah ke "Lainnya".
- **Fix bug:** `calcEstimatedProfit` dulu salah baca diskon dari objek promo, bukan argumen — profit & margin salah; diperbaiki.
- **GAS:** schema `Promotions`; action `addPromotion`/`getPromotions`.
- **Test:** suite baru `promo-test` 30/30. **Acceptance valid:** Diskon 20% merchant-funded + GoFood 22% × Rp15.000 → diskon merchant Rp3.000 → discounted Rp12.000 → fee Rp2.640 → net Rp9.360 → profit **Rp3.271,2** (margin 21,8%). BXGY: beli 2 @Rp15.000 → 3 unit, effective Rp10.000/unit.
- `npm test` semua hijau.

---

## Checklist Fase (PRD §44)

| Fase | Isi | Status |
|------|-----|--------|
| 1 | Project structure + DB schema + business setup + settings | ✅ |
| 2 | Ingredient CRUD + unit conversion + price history | ✅ |
| 3 | Packaging CRUD + packaging sets | ✅ |
| 4 | Recipe builder + HPP calculation engine | ✅ |
| 5 | Menu CRUD + menu pricing | ✅ |
| 6 | Sales channel + fee calculation | ✅ |
| 7 | Promotion engine + profit calculation | ✅ |
| 8 | Price recommendation | ✅ |
| 9 | Dashboard & laporan | ✅ |
| 10 | What-if simulator | ⏭ dilewati |
| 11 | Testing + validation + UX polish | ⏭ dilewati (test tetap hijau) |

## Acceptance MVP (PRD §43) — status

- [x] Kopi Susu Gula Aren → HPP bahan (Rp5.288,8) + kemasan → Direct HPP (Rp6.088,8)
- [x] GoFood 22% → Rp15.000 → fee Rp3.300, net Rp11.700, profit Rp5.611,2
- [x] Diskon 20% merchant-funded → re-calc profit Rp3.271,2 (margin 21,8%)
- [x] Susu 22.000→24.200 → riwayat append-only, HPP rekalkulasi, laporan Perubahan Biaya + menu terdampak
- [x] Target margin 35% → rekomendasi harga (GoFood+promo) Rp23.500, min breakeven Rp10.118
- [x] README + petunjuk deploy ke GAS (backend/Code.gs, schema, Web App, `DATA_BACKEND` swap via `js/data/backend.js`)

### Fase 5 — Menu CRUD + menu pricing + Direct HPP (2026-08-28)
- **Engine:** `js/core/engine-menu.js` — `calcDirectHPP` (bahan+kemasan), margin vs markup (PRD §20), `menuHealth` thresholds configurable, validation.
- **State:** `addMenu/updateMenu/deleteMenu/listMenus/memoMenu` di `js/data/state.js`; Direct HPP auto (recipe HPP + packaging set total).
- **Seed:** menu `MENU-000001` Kopi Susu Gula Aren (REC-000001 + PKGSET-000001, harga Rp15.000).
- **UI:** view `menu.js` + nav (Dashboard→Bahan→Resep→Menu→Lainnya); breakdown Direct HPP, harga offline, margin, health badge; dashboard section Menu & Direct HPP.
- **Router fix:** `navigate` kini kirim `navigate` sebagai arg ke-3 view (`render(main, opts, navigate)`) — perbaiki bug klik nav dashboard.
- **Kemasan** dipindah ke "Lainnya" (link master data) karena slot nav penuh.
- **GAS:** schema `Menus`; action `addMenu`/`getMenus` + `menuDirectHPP_`.
- **Test:** suite baru `menu-test` 11/11; state-test tambah verifikasi Direct HPP seed (Rp6.313,2 post price-change) + margin 57,9% healthy; `npm test` semua hijau (engine 14 + recipe 8 + menu 11 + state 27 + UI 8).

- [ ] Susu Rp22.000→Rp24.200 → riwayat, HPP, dampak, warning, rekomendasi
