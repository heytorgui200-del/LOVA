import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { simulateCheckStatus, simulateGetEvents } from "../_shared/simulate-provisioning.ts";

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

    // ═══ AUTHENTICATION REQUIRED ═══
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    if (!token) return respond({ error: "Unauthorized" }, 401);

    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return respond({ error: "Unauthorized" }, 401);

    const { api_order_id } = await req.json();
    if (!api_order_id) return respond({ error: "Missing api_order_id" }, 400);

    const orderId = Number(api_order_id);
    if (!Number.isFinite(orderId) || orderId <= 0) {
      return respond({ error: "Invalid api_order_id" }, 400);
    }

    // ═══ OWNERSHIP CHECK ═══
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (!isAdmin) {
      // Non-admin: verify they own the order
      const { data: order } = await supabase
        .from("orders")
        .select("user_id")
        .eq("order_id_lovable", String(orderId))
        .maybeSingle();

      if (!order || order.user_id !== user.id) {
        return respond({ error: "Not found" }, 404);
      }
    }

    // Get order details for simulation
    const { data: orderData } = await supabase
      .from("orders")
      .select("id, created_at, master_email, credits")
      .eq("order_id_lovable", String(orderId))
      .maybeSingle();

    if (!orderData) {
      return respond({ error: "Order not found" }, 404);
    }

    const statusResult = simulateCheckStatus(
      String(orderData.id),
      orderData.created_at,
      orderData.master_email,
      orderData.credits,
    );

    const eventsResult = simulateGetEvents(
      String(orderData.id),
      orderData.master_email,
      orderData.created_at,
      orderData.credits,
    );

    return respond({
      status: statusResult.status || "pending",
      credits_requested: statusResult.credits_requested || 0,
      credits_delivered: statusResult.credits_delivered || 0,
      events: eventsResult.events || [],
    });
  } catch (err) {
    console.error("proxy-api-status error:", err);
    return respond({ error: "Internal server error" }, 500);
  }
});
