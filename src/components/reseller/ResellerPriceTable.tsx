import { useState, useMemo } from "react";
import { usePricing } from "@/hooks/usePricing";
import { formatCurrency, formatNumber } from "@/lib/pricing";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Copy, Check, MessageCircle, Send, Sparkles, Loader2, TableProperties } from "lucide-react";
import { toast } from "sonner";

const TABLE_TIERS = [100, 200, 500, 1000, 2000, 5000, 10000];
const DEFAULT_MARGIN = 50;

export function ResellerPriceTable({ storeName }: { storeName?: string | null }) {
  const { calculateTotal } = usePricing();
  const [margin, setMargin] = useState(DEFAULT_MARGIN);
  const [copied, setCopied] = useState(false);
  const [aiText, setAiText] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const rows = useMemo(() =>
    TABLE_TIERS.map(qty => {
      const cost = calculateTotal(qty);
      const salePrice = Math.ceil(cost * (1 + margin / 100));
      const profit = salePrice - cost;
      return { qty, cost, salePrice, profit };
    }), [margin, calculateTotal]
  );

  const buildPlainText = () => {
    const header = storeName ? `📋 Tabela de Preços — ${storeName}\n\n` : "📋 Tabela de Preços\n\n";
    const lines = rows.map(r => `📦 ${formatNumber(r.qty)} créditos — ${formatCurrency(r.salePrice)}`).join("\n");
    return `${header}${lines}\n\n⚡ Entrega automática em minutos\n✅ Funciona 24h`;
  };

  const handleCopyTable = () => {
    navigator.clipboard.writeText(buildPlainText()).then(() => {
      setCopied(true);
      toast.success("Tabela copiada!");
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => toast.error("Erro ao copiar"));
  };

  const handleSend = (channel: "whatsapp" | "telegram") => {
    const text = aiText || buildPlainText();
    const encoded = encodeURIComponent(text);
    if (channel === "whatsapp") {
      window.open(`https://wa.me/?text=${encoded}`, "_blank");
    } else {
      window.open(`https://t.me/share/url?url=&text=${encoded}`, "_blank");
    }
  };

  const generateAiText = async () => {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("reseller-ai", {
        body: {
          action: "generate_price_table",
          storeName,
          priceTable: rows.map(r => ({ credits: r.qty, price: r.salePrice })),
        },
      });
      if (error) throw error;
      setAiText(data.result);
    } catch {
      toast.error("Erro ao gerar texto com IA");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-primary/20 bg-card p-2.5 sm:p-5 space-y-3 sm:space-y-5">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <TableProperties className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-sm sm:text-base font-bold text-foreground">Tabela de Preços</h2>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground">Defina sua margem e compartilhe</p>
        </div>
      </div>

      {/* Margin slider */}
      <div className="space-y-1.5 sm:space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-xs text-muted-foreground">Margem: {margin}%</span>
        </div>
        <input type="range" min={10} max={200} value={margin}
          onChange={(e) => { setMargin(Number(e.target.value)); setAiText(null); }}
          className="w-full accent-primary h-2 rounded-lg cursor-pointer" />
      </div>

      {/* Price table */}
      <div className="rounded-xl border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-[11px] sm:text-xs font-bold py-1.5 sm:py-2">Créditos</TableHead>
              <TableHead className="text-[11px] sm:text-xs font-bold text-right py-1.5 sm:py-2">Preço</TableHead>
              <TableHead className="text-[11px] sm:text-xs font-bold text-right py-1.5 sm:py-2">Lucro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(r => (
              <TableRow key={r.qty}>
                <TableCell className="text-[11px] sm:text-sm font-semibold py-1.5 sm:py-2">{formatNumber(r.qty)}</TableCell>
                <TableCell className="text-[11px] sm:text-sm font-bold text-right py-1.5 sm:py-2">{formatCurrency(r.salePrice)}</TableCell>
                <TableCell className="text-[11px] sm:text-sm font-bold text-emerald-500 text-right py-1.5 sm:py-2">{formatCurrency(r.profit)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
        <Button variant="outline" size="sm" className="gap-1 sm:gap-1.5 text-[10px] sm:text-xs rounded-xl h-8 sm:h-9" onClick={handleCopyTable}>
          {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copiado!" : "Copiar"}
        </Button>
        <Button variant="outline" size="sm" className="gap-1 sm:gap-1.5 text-[10px] sm:text-xs rounded-xl h-8 sm:h-9" onClick={generateAiText} disabled={aiLoading}>
          {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3 text-amber-400" />}
          {aiLoading ? "Gerando..." : "IA"}
        </Button>
        <Button variant="outline" size="sm" className="gap-1 sm:gap-1.5 text-[10px] sm:text-xs rounded-xl h-8 sm:h-9" onClick={() => handleSend("whatsapp")}>
          <MessageCircle className="h-3 w-3 text-emerald-500" /> WhatsApp
        </Button>
        <Button variant="outline" size="sm" className="gap-1 sm:gap-1.5 text-[10px] sm:text-xs rounded-xl h-8 sm:h-9" onClick={() => handleSend("telegram")}>
          <Send className="h-3 w-3 text-blue-400" /> Telegram
        </Button>
      </div>

      {/* AI generated text */}
      {aiText && (
        <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-2 sm:p-3 space-y-2">
          <p className="text-xs text-foreground whitespace-pre-wrap">{aiText}</p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="text-xs gap-1.5"
              onClick={() => { navigator.clipboard.writeText(aiText); toast.success("Copiado!"); }}>
              <Copy className="h-3 w-3" /> Copiar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
