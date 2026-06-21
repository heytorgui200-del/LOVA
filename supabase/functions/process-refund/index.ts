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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Authenticate & verify admin
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

    const body = await req.json();
    const { refund_request_id, action } = body;

    if (!refund_request_id || !["approve", "reject"].includes(action)) {
      return respond({ error: "Invalid request. Need refund_request_id and action (approve/reject)" }, 400);
    }

    // Get refund request
    const { data: refundReq, error: fetchErr } = await supabase
      .from("refund_requests")
      .select("*")
      .eq("id", refund_request_id)
      .eq("status", "pending")
      .single();

    if (fetchErr || !refundReq) {
      return respond({ error: "Refund request not found or already processed" }, 404);
    }

    if (action === "reject") {
      await supabase
        .from("refund_requests")
        .update({ status: "rejected", reviewed_at: new Date().toISOString(), reviewed_by: user.id })
        .eq("id", refund_request_id);

      await supabase
        .from("orders")
        .update({ status: "refund_rejected" })
        .eq("id", refundReq.order_id);

      return respond({ ok: true, message: "Refund rejected" });
    }

    // action === "approve"
    let refundSuccess = false;

    if (refundReq.refund_type === "wallet") {
      const { data: credited } = await supabase.rpc("credit_wallet", {
        _user_id: refundReq.user_id,
        _amount: refundReq.amount,
        _description: `Estorno aprovado - pedido ${refundReq.order_id}`,
        _order_id: refundReq.order_id,
      });
      refundSuccess = !!credited;
    } else if (refundReq.refund_type === "mercadopago") {
      const mpToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
      if (!mpToken || !refundReq.mercadopago_payment_id) {
        return respond({ error: "Cannot process MP refund — missing config or payment ID" }, 500);
      }

      try {
        const res = await fetch(
          `https://api.mercadopago.com/v1/payments/${refundReq.mercadopago_payment_id}/refunds`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${mpToken}`,
              "Content-Type": "application/json",
            },
          },
        );
        refundSuccess = res.ok || res.status === 201;
      } catch (err) {
        console.error("MP refund error:", err);
        return respond({ error: "Mercado Pago refund failed" }, 500);
      }
    }

    if (refundSuccess) {
      await supabase
        .from("refund_requests")
        .update({ status: "approved", reviewed_at: new Date().toISOString(), reviewed_by: user.id })
        .eq("id", refund_request_id);

      await supabase
        .from("orders")
        .update({ status: "refunded" })
        .eq("id", refundReq.order_id);

      if (refundReq.refund_type === "mercadopago") {
        await supabase
          .from("payments")
          .update({ status: "refunded" })
          .eq("order_id", refundReq.order_id);
      }

      return respond({ ok: true, message: "Refund approved and processed" });
    }

    return respond({ error: "Refund processing failed" }, 500);
  } catch (err) {
    console.error("process-refund error:", err);
    return respond({ error: "Internal server error" }, 500);
  }
});
