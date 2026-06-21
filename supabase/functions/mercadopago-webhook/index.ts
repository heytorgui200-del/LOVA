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

async function refundPayment(mpPaymentId: string): Promise<boolean> {
  const mpToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
  if (!mpToken || mpPaymentId.startsWith("MOCK")) return false;

  try {
    const res = await fetch(
      `https://api.mercadopago.com/v1/payments/${mpPaymentId}/refunds`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${mpToken}`,
          "Content-Type": "application/json",
        },
      },
    );
    const data = await res.json();
    console.log(`Refund response for ${mpPaymentId}:`, JSON.stringify(data).slice(0, 300));
    return res.ok || res.status === 201;
  } catch (err) {
    console.error(`Refund error for ${mpPaymentId}:`, err);
    return false;
  }
}

async function provisionCredits(
  supabase: ReturnType<typeof createClient>,
  orderId: string,
  credits: number,
  _mpPaymentId: string,
) {
  const simResult = simulateCreateOrder(credits);

  const updatePayload: Record<string, unknown> = {
    status: "provisioning",
    order_id_lovable: String(simResult.order_id),
    master_email: simResult.master_email,
  };

  await supabase
    .from("orders")
    .update(updatePayload)
    .eq("id", orderId);

  console.log(`✅ Webhook: Local provisioning for ${orderId}, fake_order=${simResult.order_id}, email=${simResult.master_email}`);
  return true;
}

// --- Webhook Signature Verification (HMAC-SHA256) ---
async function verifyWebhookSignature(req: Request, url: URL): Promise<boolean> {
  const secret = Deno.env.get("MERCADOPAGO_WEBHOOK_SECRET");
  if (!secret) {
    console.error("MERCADOPAGO_WEBHOOK_SECRET not configured — rejecting webhook");
    return false;
  }

  const xSignature = req.headers.get("x-signature");
  const xRequestId = req.headers.get("x-request-id");
  if (!xSignature || !xRequestId) {
    console.error("Missing x-signature or x-request-id headers");
    return false;
  }

  // Parse x-signature: "ts=TIMESTAMP,v1=HASH"
  const parts: Record<string, string> = {};
  for (const part of xSignature.split(",")) {
    const [key, ...valueParts] = part.split("=");
    parts[key.trim()] = valueParts.join("=").trim();
  }

  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) {
    console.error("Invalid x-signature format");
    return false;
  }

  // Reject timestamps older than 5 minutes (replay protection)
  const signatureAge = Math.abs(Date.now() - Number(ts) * 1000);
  if (signatureAge > 5 * 60 * 1000) {
    console.error("Webhook signature too old:", signatureAge, "ms");
    return false;
  }

  // Build the signed string per MercadoPago docs
  const dataId = url.searchParams.get("data.id") || url.searchParams.get("id") || "";
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

  // HMAC-SHA256
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(manifest));
  const computed = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, "0")).join("");

  if (computed !== v1) {
    console.error("HMAC mismatch — possible forged webhook");
    return false;
  }

  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);

    // --- Verify webhook signature (BLOCKING — reject forged requests) ---
    const signatureValid = await verifyWebhookSignature(req, url);
    if (!signatureValid) {
      console.error("🚫 FRAUD ATTEMPT: Webhook signature verification FAILED — rejecting request");
      return respond({ error: "Invalid signature" }, 403);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const queryType = url.searchParams.get("type") || url.searchParams.get("topic");
    const queryId = url.searchParams.get("data.id") || url.searchParams.get("id");

    let type = queryType;
    let paymentId = queryId;

    if (!type || !paymentId) {
      try {
        const body = await req.json();
        type = body.type || body.topic || type;
        paymentId = body.data?.id || body.id || paymentId;
        console.log("Webhook body:", JSON.stringify(body));
      } catch {
        // No JSON body
      }
    }

    console.log(`Webhook received: type=${type}, paymentId=${paymentId}`);

    if (type !== "payment" || !paymentId) {
      return respond({ ok: true, message: "ignored" });
    }

    // Sanitize paymentId — only allow numeric IDs
    if (!/^\d+$/.test(String(paymentId))) {
      console.error("Invalid payment ID format:", paymentId);
      return respond({ error: "Invalid payment ID" }, 400);
    }

    // Verify payment with Mercado Pago
    const mpToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!mpToken) {
      console.error("MERCADOPAGO_ACCESS_TOKEN not set");
      return respond({ error: "Server config error" }, 500);
    }

    const mpRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      { headers: { Authorization: `Bearer ${mpToken}` } },
    );
    const mpData = await mpRes.json();

    console.log(`MP payment ${paymentId} status: ${mpData.status}, external_reference: ${mpData.external_reference}`);

    if (mpData.status !== "approved") {
      return respond({ ok: true, message: "not_approved", status: mpData.status });
    }

    // Try to find order by external_reference (our local UUID) first
    let localOrderId: string | null = mpData.external_reference || null;

    // Find payment in our DB
    const { data: payment, error: payErr } = await supabase
      .from("payments")
      .select("*")
      .eq("mercadopago_payment_id", String(paymentId))
      .limit(1)
      .single();

    if (payErr || !payment) {
      if (localOrderId) {
        const { data: orderCheck } = await supabase
          .from("orders")
          .select("id, status")
          .eq("id", localOrderId)
          .single();
        
        if (orderCheck && (orderCheck.status === "completed" || orderCheck.status === "provisioning")) {
          return respond({ ok: true, message: "already_processed" });
        }
      }
      console.error("Payment not found for MP ID:", paymentId);
      return respond({ ok: true, message: "payment_not_found" });
    }

    localOrderId = payment.order_id;

    // ═══════════ RACE CONDITION FIX: Atomic idempotency check ═══════════
    // Use atomic UPDATE with WHERE condition to prevent double-processing.
    // Only ONE concurrent request can successfully transition pending→approved.
    const { data: updatedPayment, error: updateErr } = await supabase
      .from("payments")
      .update({ status: "approved" })
      .eq("id", payment.id)
      .eq("status", "pending") // Only update if still pending (atomic guard)
      .select("id")
      .maybeSingle();

    if (updateErr || !updatedPayment) {
      // Another webhook already processed this payment
      console.log(`⚡ Idempotency guard: payment ${payment.id} already processed, skipping`);
      return respond({ ok: true, message: "already_processed" });
    }

    // Atomic order status transition: only if still pending_payment or paid
    const { data: updatedOrder, error: orderUpdateErr } = await supabase
      .from("orders")
      .update({ status: "paid" })
      .eq("id", localOrderId)
      .in("status", ["pending_payment", "pending"]) // Only transition from initial states
      .select("id, credits")
      .maybeSingle();

    if (orderUpdateErr || !updatedOrder) {
      console.log(`⚡ Idempotency guard: order ${localOrderId} already advanced past pending`);
      return respond({ ok: true, message: "already_processed" });
    }

    // Check if this is a wallet top-up order
    const { data: orderDetails } = await supabase
      .from("orders")
      .select("order_type, user_id")
      .eq("id", localOrderId)
      .single();

    if (orderDetails?.order_type === "wallet_topup" && orderDetails.user_id) {
      // Credit the user's wallet
      const amount = updatedOrder.credits; // For topups, credits field stores the BRL amount
      const { data: credited } = await supabase.rpc("credit_wallet", {
        _user_id: orderDetails.user_id,
        _amount: amount,
        _description: `Recarga via PIX`,
        _order_id: localOrderId,
      });

      await supabase
        .from("orders")
        .update({ status: credited ? "completed" : "failed" })
        .eq("id", localOrderId);

      console.log(`💰 Wallet top-up ${credited ? "succeeded" : "failed"} for order ${localOrderId}, amount=${amount}`);
      return respond({ ok: true, message: credited ? "wallet_topped_up" : "wallet_topup_failed", order_id: localOrderId });
    }

    // Regular credit purchase — provision via reseller API
    const provisioned = await provisionCredits(
      supabase,
      localOrderId,
      updatedOrder.credits,
      String(paymentId),
    );

    return respond({
      ok: true,
      message: provisioned ? "credits_provisioning" : "provision_failed",
      order_id: localOrderId,
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return respond({ error: "Internal server error" }, 500);
  }
});
