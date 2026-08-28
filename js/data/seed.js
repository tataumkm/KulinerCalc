import { nextId, maxNumber } from "../core/ids.js";
import { calculateCostPerUsageUnit } from "../core/engine-ingredient.js";
import { calculateCostPerUnit, packagingSetTotal } from "../core/engine-packaging.js";

const now = new Date().toISOString();

export function buildSeed() {
  const ings = [
    {
      id: "ING-000001",
      name: "Kopi Arabica",
      category: "Kopi",
      purchaseUnit: "Kg",
      purchaseQty: 1,
      purchasePrice: 120000,
      usageUnit: "Gram",
      conversion: 1000,
      supplier: "Supplier Kopi",
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "ING-000002",
      name: "Susu UHT",
      category: "Susu",
      purchaseUnit: "Liter",
      purchaseQty: 1,
      purchasePrice: 22000,
      usageUnit: "ml",
      conversion: 1000,
      supplier: "Supplier Susu",
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "ING-000003",
      name: "Gula Aren",
      category: "Pemanis",
      purchaseUnit: "Kg",
      purchaseQty: 1,
      purchasePrice: 28000,
      usageUnit: "Gram",
      conversion: 1000,
      supplier: "Supplier Gula",
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "ING-000004",
      name: "Es Batu",
      category: "Lainnya",
      purchaseUnit: "Kg",
      purchaseQty: 1,
      purchasePrice: 2000,
      usageUnit: "Gram",
      conversion: 1000,
      supplier: "Supplier Es",
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const ing of ings) {
    const calc = calculateCostPerUsageUnit(ing);
    ing.costPerUsageUnit = calc.costPerUsageUnit;
    ing.conversionNote = calc.conversionNote;
  }

  const pkgCups = {
    id: "PKG-000001",
    name: "Cup 16 oz",
    category: "Kemasan",
    unit: "Pcs",
    purchaseQty: 1,
    purchasePrice: 800,
    supplier: "Supplier Kemasan",
    status: "active",
    createdAt: now,
    updatedAt: now,
  };
  const sets = [
    {
      id: "PKGSET-000001",
      name: "Set Cup 16 oz",
      createdAt: now,
    },
  ];
  const setItems = {
    "PKGSET-000001": [
      { packagingId: "PKG-000001", quantity: 1 },
    ],
  };

  const catalog = { "PKG-000001": { ...pkgCups, costPerUnit: calculateCostPerUnit(pkgCups).costPerUnit } };
  const setTotal = packagingSetTotal(sets[0], setItems["PKGSET-000001"], catalog);

  const priceHistory = [
    {
      id: "PRH-000001",
      ingredientId: "ING-000002",
      date: "2026-07-01",
      supplier: "Supplier Susu",
      purchaseQty: 1,
      purchaseUnit: "Liter",
      price: 105000,
      unitCost: 105,
      notes: "awal",
    },
    {
      id: "PRH-000002",
      ingredientId: "ING-000002",
      date: "2026-07-15",
      supplier: "Supplier Susu",
      purchaseQty: 1,
      purchaseUnit: "Liter",
      price: 110000,
      unitCost: 110,
      notes: "",
    },
    {
      id: "PRH-000003",
      ingredientId: "ING-000002",
      date: "2026-08-01",
      supplier: "Supplier Susu",
      purchaseQty: 1,
      purchaseUnit: "Liter",
      price: 115000,
      unitCost: 115,
      notes: "",
    },
    {
      id: "PRH-000004",
      ingredientId: "ING-000002",
      date: "2026-08-25",
      supplier: "Supplier Susu",
      purchaseQty: 1,
      purchaseUnit: "Liter",
      price: 120000,
      unitCost: 120,
      notes: "harga terkini",
    },
  ];

  const recipes = [
    {
      id: "REC-000001",
      name: "Kopi Susu Gula Aren",
      description: "Menu utama uji acceptance (PRD §43)",
      createdAt: now,
      updatedAt: now,
    },
  ];
  const recipeItems = {
    "REC-000001": [
      { ingredientId: "ING-000001", quantity: 18, unit: "Gram", wastePercent: 5 },
      { ingredientId: "ING-000002", quantity: 100, unit: "ml", wastePercent: 2 },
      { ingredientId: "ING-000003", quantity: 20, unit: "Gram", wastePercent: 3 },
      { ingredientId: "ING-000004", quantity: 100, unit: "Gram", wastePercent: 0 },
    ],
  };

  const menus = [
    {
      id: "MENU-000001",
      name: "Kopi Susu Gula Aren",
      category: "Kopi",
      recipeId: "REC-000001",
      packagingSetId: "PKGSET-000001",
      sellingPrice: 15000,
      status: "active",
      description: "Menu utama uji acceptance",
      createdAt: now,
      updatedAt: now,
    },
  ];

  const channels = [
    { id: "CHN-000001", name: "Offline", commissionPercent: 0, paymentFeePercent: 0, fixedFee: 0, taxPercent: 0, marketingFeePercent: 0, status: "active" },
    { id: "CHN-000002", name: "GoFood", commissionPercent: 22, paymentFeePercent: 0, fixedFee: 0, taxPercent: 0, marketingFeePercent: 0, status: "active" },
    { id: "CHN-000003", name: "GrabFood", commissionPercent: 22, paymentFeePercent: 0, fixedFee: 0, taxPercent: 0, marketingFeePercent: 0, status: "active" },
    { id: "CHN-000004", name: "ShopeeFood", commissionPercent: 20, paymentFeePercent: 0, fixedFee: 0, taxPercent: 0, marketingFeePercent: 0, status: "active" },
    { id: "CHN-000005", name: "WhatsApp", commissionPercent: 0, paymentFeePercent: 0, fixedFee: 0, taxPercent: 0, marketingFeePercent: 0, status: "active" },
  ];
  const menuPrices = [
    { id: "MPR-000001", menuId: "MENU-000001", channelId: "CHN-000002", sellingPrice: 15000, status: "active" },
  ];

  const promotions = [
    {
      id: "PRM-000001",
      name: "Diskon 20% merchant",
      type: "percentage",
      funding: "merchant",
      discountPercent: 20,
      discountAmount: 0,
      merchantShare: 0,
      platformShare: 0,
      minimumPurchase: 0,
      status: "active",
    },
    {
      id: "PRM-000002",
      name: "Beli 2 Gratis 1",
      type: "buy_x_get_y",
      funding: "merchant",
      buyX: 2,
      getY: 1,
      merchantShare: 0,
      platformShare: 0,
      status: "active",
    },
  ];

  return {
    business: {
      id: "BIZ-000001",
      name: "Kedai Aroma",
      businessType: "Kedai Kopi",
      currency: "IDR",
      targetMarginDefault: 35,
      wasteDefault: 3,
      monthlySalesTarget: 2000,
      createdAt: now,
    },
    settings: {
      healthyMarginThreshold: 35,
      reviewMarginThreshold: 20,
      currency: "IDR",
      wasteDefault: 3,
    },
    ingredients: ings,
    ingredientPriceHistory: priceHistory,
    packagings: [pkgCups],
    packagingSets: sets,
    packagingSetItems: setItems,
    recipes,
    recipeItems,
    menus,
    channels,
    menuPrices,
    promotions,
    seq: {
      ingredient: maxNumber([...ings.map((i) => i.id), "ING-000001"]),
      packaging: 1,
      packagingSet: 1,
      recipe: 1,
      menu: 1,
      channel: 5,
      menuPrice: 1,
      promotion: 2,
    },
  };
}
