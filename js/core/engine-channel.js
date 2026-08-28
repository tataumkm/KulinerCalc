export function validateChannel(channel) {
  const errors = [];
  if (!channel.name || !channel.name.trim()) errors.push("Nama channel wajib diisi");
  for (const f of ["commissionPercent", "paymentFeePercent", "taxPercent", "marketingFeePercent"]) {
    if (channel[f] != null) {
      const v = Number(channel[f]);
      if (v < 0) errors.push(`Fee ${f} tidak boleh negatif`);
      if (v > 100) errors.push(`Fee ${f} tidak boleh lebih dari 100%`);
    }
  }
  if (channel.fixedFee != null && Number(channel.fixedFee) < 0) errors.push("Fixed fee tidak boleh negatif");
  return errors;
}

export function calcChannelFee(price, channel) {
  const p = Number(price) || 0;
  const commission = p * (Number(channel.commissionPercent) || 0) / 100;
  const paymentFee = p * (Number(channel.paymentFeePercent) || 0) / 100;
  const tax = p * (Number(channel.taxPercent) || 0) / 100;
  const marketingFee = p * (Number(channel.marketingFeePercent) || 0) / 100;
  const fixed = Number(channel.fixedFee) || 0;
  const total = commission + paymentFee + tax + marketingFee + fixed;
  return { price: p, commission, paymentFee, tax, marketingFee, fixedFee: fixed, total };
}

export function calcNetRevenue(price, channel) {
  const fee = calcChannelFee(price, channel);
  return { ...fee, netRevenue: fee.price - fee.total };
}
