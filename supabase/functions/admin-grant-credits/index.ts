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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Authenticate
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    if (!token) return respond({ error: "Unauthorized" }, 401);

    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return respond({ error: "Unauthorized" }, 401);

    // Verify admin role
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (!isAdmin) return respond({ error: "Forbidden" }, 403);

    const body = await req.json();
    const credits = Math.trunc(Number(body.credits));
    if (!Number.isFinite(credits) || credits < 10 || credits > 100000 || credits % 10 !== 0) {
      return respond({ error: "Credits must be between 10 and 100000, in multiples of 10" }, 400);
    }

    const targetEmail = body.email || null;

    // Create order
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        credits,
        price: 0,
        status: "provisioning",
        order_type: "admin_grant",
      })
      .select("id")
      .single();

    if (orderErr || !order) {
      console.error("Order creation failed:", orderErr);
      return respond({ error: "Failed to create order" }, 500);
    }

    // Simulate provisioning
    const simResult = simulateCreateOrder(credits);

    const updatePayload: Record<string, unknown> = {
      order_id_lovable: String(simResult.order_id),
      master_email: targetEmail || simResult.master_email,
    };

    await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", order.id);

    console.log(`✅ Admin grant: ${credits} credits for order ${order.id}, email=${updatePayload.master_email}`);

    return respond({
      ok: true,
      order_id: order.id,
      credits,
      master_email: updatePayload.master_email,
    });
  } catch (err) {
    console.error("admin-grant-credits error:", err);
    return respond({ error: "Internal server error" }, 500);
  }
});
