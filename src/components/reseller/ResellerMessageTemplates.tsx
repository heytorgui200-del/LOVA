import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, MessageCircle, Send, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatNumber } from "@/lib/pricing";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  credits: number;
  salePrice: number;
  link: string;
  clientName?: string;
  storeName?: string;
}

const channels = [
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { id: "telegram", label: "Telegram", icon: Send },
];

function buildTemplate(channel: string, c: number, p: number, link: string, name?: string) {
  const greeting = name ? `Olá ${name}! 👋` : "Salve! 👋";
  const pack = `📦 ${formatNumber(c)} créditos Lovable`;
  const price = `💰 Por apenas ${formatCurrency(p)}`;
  const delivery = "⚡ Entrega automática em 3 min via bot";

  if (channel === "whatsapp") {
    return `${greeting}\n\n${pack}\n${price}\n${delivery}\n\n✅ Sem fila, sem espera\n✅ Funciona 24h\n\n👉 ${link}`;
  }
  // telegram
  return `${greeting}\n\n${pack}\n${price}\n${delivery}\n\n🚀 Compre agora:\n${link}`;
}

export function ResellerMessageTemplates({ credits, salePrice, link, clientName, storeName }: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      toast.success("Mensagem copiada!");
      setTimeout(() => setCopiedId(null), 2500);
    }).catch(() => toast.error("Erro ao copiar"));
  };

  const handleSend = (channel: string, text: string) => {
    const encoded = encodeURIComponent(text);
    if (channel === "whatsapp") {
      window.open(`https://wa.me/?text=${encoded}`, "_blank");
    } else {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encoded}`, "_blank");
    }
  };

  const generateAiMessage = async () => {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("reseller-ai", {
        body: {
          action: "generate_whatsapp",
          clientName,
          credits,
          salePrice,
          storeName,
        },
      });
      if (error) throw error;
      setAiMessage(data.result);
    } catch {
      toast.error("Erro ao gerar mensagem com IA");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-3 pt-3 border-t border-border/30">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mensagens Prontas</p>

      <div className="grid gap-2">
        {channels.map((ch) => {
          const text = buildTemplate(ch.id, credits, salePrice, link, clientName);
          const isCopied = copiedId === ch.id;
          return (
            <div key={ch.id} className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 justify-between text-xs h-auto py-2 px-3"
                onClick={() => handleCopy(ch.id, text)}
              >
                <span className="flex items-center gap-1.5">
                  <ch.icon className="h-3.5 w-3.5" />
                  {ch.label}
                </span>
                {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"
                onClick={() => handleSend(ch.id, text)}>
                <Send className="h-3.5 w-3.5 text-emerald-500" />
              </Button>
            </div>
          );
        })}
      </div>

      {/* AI-generated message */}
      <div className="space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 text-xs"
          onClick={generateAiMessage}
          disabled={aiLoading}
        >
          {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-amber-400" />}
          {aiLoading ? "Gerando com IA..." : "✨ Gerar mensagem com IA"}
        </Button>

        {aiMessage && (
          <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-3 space-y-2">
            <p className="text-xs text-foreground whitespace-pre-wrap">{aiMessage}</p>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <Button variant="ghost" size="sm" className="text-[11px] sm:text-xs gap-1 sm:gap-1.5 h-7 sm:h-8 px-2 sm:px-3"
                onClick={() => handleCopy("ai", aiMessage)}>
                {copiedId === "ai" ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                Copiar
              </Button>
              <Button variant="ghost" size="sm" className="text-[11px] sm:text-xs gap-1 sm:gap-1.5 h-7 sm:h-8 px-2 sm:px-3"
                onClick={() => handleSend("whatsapp", aiMessage)}>
                <MessageCircle className="h-3 w-3 text-emerald-500" /> WhatsApp
              </Button>
              <Button variant="ghost" size="sm" className="text-[11px] sm:text-xs gap-1 sm:gap-1.5 h-7 sm:h-8 px-2 sm:px-3"
                onClick={() => handleSend("telegram", aiMessage)}>
                <Send className="h-3 w-3 text-blue-400" /> Telegram
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
