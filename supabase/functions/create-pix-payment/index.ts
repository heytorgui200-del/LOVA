import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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
  userId: string | null,
  ip: string,
  action: string,
  windowSeconds: number,
  maxAttempts: number,
): Promise<boolean> {
  // Cleanup old entries
  try { await supabase.rpc("cleanup_rate_limits"); } catch { /* ignore */ }

  const since = new Date(Date.now() - windowSeconds * 1000).toISOString();

  // Check by user_id first, then by IP
  if (userId) {
    const { count } = await supabase
      .from("rate_limits")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("action", action)
      .gte("attempted_at", since);
    if ((count ?? 0) >= maxAttempts) return false;
  }

  // Also check by IP
  if (ip) {
    const { count } = await supabase
      .from("rate_limits")
      .select("id", { count: "exact", head: true })
      .eq("ip_address", ip)
      .eq("action", action)
      .gte("attempted_at", since);
    if ((count ?? 0) >= maxAttempts) return false;
  }

  // Record attempt
  await supabase.from("rate_limits").insert({
    user_id: userId,
    action,
    ip_address: ip,
  });

  return true;
}

// Fallback API prices (keep in sync with src/lib/pricing.ts)
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

function calcTotal(credits: number, marginPct: number, priceTable: Record<number, number>): number {
  return Math.ceil(interpolateApiCost(credits, priceTable) * (1 + marginPct / 100));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Extract client IP
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") || "unknown";

    // ═══ AUTHENTICATION (optional for guest PIX) ═══
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    
    let finalUserId: string | null = null;
    let userEmail = "";

    if (token) {
      try {
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          finalUserId = user.id;
          userEmail = user.email || "";
        }
      } catch {
        // Token invalid — treat as guest
      }
    }

    // ═══ RATE LIMIT: stricter for unauthenticated (1 per 60s) vs authenticated (3 per 30s) ═══
    const rlWindow = finalUserId ? 30 : 60;
    const rlMax = finalUserId ? 3 : 1;
    const allowed = await checkRateLimit(supabase, finalUserId, clientIp, "create_pix", rlWindow, rlMax);
    if (!allowed) {
      return respond({ error: "Muitas tentativas. Aguarde e tente novamente." }, 429);
    }

    const rawBody = await req.text();
    if (!rawBody) return respond({ error: "Empty body" }, 400);
    
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return respond({ error: "Invalid JSON body" }, 400);
    }

    const amount = Number(body.amount);
    const credits = Math.trunc(Number(body.credits));
    const email = typeof body.email === "string" ? body.email.trim() : userEmail;
    const cpf = typeof body.cpf === "string" ? body.cpf.replace(/\D/g, "") : "";
    const orderType = body.order_type === "wallet_topup" ? "wallet_topup" : "credit_purchase";

    if (!Number.isFinite(amount) || amount <= 0) {
      return respond({ error: "Invalid amount" }, 400);
    }

    // Fetch min_credits from api_config
    let minCredits = 10;
    const { data: minRow } = await supabase
      .from("api_config")
      .select("key_value")
      .eq("key_name", "min_credits")
      .maybeSingle();
    if (minRow) {
      const val = Number(minRow.key_value);
      if (Number.isFinite(val) && val >= 1) minCredits = val;
    }

    if (orderType === "credit_purchase") {
      if (!Number.isFinite(credits) || credits < minCredits || credits > 10000) {
        return respond({ error: `Créditos devem ser entre ${minCredits} e 10000` }, 400);
      }
    }

    // Fetch profit margin from api_config
    let marginPct = 35;
    const { data: marginRow } = await supabase
      .from("api_config")
      .select("key_value")
      .eq("key_name", "profit_margin")
      .maybeSingle();
    if (marginRow) {
      const val = Number(marginRow.key_value);
      if (Number.isFinite(val) && val >= 0) marginPct = val;
    }

    // Read pricing from local DB cache — NO upstream API calls
    let priceTable = FALLBACK_API_PRICES;
    try {
      const { data: cached } = await supabase
        .from("pricing_cache")
        .select("prices")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cached?.prices && typeof cached.prices === "object") {
        const parsed: Record<number, number> = {};
        for (const [k, v] of Object.entries(cached.prices as Record<string, number>)) {
          parsed[Number(k)] = Number(v);
        }
        if (Object.keys(parsed).length > 0) priceTable = parsed;
      }
    } catch (e) {
      console.warn("Failed to read pricing cache, using fallback:", e);
    }

    // Server-side price validation (±2 BRL tolerance) — skip for wallet topups
    if (orderType === "credit_purchase") {
      const expectedAmount = calcTotal(credits, marginPct, priceTable);
      if (Math.abs(amount - expectedAmount) > 1) {
        console.error("Price mismatch", { amount, expectedAmount, credits, marginPct });
        return respond({ error: "Price mismatch. Please refresh and try again." }, 400);
      }
    }

    // 1. Create local order (pending_payment)
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: finalUserId,
        credits: orderType === "wallet_topup" ? amount : credits,
        price: amount,
        status: "pending_payment",
        order_type: orderType,
      })
      .select("id")
      .single();

    if (orderError) {
      console.error("Order insert error:", orderError);
      return respond({ error: "Failed to create order" }, 500);
    }

    const orderId = order.id;

    // 2. Create PIX payment via Mercado Pago (or mock)
    const mpToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    const webhookUrl = `${supabaseUrl}/functions/v1/mercadopago-webhook`;
    let pixData;

    if (mpToken) {
      try {
        const pixExpiration = new Date(Date.now() + 30 * 60 * 1000).toISOString();

        const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${mpToken}`,
            "Content-Type": "application/json",
            "X-Idempotency-Key": orderId,
          },
          body: JSON.stringify({
            transaction_amount: Number(amount),
            description: `LovaBoost - ${credits} créditos Lovable`,
            payment_method_id: "pix",
            date_of_expiration: pixExpiration,
            notification_url: webhookUrl,
            external_reference: orderId,
            payer: {
              email: email || "cliente@lovaboost.com",
              first_name: "Cliente",
              last_name: "LovaBoost",
              ...(cpf ? { identification: { type: "CPF", number: cpf } } : {}),
            },
          }),
        });

        const mpRawText = await mpRes.text();
        let mpData;
        try { mpData = JSON.parse(mpRawText); } catch { mpData = null; }

        if (mpRes.ok && mpData && typeof mpData === "object" && "id" in mpData) {
          const { error: paymentError } = await supabase.from("payments").insert({
            order_id: orderId,
            user_id: finalUserId,
            amount,
            mercadopago_payment_id: String(mpData.id),
            status: "pending",
          });

          if (paymentError) {
            console.error("Payment insert error:", paymentError);
            return respond({ error: "Failed to record payment" }, 500);
          }

          pixData = {
            payment_id: String(mpData.id),
            qr_code: mpData.point_of_interaction?.transaction_data?.qr_code || "",
            qr_code_base64: mpData.point_of_interaction?.transaction_data?.qr_code_base64 || "",
            ticket_url: mpData.point_of_interaction?.transaction_data?.ticket_url || "",
            expires_at: mpData.date_of_expiration || pixExpiration,
          };
        } else {
          console.error("MP payment creation failed:", { status: mpRes.status, body: mpRawText?.slice(0, 300) });
          // Cancel the order since payment couldn't be created
          await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId);
          return respond({ error: "Serviço de pagamento indisponível. Tente novamente em alguns minutos." }, 503);
        }
      } catch (fetchErr) {
        console.error("MP fetch error:", fetchErr);
        await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId);
        return respond({ error: "Serviço de pagamento indisponível. Tente novamente em alguns minutos." }, 503);
      }
    } else {
      // No MP token configured — cannot process payments
      console.error("MERCADOPAGO_ACCESS_TOKEN not configured");
      await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId);
      return respond({ error: "Serviço de pagamento não configurado." }, 503);
    }
    return respond({
      ok: true,
      order_id: orderId,
      ...pixData,
    });
  } catch (err) {
    console.error("create-pix-payment error:", err);
    return respond({ error: "Internal server error" }, 500);
  }
});
