import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { simulateCheckStatus, simulateGetEvents, simulateCreateOrder } from "../_shared/simulate-provisioning.ts";

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

function extractEmailFromEvents(events: Array<{ event: string; message?: string }>): string | null {
  for (const ev of events) {
    if (ev.event === "action" && ev.message) {
      const match = ev.message.match(/[\w.+-]+@[\w.-]+\.\w+/);
      if (match) return match[0];
    }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { order_id } = await req.json();
    if (!order_id) return respond({ error: "Missing order_id" }, 400);

    // ═══ AUTHENTICATION (optional for guest orders) ═══
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    
    let requestUserId: string | null = null;
    if (token) {
      try {
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) requestUserId = user.id;
      } catch {
        // Invalid token — treat as guest
      }
    }

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (orderErr || !order) {
      return respond({ ok: false, status: "not_found" }, 404);
    }

    // ═══ OWNERSHIP CHECK ═══
    if (order.user_id) {
      // Order belongs to a user — require matching auth
      if (order.user_id !== requestUserId) {
        // Allow admins
        if (requestUserId) {
          const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: requestUserId, _role: "admin" });
          if (!isAdmin) {
            return respond({ ok: false, status: "not_found" }, 404);
          }
        } else {
          return respond({ ok: false, status: "not_found" }, 404);
        }
      }
    }
    // Guest orders (user_id is null) — accessible by anyone with the order_id (acts as a secret token)

    // ─── If order has external reseller order, check real-time progress ───
    if (order.order_id_lovable && !["provision_failed", "refunded", "cancelled"].includes(order.status)) {
      const statusData = simulateCheckStatus(
        order_id,
        order.created_at,
        order.master_email,
        order.credits,
      );

      const { events: rawEvents } = simulateGetEvents(
        order_id,
        order.master_email,
        order.created_at,
        order.credits,
      );

      const events = rawEvents.map((e) => ({
        ...e,
        timestamp: e.created_at,
      }));
      const actionEvents = events.filter((e: { event: string }) => e.event === "action");
      const creditEvents = events.filter((e: { event: string }) => e.event === "credit");
      const creditsDeposited = creditEvents.length * 10;

      // Resolve master_email: DB > extract from event text
      const resolvedEmail = order.master_email || extractEmailFromEvents(events);

      // Save master_email if resolved and not yet saved
      if (resolvedEmail && !order.master_email) {
        await supabase
          .from("orders")
          .update({ master_email: resolvedEmail })
          .eq("id", order_id);
      }

      const resellerStatus = statusData?.status || "pending";

      // Build enriched response fields
      const enriched = {
        events,
        credits_deposited: creditsDeposited,
        credits_total: statusData?.credits_requested || order.credits,
        action_required: actionEvents.length > 0,
        latest_action_message: actionEvents.length > 0 ? actionEvents[actionEvents.length - 1].message : null,
        master_email: resolvedEmail || null,
      };

      if (resellerStatus === "completed") {
        await supabase
          .from("orders")
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("id", order_id);

        return respond({
          ok: true, status: "completed", phase: "done",
          ...enriched,
          credits_deposited: statusData?.credits_delivered || order.credits,
        });
      }

      if (resellerStatus === "partial") {
        await supabase
          .from("orders")
          .update({ status: "partial", completed_at: new Date().toISOString() })
          .eq("id", order_id);

        return respond({
          ok: true, status: "partial", phase: "done",
          ...enriched,
          credits_deposited: statusData?.credits_delivered || creditsDeposited,
        });
      }

      if (resellerStatus === "error" || resellerStatus === "refunded") {
        await supabase
          .from("orders")
          .update({ status: resellerStatus === "refunded" ? "refunded" : "provision_failed" })
          .eq("id", order_id);

        return respond({
          ok: true, status: resellerStatus, phase: "error",
          ...enriched,
        });
      }

      return respond({
        ok: true, status: "provisioning", phase: "syncing",
        ...enriched,
      });
    }

    // ─── Terminal states (read-only) ───
    if (order.status === "completed") {
      return respond({
        ok: true, status: "completed", phase: "done",
        credits_deposited: order.credits, credits_total: order.credits,
        events: [], action_required: false,
      });
    }

    if (order.status === "provision_failed" || order.status === "refund_pending") {
      return respond({ ok: true, status: order.status, phase: "error", events: [], action_required: false });
    }

    if (order.status === "refunded" || order.status === "cancelled") {
      return respond({ ok: true, status: order.status, phase: "error", events: [], action_required: false });
    }

    if (order.status === "provisioning") {
      return respond({
        ok: true, status: "provisioning", phase: "syncing",
        credits_deposited: 0, credits_total: order.credits,
        events: [], action_required: false,
        master_email: order.master_email || null,
      });
    }

    if (order.status === "paid") {
      return respond({
        ok: true, status: "paid", phase: "identified",
        api_order_id: order.order_id_lovable || null,
        events: [], action_required: false,
        master_email: order.master_email || null,
      });
    }

    // ─── Check payment status (read-only — NO provisioning) ───
    const { data: payment, error: payErr } = await supabase
      .from("payments")
      .select("*")
      .eq("order_id", order_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (payErr || !payment) {
      return respond({ ok: false, status: "not_found" }, 404);
    }

    if (payment.status === "approved") {
      return respond({
        ok: true, status: "approved", phase: "identified",
        api_order_id: order.order_id_lovable || null,
        events: [], action_required: false,
      });
    }

    // Check Mercado Pago for real payments
    const mpToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");

    if (mpToken && payment.mercadopago_payment_id && !payment.mercadopago_payment_id.startsWith("MOCK")) {
      const mpRes = await fetch(
        `https://api.mercadopago.com/v1/payments/${payment.mercadopago_payment_id}`,
        { headers: { Authorization: `Bearer ${mpToken}` } },
      );
      const mpData = await mpRes.json();

    if (mpData.status === "approved") {
        // Atomic transition: only one poller wins
        const { data: updatedPay } = await supabase
          .from("payments")
          .update({ status: "approved" })
          .eq("id", payment.id)
          .eq("status", "pending")
          .select("id")
          .maybeSingle();

        if (updatedPay) {
          await supabase
            .from("orders")
            .update({ status: "paid" })
            .eq("id", order_id)
            .in("status", ["pending_payment", "pending"]);

          // ─── Trigger provisioning (fallback for when webhook fails) ───
          if (order.order_type !== "wallet_topup") {
            const simResult = simulateCreateOrder(order.credits);
            const updatePayload: Record<string, unknown> = {
              status: "provisioning",
              order_id_lovable: String(simResult.order_id),
              master_email: simResult.master_email,
            };
            await supabase.from("orders").update(updatePayload).eq("id", order_id);
            console.log(`✅ Fallback local provisioning triggered for order ${order_id}`);
          } else if (order.order_type === "wallet_topup" && order.user_id) {
            // Wallet top-up
            const { data: credited } = await supabase.rpc("credit_wallet", {
              _user_id: order.user_id, _amount: order.credits,
              _description: "Recarga via PIX", _order_id: order_id,
            });
            await supabase.from("orders").update({ status: credited ? "completed" : "failed" }).eq("id", order_id);
          }
        }

        return respond({
          ok: true, status: "approved", phase: "identified",
          api_order_id: order.order_id_lovable || null,
          events: [], action_required: false,
        });
      }

      if (mpData.status === "cancelled" || mpData.status === "rejected") {
        await supabase.from("payments").update({ status: "cancelled" }).eq("id", payment.id);
        await supabase.from("orders").update({ status: "cancelled" }).eq("id", order_id);
        return respond({ ok: true, status: mpData.status, phase: "error", events: [], action_required: false });
      }

      return respond({ ok: true, status: mpData.status || "pending", phase: "waiting", events: [], action_required: false });
    }

    return respond({ ok: true, status: "pending", phase: "waiting", events: [], action_required: false });
  } catch (err) {
    console.error("check-pix-status error:", err);
    return respond({ error: "Internal server error" }, 500);
  }
});
