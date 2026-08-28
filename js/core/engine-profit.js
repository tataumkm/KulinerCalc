import { calcNetRevenue } from "./engine-channel.js";
import { merchantDiscountShare } from "./engine-promotion.js";

export function calcEstimatedProfit({ price, channel, promo, merchantDiscountRaw, directHPP, unitCount = 1 }) {
  const gross = Number(price) * unitCount;
  let merchantDiscount = 0;
  let promoApplied = false;

  const discount = merchantDiscountRaw != null ? merchantDiscountRaw : null;
  if (promo && discount != null && discount > 0) {
    merchantDiscount = merchantDiscountShare(promo, discount);
    promoApplied = true;
  }

  const discountedSales = gross - merchantDiscount;
  const channelFeeOn = discountedSales;
  const channelFee = channel ? calcNetRevenue(channelFeeOn, channel) : { total: 0, netRevenue: discountedSales };
  const netRevenue = channel ? channelFee.netRevenue : discountedSales;

  const directHPPTotal = Number(directHPP) * unitCount;
  const profit = netRevenue - directHPPTotal;
  const margin = gross > 0 ? (profit / gross) * 100 : null;

  return {
    gross,
    merchantDiscount,
    promoApplied,
    discountedSales,
    channelFee: channelFee.total,
    netRevenue,
    directHPP: directHPPTotal,
    profit,
    margin,
  };
}
