import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  getLovableOfficialPrice,
} from "@/lib/pricing";

const DEFAULT_MIN_CREDITS = 10;

const FALLBACK_FINAL_PRICES: Record<number, number> = {
  100: 13, 500: 44, 1000: 83,
  2000: 152, 5000: 316, 10000: 527,
};

interface PricingData {
  prices: Record<number, number>;
  minCredits: number;
}

function interpolateFinalPrice(credits: number, priceTable: Record<number, number>): number {
  const tiers = Object.keys(priceTable).map(Number).sort((a, b) => a - b);
  if (tiers.length === 0) return 0;
  if (credits <= tiers[0]) return (priceTable[tiers[0]] / tiers[0]) * credits;
  if (credits >= tiers[tiers.length - 1]) return priceTable[tiers[tiers.length - 1]];
  for (let i = 0; i < tiers.length - 1; i++) {
    const lo = tiers[i], hi = tiers[i + 1];
    if (credits >= lo && credits <= hi) {
      const ratio = (credits - lo) / (hi - lo);
      return priceTable[lo] + ratio * (priceTable[hi] - priceTable[lo]);
    }
  }
  return priceTable[tiers[tiers.length - 1]];
}

async function fetchPricing(): Promise<PricingData> {
  try {
    const { data, error } = await supabase.functions.invoke("get-pricing");
    if (error) throw error;
    if (data && data.prices) {
      const prices: Record<number, number> = {};
      for (const [k, v] of Object.entries(data.prices)) {
        prices[Number(k)] = Number(v);
      }
      const minCredits =
        typeof data.min_credits === "number" && data.min_credits >= 1
          ? data.min_credits
          : DEFAULT_MIN_CREDITS;
      return { prices, minCredits };
    }
  } catch (err) {
    console.warn("Failed to fetch dynamic pricing, using fallback:", err);
  }
  let minCredits = DEFAULT_MIN_CREDITS;
  try {
    const { data: rows } = await supabase
      .from("api_config")
      .select("key_name, key_value")
      .in("key_name", ["min_credits"]);
    if (rows) {
      for (const row of rows) {
        const val = Number(row.key_value);
        if (row.key_name === "min_credits" && Number.isFinite(val) && val >= 1) minCredits = val;
      }
    }
  } catch {}
  return { prices: FALLBACK_FINAL_PRICES, minCredits };
}

export function usePricing() {
  const { data, isLoading } = useQuery({
    queryKey: ["dynamic-pricing"],
    queryFn: fetchPricing,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60 * 1000,
  });

  const priceTable = data?.prices ?? FALLBACK_FINAL_PRICES;
  const minCredits = data?.minCredits ?? DEFAULT_MIN_CREDITS;

  const calculateTotal = (credits: number) =>
    Math.ceil(interpolateFinalPrice(credits, priceTable));

  const getDetails = (credits: number) => {
    const total = calculateTotal(credits);
    const lovablePrice = getLovableOfficialPrice(credits);
    const savings = Math.max(0, lovablePrice - total);
    const discountPct =
      lovablePrice > 0 ? Math.round((1 - total / lovablePrice) * 100) : 0;
    return { total, lovablePrice, savings, discountPct, apiCost: total };
  };

  return { margin: 0, priceTable, minCredits, isLoading, calculateTotal, getDetails };
}
