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
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return respond({ error: "AI not configured" }, 500);

    // ═══ AUTHENTICATION REQUIRED ═══
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    if (!token) return respond({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return respond({ error: "Unauthorized" }, 401);

    const body = await req.json();
    const { action, clientName, credits, salePrice, cost, profit, storeName, logs, priceTable } = body;

    let systemPrompt = "";
    let userPrompt = "";

    switch (action) {
      case "suggest_margin": {
        systemPrompt = "Você é um consultor de vendas de créditos Lovable. Responda APENAS em JSON com o formato: {\"suggested_margin\": number, \"reason\": string}. A margem é em porcentagem sobre o custo.";
        userPrompt = `O revendedor está vendendo ${credits} créditos. O custo dele é R$${cost?.toFixed(2)}. Sugira a melhor margem de lucro (em %) considerando competitividade e lucratividade. Pacotes menores podem ter margem maior.`;
        break;
      }
      case "generate_whatsapp": {
        systemPrompt = "Você é um copywriter de vendas brasileiro. Gere APENAS a mensagem pronta para WhatsApp, sem explicações extras. Use emojis moderados. Seja persuasivo mas natural.";
        userPrompt = `Gere uma mensagem de WhatsApp para vender ${credits} créditos Lovable por R$${salePrice?.toFixed(2)} para o cliente "${clientName || "cliente"}". O revendedor se chama "${storeName || "Loja"}". A entrega é automática em 3 minutos via bot.`;
        break;
      }
      case "generate_copy": {
        systemPrompt = "Você é um copywriter brasileiro. Gere APENAS o texto curto (máximo 2 frases) para página de venda. Seja direto e persuasivo.";
        userPrompt = `Crie uma copy curta para vender ${credits} créditos Lovable por R$${salePrice?.toFixed(2)} para "${clientName || "desenvolvedor"}". Destaque economia e entrega rápida.`;
        break;
      }
      case "summarize_logs": {
        systemPrompt = "Você é um assistente de suporte. Resuma os logs de entrega em 1-2 frases simples em português. Diga o status atual de forma clara para o revendedor.";
        userPrompt = `Resuma estes logs de entrega para o revendedor:\n${JSON.stringify(logs)}`;
        break;
      }
      case "suggest_pack": {
        systemPrompt = "Você é um consultor de vendas. Responda APENAS em JSON: {\"suggested_pack\": number, \"reason\": string}. Packs disponíveis: 100, 200, 500, 1000, 2000, 5000, 10000.";
        userPrompt = `O cliente "${clientName || "cliente"}" quer comprar créditos Lovable. O revendedor tem saldo de R$${cost?.toFixed(2)} na carteira. Sugira o melhor pacote considerando margem e conversão.`;
        break;
      }
      case "generate_price_table": {
        systemPrompt = "Você é um copywriter de vendas brasileiro. Gere APENAS o texto pronto para enviar no WhatsApp/Telegram, sem explicações extras. Use emojis moderados. Inclua todos os preços da tabela. Seja persuasivo, comercial e direto. Máximo 15 linhas.";
        const tableStr = (priceTable || []).map((r: any) => `${r.credits} créditos = R$${r.price}`).join(", ");
        userPrompt = `Gere um texto comercial para compartilhar esta tabela de preços de créditos Lovable:\n${tableStr}\nNome da loja: "${storeName || "Loja"}". Entrega automática em minutos.`;
        break;
      }
      default:
        return respond({ error: "Invalid action" }, 400);
    }

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) return respond({ error: "Rate limit, tente novamente em instantes." }, 429);
      if (aiResp.status === 402) return respond({ error: "Créditos AI esgotados." }, 402);
      const t = await aiResp.text();
      console.error("AI error:", aiResp.status, t);
      return respond({ error: "AI error" }, 500);
    }

    const aiData = await aiResp.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    return respond({ result: content });
  } catch (err) {
    console.error("reseller-ai error:", err);
    return respond({ error: "Internal server error" }, 500);
  }
});
