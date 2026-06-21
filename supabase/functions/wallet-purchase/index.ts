import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { simulateCreateOrder } from "../_shared/simulate-provisioning.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function respond(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// --- Rate Limiting Helper ---
async function checkRateLimit(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  action: string,
  windowSeconds: number,
  maxAttempts: number,
): Promise<boolean> {
  try { await supabase.rpc("cleanup_rate_limits"); } catch {}

  const since = new Date(Date.now() - windowSeconds * 1000).toISOString();

  const { count } = await supabase
    .from("rate_limits")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("action", action)
    .gte("attempted_at", since);

  if ((count ?? 0) >= maxAttempts) return false;

  await supabase.from("rate_limits").insert({
    user_id: userId,
    action,
  });

  return true;
}

const FALLBACK_API_PRICES: Record<number, number> = {
  100: 9.0, 500: 32.31, 1000: 61.11,
  2000: 112.41, 5000: 233.91, 10000: 390.0,
};

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

    // Authenticate user
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    if (!token) return respond({ error: "Unauthorized" }, 401);

    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return respond({ error: "Unauthorized" }, 401);

    // ═══ RATE LIMIT: max 3 wallet purchases per 60 seconds ═══
    const allowed = await checkRateLimit(supabase, user.id, "wallet_purchase", 60, 3);
    if (!allowed) {
      return respond({ error: "Muitas tentativas. Aguarde 1 minuto.", code: "RATE_LIMITED" }, 429);
    }

    // Check reseller status
    const { data: reseller } = await supabase
      .from("resellers")
      .select("status, margin_pct")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (!reseller) return respond({ error: "Not an active reseller" }, 403);

    const body = await req.json();
    const credits = Math.trunc(Number(body.credits));
    if (!Number.isFinite(credits) || credits < 10 || credits > 50000 || credits % 10 !== 0) {
      return respond({ error: "Credits must be between 10 and 50000, in multiples of 10" }, 400);
    }

    // Calculate reseller price (API cost + reseller margin)
    const resellerMargin = reseller.margin_pct ?? 12;

    let priceTable = FALLBACK_API_PRICES;
    const { data: cacheRow } = await supabase
      .from("pricing_cache")
      .select("prices")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (cacheRow?.prices && typeof cacheRow.prices === "object") {
      const parsed: Record<number, number> = {};
      for (const [k, v] of Object.entries(cacheRow.prices as Record<string, number>)) {
        parsed[Number(k)] = Number(v);
      }
      if (Object.keys(parsed).length > 0) priceTable = parsed;
    }

    const apiCost = interpolateApiCost(credits, priceTable);
    const totalPrice = Math.ceil(apiCost * (1 + resellerMargin / 100));

    // Create order first
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        credits,
        price: totalPrice,
        status: "pending_payment",
        order_type: "credit_purchase",
      })
      .select("id")
      .single();

    if (orderErr || !order) {
      console.error("Order creation failed:", orderErr);
      return respond({ error: "Failed to create order" }, 500);
    }

    // Debit wallet atomically
    const { data: debited } = await supabase.rpc("debit_wallet", {
      _user_id: user.id,
      _amount: totalPrice,
      _description: `Compra de ${credits} créditos`,
      _order_id: order.id,
    });

    if (!debited) {
      await supabase.from("orders").update({ status: "failed" }).eq("id", order.id);

      // ═══ RATE LIMIT: Track failed balance attempts separately (3 fails = 5min cooldown) ═══
      const failAllowed = await checkRateLimit(supabase, user.id, "wallet_fail", 300, 3);
      if (!failAllowed) {
        return respond({
          error: "Muitas tentativas sem saldo. Aguarde 5 minutos.",
          code: "COOLDOWN",
        }, 429);
      }

      return respond({ error: "Insufficient balance", code: "INSUFFICIENT_BALANCE" }, 400);
    }

    // Mark as paid after successful debit
    await supabase.from("orders").update({ status: "paid" }).eq("id", order.id);

    // Provision credits locally (no external API)
    const simResult = simulateCreateOrder(credits);
    const updatePayload: Record<string, unknown> = {
      status: "provisioning",
      order_id_lovable: String(simResult.order_id),
      master_email: simResult.master_email,
    };
    await supabase.from("orders").update(updatePayload).eq("id", order.id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("wallet_balance")
      .eq("id", user.id)
      .single();

    return respond({
      ok: true,
      order_id: order.id,
      new_balance: profile?.wallet_balance ?? 0,
    });
  } catch (err) {
    console.error("wallet-purchase error:", err);
    return respond({ error: "Internal server error" }, 500);
  }
});
