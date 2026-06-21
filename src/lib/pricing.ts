// Lovable official price per credit in BRL (~$0.10 USD × 5.70 BRL/USD)
export const LOVABLE_OFFICIAL_UNIT_PRICE = 0.57;

// Fallback API prices (real costs from upstream API, updated 2026-04-06)
export const FALLBACK_API_PRICES: Record<number, number> = {
  100: 9.0,
  500: 32.31,
  1000: 61.11,
  2000: 112.41,
  5000: 233.91,
  10000: 390.0,
};

export const CREDIT_TIERS = [100, 500, 1000, 2000, 5000, 10000];

/**
 * Interpolate API cost for any credit amount using the price table.
 */
export function interpolateApiCost(
  credits: number,
  priceTable: Record<number, number> = FALLBACK_API_PRICES
): number {
  const tiers = Object.keys(priceTable)
    .map(Number)
    .sort((a, b) => a - b);

  if (tiers.length === 0) return 0;
  if (credits <= tiers[0]) {
    // Linear from 0 to first tier
    return (priceTable[tiers[0]] / tiers[0]) * credits;
  }
  if (credits >= tiers[tiers.length - 1]) {
    return priceTable[tiers[tiers.length - 1]];
  }

  for (let i = 0; i < tiers.length - 1; i++) {
    const lo = tiers[i];
    const hi = tiers[i + 1];
    if (credits >= lo && credits <= hi) {
      const ratio = (credits - lo) / (hi - lo);
      return priceTable[lo] + ratio * (priceTable[hi] - priceTable[lo]);
    }
  }
  return priceTable[tiers[tiers.length - 1]];
}

/**
 * Calculate final price with margin.
 */
export function calculateTotal(
  credits: number,
  marginPct: number = 35,
  priceTable: Record<number, number> = FALLBACK_API_PRICES
): number {
  const multiplier = 1 + marginPct / 100;
  return Math.ceil(interpolateApiCost(credits, priceTable) * multiplier);
}

export function calculateApiTotal(
  credits: number,
  priceTable: Record<number, number> = FALLBACK_API_PRICES
): number {
  return interpolateApiCost(credits, priceTable);
}

export function getLovableOfficialPrice(credits: number): number {
  return credits * LOVABLE_OFFICIAL_UNIT_PRICE;
}

export function calculateSavings(
  credits: number,
  marginPct: number = 35,
  priceTable: Record<number, number> = FALLBACK_API_PRICES
): number {
  const lovablePrice = getLovableOfficialPrice(credits);
  const ourPrice = calculateTotal(credits, marginPct, priceTable);
  return Math.max(0, lovablePrice - ourPrice);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

export function getPricingTable(
  marginPct: number = 35,
  priceTable: Record<number, number> = FALLBACK_API_PRICES
) {
  return CREDIT_TIERS.map((qty) => {
    const apiTotal = calculateApiTotal(qty, priceTable);
    const finalTotal = calculateTotal(qty, marginPct, priceTable);
    const finalUnit = finalTotal / qty;
    const lovablePrice = getLovableOfficialPrice(qty);
    const saving = Math.max(0, lovablePrice - finalTotal);
    const discount =
      lovablePrice > 0 ? Math.round((1 - finalTotal / lovablePrice) * 100) : 0;
    return { qty, apiTotal, finalTotal, finalUnit, lovablePrice, saving, discount };
  });
}
