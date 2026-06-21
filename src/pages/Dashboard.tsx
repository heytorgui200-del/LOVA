import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NoIndex } from "@/components/NoIndex";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Zap, Package, Loader2, History, MessageCircle,
  Store, Users, Wallet, Plus, Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { createPixPayment, clientWalletPurchase, adminGrantCredits } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/pricing";
import { usePricing } from "@/hooks/usePricing";
import { useWhatsAppLink } from "@/hooks/useWhatsAppLink";
import { openWhatsApp } from "@/lib/whatsapp";
import { WalletHistory } from "@/components/WalletHistory";
import { WalletTopUp } from "@/components/WalletTopUp";

const PRESETS = [100, 500, 1000, 2000, 5000, 10000];

const statusMap: Record<string, { label: string; cls: string }> = {
  pending_payment: { label: "Aguardando PIX", cls: "bg-yellow-100 text-yellow-700" },
  pending: { label: "Pendente", cls: "bg-yellow-100 text-yellow-700" },
  paid: { label: "Pago", cls: "bg-blue-100 text-blue-700" },
  provisioning: { label: "Injetando...", cls: "bg-blue-100 text-blue-700" },
  processing: { label: "Processando", cls: "bg-blue-100 text-blue-700" },
  completed: { label: "Concluído", cls: "bg-green-100 text-green-700" },
  provision_failed: { label: "Falhou", cls: "bg-red-100 text-red-700" },
  failed: { label: "Falhou", cls: "bg-red-100 text-red-700" },
  refunded: { label: "Estornado", cls: "bg-gray-100 text-gray-700" },
  partial: { label: "Parcial", cls: "bg-orange-100 text-orange-700" },
};

export default function DashboardPage() {
  const { profile, user, isAdmin, refreshProfile } = useAuth();
  const SUPPORT_LINK = useWhatsAppLink();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Usuário";
  const balance = profile?.wallet_balance ?? 0;

  const [credits, setCredits] = useState(100);
  const [loading, setLoading] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);
  const [showTopUp, setShowTopUp] = useState(false);
  const [adminCredits, setAdminCredits] = useState<string>("");
  const [adminGranting, setAdminGranting] = useState(false);
  const { getDetails } = usePricing();
  
  const { total, savings } = getDetails(credits);

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["user-orders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const completedOrders = orders?.filter((o) => o.status === "completed") || [];
  const totalCredits = completedOrders.reduce((s, o) => s + o.credits, 0);
  const lastOrder = orders?.[0];

  const handleGeneratePix = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const pixData = await createPixPayment(null, total, credits, user?.email);
      if (!pixData.ok) {
        toast.error("Erro ao gerar PIX. Tente novamente.");
        return;
      }
      const params = new URLSearchParams({
        credits: String(credits),
        amount: String(total),
        pix_code: pixData.qr_code || "",
        pix_base64: pixData.qr_code_base64 || "",
        expires_at: pixData.expires_at || "",
      });
      navigate(`/pix/${pixData.order_id}?${params.toString()}`);
    } catch {
      toast.error("Erro ao processar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleWalletPurchase = async () => {
    if (walletLoading) return;
    setWalletLoading(true);
    try {
      const res = await clientWalletPurchase(credits);
      if (res.error) {
        if (res.code === "INSUFFICIENT_BALANCE") {
          toast.error("Saldo insuficiente. Recarregue sua carteira.");
          setShowTopUp(true);
        } else {
          toast.error(res.error);
        }
        return;
      }
      toast.success(`${formatNumber(credits)} créditos comprados com sucesso!`);
      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: ["user-orders"] });
      queryClient.invalidateQueries({ queryKey: ["wallet-transactions"] });
      if (res.order_id) {
        navigate(`/order/${res.order_id}`);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao processar compra");
    } finally {
      setWalletLoading(false);
    }
  };

  const handleAdminGrant = async () => {
    const creditsAmount = parseInt(adminCredits);
    if (!creditsAmount || creditsAmount < 10 || creditsAmount > 100000 || creditsAmount % 10 !== 0) {
      toast.error("Creditos devem ser entre 10 e 100000, em multiplos de 10");
      return;
    }
    setAdminGranting(true);
    try {
      const result = await adminGrantCredits(creditsAmount);
      if (result.ok) {
        toast.success(`${creditsAmount} creditos adicionados com sucesso!`);
        setAdminCredits("");
        await refreshProfile();
        queryClient.invalidateQueries({ queryKey: ["user-orders"] });
      } else {
        toast.error("Erro ao creditar. Tente novamente.");
      }
    } catch {
      toast.error("Erro ao creditar. Verifique se voce e admin.");
    } finally {
      setAdminGranting(false);
    }
  };

  if (showTopUp) {
    return (
      <div className="min-h-screen bg-background pt-20 sm:pt-24 pb-12 sm:pb-16 px-3 sm:px-4">
        <div className="container mx-auto max-w-lg space-y-4">
          <WalletTopUp onClose={() => setShowTopUp(false)} />
        </div>
      </div>
    );
  }

  return (
    <>
    <NoIndex />
    <div className="min-h-screen bg-background pt-20 sm:pt-24 pb-12 sm:pb-16 px-3 sm:px-4">
      <div className="container mx-auto max-w-4xl space-y-4 sm:space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Olá, <span className="text-primary">{displayName}</span> 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Seu painel de créditos</p>
        </motion.div>

        {/* Wallet Card (hero) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Saldo da carteira</p>
                  <p className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums">{formatCurrency(balance)}</p>
                </div>
              </div>
              <Button onClick={() => setShowTopUp(true)} size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" /> Recarregar
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* ═══════════ ADMIN: CREDITOS GRATIS ═══════════ */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-purple-500/30 bg-purple-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-purple-400">
                  <Zap className="h-4 w-4" />
                  Creditos Gratis (Admin)
                </CardTitle>
                <CardDescription>Adicione creditos sem pagar nada</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={adminCredits}
                    onChange={(e) => setAdminCredits(e.target.value)}
                    placeholder="Qtd. creditos"
                    min={10}
                    max={100000}
                    step={10}
                    className="flex-1 rounded-lg border border-purple-500/30 bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                  <Button
                    onClick={handleAdminGrant}
                    disabled={adminGranting || !adminCredits}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {adminGranting ? "Creditando..." : "Creditar Gratis"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="pt-4 pb-3 px-3 text-center">
              <Zap className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-xl font-bold text-foreground tabular-nums">{formatNumber(totalCredits)}</p>
              <p className="text-[10px] text-muted-foreground">Créditos comprados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-3 text-center">
              <Package className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-xl font-bold text-foreground tabular-nums">{completedOrders.length}</p>
              <p className="text-[10px] text-muted-foreground">Pedidos concluídos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-3 text-center">
              <Clock className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-xl font-bold text-foreground tabular-nums">
                {lastOrder ? new Date(lastOrder.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : "—"}
              </p>
              <p className="text-[10px] text-muted-foreground">Último pedido</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Buy */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Zap className="h-5 w-5 text-primary" />
              Compra Rápida
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Escolha a quantidade e pague via PIX ou saldo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-5 p-4 sm:p-6 pt-0 sm:pt-0">
            <div className="text-center">
              <span className="font-display text-4xl sm:text-5xl font-extrabold text-foreground tabular-nums">
                {formatNumber(credits)}
              </span>
              <p className="text-muted-foreground text-xs sm:text-sm mt-1">créditos</p>
            </div>

            <Slider value={[credits]} onValueChange={([v]) => setCredits(v)} min={100} max={10000} step={50} />

            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => setCredits(p)}
                  className={`rounded-full px-3 py-2.5 text-sm font-medium transition-all min-h-[44px] ${
                    credits === p
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "border border-border bg-background text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {formatNumber(p)}
                </button>
              ))}
            </div>

            <div className="rounded-2xl bg-muted/50 border border-border p-4 sm:p-5 text-center">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Preço final</p>
              <span className="font-display text-3xl sm:text-4xl font-extrabold text-primary tabular-nums">
                {formatCurrency(total)}
              </span>
              {savings > 0 && (
                <p className="text-xs sm:text-sm font-bold text-green-600 mt-1">
                  Economia de {formatCurrency(savings)}
                </p>
              )}
            </div>

            {/* Two payment buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                onClick={handleGeneratePix}
                disabled={loading || credits < 100}
                className="w-full rounded-xl py-5 text-base font-bold gap-2 min-h-[48px]"
                size="lg"
              >
                {loading ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> Gerando PIX...</>
                ) : (
                  <><Zap className="h-5 w-5" /> Pagar via PIX</>
                )}
              </Button>
              <Button
                onClick={handleWalletPurchase}
                disabled={walletLoading || credits < 100 || balance < total}
                variant={balance >= total ? "default" : "outline"}
                className="w-full rounded-xl py-5 text-base font-bold gap-2 min-h-[48px]"
                size="lg"
              >
                {walletLoading ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> Processando...</>
                ) : (
                  <><Wallet className="h-5 w-5" /> Pagar com Saldo</>
                )}
              </Button>
            </div>
            {balance < total && balance > 0 && (
              <p className="text-xs text-center text-muted-foreground">
                Saldo insuficiente ({formatCurrency(balance)}).{" "}
                <button onClick={() => setShowTopUp(true)} className="text-primary font-medium hover:underline">Recarregar</button>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-5 pb-4 px-4 space-y-2">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-emerald-400" />
                <CardTitle className="text-sm">Bot WhatsApp</CardTitle>
              </div>
              <p className="text-xs text-muted-foreground">Compre créditos diretamente pelo WhatsApp</p>
              <Button variant="outline" size="sm" className="w-full active:scale-95 transition-transform" asChild>
                <a
                  href={SUPPORT_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Abrir WhatsApp
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-5 pb-4 px-4 space-y-2">
              <div className="flex items-center gap-2">
                <Store className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm">Loja</CardTitle>
                <Badge className="bg-primary/10 text-primary border-0 text-[10px] px-2 py-0">Em breve</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Novos produtos e serviços em breve</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-5 pb-4 px-4 space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm">Programa de Revenda</CardTitle>
              </div>
              <p className="text-xs text-muted-foreground">Ganhe comissões revendendo créditos.</p>
              <Button variant="outline" size="sm" className="w-full active:scale-95 transition-transform" onClick={() => navigate("/revenda")}>
                Acessar Revenda
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="gap-2 min-h-[48px]" onClick={() => openWhatsApp(SUPPORT_LINK)}>
              <MessageCircle className="h-4 w-4" /> Suporte
          </Button>
          <Button variant="outline" className="gap-2 min-h-[48px]" onClick={() => navigate("/como-funciona")}>
            <Zap className="h-4 w-4" /> Como funciona
          </Button>
        </div>

        {/* Tabs: Orders + Wallet History */}
        <Tabs defaultValue="pedidos" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="pedidos" className="gap-1.5">
              <Package className="h-4 w-4" /> Pedidos
            </TabsTrigger>
            <TabsTrigger value="extrato" className="gap-1.5">
              <Wallet className="h-4 w-4" /> Extrato
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pedidos">
            <Card>
              <CardHeader className="p-4 sm:p-6 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Package className="h-5 w-5 text-primary" />
                    Pedidos Recentes
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Últimos 10 pedidos</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => navigate("/history")}>
                  <History className="h-3.5 w-3.5" /> Ver todos
                </Button>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                {ordersLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : orders && orders.length > 0 ? (
                  <div className="space-y-3">
                    {orders.map((order) => {
                      const st = statusMap[order.status] || statusMap.pending;
                      return (
                        <div
                          key={order.id}
                          className="rounded-xl border border-border p-3 sm:p-4 flex items-center justify-between gap-3 cursor-pointer hover:border-primary/30 transition-colors"
                          onClick={() => {
                            if (["pending_payment", "paid", "provisioning"].includes(order.status)) {
                              navigate(`/pix/${order.id}?credits=${order.credits}&amount=${order.price}`);
                            }
                          }}
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground">{formatNumber(order.credits)} créditos</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString("pt-BR")} · {formatCurrency(Number(order.price))}
                            </p>
                          </div>
                          <span className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${st.cls}`}>
                            {st.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center py-10 text-muted-foreground text-sm">Nenhum pedido encontrado.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="extrato">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Wallet className="h-5 w-5 text-primary" /> Extrato da Carteira
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                <WalletHistory />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </>
  );
}
