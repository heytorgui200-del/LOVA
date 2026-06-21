import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Local fallback prices — used only if cache AND sync both fail
const FALLBACK_API_PRICES: Record<number, number> = {
  100: 9.0, 500: 32.31, 1000: 61.11,
  2000: 112.41, 5000: 233.91, 10000: 390.0,
};

const CACHE_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

function respond(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function interpolateApiCost(credits: number, priceTable: Record<number, number>): number {
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Read from pricing_cache
    let apiPrices: Record<string, number> = {};
    let cacheAge = Infinity;

    const { data: cached } = await supabase
      .from("pricing_cache")
      .select("prices, updated_at")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cached && cached.prices && typeof cached.prices === "object") {
      const p = cached.prices as Record<string, number>;
      if (Object.keys(p).length > 0) {
        apiPrices = p;
        cacheAge = Date.now() - new Date(cached.updated_at).getTime();
      }
    }

    // Cache age logged for monitoring (auto-refresh removed — admin manually syncs)
    if (cacheAge > CACHE_MAX_AGE_MS) {
      console.warn(`Pricing cache is ${Math.round(cacheAge / 60000)}min old. Admin should sync manually.`);
    }

    // Fallback if cache is still empty
    if (Object.keys(apiPrices).length === 0) {
      apiPrices = FALLBACK_API_PRICES as unknown as Record<string, number>;
    }

    const margin = await getMargin(supabase);
    const minCredits = await getMinCredits(supabase);

    // ═══ CALCULATE FINAL PRICES — NEVER EXPOSE RAW MARGIN ═══
    const finalPrices: Record<string, number> = {};
    const priceTableNum: Record<number, number> = {};
    for (const [k, v] of Object.entries(apiPrices)) {
      priceTableNum[Number(k)] = Number(v);
    }
    for (const key of Object.keys(apiPrices)) {
      const credits = Number(key);
      const apiCost = interpolateApiCost(credits, priceTableNum);
      finalPrices[key] = Math.ceil(apiCost * (1 + margin / 100));
    }

    return respond({ prices: finalPrices, min_credits: minCredits });
  } catch (err) {
    console.error("get-pricing error:", err);
    return respond({ error: "Internal server error" }, 500);
  }
});

async function getMargin(supabase: any): Promise<number> {
  const { data } = await supabase
    .from("api_config")
    .select("key_value")
    .eq("key_name", "profit_margin")
    .maybeSingle();
  if (data) {
    const val = Number(data.key_value);
    if (Number.isFinite(val) && val >= 0) return val;
  }
  return 35;
}

async function getMinCredits(supabase: any): Promise<number> {
  const { data } = await supabase
    .from("api_config")
    .select("key_value")
    .eq("key_name", "min_credits")
    .maybeSingle();
  if (data) {
    const val = Number(data.key_value);
    if (Number.isFinite(val) && val >= 1) return val;
  }
  return 10;
}
