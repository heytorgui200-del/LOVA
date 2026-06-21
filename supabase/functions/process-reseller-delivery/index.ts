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

function generateToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  let result = "";
  for (let i = 0; i < 16; i++) {
    result += chars[arr[i] % chars.length];
  }
  return result;
}

function addLog(logs: unknown[], message: string, type = "info") {
  logs.push({ message, type, timestamp: new Date().toISOString() });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const { action } = body;

    // ═══ AUTHENTICATION (required for all actions) ═══
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    if (!token) return respond({ error: "Unauthorized" }, 401);

    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return respond({ error: "Unauthorized" }, 401);

    // ═══ ACTION: CREATE LINK AND RESERVE BALANCE ═══
    if (action === "create_link_and_reserve") {
      const { reseller_id, credits, sale_price, profit, margin_mode, slug, client_name, client_phone } = body;

      if (!reseller_id || !credits || !slug) {
        return respond({ error: "Missing required fields" }, 400);
      }

      if (credits < 100 || credits > 50000) {
        return respond({ error: "Credits out of range" }, 400);
      }

      // Get reseller user_id
      const { data: reseller } = await supabase
        .from("resellers")
        .select("user_id, store_name")
        .eq("id", reseller_id)
        .single();

      if (!reseller) return respond({ error: "Reseller not found" }, 404);

      // Verify ownership
      if (reseller.user_id !== user.id) {
        const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
        if (!isAdmin) return respond({ error: "Forbidden" }, 403);
      }

      // ── V4 FIX: Recalculate cost server-side ──
      const { data: pricingRow } = await supabase
        .from("pricing_cache")
        .select("prices")
        .limit(1)
        .maybeSingle();

      let serverCost: number;
      if (pricingRow?.prices) {
        const prices = pricingRow.prices as Record<string, unknown>;
        // pricing_cache.prices is an object keyed by credit amount or a sorted array
        // Try to find exact match or calculate from tiers
        const priceEntry = (prices as Record<string, number>)[String(credits)];
        if (priceEntry && typeof priceEntry === "number") {
          serverCost = priceEntry;
        } else {
          // Fallback: find closest tier or use the provided cost (legacy)
          const amounts = Object.keys(prices).map(Number).filter(n => !isNaN(n)).sort((a, b) => a - b);
          if (amounts.length > 0) {
            // Find the per-credit rate from the closest tier
            let closestAmount = amounts[0];
            for (const amt of amounts) {
              if (amt <= credits) closestAmount = amt;
            }
            const closestPrice = (prices as Record<string, number>)[String(closestAmount)];
            if (closestPrice && typeof closestPrice === "number") {
              const perCredit = closestPrice / closestAmount;
              serverCost = Math.ceil(perCredit * credits * 100) / 100;
            } else {
              return respond({ error: "Pricing unavailable" }, 500);
            }
          } else {
            return respond({ error: "Pricing unavailable" }, 500);
          }
        }
      } else {
        return respond({ error: "Pricing unavailable" }, 500);
      }

      // Recalculate sale_price and profit based on server cost
      const serverSalePrice = sale_price || Math.ceil(serverCost * 1.5);
      const serverProfit = serverSalePrice - serverCost;

      // ── L1 FIX: Check for existing reserved order for same link ──
      // First get link id if exists
      const { data: existingLink } = await supabase
        .from("reseller_links")
        .select("id")
        .eq("reseller_id", reseller_id)
        .eq("slug", slug)
        .maybeSingle();

      if (existingLink) {
        const { data: existingOrder } = await supabase
          .from("reseller_orders")
          .select("id, public_token, status")
          .eq("reseller_link_id", existingLink.id)
          .eq("status", "reserved")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingOrder) {
          // Return existing order instead of double-debiting
          return respond({
            ok: true,
            token: existingOrder.public_token,
            order_id: existingOrder.id,
            status: existingOrder.status,
            duplicate: true,
          });
        }
      }

      // Check balance
      const { data: profile } = await supabase
        .from("profiles")
        .select("wallet_balance")
        .eq("id", reseller.user_id)
        .single();

      if (!profile || profile.wallet_balance < serverCost) {
        return respond({ error: "insufficient_balance", message: "Saldo insuficiente na carteira" }, 400);
      }

      // Debit wallet
      const { data: debited } = await supabase.rpc("debit_wallet", {
        _user_id: reseller.user_id,
        _amount: serverCost,
        _description: `Reserva: ${credits} créditos (link ${slug})`,
      });

      if (!debited) {
        return respond({ error: "debit_failed", message: "Falha ao debitar saldo" }, 500);
      }

      // Upsert link
      const { error: linkErr } = await supabase.from("reseller_links").upsert(
        {
          reseller_id, pack: credits, cost: serverCost, sale_price: serverSalePrice, profit: serverProfit,
          margin_mode: margin_mode || "percent", slug, is_active: true,
          client_name: client_name || null,
          client_phone: client_phone || null,
        },
        { onConflict: "reseller_id,slug" }
      );

      if (linkErr) {
        // Refund on failure
        await supabase.rpc("credit_wallet", {
          _user_id: reseller.user_id,
          _amount: serverCost,
          _description: `Estorno: falha ao criar link (${slug})`,
        });
        return respond({ error: "link_creation_failed" }, 500);
      }

      // Get link id
      const { data: link } = await supabase
        .from("reseller_links")
        .select("id")
        .eq("reseller_id", reseller_id)
        .eq("slug", slug)
        .single();

      // Create order with status "reserved"
      const token = generateToken();
      const logs: unknown[] = [];
      addLog(logs, "Saldo reservado com sucesso", "success");
      addLog(logs, "Link de venda criado", "success");

      const { data: order, error: orderErr } = await supabase
        .from("reseller_orders")
        .insert({
          public_token: token,
          reseller_id,
          reseller_link_id: link?.id || null,
          credits,
          final_price: serverSalePrice,
          cost: serverCost,
          profit: serverProfit,
          status: "reserved",
          delivery_logs: logs,
          client_email: null,
          client_whatsapp: client_phone || null,
          expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        })
        .select("id, public_token, status")
        .single();

      if (orderErr) {
        // Refund on failure
        await supabase.rpc("credit_wallet", {
          _user_id: reseller.user_id,
          _amount: serverCost,
          _description: `Estorno: falha ao criar pedido (${slug})`,
        });
        return respond({ error: "order_creation_failed" }, 500);
      }

      // ── L2 FIX: Fresh balance after debit ──
      const { data: freshProfile } = await supabase
        .from("profiles")
        .select("wallet_balance")
        .eq("id", reseller.user_id)
        .single();

      return respond({
        ok: true,
        token: order.public_token,
        order_id: order.id,
        status: order.status,
        new_balance: freshProfile?.wallet_balance ?? (profile.wallet_balance - serverCost),
      });
    }

    // ═══ ACTION: CREATE ORDER (legacy / public page) ═══
    if (action === "create_order") {
      const { reseller_link_id } = body;
      if (!reseller_link_id) return respond({ error: "Missing reseller_link_id" }, 400);

      const { data: link } = await supabase
        .from("reseller_links")
        .select("id, reseller_id, pack, cost, sale_price, profit, is_active")
        .eq("id", reseller_link_id)
        .eq("is_active", true)
        .maybeSingle();

      if (!link) return respond({ error: "Link not found or inactive" }, 404);

      // Check for existing non-terminal order
      const { data: existing } = await supabase
        .from("reseller_orders")
        .select("id, public_token, status")
        .eq("reseller_link_id", reseller_link_id)
        .in("status", ["pending", "reserved", "tutorial_viewed", "validating", "processing", "ready_to_deliver"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        return respond({ token: existing.public_token, order_id: existing.id, status: existing.status });
      }

      const token = generateToken();
      const logs: unknown[] = [];
      addLog(logs, "Pedido criado com sucesso", "success");

      const { data: order, error } = await supabase
        .from("reseller_orders")
        .insert({
          public_token: token,
          reseller_id: link.reseller_id,
          reseller_link_id: link.id,
          credits: link.pack,
          final_price: link.sale_price,
          cost: link.cost,
          profit: link.profit,
          status: "pending",
          delivery_logs: logs,
        })
        .select("id, public_token, status")
        .single();

      if (error) {
        console.error("Create order error:", error);
        return respond({ error: "Failed to create order" }, 500);
      }

      await supabase.rpc("increment_link_views", { _link_id: link.id });

      return respond({ token: order.public_token, order_id: order.id, status: order.status });
    }

    // ═══ ACTION: MARK TUTORIAL VIEWED ═══
    if (action === "tutorial_viewed") {
      const { public_token } = body;
      if (!public_token) return respond({ error: "Missing public_token" }, 400);

      const { data: order } = await supabase
        .from("reseller_orders")
        .select("*")
        .eq("public_token", public_token)
        .maybeSingle();

      if (!order) return respond({ error: "Order not found" }, 404);
      if (order.tutorial_viewed_at) return respond({ status: order.status, message: "Already viewed" });

      const logs = Array.isArray(order.delivery_logs) ? [...order.delivery_logs] : [];
      addLog(logs, "Tutorial concluído pelo cliente", "success");

      await supabase
        .from("reseller_orders")
        .update({
          status: "tutorial_viewed",
          tutorial_viewed_at: new Date().toISOString(),
          delivery_logs: logs,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      return respond({ status: "tutorial_viewed" });
    }

    // ═══ ACTION: START DELIVERY ═══
    if (action === "start_delivery") {
      const { public_token, client_email } = body;
      if (!public_token) return respond({ error: "Missing public_token" }, 400);

      const { data: order } = await supabase
        .from("reseller_orders")
        .select("*, resellers(user_id, store_name, whatsapp)")
        .eq("public_token", public_token)
        .maybeSingle();

      if (!order) return respond({ error: "Order not found" }, 404);
      if (order.status === "completed") return respond({ error: "Already completed" }, 400);
      if (order.status === "processing") return respond({ error: "Already processing" }, 400);

      // Check expiration
      if (order.expires_at && new Date(order.expires_at) < new Date()) {
        const logs = Array.isArray(order.delivery_logs) ? [...order.delivery_logs] : [];
        addLog(logs, "Pedido expirado", "error");

        // ── L3 FIX: Check refunded flag before refunding ──
        if (!order.refunded && ["reserved", "tutorial_viewed", "pending"].includes(order.status)) {
          const { data: reseller } = await supabase.from("resellers").select("user_id").eq("id", order.reseller_id).single();
          if (reseller) {
            await supabase.rpc("credit_wallet", {
              _user_id: reseller.user_id,
              _amount: order.cost,
              _description: `Estorno automático: pedido expirado (${order.public_token})`,
            });
            addLog(logs, "Saldo estornado automaticamente", "info");
          }
        }

        await supabase.from("reseller_orders").update({
          status: "expired", delivery_logs: logs, updated_at: new Date().toISOString(), refunded: true,
        }).eq("id", order.id);

        return respond({ error: "Order expired", status: "expired" }, 400);
      }

      const logs = Array.isArray(order.delivery_logs) ? [...order.delivery_logs] : [];
      const resellerId = order.reseller_id;

      const { data: reseller } = await supabase
        .from("resellers")
        .select("user_id")
        .eq("id", resellerId)
        .single();

      if (!reseller) {
        addLog(logs, "Revendedor não encontrado", "error");
        await supabase
          .from("reseller_orders")
          .update({ status: "failed", delivery_logs: logs, updated_at: new Date().toISOString() })
          .eq("id", order.id);
        return respond({ error: "Reseller not found", status: "failed" }, 404);
      }

      // Balance already debited at link generation (status=reserved)
      // For legacy orders (status=pending), debit now
      const isLegacy = order.status === "pending" || order.status === "tutorial_viewed";

      if (isLegacy) {
        addLog(logs, "Validando saldo do revendedor...", "info");
        await supabase
          .from("reseller_orders")
          .update({ status: "validating", delivery_logs: logs, updated_at: new Date().toISOString() })
          .eq("id", order.id);

        const { data: profile } = await supabase
          .from("profiles")
          .select("wallet_balance")
          .eq("id", reseller.user_id)
          .single();

        if (!profile || profile.wallet_balance < order.cost) {
          addLog(logs, "Saldo insuficiente do revendedor", "error");
          await supabase
            .from("reseller_orders")
            .update({ status: "failed", delivery_logs: logs, updated_at: new Date().toISOString() })
            .eq("id", order.id);
          return respond({ error: "Insufficient reseller balance", status: "failed" }, 400);
        }

        const { data: debited } = await supabase.rpc("debit_wallet", {
          _user_id: reseller.user_id,
          _amount: order.cost,
          _description: `Revenda: ${order.credits} créditos (pedido ${order.public_token})`,
        });

        if (!debited) {
          addLog(logs, "Falha ao debitar saldo", "error");
          await supabase
            .from("reseller_orders")
            .update({ status: "failed", delivery_logs: logs, updated_at: new Date().toISOString() })
            .eq("id", order.id);
          return respond({ error: "Failed to debit wallet", status: "failed" }, 500);
        }
        addLog(logs, "Saldo debitado com sucesso", "success");
      } else {
        addLog(logs, "Saldo já reservado", "success");
      }

      addLog(logs, "Iniciando entrega via API oficial...", "info");

      await supabase
        .from("reseller_orders")
        .update({
          status: "processing",
          delivery_started_at: new Date().toISOString(),
          delivery_logs: logs,
          client_email: client_email || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      try {
        addLog(logs, "Gerando provisionamento local...", "info");
        await supabase
          .from("reseller_orders")
          .update({ delivery_logs: logs, updated_at: new Date().toISOString() })
          .eq("id", order.id);

        const simResult = simulateCreateOrder(order.credits);

        addLog(logs, "Provisionamento local gerado com sucesso", "success");

        const { data: mainOrder, error: mainError } = await supabase
          .from("orders")
          .insert({
            credits: order.credits,
            price: order.cost,
            status: "provisioning",
            order_type: "reseller_delivery",
            master_email: client_email || simResult.master_email,
            user_id: reseller.user_id,
            order_id_lovable: String(simResult.order_id),
          })
          .select("id")
          .single();

        if (mainError) {
          throw new Error(`Failed to create main order: ${mainError.message}`);
        }

        addLog(logs, "Créditos sendo provisionados localmente", "success");

        await supabase
          .from("reseller_orders")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            api_order_id: mainOrder.id,
            delivery_logs: logs,
            client_email: client_email || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.id);

        return respond({ status: "completed", order_id: order.id });
      } catch (apiErr) {
        console.error("API delivery error:", apiErr);
        addLog(logs, `Erro na entrega: ${(apiErr as Error).message}`, "error");

        // ── L3 FIX: Check refunded before refunding ──
        if (!order.refunded) {
          await supabase.rpc("credit_wallet", {
            _user_id: reseller.user_id,
            _amount: order.cost,
            _description: `Estorno: falha na entrega (pedido ${order.public_token})`,
          });
          addLog(logs, "Saldo estornado automaticamente", "info");
        }

        await supabase
          .from("reseller_orders")
          .update({ status: "failed", delivery_logs: logs, updated_at: new Date().toISOString(), refunded: true })
          .eq("id", order.id);

        return respond({ error: "Delivery failed", status: "failed" }, 500);
      }
    }

    // ═══ ACTION: GET STATUS ═══
    if (action === "get_status") {
      const { public_token } = body;
      if (!public_token) return respond({ error: "Missing public_token" }, 400);

      // ── V5 FIX: Only return safe fields ──
      const { data: order } = await supabase
        .from("reseller_orders")
        .select("id, public_token, credits, final_price, status, delivery_logs, tutorial_viewed_at, completed_at, created_at, expires_at, resellers(store_name, whatsapp)")
        .eq("public_token", public_token)
        .maybeSingle();

      if (!order) return respond({ error: "Order not found" }, 404);
      return respond(order);
    }

    // ═══ ACTION: LOOKUP ORDER BY LINK ═══
    if (action === "lookup_order") {
      const { reseller_link_id } = body;
      if (!reseller_link_id) return respond({ error: "Missing reseller_link_id" }, 400);

      // ── V5 FIX: Only return safe fields (no cost, profit, client_whatsapp) ──
      const { data: order } = await supabase
        .from("reseller_orders")
        .select("id, public_token, credits, final_price, status, tutorial_viewed_at, completed_at, created_at, expires_at, resellers(store_name, whatsapp)")
        .eq("reseller_link_id", reseller_link_id)
        .not("status", "in", '("cancelled","failed","expired")')
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return respond({ order: order || null });
    }

    // ═══ ACTION: CANCEL / RELEASE ═══
    if (action === "cancel_order") {
      const { public_token } = body;

      const authHeader = req.headers.get("authorization") || "";
      const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
      if (!token) return respond({ error: "Unauthorized" }, 401);

      const { data: { user } } = await supabase.auth.getUser(token);
      if (!user) return respond({ error: "Unauthorized" }, 401);

      const { data: order } = await supabase
        .from("reseller_orders")
        .select("*, resellers(user_id)")
        .eq("public_token", public_token)
        .maybeSingle();

      if (!order) return respond({ error: "Order not found" }, 404);

      const isOwner = order.resellers?.user_id === user.id;
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!isOwner && !isAdmin) return respond({ error: "Forbidden" }, 403);

      if (order.status === "completed") return respond({ error: "Cannot cancel completed order" }, 400);
      if (order.status === "cancelled") return respond({ error: "Already cancelled" }, 400);

      const logs = Array.isArray(order.delivery_logs) ? [...order.delivery_logs] : [];

      // ── L3 FIX: Check refunded flag before refunding ──
      if (!order.refunded && ["reserved", "processing", "ready_to_deliver", "validating", "pending", "tutorial_viewed"].includes(order.status)) {
        await supabase.rpc("credit_wallet", {
          _user_id: order.resellers.user_id,
          _amount: order.cost,
          _description: `Cancelamento: pedido ${order.public_token}`,
        });
        addLog(logs, "Saldo estornado", "info");
      }

      addLog(logs, "Pedido cancelado", "warning");

      await supabase
        .from("reseller_orders")
        .update({ status: "cancelled", delivery_logs: logs, updated_at: new Date().toISOString(), refunded: true })
        .eq("id", order.id);

      return respond({ status: "cancelled" });
    }

    return respond({ error: "Invalid action" }, 400);
  } catch (err) {
    console.error("process-reseller-delivery error:", err);
    return respond({ error: "Internal server error" }, 500);
  }
});
