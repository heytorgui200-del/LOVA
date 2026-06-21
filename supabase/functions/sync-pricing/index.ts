import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CREDIT_TIERS = [100, 500, 1000, 2000, 5000, 10000];

function respond(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // ═══ AUTHENTICATION MANDATORY ═══
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    if (!token) return respond({ error: "Unauthorized" }, 401);

    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return respond({ error: "Unauthorized" }, 401);

    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (!isAdmin) return respond({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const { cost_per_credit, prices: manualPrices } = body as {
      cost_per_credit?: number;
      prices?: Record<string, number>;
    };

    let normalized: Record<string, number> = {};

    if (typeof cost_per_credit === "number" && cost_per_credit > 0) {
      // ═══ UNIT COST MODE: generate all tiers automatically ═══
      for (const tier of CREDIT_TIERS) {
        normalized[String(tier)] = Math.round(tier * cost_per_credit * 100) / 100;
      }

      // Save cost_per_credit to api_config for persistence
      await supabase.from("api_config").upsert(
        { key_name: "cost_per_credit", key_value: String(cost_per_credit), updated_at: new Date().toISOString() },
        { onConflict: "key_name" }
      );
    } else if (manualPrices && typeof manualPrices === "object" && Object.keys(manualPrices).length > 0) {
      // ═══ MANUAL MODE: admin provided prices directly (legacy) ═══
      for (const [k, v] of Object.entries(manualPrices)) {
        const numKey = Number(k);
        const numVal = Number(v);
        if (isNaN(numKey) || isNaN(numVal) || numKey <= 0 || numVal < 0) continue;
        normalized[String(numKey)] = numVal;
      }
    } else {
      return respond({
        ok: false,
        error: "Forneça cost_per_credit ou prices.",
      }, 400);
    }

    if (Object.keys(normalized).length === 0) {
      return respond({ ok: false, error: "No valid price entries" }, 400);
    }

    // Upsert into pricing_cache
    await supabase.from("pricing_cache").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    const { error: insertErr } = await supabase.from("pricing_cache").insert({
      prices: normalized,
      updated_at: new Date().toISOString(),
    });

    if (insertErr) {
      console.error("Failed to save pricing cache:", insertErr);
      return respond({ error: "Failed to save pricing cache" }, 500);
    }

    return respond({
      ok: true,
      prices: normalized,
      source: cost_per_credit ? "unit_cost" : "manual",
      synced_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("sync-pricing error:", err);
    return respond({ error: "Internal server error" }, 500);
  }
});
