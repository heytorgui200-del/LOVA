import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePricing } from "@/hooks/usePricing";
import { formatCurrency, formatNumber, interpolateApiCost } from "@/lib/pricing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Loader2, TrendingUp, Package, DollarSign, Target, Link2 } from "lucide-react";

export function ResellerPerformance() {
  const { user, resellerInfo } = useAuth();
  const { priceTable } = usePricing();
  const margin = resellerInfo?.margin_pct ?? 12;

  const { data: allOrders, isLoading } = useQuery({
    queryKey: ["reseller-all-orders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("credits, price, status, created_at")
        .eq("order_type", "credit_purchase")
        .in("status", ["completed", "paid", "processing", "provisioning"])
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const { data: referralData } = useQuery({
    queryKey: ["reseller-referrals-perf", user?.id],
    queryFn: async () => {
      const { data: reseller } = await supabase
        .from("resellers")
        .select("id")
        .eq("user_id", user!.id)
        .single();
      if (!reseller) return { clicks: 0, conversions: 0, bestPack: 0 };

      const { data: refs, count: clicks } = await supabase
        .from("reseller_referrals")
        .select("pack, converted", { count: "exact" })
        .eq("reseller_id", reseller.id);

      const conversions = refs?.filter(r => r.converted).length || 0;

      // Best pack from referrals
      const packCounts: Record<number, number> = {};
      refs?.filter(r => r.converted).forEach(r => {
        packCounts[r.pack] = (packCounts[r.pack] || 0) + 1;
      });
      const bestPack = Object.entries(packCounts).sort((a, b) => b[1] - a[1])[0];

      return {
        clicks: clicks || 0,
        conversions,
        bestPack: bestPack ? Number(bestPack[0]) : 0,
      };
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  if (isLoading) {
    return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const orders = allOrders || [];
  const totalSold = orders.reduce((s, o) => s + o.credits, 0);
  const totalRevenue = orders.reduce((s, o) => s + Number(o.price), 0);
  const totalCost = orders.reduce((s, o) => {
    return s + Math.ceil(interpolateApiCost(o.credits, priceTable) * (1 + margin / 100));
  }, 0);
  const totalProfit = Math.max(0, totalRevenue - totalCost);
  const avgTicket = orders.length > 0 ? totalRevenue / orders.length : 0;
  const convRate = referralData && referralData.clicks > 0
    ? Math.round((referralData.conversions / referralData.clicks) * 100) : 0;

  const stats = [
    { icon: <Package className="h-4 w-4" />, label: "Total Vendido", value: `${formatNumber(totalSold)} cr` },
    { icon: <DollarSign className="h-4 w-4" />, label: "Total Ganho", value: formatCurrency(totalProfit) },
    { icon: <Target className="h-4 w-4" />, label: "Ticket Médio", value: formatCurrency(avgTicket) },
    { icon: <TrendingUp className="h-4 w-4" />, label: "Pedidos", value: String(orders.length) },
    { icon: <Link2 className="h-4 w-4" />, label: "Conversão", value: `${convRate}%` },
    { icon: <Package className="h-4 w-4" />, label: "Melhor Pacote", value: referralData?.bestPack ? `${formatNumber(referralData.bestPack)} cr` : "—" },
  ];

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" /> Desempenho
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-border/50 p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                {s.icon}
                <span className="text-[10px] font-medium">{s.label}</span>
              </div>
              <p className="text-lg font-bold text-foreground tabular-nums">{s.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
