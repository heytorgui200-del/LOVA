import { usePricing } from "@/hooks/usePricing";
import { useAuth } from "@/contexts/AuthContext";
import { CREDIT_TIERS, formatCurrency, formatNumber, interpolateApiCost } from "@/lib/pricing";
import { Lightbulb, TrendingUp, Zap, MessageCircle } from "lucide-react";

export function ResellerSuggestions() {
  const { resellerInfo } = useAuth();
  const { priceTable, getDetails } = usePricing();
  const margin = resellerInfo?.margin_pct ?? 12;

  // Find best margin package
  const packages = CREDIT_TIERS.map((qty) => {
    const cost = Math.ceil(interpolateApiCost(qty, priceTable) * (1 + margin / 100));
    const { total: retail } = getDetails(qty);
    const profit = Math.max(0, retail - cost);
    const profitPct = cost > 0 ? (profit / cost) * 100 : 0;
    return { qty, cost, retail, profit, profitPct };
  });

  const bestMargin = packages.reduce((best, p) => p.profitPct > best.profitPct ? p : best, packages[0]);
  const bestProfit = packages.reduce((best, p) => p.profit > best.profit ? p : best, packages[0]);

  const suggestions = [
    {
      icon: <TrendingUp className="h-4 w-4 text-emerald-400" />,
      title: "Melhor margem hoje",
      desc: `Pacote de ${formatNumber(bestMargin.qty)} créditos — ${Math.round(bestMargin.profitPct)}% de margem`,
    },
    {
      icon: <Zap className="h-4 w-4 text-yellow-400" />,
      title: "Maior lucro por venda",
      desc: `${formatNumber(bestProfit.qty)} créditos = ${formatCurrency(bestProfit.profit)} de lucro`,
    },
    {
      icon: <MessageCircle className="h-4 w-4 text-blue-400" />,
      title: "Dica de conversão",
      desc: "Use a mensagem 'Para Indecisos' — tem a melhor taxa de resposta",
    },
  ];

  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-emerald-500/5 p-4 space-y-3">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-yellow-400" />
        Sugestões Inteligentes
      </h3>
      <div className="space-y-2">
        {suggestions.map((s, i) => (
          <div key={i} className="flex items-start gap-3 rounded-xl bg-background/50 p-3">
            <div className="mt-0.5">{s.icon}</div>
            <div>
              <p className="text-xs font-semibold text-foreground">{s.title}</p>
              <p className="text-[11px] text-muted-foreground">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
