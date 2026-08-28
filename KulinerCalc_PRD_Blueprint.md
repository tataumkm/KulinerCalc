# KulinerCalc — Product Requirements & Technical Blueprint

## 1. Ringkasan Produk

**KulinerCalc** adalah web app untuk usaha kuliner/UMKM Indonesia yang membantu pemilik usaha:

- Mengelola master bahan baku dan perubahan harga.
- Menghitung HPP bahan.
- Menghitung HPP kemasan.
- Membuat resep/BOM setiap menu.
- Mengelola daftar menu dan harga jual.
- Menghitung harga jual berdasarkan target margin/markup/profit.
- Menghitung dampak fee platform food delivery.
- Mensimulasikan diskon, voucher, bundling, dan promo.
- Menghitung estimasi profit setelah HPP, fee, marketing, dan overhead.
- Menunjukkan menu yang marginnya sehat, perlu ditinjau, atau rugi.
- Mensimulasikan perubahan harga bahan baku.

### Positioning

> **"Cek apakah menu kamu benar-benar untung."**

Bukan sekadar kalkulator HPP, tetapi **Cost & Pricing Management System untuk usaha kuliner**.

---

# 2. Target Pengguna

Target utama:

- Kedai kopi.
- Kedai minuman.
- Warung makan.
- Restoran kecil.
- Bakery.
- Catering.
- Cloud kitchen.
- UMKM makanan/minuman.
- Reseller makanan/minuman.
- Pemilik usaha yang menjual melalui GoFood, GrabFood, ShopeeFood, WhatsApp, dan offline.

Target awal: **owner/operator UMKM yang belum menggunakan software akuntansi kompleks.**

Prinsip UX:

- Bahasa Indonesia.
- Sederhana untuk pengguna non-teknis.
- Angka dan insight lebih penting daripada istilah teknis.
- Semua fee/promo harus editable.
- Jangan mengunci angka fee platform karena kebijakan platform dapat berubah.

---

# 3. Tujuan MVP

MVP harus mampu menyelesaikan satu alur end-to-end:

```text
Harga bahan
    ↓
Master bahan
    ↓
Resep
    ↓
HPP bahan
    ↓
HPP kemasan
    ↓
HPP menu
    ↓
Channel penjualan
    ↓
Fee platform
    ↓
Diskon/promo
    ↓
Profit
    ↓
Rekomendasi harga jual
```

MVP tidak perlu menjadi POS, ERP, accounting, atau inventory management penuh.

---

# 4. Modul Utama

## 4.1 Dashboard

Menampilkan:

- Total menu aktif.
- Total bahan.
- HPP rata-rata.
- Margin rata-rata.
- Jumlah menu sehat.
- Jumlah menu perlu review.
- Jumlah menu berbahaya.
- Jumlah menu rugi.
- Perubahan HPP periode berjalan.
- Peringatan perubahan harga bahan.
- Menu dengan profit tertinggi.
- Menu dengan margin terendah.
- Menu yang terdampak perubahan harga.

Contoh status:

```text
🟢 Sehat      Margin > 35%
🟡 Review     Margin 20–35%
🔴 Bahaya     Margin < 20%
⚫ Rugi       Profit < 0
```

Threshold sebaiknya configurable.

---

# 5. Modul Bahan Baku

## 5.1 Master Bahan

Field minimum:

```text
ingredient_id
name
category
purchase_unit
purchase_qty
purchase_price
usage_unit
conversion
cost_per_usage_unit
supplier
status
created_at
updated_at
```

Contoh:

```text
Nama: Kopi Arabica
Kategori: Kopi
Satuan pembelian: Kg
Qty pembelian: 1
Harga pembelian: Rp120.000
Satuan pemakaian: Gram
Konversi: 1 Kg = 1.000 Gram
Cost/gram: Rp120
```

## 5.2 Konversi Satuan

Minimal dukung:

- Kg → gram
- Liter → ml
- Dus → pcs
- Karton → pcs

Desain sistem harus memungkinkan penambahan unit baru.

Formula:

```text
cost_per_usage_unit =
purchase_price / converted_total_usage_quantity
```

Contoh:

```text
Rp22.000 / 1.000 ml = Rp22/ml
```

## 5.3 Riwayat Harga

Jangan overwrite harga lama.

Tabel `ingredient_price_history`:

```text
id
ingredient_id
date
supplier
purchase_qty
purchase_unit
price
unit_cost
notes
```

Contoh:

```text
1 Jul 2026  Rp105.000
15 Jul 2026 Rp110.000
1 Aug 2026  Rp115.000
25 Aug 2026 Rp120.000
```

Sistem harus dapat membandingkan harga sekarang vs harga sebelumnya.

Insight:

```text
Harga naik Rp5.000
Persentase +4,35%
```

---

# 6. Modul Kemasan

Kemasan dipisahkan dari bahan baku.

Contoh:

```text
Cup 16 oz       Rp800
Lid             Rp250
Sedotan         Rp150
Sticker         Rp200
Plastik         Rp100
Paper Bag       Rp500
```

Field:

```text
packaging_id
name
category
unit
purchase_qty
purchase_price
cost_per_unit
supplier
status
```

## 6.1 Packaging Set

Dukung paket kemasan.

Contoh:

```text
Packaging Set: Cup 16 oz

Cup       Rp800
Lid       Rp250
Sedotan   Rp150
Sticker   Rp200
Plastik   Rp100

Total     Rp1.500
```

Menu cukup memilih `packaging_set_id`.

---

# 7. Modul Resep / BOM

Ini adalah inti penghitungan HPP.

Contoh:

## Kopi Susu Gula Aren

```text
Kopi       18 g
Susu       100 ml
Gula Aren  20 g
Es         100 g
```

Setiap recipe item:

```text
recipe_id
ingredient_id
quantity
unit
waste_percent
calculated_cost
```

## Formula

```text
base_cost =
quantity × ingredient.cost_per_usage_unit

effective_cost =
base_cost × (1 + waste_percent / 100)
```

Total HPP bahan:

```text
sum(effective_cost)
```

HPP produksi:

```text
total_ingredient_cost
+
total_packaging_cost
```

---

# 8. Waste / Shrinkage

Dukung:

- Waste per bahan.
- Waste default/global.

Contoh:

```text
Kopi       5%
Susu       2%
Gula       3%
```

Jika tidak diatur per bahan, gunakan default global.

Contoh:

```text
Cost kopi = Rp2.160
Waste = 5%

Effective cost = Rp2.268
```

---

# 9. Modul Menu

Master menu:

```text
menu_id
name
category
recipe_id
packaging_set_id
status
description
created_at
updated_at
```

Contoh:

```text
Kopi Susu Aren
Creamy Royal
Dark Chocolate
Vanilla Tea
```

Setiap menu otomatis memiliki:

- Direct HPP.
- Full Cost jika overhead aktif.
- Harga offline.
- Harga per channel.
- Profit per channel.
- Margin per channel.
- Status kesehatan.

---

# 10. Direct HPP vs Full Cost

Sistem harus menampilkan dua angka.

## Direct HPP

```text
HPP bahan
+
HPP kemasan
```

Contoh:

```text
Bahan      Rp5.120
Kemasan    Rp1.500
------------------
Direct HPP Rp6.620
```

## Full Cost

```text
Direct HPP
+
alokasi overhead
```

Contoh:

```text
Direct HPP     Rp6.620
Overhead       Rp3.150
----------------------
Full Cost      Rp9.770
```

Jangan mengganti Direct HPP dengan Full Cost; tampilkan keduanya.

---

# 11. Modul Biaya Operasional

Contoh:

```text
Sewa          Rp2.000.000/bulan
Listrik       Rp500.000
Air           Rp200.000
Internet      Rp300.000
Gaji          Rp3.000.000
Gas           Rp300.000
```

Field:

```text
operating_cost_id
name
category
amount
period
allocation_method
status
```

## Alokasi sederhana

Contoh:

```text
Total overhead = Rp6.300.000/bulan
Target penjualan = 2.000 cup/bulan

Overhead/cup =
6.300.000 / 2.000
= Rp3.150
```

MVP cukup mendukung alokasi berdasarkan target unit penjualan.

---

# 12. Modul Channel Penjualan

Default channel:

```text
Offline
GoFood
GrabFood
ShopeeFood
WhatsApp
Instagram
Website
```

User dapat menambah channel custom.

Field:

```text
channel_id
name
commission_percent
payment_fee_percent
fixed_fee
tax_percent
marketing_fee_percent
status
```

Semua angka harus configurable.

---

# 13. Perhitungan Fee Channel

Contoh:

```text
Harga jual = Rp12.000
Commission = 20%
Payment fee = 2%
```

Jika keduanya dikenakan terhadap harga transaksi:

```text
Commission = 12.000 × 20% = 2.400
Payment fee = 12.000 × 2% = 240

Total fee = Rp2.640

Net revenue = Rp9.360
```

Implementasi harus memisahkan setiap komponen fee agar mudah dikembangkan.

---

# 14. Harga per Channel

Satu menu dapat memiliki harga berbeda:

```text
Offline       Rp12.000
GoFood        Rp15.000
GrabFood      Rp15.000
ShopeeFood    Rp14.000
```

Table:

```text
menu_price_id
menu_id
channel_id
selling_price
effective_date
status
```

---

# 15. Modul Promo & Marketing

Promo harus configurable.

Tipe promo minimal:

```text
Percentage discount
Nominal discount
Buy X Get Y
Bundle
Voucher
Minimum purchase
Special price
Cashback
```

Field dasar:

```text
promotion_id
name
type
discount_percent
discount_amount
minimum_purchase
platform_share
merchant_share
start_date
end_date
status
```

---

# 16. Penanggung Diskon

Dukung tiga skenario:

```text
Merchant
Platform
Split
```

Contoh:

Harga Rp15.000

Diskon 20% = Rp3.000

Merchant menanggung seluruhnya:

```text
Revenue efektif = Rp12.000
```

Platform menanggung seluruhnya:

```text
Merchant revenue mengikuti aturan platform
```

Split:

```text
Platform = Rp2.000
Merchant = Rp1.000
```

Engine harus menyimpan nominal yang ditanggung merchant secara eksplisit agar profit tidak salah.

---

# 17. Promo Buy X Get Y

Contoh:

```text
Beli 2 gratis 1
Harga/unit Rp12.000
```

Customer membayar:

```text
2 × 12.000 = Rp24.000
```

Produk keluar:

```text
3 unit
```

Effective revenue/unit:

```text
24.000 / 3 = Rp8.000
```

Jika HPP/unit Rp6.620:

```text
Total HPP = 3 × 6.620 = Rp19.860
Profit = Rp4.140
```

---

# 18. Bundling

Contoh:

```text
Kopi Susu Aren HPP = Rp6.620
Vanilla Tea HPP    = Rp4.500

Total HPP = Rp11.120

Harga normal:
12.000 + 10.000 = Rp22.000

Harga bundle:
Rp18.000

Profit = Rp6.880
Margin = 38,2%
```

Bundle harus dapat memiliki beberapa menu item dan quantity.

---

# 19. Formula Profit

Urutan kalkulasi yang direkomendasikan:

```text
Gross Sales
- Merchant-funded Discount
= Discounted Sales

- Platform Commission
- Payment Fee
- Tax/Fee
- Marketing Fee
= Net Revenue

- Direct HPP
- Overhead Allocation
- Other Cost
= Estimated Profit
```

Untuk setiap hasil, tampilkan breakdown agar user bisa melakukan audit.

---

# 20. Margin vs Markup

Sistem harus membedakan:

### Markup

```text
(Harga - HPP) / HPP
```

### Margin

```text
(Harga - HPP) / Harga
```

Contoh:

```text
HPP = Rp10.000
Harga = Rp13.000

Markup = 30%
Margin = 23,08%
```

User dapat memilih target:

```text
Target berdasarkan:
○ Markup
● Margin
○ Profit nominal
```

---

# 21. Kalkulator Harga Jual

Input:

```text
Menu
Channel
Target type
Target margin / markup / profit
Promo aktif
```

Output:

```text
Direct HPP
Full Cost
Channel fee
Promo
Harga minimum
Harga rekomendasi
Profit
Margin
```

Contoh:

```text
Direct HPP      Rp6.620
Full Cost       Rp9.770
Target margin   35%
Channel fee     22%

Harga rekomendasi
Rp15.000
```

Harga sebaiknya memiliki opsi pembulatan:

```text
Nearest 500
Nearest 1.000
Custom
```

---

# 22. What-If Simulator

Buat halaman khusus untuk simulasi.

Parameter:

```text
Perubahan harga bahan
Harga jual
Fee channel
Diskon
Order/hari
Hari operasi
Marketing cost
Overhead
```

Contoh:

```text
Harga bahan       +10%
Harga jual         +5%
Fee platform       22%
Diskon             20%
Order/hari          50
```

Output:

```text
Revenue
Total HPP
Platform Fee
Promo
Marketing
Overhead
Estimated Profit
Profit/unit
Margin
```

Simulator tidak mengubah data master. Semua perubahan bersifat temporary.

---

# 23. Dampak Perubahan Harga Bahan

Saat harga bahan berubah, sistem harus menghitung dampaknya terhadap menu.

Contoh:

```text
Susu
Rp22.000 → Rp24.200
+10%
```

Sistem menemukan 8 menu terdampak.

Contoh:

```text
Kopi Susu Aren

HPP lama      Rp6.620
HPP baru      Rp6.840

Margin lama   44,8%
Margin baru   43,0%

Status:
🟢 Masih aman
```

Jika margin jatuh di bawah threshold:

```text
🔴 PERLU REVIEW
```

Jangan otomatis mengubah harga jual tanpa persetujuan user.

---

# 24. Menu Health Score

Setiap kombinasi:

```text
Menu + Channel + Promo
```

dapat memiliki status.

Default:

```text
🟢 Healthy  > 35%
🟡 Review   20–35%
🔴 Risk     < 20%
⚫ Loss     < 0 profit
```

Threshold configurable di Settings.

---

# 25. Laporan

MVP:

### Menu Profitability

```text
Menu
HPP
Harga
Fee
Promo
Profit
Margin
Status
```

### Ingredient Cost Change

```text
Bahan
Harga lama
Harga baru
Perubahan %
Menu terdampak
```

### Channel Profitability

```text
Channel
Revenue
Fee
Promo
HPP
Profit
Margin
```

### Price Recommendation

```text
Menu
Channel
Current Price
Minimum Price
Recommended Price
Target Margin
```

---

# 26. Menu Engineering — Fase Berikutnya

Klasifikasi:

```text
STAR
High Sales + High Profit

PLOW HORSE
High Sales + Low Profit

PUZZLE
Low Sales + High Profit

DOG
Low Sales + Low Profit
```

Fitur ini membutuhkan data penjualan aktual, sehingga tidak wajib untuk MVP.

---

# 27. AI Consultant — Fase Berikutnya

AI membaca hasil kalkulasi dan memberi insight.

Contoh:

> Kopi Susu Aren memiliki margin sehat dan penjualan tinggi. Pertahankan sebagai menu utama.

> Dark Chocolate memiliki margin rendah setelah fee platform dan promo. Pertimbangkan menaikkan harga platform atau mengurangi diskon.

AI tidak boleh mengarang fee platform atau biaya. AI hanya menggunakan data hasil calculation engine.

---

# 28. Import / Export

MVP:

### Import

- CSV.
- Excel/XLSX jika library tersedia.

Import minimal:

```text
Nama
Satuan
Qty
Harga
Supplier
```

### Export

- PDF laporan.
- CSV.
- Excel jika tersedia.

---

# 29. Arsitektur Teknis

Stack yang disarankan:

```text
Frontend:
HTML
Tailwind CSS
Vanilla JavaScript / modular JS

Backend:
Google Apps Script

Database:
Google Sheets

Hosting:
Google Apps Script Web App
atau
Frontend hosting + Apps Script API
```

Jika aplikasi berkembang besar, backend/database dapat diganti tanpa mengubah domain model.

---

# 30. Struktur Data / Spreadsheet

Gunakan sheet terpisah:

```text
Users
Business
Ingredients
IngredientPriceHistory
Units
Packaging
PackagingItems
Recipes
RecipeItems
Menus
MenuPrices
SalesChannels
ChannelFees
Promotions
PromotionRules
OperatingCosts
Settings
Simulations
```

Opsional fase berikutnya:

```text
Sales
Orders
OrderItems
Bundles
Suppliers
AuditLogs
```

---

# 31. ID Strategy

Gunakan ID unik untuk seluruh entitas.

Contoh:

```text
ING-000001
REC-000001
MENU-000001
PKG-000001
CHN-000001
PRM-000001
```

Jangan menggunakan nama sebagai primary key.

---

# 32. Calculation Engine

Pisahkan calculation engine dari UI.

Contoh fungsi konseptual:

```javascript
calculateIngredientCost()
calculateRecipeCost()
calculatePackagingCost()
calculateDirectHPP()
calculateOverheadAllocation()
calculateFullCost()
calculateChannelFees()
calculatePromotionImpact()
calculateNetRevenue()
calculateProfit()
calculateMargin()
calculateMarkup()
calculateRequiredSellingPrice()
simulateScenario()
calculateIngredientImpact()
```

**Penting:** jangan menaruh formula bisnis utama langsung di event handler UI.

Satu sumber kebenaran harus berada di calculation/service layer.

---

# 33. Contoh Object Model

```javascript
Ingredient {
  id,
  name,
  category,
  purchaseUnit,
  purchaseQty,
  purchasePrice,
  usageUnit,
  conversion,
  costPerUsageUnit
}

RecipeItem {
  ingredientId,
  quantity,
  unit,
  wastePercent
}

Menu {
  id,
  name,
  recipeId,
  packagingSetId
}

Channel {
  id,
  name,
  commissionPercent,
  paymentFeePercent,
  fixedFee,
  taxPercent
}

Promotion {
  id,
  name,
  type,
  discountPercent,
  discountAmount,
  merchantShare,
  platformShare
}
```

---

# 34. UI / Navigation

Desktop:

```text
Dashboard

MASTER DATA
├── Bahan Baku
├── Kemasan
└── Satuan

PRODUK
├── Resep
└── Menu

PENJUALAN
├── Channel
└── Promo

ANALISIS
├── Kalkulator Harga
├── Simulasi
└── Laporan

PENGATURAN
└── Settings
```

Mobile:

- Bottom navigation.
- Dashboard.
- Menu.
- Calculator.
- More.

---

# 35. Halaman MVP

Minimal 8 halaman:

```text
1. Login / Business Setup
2. Dashboard
3. Bahan Baku
4. Kemasan
5. Resep
6. Menu
7. Channel & Promo
8. Kalkulator Harga
9. Simulasi
10. Settings
```

Jika ingin sangat cepat, Promo dapat sementara digabung dengan Channel.

---

# 36. Business Setup / Onboarding

Saat pertama kali menggunakan aplikasi:

```text
Nama usaha
Jenis usaha
Mata uang
Target margin default
Waste default
Target penjualan bulanan
```

Setelah selesai:

```text
Tambahkan bahan
↓
Tambahkan kemasan
↓
Buat resep
↓
Daftarkan menu
↓
Atur channel
↓
Hitung harga
```

Buat sample data agar user bisa langsung mencoba aplikasi.

---

# 37. Validasi Penting

Sistem harus menolak atau memberi warning jika:

- Harga bahan <= 0.
- Qty resep <= 0.
- Konversi <= 0.
- Menu tidak punya resep.
- Resep tidak punya bahan.
- Harga jual <= 0.
- Fee < 0%.
- Fee > 100%.
- Diskon < 0%.
- Diskon > 100%.
- Promo aktif tetapi tidak memiliki rule.
- Target margin >= 100%.
- Harga rekomendasi tidak valid.

Semua calculation error harus memiliki pesan yang jelas.

---

# 38. Auditability

Setiap kalkulasi penting sebaiknya dapat dibuka menjadi breakdown.

Contoh:

```text
Kopi Susu Aren
────────────────────
Kopi             Rp2.160
Waste 5%           Rp108
Susu             Rp2.200
Gula Aren           Rp560
Es                  Rp200
────────────────────
HPP Bahan         Rp5.228

Kemasan           Rp1.500
────────────────────
Direct HPP        Rp6.728

Fee GoFood        Rp3.300
Diskon            Rp1.000
────────────────────
Estimated Profit  Rp2.972
```

User harus dapat memahami **mengapa** angka profit tersebut muncul.

---

# 39. Prinsip Produk

1. **Accuracy over decoration.**
2. Semua formula harus dapat diaudit.
3. Jangan hardcode fee platform.
4. Jangan mengubah harga master secara otomatis.
5. Pisahkan Direct HPP dan Full Cost.
6. Promo harus memperhitungkan siapa yang menanggung diskon.
7. Semua simulasi tidak mengubah data aktual.
8. Calculation engine harus terpisah dari UI.
9. Bahasa Indonesia sebagai default.
10. Mobile responsive.
11. Data harus mudah diekspor.
12. Fokus MVP sebelum fitur enterprise.

---

# 40. Roadmap

## V1 — MVP

```text
[✓] Business setup
[✓] Bahan baku
[✓] Riwayat harga
[✓] Konversi satuan
[✓] Kemasan
[✓] Packaging set
[✓] Resep
[✓] Waste
[✓] Menu
[✓] Direct HPP
[✓] Channel
[✓] Harga per channel
[✓] Fee calculation
[✓] Basic promo
[✓] Price calculator
[✓] Dashboard
[✓] Basic reports
```

## V2

```text
[ ] Operating costs
[ ] Full Cost
[ ] Advanced promotions
[ ] Bundle
[ ] Buy X Get Y
[ ] Import Excel
[ ] Export PDF
[ ] Advanced reports
[ ] Supplier management
[ ] Price alerts
[ ] Multi-user
```

## V3

```text
[ ] Sales tracking
[ ] Menu engineering
[ ] Forecasting
[ ] AI consultant
[ ] Multi-outlet
[ ] Role/permission
[ ] Advanced analytics
[ ] POS integration
```

---

# 41. Model Monetisasi

Untuk pasar Indonesia:

### Personal
Rp49.000–99.000

### Pro
Rp99.000–199.000

### Business
Rp299.000–499.000

### Custom
Rp750.000–Rp5.000.000+

Strategi awal:

**One-time purchase terlebih dahulu**, bukan subscription wajib.

Subscription dapat diperkenalkan untuk fitur cloud/multi-user/advanced analytics setelah product-market fit.

---

# 42. Fitur yang JANGAN dibuat di MVP

Hindari:

- POS lengkap.
- Accounting.
- Payroll.
- Inventory penuh.
- Purchase order kompleks.
- Integrasi API GoFood/GrabFood/ShopeeFood.
- Payment gateway.
- Multi-outlet kompleks.
- AI chatbot kompleks.

Tujuan MVP adalah membuat pengguna bisa:

> **"Saya punya resep → saya tahu HPP → saya masukkan fee platform/promo → saya tahu harga jual yang aman dan profit saya."**

---

# 43. Acceptance Criteria MVP

MVP dianggap berhasil jika skenario berikut berjalan benar:

### Scenario

Input:

```text
Kopi = Rp120.000/kg
Resep = 18g
Susu = Rp22.000/liter
Resep = 100ml
Gula = Rp28.000/kg
Resep = 20g
Kemasan = Rp1.500
```

Sistem menghasilkan Direct HPP.

Kemudian:

```text
Channel = GoFood
Fee = 22%
Harga = Rp15.000
```

Sistem menghasilkan:

```text
Gross Sales
Platform Fee
Net Revenue
Direct HPP
Profit
Margin
```

Kemudian aktifkan:

```text
Diskon 20%
Merchant-funded
```

Sistem harus menghitung ulang profit.

Kemudian ubah harga susu:

```text
Rp22.000 → Rp24.200
```

Sistem harus:

1. Menyimpan riwayat harga.
2. Menghitung ulang HPP.
3. Menampilkan perubahan HPP.
4. Menampilkan menu terdampak.
5. Menghitung ulang margin.
6. Memberi warning jika margin melewati threshold.

Terakhir:

```text
Target margin = 35%
```

Sistem harus menghasilkan:

```text
Harga minimum/rekomendasi
```

yang mempertimbangkan HPP + channel fee + promo sesuai konfigurasi.

---

# 44. Prioritas Development untuk AI Coding Agent

Urutan pengerjaan yang direkomendasikan:

```text
PHASE 1
Project structure
+
Database schema
+
Business setup
+
Settings

PHASE 2
Ingredient CRUD
+
Unit conversion
+
Price history

PHASE 3
Packaging CRUD
+
Packaging sets

PHASE 4
Recipe builder
+
HPP calculation engine

PHASE 5
Menu CRUD
+
Menu pricing

PHASE 6
Sales channel
+
Fee calculation

PHASE 7
Promotion engine
+
Profit calculation

PHASE 8
Price recommendation

PHASE 9
Dashboard
+
Reports

PHASE 10
What-if simulator

PHASE 11
Testing
+
Validation
+
UX polish
```

**Jangan meminta coding agent membangun seluruh aplikasi dalam satu prompt.**

Bangun per fase, dan setelah setiap fase lakukan test terhadap calculation engine sebelum lanjut.

---

# 45. Definition of Done

Fitur dianggap selesai jika:

- CRUD berfungsi.
- Data tersimpan persisten.
- Validasi input tersedia.
- Calculation engine memiliki unit test untuk formula penting.
- UI responsive.
- Error handling tersedia.
- Tidak ada formula bisnis yang hardcoded di UI.
- Data dapat diedit tanpa merusak relasi.
- Perubahan harga memiliki histori.
- Hasil kalkulasi dapat dibreakdown.
- Tidak ada perubahan data aktual saat melakukan simulasi.

---

# 46. Prinsip Pengembangan untuk Coding Agent

Coding agent harus:

1. Membaca struktur project sebelum mengubah file.
2. Tidak menghapus fitur yang sudah berjalan tanpa alasan.
3. Mengikuti schema/domain model yang sudah ada.
4. Membuat calculation engine modular.
5. Membuat test untuk setiap formula bisnis.
6. Tidak hardcode nama/fee platform.
7. Menggunakan Indonesian locale untuk currency/number formatting.
8. Menjaga responsive design.
9. Menghindari dependency yang tidak diperlukan.
10. Setelah setiap fase, memberikan ringkasan perubahan dan test result.

---

# 47. Core Product Loop

```text
BUY RAW MATERIAL
        ↓
RECORD PRICE
        ↓
BUILD RECIPE
        ↓
CALCULATE HPP
        ↓
ADD PACKAGING
        ↓
REGISTER MENU
        ↓
SELECT SALES CHANNEL
        ↓
ADD PROMOTION
        ↓
CALCULATE REAL PROFIT
        ↓
RECOMMEND SELLING PRICE
        ↓
MONITOR PRICE CHANGES
        ↓
REVIEW MENU PROFITABILITY
```

## Produk inti yang harus terasa oleh pengguna

> **"Saya tidak lagi menebak harga jual. Saya tahu berapa biaya sebenarnya, berapa yang dipotong platform/promo, dan berapa keuntungan yang tersisa."**
