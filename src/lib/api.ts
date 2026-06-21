import { supabase } from "@/integrations/supabase/client";

const API_PATH = "reseller-proxy";

async function callApi(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke(API_PATH, {
    body,
  });
  if (error) throw new Error(error.message || "API call failed");
  return data;
}

export async function checkStatus(orderId: string | number) {
  return callApi({ action: "check_status", order_id: Number(orderId) });
}

export async function getEvents(orderId: string | number) {
  return callApi({ action: "get_events", order_id: Number(orderId) });
}

export async function listOrders(limit = 50) {
  return callApi({ action: "list_orders", limit });
}


export async function createPixPayment(orderId: string | number | null, amount: number, credits: number, email?: string, orderType?: string) {
  const { data, error } = await supabase.functions.invoke("create-pix-payment", {
    body: { order_id: orderId, amount, credits, email, order_type: orderType },
  });
  if (error) throw new Error(error.message || "Failed to create PIX payment");
  return data;
}

export async function checkPixStatus(orderId: string) {
  const { data, error } = await supabase.functions.invoke("check-pix-status", {
    body: { order_id: orderId },
  });
  if (error) throw new Error(error.message || "Failed to check PIX status");
  return data;
}

export async function proxyApiStatus(apiOrderId: string | number) {
  const { data, error } = await supabase.functions.invoke("proxy-api-status", {
    body: { api_order_id: Number(apiOrderId) },
  });
  if (error) throw new Error(error.message || "Failed to fetch delivery status");
  return data;
}

export async function walletPurchase(credits: number) {
  const { data, error } = await supabase.functions.invoke("wallet-purchase", {
    body: { credits },
  });
  if (error) throw new Error(error.message || "Failed to purchase with wallet");
  return data;
}

export async function clientWalletPurchase(credits: number) {
  const { data, error } = await supabase.functions.invoke("client-wallet-purchase", {
    body: { credits },
  });
  if (error) throw new Error(error.message || "Failed to purchase with wallet");
  return data;
}

export async function adminGrantCredits(credits: number, email?: string) {
  const { data, error } = await supabase.functions.invoke("admin-grant-credits", {
    body: { credits, email },
  });
  if (error) throw new Error(error.message || "Failed to grant credits");
  return data;
}
