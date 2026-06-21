import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2, Check,
  Package, Clock, CheckCircle2,
  Wallet, Link2, Settings,
  TrendingUp, Zap, TableProperties,
  ShoppingCart, ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import { WalletTopUp } from "@/components/WalletTopUp";
import { formatCurrency, formatNumber, interpolateApiCost } from "@/lib/pricing";
import { usePricing } from "@/hooks/usePricing";
import { ResellerLinkGenerator } from "@/components/reseller/ResellerLinkGenerator";
import { ResellerRecentLinks } from "@/components/reseller/ResellerRecentLinks";
import { ResellerTutorialModal } from "@/components/reseller/ResellerTutorialModal";
import { ResellerPriceTable } from "@/components/reseller/ResellerPriceTable";
import { ResellerOnboarding } from "@/components/ResellerOnboarding";
import { ResellerOrdersTab, ResellerSettingsTab } from "@/components/reseller/ResellerOrdersAndSettings";
import { NoIndex } from "@/components/NoIndex";

// ─── Mini Stats ───
function MiniStats({ balance, onTopUp }: { balance: number; onTopUp: () => void }) {
  const { user, resellerInfo } = useAuth();
  const { priceTable } = usePricing();
  const margin = resellerInfo?.margin_pct ?? 12;

  const { data: todayOrders } = useQuery({
    queryKey: ["reseller-today-orders", user?.id],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from("orders")
        .select("credits, price, status, created_at")
        .eq("order_type", "credit_purchase")
        .gte("created_at", today.toISOString());
      return data || [];
    },
    enabled: !!user,
    refetchInterval: 30_000,
  });

  const completed = todayOrders?.filter(o => ["completed", "paid", "processing", "provisioning"].includes(o.status)) || [];
  const salesToday = completed.length;
  const profitToday = completed.reduce((sum, o) => {
    const cost = interpolateApiCost(o.credits, priceTable) * (1 + margin / 100);
    return sum + Math.max(0, Number(o.price) - cost);
  }, 0);

  return (
    <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
      <div className="flex items-center gap-1 sm:gap-2 rounded-xl border border-border/50 bg-card px-1.5 sm:px-3 py-1.5 sm:py-2">
        <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-400 shrink-0" />
        <div className="min-w-0">
          <p className="text-[8px] sm:text-[10px] text-muted-foreground leading-none">Lucro hoje</p>
          <p className="text-[11px] sm:text-sm font-bold text-emerald-400 tabular-nums truncate">{formatCurrency(profitToday)}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 sm:gap-2 rounded-xl border border-border/50 bg-card px-1.5 sm:px-3 py-1.5 sm:py-2">
        <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 text-primary shrink-0" />
        <div className="min-w-0">
          <p className="text-[8px] sm:text-[10px] text-muted-foreground leading-none">Vendas</p>
          <p className="text-[11px] sm:text-sm font-bold text-foreground tabular-nums">{salesToday}</p>
        </div>
      </div>
      <button onClick={onTopUp} className="flex items-center gap-1 sm:gap-2 rounded-xl border border-primary/20 bg-primary/5 px-1.5 sm:px-3 py-1.5 sm:py-2 hover:bg-primary/10 transition-colors">
        <Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-primary shrink-0" />
        <div className="min-w-0">
          <p className="text-[8px] sm:text-[10px] text-muted-foreground leading-none">Saldo</p>
          <p className="text-[11px] sm:text-sm font-bold text-foreground tabular-nums truncate">{formatCurrency(balance)}</p>
        </div>
      </button>
    </div>
  );
}

// ─── Slug Setup Banner ───
function SlugSetupBanner({ userId, onSaved }: { userId: string; onSaved: () => void }) {
  const [slug, setSlug] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const clean = slug.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 30);
    if (!clean) { toast.error("Digite um slug válido."); return; }
    setSaving(true);
    const { error } = await supabase.from("resellers").update({ slug: clean }).eq("user_id", userId);
    setSaving(false);
    if (error) {
      if (error.code === "23505") toast.error("Esse slug já está em uso.");
      else toast.error("Erro ao salvar.");
      return;
    }
    toast.success("Slug configurado!");
    onSaved();
  };

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" />
          <h3 className="font-bold text-foreground">Configure seu link para começar</h3>
        </div>
        <p className="text-sm text-muted-foreground">Escolha um nome para sua página de vendas.</p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">/r/</span>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="meu-nome" className="flex-1" />
          <Button onClick={handleSave} disabled={saving || !slug.trim()} size="sm" className="gap-1.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Salvar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ───
export default function ResellerPage() {
  const { user, profile, isReseller, resellerInfo } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showTopUp, setShowTopUp] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { const t = setTimeout(() => setLoading(false), 500); return () => clearTimeout(t); }, []);

  const { data: resellerData } = useQuery({
    queryKey: ["reseller-slug", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("resellers").select("id, slug").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user && isReseller,
  });

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (!isReseller) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-md text-center space-y-4">
          <Package className="h-12 w-12 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Acesso Restrito</h1>
          <p className="text-muted-foreground text-sm">Você ainda não tem acesso ao programa de revenda.</p>
          <Button onClick={() => navigate("/dashboard")}>Voltar ao Painel</Button>
        </div>
      </div>
    );
  }

  const balance = profile?.wallet_balance ?? 0;
  const slug = resellerData?.slug || null;
  const resellerId = resellerData?.id || null;

  if (showTopUp) {
    return (
      <div className="min-h-screen bg-background pt-20 sm:pt-24 pb-12 px-3 sm:px-4">
        <div className="container mx-auto max-w-lg space-y-4"><WalletTopUp onClose={() => setShowTopUp(false)} /></div>
      </div>
    );
  }

  return (
    <>
    <NoIndex />
    <div className="min-h-screen bg-background pt-20 sm:pt-24 pb-12 sm:pb-16 px-2 sm:px-4 md:px-8">
      <div className="container mx-auto max-w-3xl space-y-4 sm:space-y-5">
        {/* Header with tutorial */}
        <div className="flex items-center justify-between">
          <h1 className="text-base sm:text-lg font-bold text-foreground">Painel de Revenda</h1>
          <ResellerTutorialModal />
        </div>

        {/* Stats */}
        <MiniStats balance={balance} onTopUp={() => setShowTopUp(true)} />

        {/* Slug Setup */}
        {!slug && <SlugSetupBanner userId={user.id} onSaved={() => queryClient.invalidateQueries({ queryKey: ["reseller-slug"] })} />}

        {/* HERO: Link Generator */}
        {slug && (
          <ResellerLinkGenerator
            slug={slug}
            resellerId={resellerId}
            storeName={resellerInfo?.store_name}
            walletBalance={balance}
            onSelectPackage={() => {}}
            onLinkGenerated={() => {
              queryClient.invalidateQueries({ queryKey: ["reseller-links"] });
              queryClient.invalidateQueries({ queryKey: ["profile"] });
              queryClient.invalidateQueries({ queryKey: ["reseller-order-history"] });
            }}
          />
        )}

        {/* Secondary Tabs */}
        <Tabs defaultValue="tabela" className="w-full">
          <TabsList className="w-full grid grid-cols-5 h-8 sm:h-10">
            <TabsTrigger value="tabela" className="gap-1 text-[10px] sm:text-xs px-0.5 sm:px-3"><TableProperties className="h-3 w-3 hidden sm:block" /> Preços</TabsTrigger>
            <TabsTrigger value="links" className="gap-1 text-[10px] sm:text-xs px-0.5 sm:px-3"><Link2 className="h-3 w-3 hidden sm:block" /> Links</TabsTrigger>
            <TabsTrigger value="historico" className="gap-1 text-[10px] sm:text-xs px-0.5 sm:px-3"><ClipboardList className="h-3 w-3 hidden sm:block" /> Pedidos</TabsTrigger>
            <TabsTrigger value="pedidos" className="gap-1 text-[10px] sm:text-xs px-0.5 sm:px-3"><Package className="h-3 w-3 hidden sm:block" /> Compras</TabsTrigger>
            <TabsTrigger value="config" className="gap-1 text-[10px] sm:text-xs px-0.5 sm:px-3"><Settings className="h-3 w-3 hidden sm:block" /> Config</TabsTrigger>
          </TabsList>

          <TabsContent value="tabela" className="mt-4">
            {slug && <ResellerPriceTable storeName={resellerInfo?.store_name} />}
          </TabsContent>

          <TabsContent value="links" className="mt-4">
            <Card className="border-border/50">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Link2 className="h-4 w-4 text-primary" /> Links Gerados</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <ResellerRecentLinks resellerId={resellerId} slug={slug} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="historico" className="mt-4">
            <Card className="border-border/50">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><ClipboardList className="h-4 w-4 text-primary" /> Pedidos de Revenda</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <ResellerOrdersTab resellerId={resellerId} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pedidos" className="mt-4">
            <Card className="border-border/50">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Package className="h-4 w-4 text-primary" /> Minhas Compras</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <MyOrders />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="config" className="mt-4">
            <Card className="border-border/50">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Settings className="h-4 w-4 text-primary" /> Configurações</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <ResellerSettingsTab userId={user.id} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </>
  );
}

// ─── My Orders (wallet purchases) ───
function MyOrders() {
  const { user } = useAuth();
  const { data: orders, isLoading } = useQuery({
    queryKey: ["reseller-orders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").eq("order_type", "credit_purchase").order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: 10_000,
  });

  const statusLabels: Record<string, { label: string; icon: typeof Clock; cls: string }> = {
    pending_payment: { label: "Aguardando PIX", icon: Clock, cls: "text-yellow-500" },
    pending: { label: "Aguardando PIX", icon: Clock, cls: "text-yellow-500" },
    paid: { label: "Pago", icon: Loader2, cls: "text-blue-500" },
    processing: { label: "Processando", icon: Loader2, cls: "text-blue-500" },
    provisioning: { label: "Aguardando", icon: Clock, cls: "text-orange-500" },
    completed: { label: "Concluído", icon: CheckCircle2, cls: "text-emerald-500" },
  };

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!orders?.length) return <p className="text-center py-10 text-muted-foreground text-sm">Nenhum pedido ainda.</p>;

  return (
    <div className="space-y-2">
      {orders.map((order) => {
        const st = statusLabels[order.status] || statusLabels.pending;
        const Icon = st.icon;
        return (
          <div key={order.id} className="rounded-xl border border-border/50 p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon className={`h-4 w-4 ${st.cls} ${Icon === Loader2 ? "animate-spin" : ""}`} />
              <div>
                <span className="text-sm font-semibold text-foreground">{formatNumber(order.credits)} créditos</span>
                <span className="text-xs text-muted-foreground ml-2">{st.label}</span>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString("pt-BR")}</span>
          </div>
        );
      })}
    </div>
  );
}