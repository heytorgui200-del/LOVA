import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Users, Loader2, Plus, Trash2, Search, RefreshCw,
  TrendingUp, DollarSign, ShoppingCart, Mail, Send, Shield, Ban,
  MoreVertical, KeyRound, Wallet, UserX, UserCheck, Crown, Globe, Zap,
  Copy, MessageCircle, AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { formatCurrency, formatNumber } from "@/lib/pricing";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AdminSidebar from "@/components/AdminSidebar";
import AdminNotificationsTab from "@/components/AdminNotificationsTab";
import AdminSeoTab from "@/components/AdminSeoTab";
import AdminClustersTab from "@/components/AdminClustersTab";
import AdminUsersTab from "@/components/AdminUsersTab";
import AdminCommentsTab from "@/components/AdminCommentsTab";
import AdminIntentsTab from "@/components/AdminIntentsTab";
import { clearWhatsAppCache } from "@/lib/whatsapp";
import { NoIndex } from "@/components/NoIndex";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const fadeIn = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } };

function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/javascript:/gi, "");
}

/* ─── ADMIN DASHBOARD ─── */
export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    const saved = localStorage.getItem("admin-theme");
    if (saved === "light") document.documentElement.classList.add("light");
    return () => { document.documentElement.classList.remove("light"); };
  }, []);

  return (
    <>
    <NoIndex />
    <div className="flex min-h-screen bg-background">
      <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 min-w-0 p-6 md:p-10 pt-24 md:pt-10">
        <div className="max-w-7xl mx-auto space-y-8">
          <motion.div {...fadeIn}>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {activeTab === "dashboard" && "Dashboard"}
              {activeTab === "clusters" && "Clusters SEO"}
              {activeTab === "seo" && "Autopilot SEO"}
              {activeTab === "users" && "Usuários"}
              {activeTab === "resellers" && "Revendedores"}
              {activeTab === "pricing" && "Créditos & Preços"}
              {activeTab === "refunds" && "Reembolsos"}
              {activeTab === "comments" && "Comentários"}
              {activeTab === "intents" && "Simulador inteligente"}
              {activeTab === "automation" && "Automação"}
              {activeTab === "settings" && "Configurações"}
            </h1>
          </motion.div>

          <div>
            {activeTab === "dashboard" && <AdminDashboardTab onNavigate={setActiveTab} />}
            {activeTab === "clusters" && <AdminClustersTab />}
            {activeTab === "users" && <AdminUsersTab />}
            {activeTab === "pricing" && <AdminPricingTab />}
            {activeTab === "automation" && <AdminAutomationTab />}
            {activeTab === "resellers" && <AdminResellersTab />}
            {activeTab === "seo" && <AdminSeoTab />}
            {activeTab === "comments" && <AdminCommentsTab />}
            {activeTab === "intents" && <AdminIntentsTab />}
            {activeTab === "refunds" && <AdminRefundsTab />}
            {activeTab === "settings" && <AdminSettingsTab />}
          </div>
        </div>
      </main>
    </div>
    </>
  );
}

/* ═══════════════════════════════════════════════ */
/*  TAB: Dashboard KPIs + Quick Actions             */
/* ═══════════════════════════════════════════════ */
function AdminDashboardTab({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats-financial"],
    queryFn: async () => {
      const [profilesRes, ordersRes, paymentsRes, configRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("*"),
        supabase.from("payments").select("*"),
        supabase.from("api_config").select("*").eq("key_name", "profit_margin").single(),
      ]);
      const orders = ordersRes.data || [];
      const payments = paymentsRes.data || [];
      const marginPct = Number(configRes.data?.key_value) || 35;

      const completedOrders = orders.filter((o) => o.status === "completed");
      const refundedOrders = orders.filter((o) => o.status === "refunded");
      const approvedPayments = payments.filter((p) => p.status === "approved");

      const pixRevenue = approvedPayments.reduce((s, p) => s + Number(p.amount), 0);
      const totalRevenue = completedOrders.reduce((s, o) => s + Number(o.price), 0);
      const totalApiCost = completedOrders.reduce((s, o) => s + Number(o.price) / (1 + marginPct / 100), 0);
      const totalProfit = totalRevenue - totalApiCost;
      const effectiveMargin = totalApiCost > 0 ? (totalProfit / totalApiCost) * 100 : 0;
      const totalCredits = orders.reduce((s, o) => s + o.credits, 0);

      const byMonth: Record<string, { month: string; revenue: number; cost: number; profit: number; orders: number }> = {};
      completedOrders.forEach((o) => {
        const d = new Date(o.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (!byMonth[key]) byMonth[key] = { month: key, revenue: 0, cost: 0, profit: 0, orders: 0 };
        const price = Number(o.price);
        const cost = price / (1 + marginPct / 100);
        byMonth[key].revenue += price;
        byMonth[key].cost += cost;
        byMonth[key].profit += price - cost;
        byMonth[key].orders += 1;
      });

      return {
        totalUsers: profilesRes.count || 0,
        totalOrders: orders.length,
        totalRevenue,
        totalCredits,
        pixRevenue,
        totalApiCost,
        totalProfit,
        effectiveMargin,
        pixCount: approvedPayments.length,
        refundedCount: refundedOrders.length,
        chartData: Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month)),
      };
    },
  });

  if (isLoading) return <LoadingState />;

  const kpis = [
    { label: "Receita Total", value: stats?.pixRevenue || 0, fmt: formatCurrency, iconColor: "text-primary" },
    { label: "Lucro Líquido", value: stats?.totalProfit || 0, fmt: formatCurrency, iconColor: "text-green-500" },
    { label: "Créditos Vendidos", value: stats?.totalCredits || 0, fmt: formatNumber, iconColor: "text-purple-400" },
    { label: "Usuários", value: stats?.totalUsers || 0, fmt: formatNumber, iconColor: "text-blue-400" },
  ];

  const quickActions = [
    { label: "Gerar Página SEO", icon: Globe, tab: "seo", color: "text-primary" },
    { label: "Ver Usuários", icon: Users, tab: "users", color: "text-blue-400" },
    { label: "Créditos & Preços", icon: DollarSign, tab: "pricing", color: "text-green-500" },
    { label: "Automação", icon: Zap, tab: "automation", color: "text-amber-400" },
  ];

  return (
    <motion.div {...fadeIn} className="space-y-8">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className="border-border/50">
            <CardContent className="pt-5 pb-5 px-5">
              <p className="text-xs text-muted-foreground font-medium mb-1">{k.label}</p>
              <p className={`text-2xl md:text-3xl font-bold ${k.iconColor}`}>{k.fmt(k.value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Ações Rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((a) => (
            <button
              key={a.tab}
              onClick={() => onNavigate(a.tab)}
              className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4 hover:bg-muted/50 transition-colors text-left"
            >
              <a.icon className={`h-5 w-5 ${a.color}`} />
              <span className="text-sm font-medium text-foreground">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Financial Summary */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Resumo Financeiro</CardTitle>
          <CardDescription className="text-xs">
            {stats?.totalOrders || 0} pedidos · {stats?.pixCount || 0} PIX · {stats?.refundedCount || 0} estorno(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-xl bg-muted/30">
              <p className="text-xs text-muted-foreground mb-1">Receita PIX</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(stats?.pixRevenue || 0)}</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/30">
              <p className="text-xs text-muted-foreground mb-1">Custo API</p>
              <p className="text-lg font-bold text-destructive">{formatCurrency(stats?.totalApiCost || 0)}</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/30">
              <p className="text-xs text-muted-foreground mb-1">Lucro</p>
              <p className="text-lg font-bold text-green-500">{formatCurrency(stats?.totalProfit || 0)}</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/30">
              <p className="text-xs text-muted-foreground mb-1">Margem</p>
              <p className="text-lg font-bold text-foreground">{(stats?.effectiveMargin || 0).toFixed(1)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardHeader><CardTitle className="text-sm">Receita vs Custo (Mensal)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats?.chartData || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="revenue" name="Receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cost" name="Custo API" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader><CardTitle className="text-sm">Lucro Mensal</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={stats?.chartData || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Line type="monotone" dataKey="profit" name="Lucro" stroke="hsl(142, 76%, 36%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  banned: boolean;
  role: string;
  full_name: string | null;
  wallet_balance: number;
}

/* ═══════════════════════════════════════════════ */
/*  TAB: Pricing (merged from Settings)             */
/* ═══════════════════════════════════════════════ */
function AdminPricingTab() {
  const qc = useQueryClient();
  const [marginPct, setMarginPct] = useState("35");
  const [minCredits, setMinCredits] = useState("10");
  const [costPerCredit, setCostPerCredit] = useState("");
  const [syncing, setSyncing] = useState(false);

  const { data: configs, isLoading } = useQuery({
    queryKey: ["admin-api-config"],
    queryFn: async () => {
      const { data, error } = await supabase.from("api_config").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: pricingData } = useQuery({
    queryKey: ["admin-pricing-cache"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pricing_cache")
        .select("prices, updated_at")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return { prices: (data?.prices as Record<string, number>) || {}, updated_at: data?.updated_at };
    },
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (configs) {
      const margin = configs.find((c) => c.key_name === "profit_margin");
      const min = configs.find((c) => c.key_name === "min_credits");
      const cpc = configs.find((c) => c.key_name === "cost_per_credit");
      if (margin) setMarginPct(margin.key_value);
      if (min) setMinCredits(min.key_value);
      if (cpc) setCostPerCredit(cpc.key_value);
    }
  }, [configs]);

  const saveConfig = useMutation({
    mutationFn: async ({ key_name, key_value }: { key_name: string; key_value: string }) => {
      const { error } = await supabase.from("api_config").upsert({ key_name, key_value, updated_at: new Date().toISOString() }, { onConflict: "key_name" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Configuração salva!");
      qc.invalidateQueries({ queryKey: ["admin-api-config"] });
      qc.invalidateQueries({ queryKey: ["admin-pricing-cache"] });
      qc.invalidateQueries({ queryKey: ["dynamic-pricing"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleSavePricing = async () => {
    const cpc = Number(costPerCredit);
    if (!cpc || cpc <= 0) { toast.error("Informe um custo por crédito válido"); return; }
    setSyncing(true);
    try {
      await supabase.from("api_config").upsert(
        { key_name: "profit_margin", key_value: String(Number(marginPct) || 35), updated_at: new Date().toISOString() },
        { onConflict: "key_name" }
      );
      const { data, error } = await supabase.functions.invoke("sync-pricing", { body: { cost_per_credit: cpc } });
      if (error) throw error;
      if (data?.ok) {
        toast.success("Preços atualizados!");
        qc.invalidateQueries({ queryKey: ["admin-pricing-cache"] });
        qc.invalidateQueries({ queryKey: ["dynamic-pricing"] });
        qc.invalidateQueries({ queryKey: ["admin-api-config"] });
      } else {
        toast.error(data?.error || "Erro ao salvar");
      }
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar");
    } finally {
      setSyncing(false);
    }
  };

  const marginNum = Number(marginPct) || 0;
  const cpcNum = Number(costPerCredit) || 0;
  const TIERS = [100, 500, 1000, 2000, 5000, 10000];

  const previewRows = TIERS.map((qty) => {
    const apiCost = Math.round(qty * cpcNum * 100) / 100;
    const salePrice = Math.ceil(apiCost * (1 + marginNum / 100));
    const profit = salePrice - apiCost;
    const unitPrice = qty > 0 ? salePrice / qty : 0;
    return { qty, apiCost, salePrice, profit, unitPrice };
  });

  return (
    <motion.div {...fadeIn} className="space-y-6">
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><DollarSign className="h-4 w-4" /> Precificação</CardTitle>
          <CardDescription className="text-xs">Defina custo unitário e margem. Preços são calculados automaticamente.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? <LoadingState /> : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Custo por crédito (R$)</Label>
                  <Input type="number" step="0.001" min="0.001" value={costPerCredit} onChange={(e) => setCostPerCredit(e.target.value)} placeholder="0.09" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Margem de lucro (%)</Label>
                  <Input type="number" min="0" max="500" value={marginPct} onChange={(e) => setMarginPct(e.target.value)} placeholder="35" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Mínimo de créditos</Label>
                  <div className="flex gap-2">
                    <Input type="number" min="1" max="10000" value={minCredits} onChange={(e) => setMinCredits(e.target.value)} placeholder="10" />
                    <Button variant="outline" size="sm" onClick={() => saveConfig.mutate({ key_name: "min_credits", key_value: minCredits })} disabled={saveConfig.isPending}>Salvar</Button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button onClick={handleSavePricing} disabled={syncing || !cpcNum} className="gap-2">
                  {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Salvar & Atualizar Preços
                </Button>
                {pricingData?.updated_at && (
                  <span className="text-xs text-muted-foreground">
                    Última atualização: {new Date(pricingData.updated_at).toLocaleString("pt-BR")}
                  </span>
                )}
              </div>

              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground">
                <strong className="text-foreground">Fórmula:</strong> Preço = Créditos × R$ {cpcNum.toFixed(4)} × (1 + {marginNum}%)
              </div>

              {cpcNum > 0 && (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Créditos</TableHead>
                        <TableHead className="text-xs">Custo</TableHead>
                        <TableHead className="text-xs">Preço Venda</TableHead>
                        <TableHead className="text-xs">Lucro</TableHead>
                        <TableHead className="text-xs">Unit.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewRows.map((row) => (
                        <TableRow key={row.qty}>
                          <TableCell className="font-medium">{formatNumber(row.qty)}</TableCell>
                          <TableCell className="text-muted-foreground">{formatCurrency(row.apiCost)}</TableCell>
                          <TableCell className="text-primary font-semibold">{formatCurrency(row.salePrice)}</TableCell>
                          <TableCell className="text-green-500">{formatCurrency(row.profit)}</TableCell>
                          <TableCell className="text-muted-foreground">{formatCurrency(row.unitPrice)}/un</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════ */
/*  TAB: Automation (Emails + Bulk + Notifications) */
/* ═══════════════════════════════════════════════ */
function AdminAutomationTab() {
  return (
    <motion.div {...fadeIn} className="space-y-6">
      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="notifications">Avisos</TabsTrigger>
          <TabsTrigger value="bulk-email">E-mail em Massa</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>
        <TabsContent value="notifications">
          <AdminNotificationsTab />
        </TabsContent>
        <TabsContent value="bulk-email">
          <AdminBulkEmailTab />
        </TabsContent>
        <TabsContent value="templates">
          <AdminEmailsTab />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

/* ─── Bulk Email sub-tab ─── */
function AdminBulkEmailTab() {
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [targetMode, setTargetMode] = useState<"all" | "selected">("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const { data: templates } = useQuery({
    queryKey: ["admin-email-templates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("email_templates").select("*").order("template_key");
      if (error) throw error;
      return data;
    },
  });

  const { data: users } = useQuery({
    queryKey: ["admin-users-full"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-list-users");
      if (error) throw error;
      return data as AuthUser[];
    },
  });

  const toggleUser = (id: string) => {
    setSelectedUsers((prev) => prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]);
  };

  const handleSend = async () => {
    setSending(true);
    try {
      const body: any = { template_key: selectedTemplate };
      if (targetMode === "selected" && selectedUsers.length > 0) body.user_ids = selectedUsers;
      const { data, error } = await supabase.functions.invoke("send-bulk-email", { body });
      if (error) throw error;
      toast.success(`Enviado! ${data.sent} sucesso, ${data.failed} falha(s)`);
      setConfirmOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Erro ao enviar");
    } finally {
      setSending(false);
    }
  };

  const selectedTmpl = templates?.find((t) => t.template_key === selectedTemplate);
  const targetCount = targetMode === "all" ? (users?.length || 0) : selectedUsers.length;

  return (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Template</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger><SelectValue placeholder="Selecione um template..." /></SelectTrigger>
              <SelectContent>
                {templates?.map((t) => (
                  <SelectItem key={t.template_key} value={t.template_key}>
                    {t.template_key} — {t.subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTmpl && (
            <div className="border rounded-lg p-3 bg-muted/30 max-h-[150px] overflow-y-auto text-sm" dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedTmpl.body_html) }} />
          )}

          <div className="space-y-2">
            <Label className="text-xs">Destinatários</Label>
            <Select value={targetMode} onValueChange={(v: "all" | "selected") => setTargetMode(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos ({users?.length || 0})</SelectItem>
                <SelectItem value="selected">Seleção manual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {targetMode === "selected" && users && (
            <div className="border rounded-lg p-3 max-h-[200px] overflow-y-auto space-y-1">
              {users.map((u) => (
                <label key={u.id} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded cursor-pointer">
                  <Checkbox checked={selectedUsers.includes(u.id)} onCheckedChange={() => toggleUser(u.id)} />
                  <div>
                    <p className="text-sm font-medium">{u.full_name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                </label>
              ))}
            </div>
          )}

          <Button onClick={() => setConfirmOpen(true)} disabled={!selectedTemplate || (targetMode === "selected" && selectedUsers.length === 0)} className="gap-2">
            <Send className="h-4 w-4" /> Disparar para {targetCount} usuário(s)
          </Button>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Envio</DialogTitle>
            <DialogDescription>
              Template: <strong>{selectedTemplate}</strong><br />
              Destinatários: <strong>{targetCount}</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
            <Button onClick={handleSend} disabled={sending} className="gap-2">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── Email Templates sub-tab ─── */
function AdminEmailsTab() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ template_key: "", subject: "", body_html: "" });
  const [previewKey, setPreviewKey] = useState<string | null>(null);

  const { data: templates, isLoading } = useQuery({
    queryKey: ["admin-email-templates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("email_templates").select("*").order("template_key");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        const { error } = await supabase.from("email_templates").update({
          subject: form.subject, body_html: form.body_html, updated_at: new Date().toISOString(),
        }).eq("id", editing);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("email_templates").insert({
          template_key: form.template_key, subject: form.subject, body_html: form.body_html,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Template atualizado!" : "Template criado!");
      setEditing(null);
      setForm({ template_key: "", subject: "", body_html: "" });
      qc.invalidateQueries({ queryKey: ["admin-email-templates"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("email_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Template removido!"); qc.invalidateQueries({ queryKey: ["admin-email-templates"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const startEdit = (tmpl: any) => {
    setEditing(tmpl.id);
    setForm({ template_key: tmpl.template_key, subject: tmpl.subject, body_html: tmpl.body_html });
  };

  const previewTemplate = templates?.find((t) => t.id === previewKey);

  return (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-sm">{editing ? "Editar Template" : "Novo Template"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Chave</Label>
              <Input value={form.template_key} onChange={(e) => setForm({ ...form, template_key: e.target.value })} placeholder="ex: welcome" disabled={!!editing} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Assunto</Label>
              <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Assunto do e-mail" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Corpo HTML</Label>
            <Textarea value={form.body_html} onChange={(e) => setForm({ ...form, body_html: e.target.value })} placeholder="<h1>Olá</h1>" rows={8} className="font-mono text-sm" />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => saveMutation.mutate()} disabled={(!form.template_key && !editing) || !form.subject || !form.body_html || saveMutation.isPending} className="gap-2">
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editing ? "Atualizar" : "Criar"}
            </Button>
            {editing && <Button variant="outline" onClick={() => { setEditing(null); setForm({ template_key: "", subject: "", body_html: "" }); }}>Cancelar</Button>}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader><CardTitle className="text-sm">Templates</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <LoadingState /> : templates && templates.length > 0 ? (
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs">Chave</TableHead>
                <TableHead className="text-xs">Assunto</TableHead>
                <TableHead className="text-xs">Ações</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {templates.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-sm">{t.template_key}</TableCell>
                    <TableCell>{t.subject}</TableCell>
                    <TableCell className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => startEdit(t)}>Editar</Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : <p className="text-center py-6 text-muted-foreground text-sm">Nenhum template.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════ */
/*  TAB: Settings (API keys + WhatsApp + Video)     */
/* ═══════════════════════════════════════════════ */
function AdminSettingsTab() {
  const qc = useQueryClient();
  const [pixKey, setPixKey] = useState("");
  const [resellerKey, setResellerKey] = useState("");
  const [whatsappLink, setWhatsappLink] = useState("");
  const [lightTheme, setLightTheme] = useState(() => localStorage.getItem("admin-theme") === "light");

  const { data: configs, isLoading } = useQuery({
    queryKey: ["admin-api-config"],
    queryFn: async () => {
      const { data, error } = await supabase.from("api_config").select("*");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (configs) {
      const pix = configs.find((c) => c.key_name === "pix_api_key");
      const reseller = configs.find((c) => c.key_name === "reseller_api_key");
      const wpp = configs.find((c) => c.key_name === "whatsapp_number");
      if (pix) setPixKey(pix.key_value);
      if (reseller) setResellerKey(reseller.key_value);
      if (wpp) setWhatsappLink(wpp.key_value);
    }
  }, [configs]);

  const saveConfig = useMutation({
    mutationFn: async ({ key_name, key_value }: { key_name: string; key_value: string }) => {
      const { error } = await supabase.from("api_config").upsert({ key_name, key_value, updated_at: new Date().toISOString() }, { onConflict: "key_name" });
      if (error) throw error;
      return key_name;
    },
    onSuccess: (key_name) => {
      toast.success("Salvo!");
      if (key_name === "whatsapp_number") clearWhatsAppCache();
      qc.invalidateQueries({ queryKey: ["admin-api-config"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <motion.div {...fadeIn} className="space-y-6">
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-sm">Chaves de API</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {isLoading ? <LoadingState /> : (
            <>
              <div className="space-y-2">
                <Label className="text-xs">Chave API PIX / Mercado Pago</Label>
                <div className="flex gap-2">
                  <Input type="password" value={pixKey} onChange={(e) => setPixKey(e.target.value)} placeholder="Chave de API PIX..." />
                  <Button variant="outline" onClick={() => saveConfig.mutate({ key_name: "pix_api_key", key_value: pixKey })} disabled={!pixKey || saveConfig.isPending}>Salvar</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Chave API de Revenda</Label>
                <div className="flex gap-2">
                  <Input type="password" value={resellerKey} onChange={(e) => setResellerKey(e.target.value)} placeholder="Chave de API revenda..." />
                  <Button variant="outline" onClick={() => saveConfig.mutate({ key_name: "reseller_api_key", key_value: resellerKey })} disabled={!resellerKey || saveConfig.isPending}>Salvar</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Número WhatsApp (Suporte)</Label>
                <div className="flex gap-2">
                  <Input value={whatsappLink} onChange={(e) => setWhatsappLink(e.target.value)} placeholder="5516981968813" />
                  <Button variant="outline" onClick={() => saveConfig.mutate({ key_name: "whatsapp_number", key_value: whatsappLink })} disabled={!whatsappLink || saveConfig.isPending}>Salvar</Button>
                </div>
                <p className="text-xs text-muted-foreground">Número com DDI (ex: 5516981968813)</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader><CardTitle className="text-sm">🎬 Vídeo Tutorial</CardTitle></CardHeader>
        <CardContent><VideoUploader /></CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Tema Claro</p>
              <p className="text-xs text-muted-foreground">Modo claro apenas no painel admin</p>
            </div>
            <Switch
              checked={lightTheme}
              onCheckedChange={(checked) => {
                setLightTheme(checked);
                document.documentElement.classList.toggle("light", checked);
                localStorage.setItem("admin-theme", checked ? "light" : "dark");
              }}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════ */
/*  TAB: Resellers                                   */
/* ═══════════════════════════════════════════════ */
function AdminResellersTab() {
  const queryClient = useQueryClient();

  const { data: resellers, isLoading } = useQuery({
    queryKey: ["admin-resellers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("resellers").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["admin-reseller-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name");
      return data || [];
    },
  });

  const profileMap = new Map(profiles?.map((p) => [p.id, p.full_name]) || []);

  const [showAdd, setShowAdd] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addMargin, setAddMargin] = useState("20");
  const [addLoading, setAddLoading] = useState(false);

  const handleAddReseller = async () => {
    if (!addEmail.trim()) return;
    setAddLoading(true);
    try {
      const { data: users, error: uErr } = await supabase.functions.invoke("admin-list-users");
      if (uErr) throw uErr;
      const found = (users as AuthUser[]).find((u) => u.email.toLowerCase() === addEmail.toLowerCase().trim());
      if (!found) { toast.error("Usuário não encontrado"); return; }
      const existing = resellers?.find((r) => r.user_id === found.id);
      if (existing) { toast.error("Já é revendedor"); return; }
      const { error } = await supabase.from("resellers").insert({ user_id: found.id, status: "active", margin_pct: Number(addMargin) || 20 });
      if (error) throw error;
      toast.success(`Revendedor ${addEmail} adicionado!`);
      setShowAdd(false);
      setAddEmail("");
      queryClient.invalidateQueries({ queryKey: ["admin-resellers"] });
    } catch { toast.error("Erro ao adicionar"); } finally { setAddLoading(false); }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const { error } = await supabase.from("resellers").update({ status: newStatus }).eq("id", id);
    if (error) { toast.error("Erro"); return; }
    toast.success(newStatus === "active" ? "Ativado" : "Desativado");
    queryClient.invalidateQueries({ queryKey: ["admin-resellers"] });
  };

  const updateMargin = async (id: string, margin: number) => {
    const { error } = await supabase.from("resellers").update({ margin_pct: margin }).eq("id", id);
    if (error) { toast.error("Erro"); return; }
    toast.success("Margem atualizada");
    queryClient.invalidateQueries({ queryKey: ["admin-resellers"] });
  };

  const deleteReseller = async (id: string) => {
    const { error } = await supabase.from("resellers").delete().eq("id", id);
    if (error) { toast.error("Erro"); return; }
    toast.success("Removido");
    queryClient.invalidateQueries({ queryKey: ["admin-resellers"] });
  };

  return (
    <motion.div {...fadeIn} className="space-y-4">
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Revendedores</CardTitle>
            <Button size="sm" onClick={() => setShowAdd(true)} className="gap-1.5">
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? <LoadingState /> : resellers && resellers.length > 0 ? (
            <div className="space-y-3">
              {resellers.map((r) => {
                const name = profileMap.get(r.user_id) || r.user_id.slice(0, 8);
                return (
                  <div key={r.id} className="rounded-xl border border-border/50 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{name}</p>
                      <p className="text-xs text-muted-foreground">Desde {new Date(r.created_at!).toLocaleDateString("pt-BR")}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-muted-foreground">Margem:</span>
                      <Input
                        type="number" min={0} max={100} defaultValue={r.margin_pct ?? 20}
                        className="w-16 h-7 text-xs text-center px-1"
                        onBlur={(e) => { const val = Number(e.target.value); if (!isNaN(val) && val !== r.margin_pct) updateMargin(r.id, val); }}
                        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                      <Badge variant={r.status === "active" ? "default" : "secondary"}>
                        {r.status === "active" ? "Ativo" : r.status === "pending" ? "Pendente" : "Inativo"}
                      </Badge>
                      <Switch checked={r.status === "active"} onCheckedChange={() => toggleStatus(r.id, r.status)} />
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { if (confirm("Remover?")) deleteReseller(r.id); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <p className="text-center py-8 text-muted-foreground text-sm">Nenhum revendedor.</p>}
        </CardContent>
      </Card>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Revendedor</DialogTitle>
            <DialogDescription>Insira o e-mail do usuário cadastrado</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">E-mail</Label>
              <Input value={addEmail} onChange={(e) => setAddEmail(e.target.value)} placeholder="email@exemplo.com" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Margem (%)</Label>
              <Input type="number" value={addMargin} onChange={(e) => setAddMargin(e.target.value)} placeholder="20" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancelar</Button>
            <Button onClick={handleAddReseller} disabled={addLoading || !addEmail.trim()}>
              {addLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════ */
/*  TAB: Refunds                                     */
/* ═══════════════════════════════════════════════ */
function AdminRefundsTab() {
  const queryClient = useQueryClient();
  const [autoRefund, setAutoRefund] = useState(false);
  const [autoRefundLoading, setAutoRefundLoading] = useState(true);

  const { data: refunds, isLoading } = useQuery({
    queryKey: ["admin-refunds"],
    queryFn: async () => {
      const { data, error } = await supabase.from("refund_requests").select("*, orders(credits, price, order_type, master_email)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["admin-refund-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name");
      return data || [];
    },
  });

  // Mapa userId → email (via edge function admin-list-users, com role check)
  const { data: emailMap } = useQuery({
    queryKey: ["admin-refund-emails"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-list-users");
      if (error) return {};
      const map: Record<string, string> = {};
      (Array.isArray(data) ? data : []).forEach((u: any) => {
        if (u?.id && u?.email) map[u.id] = u.email;
      });
      return map;
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    supabase.from("api_config").select("key_value").eq("key_name", "auto_refund_enabled").maybeSingle().then(({ data }) => {
      setAutoRefund(data?.key_value === "true");
      setAutoRefundLoading(false);
    });
  }, []);

  const handleAutoRefundToggle = async (checked: boolean) => {
    setAutoRefund(checked);
    const { error } = await supabase.from("api_config").upsert(
      { key_name: "auto_refund_enabled", key_value: String(checked), updated_at: new Date().toISOString() },
      { onConflict: "key_name" }
    );
    if (error) { toast.error("Erro"); setAutoRefund(!checked); return; }
    toast.success(checked ? "Automático ativado" : "Automático desativado");
  };

  const processRefund = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "approve" | "reject" }) => {
      const { data, error } = await supabase.functions.invoke("process-refund", { body: { refund_request_id: id, action } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (_, vars) => {
      toast.success(vars.action === "approve" ? "Aprovado!" : "Rejeitado.");
      queryClient.invalidateQueries({ queryKey: ["admin-refunds"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const pending = refunds?.filter((r) => r.status === "pending") || [];
  const processed = refunds?.filter((r) => r.status !== "pending") || [];

  if (isLoading) return <LoadingState />;

  return (
    <motion.div {...fadeIn} className="space-y-6">
      <Card className="border-border/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Reembolso Automático</p>
              <p className="text-xs text-muted-foreground">Aprovar automaticamente sem revisão</p>
            </div>
            <Switch checked={autoRefund} onCheckedChange={handleAutoRefundToggle} disabled={autoRefundLoading} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-sm">Pendentes ({pending.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhum pendente 🎉</p>
          ) : (
            <div className="space-y-3">
              {pending.map((r) => (
                <div key={r.id} className="rounded-lg border border-border/50 p-4 space-y-3">
                  <RefundClientCard refund={r} profiles={profiles} emailMap={emailMap} />
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/30">
                    <p className="text-xs text-muted-foreground">
                      {r.refund_type === "mercadopago" ? "💳 MP" : "👛 Wallet"} · R$ {Number(r.amount).toFixed(2)} · {(r as any).orders?.credits || "?"} créditos
                    </p>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" onClick={() => processRefund.mutate({ id: r.id, action: "approve" })} disabled={processRefund.isPending}>Aprovar</Button>
                      <Button size="sm" variant="destructive" onClick={() => processRefund.mutate({ id: r.id, action: "reject" })} disabled={processRefund.isPending}>Rejeitar</Button>
                    </div>
                  </div>
                  {r.reason && <p className="text-xs text-muted-foreground italic">"{r.reason}"</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {processed.length > 0 && (
        <Card className="border-border/50">
          <CardHeader><CardTitle className="text-sm">Histórico</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {processed.map((r) => (
                <div key={r.id} className="rounded-lg border border-border/30 p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <RefundClientCard refund={r} profiles={profiles} emailMap={emailMap} compact />
                    </div>
                    <Badge variant={r.status === "approved" ? "default" : "destructive"} className="shrink-0">
                      {r.status === "approved" ? "Aprovado" : r.status === "rejected" ? "Rejeitado" : r.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {r.refund_type === "mercadopago" ? "💳 MP" : "👛 Wallet"} · R$ {Number(r.amount).toFixed(2)} · {new Date(r.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

/* ─── Refund Client Identification Card ─── */
function RefundClientCard({
  refund,
  profiles,
  emailMap,
  compact = false,
}: {
  refund: any;
  profiles?: { id: string; full_name: string | null }[];
  emailMap?: Record<string, string>;
  compact?: boolean;
}) {
  const userId: string | null = refund.user_id;
  const order = refund.orders;
  const mpId: string | null = refund.mercadopago_payment_id;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(
      () => toast.success(`${label} copiado!`),
      () => toast.error("Erro ao copiar")
    );
  };

  if (userId) {
    const profile = profiles?.find((p) => p.id === userId);
    const fullName = profile?.full_name?.trim() || "(sem nome)";
    const email = emailMap?.[userId];
    const shortId = userId.slice(0, 8);

    return (
      <div className="space-y-1.5 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{fullName}</p>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {email ? (
            <button
              onClick={() => copyToClipboard(email, "Email")}
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors max-w-full"
              title="Copiar email"
            >
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{email}</span>
              <Copy className="h-3 w-3 shrink-0 opacity-60" />
            </button>
          ) : (
            <span className="text-xs text-muted-foreground">Email indisponível</span>
          )}
          <span className="text-muted-foreground/60">·</span>
          <button
            onClick={() => copyToClipboard(userId, "User ID")}
            className="font-mono text-muted-foreground hover:text-foreground transition-colors"
            title="Copiar User ID completo"
          >
            ID: {shortId}
          </button>
        </div>
        {!compact && mpId && (
          <button
            onClick={() => copyToClipboard(mpId, "ID Mercado Pago")}
            className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
            title="Copiar ID do pagamento Mercado Pago"
          >
            <span className="text-muted-foreground/60">MP:</span>
            <span>{mpId}</span>
            <Copy className="h-3 w-3 opacity-60" />
          </button>
        )}
      </div>
    );
  }

  // Guest (sem conta cadastrada)
  const lovableEmail: string | null = order?.master_email || null;
  const orderShort = refund.order_id ? String(refund.order_id).slice(0, 8) : "—";
  const createdAt = new Date(refund.created_at);

  return (
    <div className="space-y-2 min-w-0">
      <div className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/10 border border-amber-500/30 px-2 py-1 text-xs text-amber-600 dark:text-amber-400">
        <AlertTriangle className="h-3 w-3" />
        <span className="font-medium">Convidado (sem conta)</span>
      </div>
      <div className="space-y-1 text-xs">
        {lovableEmail ? (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Email Lovable:</span>
            <button
              onClick={() => copyToClipboard(lovableEmail, "Email")}
              className="inline-flex items-center gap-1 text-foreground hover:text-primary transition-colors max-w-full"
              title="Copiar email"
            >
              <span className="truncate">{lovableEmail}</span>
              <Copy className="h-3 w-3 shrink-0 opacity-60" />
            </button>
          </div>
        ) : (
          <p className="text-muted-foreground">Sem email cadastrado no pedido</p>
        )}
        <p className="text-muted-foreground font-mono">
          Pedido: #{orderShort} · {createdAt.toLocaleDateString("pt-BR")} {createdAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </p>
        {!compact && mpId && (
          <button
            onClick={() => copyToClipboard(mpId, "ID Mercado Pago")}
            className="inline-flex items-center gap-1 font-mono text-muted-foreground hover:text-foreground transition-colors"
            title="Copiar ID do pagamento Mercado Pago"
          >
            <span className="text-muted-foreground/60">MP:</span>
            <span>{mpId}</span>
            <Copy className="h-3 w-3 opacity-60" />
          </button>
        )}
      </div>
      {!compact && lovableEmail && (
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={() => copyToClipboard(lovableEmail, "Email")}
          >
            <Copy className="h-3 w-3" /> Copiar email
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            asChild
          >
            <a
              href={`https://web.whatsapp.com/send?text=${encodeURIComponent(`Olá! Sobre seu pedido na LovaBoost (email: ${lovableEmail}, pedido #${orderShort})...`)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="h-3 w-3" /> WhatsApp
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}

/* ─── Video Uploader ─── */
import { Upload } from "lucide-react";

function VideoUploader() {
  const [uploading, setUploading] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("api_config").select("key_value").eq("key_name", "tutorial_video_url").maybeSingle().then(({ data }) => {
      if (data?.key_value) setCurrentUrl(data.key_value);
    });
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) { toast.error("Selecione um vídeo"); return; }
    setUploading(true);
    try {
      const path = `tutorial-${Date.now()}.mp4`;
      const { error: upErr } = await supabase.storage.from("videos").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("videos").getPublicUrl(path);
      await supabase.from("api_config").upsert(
        { key_name: "tutorial_video_url", key_value: urlData.publicUrl, updated_at: new Date().toISOString() },
        { onConflict: "key_name" }
      );
      setCurrentUrl(urlData.publicUrl);
      toast.success("Vídeo enviado!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {currentUrl && <video src={currentUrl} controls className="w-full max-h-64 rounded-xl border border-border" preload="metadata" />}
      <Button asChild variant="outline" disabled={uploading} className="gap-2">
        <label className="cursor-pointer">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Enviando..." : "Enviar MP4"}
          <input type="file" accept="video/*" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </Button>
    </div>
  );
}

/* ─── Loading ─── */
function LoadingState() {
  return (
    <div className="flex justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}
