import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePricing } from "@/hooks/usePricing";
import { formatCurrency, formatNumber, CREDIT_TIERS, interpolateApiCost } from "@/lib/pricing";
import { TrendingUp, ShoppingCart, Wallet, Star, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}

function StatsCard({ icon, label, value, sub, accent = "text-primary" }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-4 space-y-1"
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className={`text-xl font-black tabular-nums ${accent}`}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </motion.div>
  );
}

export function ResellerStats() {
  const { user, resellerInfo, profile } = useAuth();
  const { priceTable } = usePricing();
  const margin = resellerInfo?.margin_pct ?? 12;

  const { data: todayOrders } = useQuery({
    queryKey: ["reseller-today-orders", user?.id],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from("orders")
        .select("credits, price, status, created_at")
        .eq("order_type", "credit_purchase")
        .gte("created_at", today.toISOString())
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    refetchInterval: 30_000,
  });

  const { data: referralStats } = useQuery({
    queryKey: ["reseller-referral-stats", user?.id],
    queryFn: async () => {
      const { data: reseller } = await supabase
        .from("resellers")
        .select("id")
        .eq("user_id", user!.id)
        .single();
      if (!reseller) return { clicks: 0, conversions: 0 };
      
      const { count: clicks } = await supabase
        .from("reseller_referrals")
        .select("*", { count: "exact", head: true })
        .eq("reseller_id", reseller.id);
      
      const { count: conversions } = await supabase
        .from("reseller_referrals")
        .select("*", { count: "exact", head: true })
        .eq("reseller_id", reseller.id)
        .eq("converted", true);
      
      return { clicks: clicks || 0, conversions: conversions || 0 };
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const completedToday = todayOrders?.filter(o => ["completed", "paid", "processing", "provisioning"].includes(o.status)) || [];
  const salesToday = completedToday.length;
  
  const profitToday = completedToday.reduce((sum, o) => {
    const cost = interpolateApiCost(o.credits, priceTable) * (1 + margin / 100);
    return sum + Math.max(0, Number(o.price) - cost);
  }, 0);

  // Find best package to sell (highest profit margin)
  const bestPack = CREDIT_TIERS.reduce((best, qty) => {
    const cost = Math.ceil(interpolateApiCost(qty, priceTable) * (1 + margin / 100));
    const retail = Math.ceil(cost * 1.5); // 50% margin suggestion
    const profit = retail - cost;
    if (profit > best.profit) return { qty, profit };
    return best;
  }, { qty: 500, profit: 0 });

  const conversionRate = referralStats && referralStats.clicks > 0
    ? Math.round((referralStats.conversions / referralStats.clicks) * 100)
    : 0;

  const balance = profile?.wallet_balance ?? 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      <StatsCard
        icon={<TrendingUp className="h-4 w-4" />}
        label="Lucro Hoje"
        value={formatCurrency(profitToday)}
        sub={`${salesToday} venda${salesToday !== 1 ? "s" : ""}`}
        accent="text-emerald-400"
      />
      <StatsCard
        icon={<ShoppingCart className="h-4 w-4" />}
        label="Vendas Hoje"
        value={String(salesToday)}
        sub="pedidos processados"
      />
      <StatsCard
        icon={<Wallet className="h-4 w-4" />}
        label="Saldo Atual"
        value={formatCurrency(balance)}
        sub="disponível para vendas"
      />
      <StatsCard
        icon={<Star className="h-4 w-4" />}
        label="Melhor Pacote"
        value={`${formatNumber(bestPack.qty)} cr`}
        sub={`lucro de ${formatCurrency(bestPack.profit)}`}
        accent="text-yellow-400"
      />
      <StatsCard
        icon={<BarChart3 className="h-4 w-4" />}
        label="Conversão Links"
        value={`${conversionRate}%`}
        sub={`${referralStats?.clicks || 0} cliques`}
      />
    </div>
  );
}
