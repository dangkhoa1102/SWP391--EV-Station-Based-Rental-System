// Currency helpers - format values to Vietnamese Dong (VND)
export const VND_RATE = 24000 // default conversion rate USD -> VND (adjustable)

// By default we assume backend prices are already in VND. Set convertFromUSD: true
// when values are provided in USD and need conversion.
export function formatVND(value, opts = { convertFromUSD: false }){
  const { convertFromUSD } = opts || {}
  const n = Number(value) || 0
  const vnd = convertFromUSD ? Math.round(n * VND_RATE) : Math.round(n)
  // Use Vietnamese locale grouping and append currency symbol
  return new Intl.NumberFormat('vi-VN').format(vnd) + ' ₫'
}

export function formatVNDPerUnit(value, unit = '/hour', opts){
  return `${formatVND(value, opts)}${unit}`
}
