import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Search, RefreshCw, Loader2, Shield, Ban, UserCheck, UserX,
  Wallet, DollarSign, KeyRound, Mail, Eye,
  TrendingUp, ShoppingCart, ArrowUpRight, ArrowDownRight, Store,
  Calendar, Clock, AlertTriangle, Lock, ShieldAlert, ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/pricing";

// ── Types ──
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

interface WalletTx {
  id: string;
  type: string;
  amount: number;
  description: string;
  created_at: string;
  order_id: string | null;
}

interface ResellerInfo {
  id: string;
  user_id: string;
  status: string;
  margin_pct: number;
  created_at: string;
}

type SortField = "name" | "balance" | "created" | "login";
type SortDir = "asc" | "desc";

// ── Main Component ──
export default function AdminUsersTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("created");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [detailUser, setDetailUser] = useState<AuthUser | null>(null);
  const [actionModal, setActionModal] = useState<{ user: AuthUser; action: string } | null>(null);
  const [actionValue, setActionValue] = useState("");
  const [actionReason, setActionReason] = useState("");
  const [actionType, setActionType] = useState("correction");
  const [confirmText, setConfirmText] = useState("");

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ["admin-users-full"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-list-users");
      if (error) throw error;
      return data as AuthUser[];
    },
  });

  const { data: resellers } = useQuery({
    queryKey: ["admin-resellers-map"],
    queryFn: async () => {
      const { data, error } = await supabase.from("resellers").select("*");
      if (error) throw error;
      return data as ResellerInfo[];
    },
  });

  const manageMutation = useMutation({
    mutationFn: async ({ user_id, action, payload }: { user_id: string; action: string; payload?: any }) => {
      const { data, error } = await supabase.functions.invoke("admin-manage-user", {
        body: { user_id, action, payload },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success("Ação executada com sucesso");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["user-financials"] });
      closeAction();
    },
    onError: (e: Error) => toast.error(e.message || "Erro"),
  });

  const closeAction = () => {
    setActionModal(null);
    setActionValue("");
    setActionReason("");
    setActionType("correction");
    setConfirmText("");
  };

  const getAccountType = (u: AuthUser): string => {
    if (u.role === "admin") return "admin";
    const reseller = resellers?.find((r) => r.user_id === u.id && r.status === "active");
    if (reseller) return "reseller";
    return "client";
  };

  const accountTypeBadge = (type: string) => {
    switch (type) {
      case "admin": return <Badge className="bg-primary/10 text-primary border-primary/20"><Shield className="h-3 w-3 mr-1" />Admin</Badge>;
      case "reseller": return <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20"><Store className="h-3 w-3 mr-1" />Revendedor</Badge>;
      default: return <Badge variant="secondary">Cliente</Badge>;
    }
  };

  const statusBadge = (u: AuthUser) => {
    if (u.banned) return <Badge variant="destructive"><Ban className="h-3 w-3 mr-1" />Bloqueado</Badge>;
    return <Badge variant="outline" className="text-green-500 border-green-500/30">Ativo</Badge>;
  };

  const filtered = users?.filter((u) => {
    const matchSearch =
      (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.id.toLowerCase().includes(search.toLowerCase());
    const type = getAccountType(u);
    const matchRole = roleFilter === "all" || type === roleFilter;
    const matchStatus = statusFilter === "all" ||
      (statusFilter === "banned" && u.banned) ||
      (statusFilter === "active" && !u.banned) ||
      (statusFilter === "no_balance" && u.wallet_balance === 0) ||
      (statusFilter === "high_balance" && u.wallet_balance >= 100);
    return matchSearch && matchRole && matchStatus;
  });

  const sorted = filtered?.sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case "name": cmp = (a.full_name || "").localeCompare(b.full_name || ""); break;
      case "balance": cmp = a.wallet_balance - b.wallet_balance; break;
      case "created": cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime(); break;
      case "login": cmp = new Date(a.last_sign_in_at || 0).getTime() - new Date(b.last_sign_in_at || 0).getTime(); break;
    }
    return sortDir === "desc" ? -cmp : cmp;
  });

  const openAction = (user: AuthUser, action: string) => {
    setActionModal({ user, action });
    setActionValue("");
    setActionReason("");
    setConfirmText("");
  };

  const executeAction = () => {
    if (!actionModal) return;
    const { user, action } = actionModal;

    switch (action) {
      case "add_credits":
      case "remove_credits": {
        const amount = Number(actionValue);
        if (!amount || amount <= 0) { toast.error("Valor inválido"); return; }
        if (!actionReason.trim()) { toast.error("Informe o motivo"); return; }
        manageMutation.mutate({
          user_id: user.id,
          action,
          payload: { amount, reason: actionReason, type: actionType },
        });
        break;
      }
      case "set_password":
        if (actionValue.length < 6) { toast.error("Mínimo 6 caracteres"); return; }
        manageMutation.mutate({ user_id: user.id, action: "set_password", payload: { password: actionValue } });
        break;
      case "ban":
        if (confirmText !== "BLOQUEAR") { toast.error("Digite BLOQUEAR para confirmar"); return; }
        manageMutation.mutate({ user_id: user.id, action: "ban" });
        break;
      case "unban":
        manageMutation.mutate({ user_id: user.id, action: "unban" });
        break;
      case "delete":
        if (confirmText !== "EXCLUIR PERMANENTEMENTE") { toast.error("Digite EXCLUIR PERMANENTEMENTE para confirmar"); return; }
        manageMutation.mutate({ user_id: user.id, action: "delete" });
        break;
      case "reset_password":
        supabase.functions.invoke("admin-reset-password", { body: { email: user.email } })
          .then(({ error }) => {
            if (error) toast.error("Erro ao resetar");
            else toast.success(`E-mail de reset enviado para ${user.email}`);
            closeAction();
          });
        return;
    }
  };

  const isCritical = (action: string) => ["ban", "delete"].includes(action);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="pt-5 space-y-3">
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome, email ou ID..." className="pl-9 h-9" />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="client">Clientes</SelectItem>
                <SelectItem value="reseller">Revendedores</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="banned">Bloqueados</SelectItem>
                <SelectItem value="no_balance">Sem saldo</SelectItem>
                <SelectItem value="high_balance">Saldo alto (&ge;R$100)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={`${sortField}-${sortDir}`} onValueChange={(v) => {
              const [f, d] = v.split("-") as [SortField, SortDir];
              setSortField(f); setSortDir(d);
            }}>
              <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="created-desc">Mais recente</SelectItem>
                <SelectItem value="created-asc">Mais antigo</SelectItem>
                <SelectItem value="balance-desc">Maior saldo</SelectItem>
                <SelectItem value="balance-asc">Menor saldo</SelectItem>
                <SelectItem value="login-desc">Último login</SelectItem>
                <SelectItem value="name-asc">Nome A-Z</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /></Button>
          </div>
          <p className="text-xs text-muted-foreground">{sorted?.length || 0} usuário(s)</p>
        </CardContent>
      </Card>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : !sorted?.length ? (
        <p className="text-center py-8 text-muted-foreground">Nenhum usuário encontrado.</p>
      ) : (
        <Card className="border-border/50">
          <CardContent className="p-0">
            {/* Mobile cards */}
            <div className="md:hidden p-4 space-y-3">
              {sorted.map((u) => (
                <button key={u.id} onClick={() => setDetailUser(u)} className="w-full text-left rounded-xl bg-card border border-border/50 p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{u.full_name || u.email}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                    <span className="text-sm font-bold text-green-500 ml-2">{formatCurrency(u.wallet_balance)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {accountTypeBadge(getAccountType(u))}
                    {statusBadge(u)}
                  </div>
                </button>
              ))}
            </div>

            {/* Desktop table — NO role/permission actions here */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Nome</TableHead>
                    <TableHead className="text-xs">E-mail</TableHead>
                    <TableHead className="text-xs">Tipo</TableHead>
                    <TableHead className="text-xs">Saldo</TableHead>
                    <TableHead className="text-xs">Cadastro</TableHead>
                    <TableHead className="text-xs">Último Login</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((u) => {
                    const type = getAccountType(u);
                    return (
                      <TableRow key={u.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setDetailUser(u)}>
                        <TableCell className="font-medium text-sm">{u.full_name || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                        <TableCell>{accountTypeBadge(type)}</TableCell>
                        <TableCell className="text-sm font-semibold text-green-500">{formatCurrency(u.wallet_balance)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString("pt-BR") : "—"}
                        </TableCell>
                        <TableCell>{statusBadge(u)}</TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setDetailUser(u)}>
                            <Eye className="h-3 w-3" /> Ver Perfil
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── User Detail Drawer ── */}
      {detailUser && (
        <UserDetailDrawer
          user={detailUser}
          accountType={getAccountType(detailUser)}
          reseller={resellers?.find((r) => r.user_id === detailUser.id)}
          onClose={() => setDetailUser(null)}
          onAction={(action) => openAction(detailUser, action)}
        />
      )}

      {/* ── Action Modal ── */}
      <Dialog open={!!actionModal} onOpenChange={(open) => { if (!open) closeAction(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isCritical(actionModal?.action || "") && <AlertTriangle className="h-5 w-5 text-destructive" />}
              {getActionTitle(actionModal?.action || "")}
            </DialogTitle>
            <DialogDescription>{actionModal?.user.email}</DialogDescription>
          </DialogHeader>

          {/* Password */}
          {actionModal?.action === "set_password" && (
            <div className="space-y-2">
              <Label>Nova Senha</Label>
              <Input type="password" value={actionValue} onChange={(e) => setActionValue(e.target.value)} placeholder="Mínimo 6 caracteres" />
            </div>
          )}

          {/* Reset password */}
          {actionModal?.action === "reset_password" && (
            <p className="text-sm text-muted-foreground">
              Um e-mail de redefinição será enviado para <strong>{actionModal.user.email}</strong>.
            </p>
          )}

          {/* Credits */}
          {(actionModal?.action === "add_credits" || actionModal?.action === "remove_credits") && (
            <div className="space-y-3">
              <div>
                <Label>Valor (R$)</Label>
                <Input type="number" step="0.01" min="0.01" value={actionValue} onChange={(e) => setActionValue(e.target.value)} placeholder="0.00" />
                <p className="text-xs text-muted-foreground mt-1">
                  Saldo atual: <strong>{formatCurrency(actionModal.user.wallet_balance)}</strong>
                  {actionValue && Number(actionValue) > 0 && (
                    <> → <strong className={actionModal.action === "add_credits" ? "text-green-500" : "text-destructive"}>
                      {formatCurrency(actionModal.action === "add_credits"
                        ? actionModal.user.wallet_balance + Number(actionValue)
                        : Math.max(0, actionModal.user.wallet_balance - Number(actionValue))
                      )}
                    </strong></>
                  )}
                </p>
              </div>
              <div>
                <Label>Tipo de Ajuste</Label>
                <Select value={actionType} onValueChange={setActionType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bonus">Bônus</SelectItem>
                    <SelectItem value="correction">Correção</SelectItem>
                    <SelectItem value="refund">Reembolso</SelectItem>
                    <SelectItem value="manual_discount">Desconto manual</SelectItem>
                    <SelectItem value="prize">Prêmio</SelectItem>
                    <SelectItem value="penalty">Penalidade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Motivo</Label>
                <Textarea value={actionReason} onChange={(e) => setActionReason(e.target.value)} placeholder="Descreva o motivo do ajuste..." rows={2} />
              </div>
            </div>
          )}

          {/* Ban */}
          {actionModal?.action === "ban" && (
            <div className="space-y-3">
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                <p className="text-sm text-destructive font-medium flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4" /> Bloquear conta
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  O usuário será desconectado imediatamente e não poderá mais acessar o sistema. Seu saldo será mantido.
                </p>
              </div>
              <div>
                <Label>Digite <strong>BLOQUEAR</strong> para confirmar</Label>
                <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="BLOQUEAR" />
              </div>
            </div>
          )}

          {/* Unban */}
          {actionModal?.action === "unban" && (
            <p className="text-sm text-muted-foreground">
              O usuário será desbloqueado e poderá acessar o sistema normalmente.
            </p>
          )}

          {/* Delete */}
          {actionModal?.action === "delete" && (
            <div className="space-y-3">
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
                <p className="text-sm text-destructive font-bold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> Exclusão permanente e irreversível
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Todos os dados serão removidos permanentemente: pedidos, pagamentos, saldo, histórico de transações e logs.
                  <strong className="text-destructive"> Esta ação NÃO pode ser desfeita.</strong>
                </p>
                <ul className="text-xs text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                  <li>Saldo atual: {formatCurrency(actionModal.user.wallet_balance)}</li>
                  <li>E-mail: {actionModal.user.email}</li>
                </ul>
              </div>
              <div>
                <Label>Digite <strong>EXCLUIR PERMANENTEMENTE</strong> para confirmar</Label>
                <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="EXCLUIR PERMANENTEMENTE" className="border-destructive/30" />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeAction}>Cancelar</Button>
            <Button
              variant={isCritical(actionModal?.action || "") ? "destructive" : "default"}
              onClick={executeAction}
              disabled={manageMutation.isPending}
            >
              {manageMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Action titles ──
function getActionTitle(action: string): string {
  const map: Record<string, string> = {
    set_password: "Definir Nova Senha",
    reset_password: "Resetar Senha por E-mail",
    add_credits: "Adicionar Saldo",
    remove_credits: "Remover Saldo",
    ban: "Bloquear Conta",
    unban: "Desbloquear Conta",
    delete: "Excluir Conta Permanentemente",
  };
  return map[action] || action;
}

// ── User Detail Drawer ──
function UserDetailDrawer({
  user, accountType, reseller, onClose, onAction,
}: {
  user: AuthUser;
  accountType: string;
  reseller?: ResellerInfo;
  onClose: () => void;
  onAction: (action: string) => void;
}) {
  const [tab, setTab] = useState("summary");

  // Financials
  const { data: financials } = useQuery({
    queryKey: ["user-financials", user.id],
    queryFn: async () => {
      const [ordersRes, walletsRes] = await Promise.all([
        supabase.from("orders").select("*").eq("user_id", user.id),
        supabase.from("wallet_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      const orders = ordersRes.data || [];
      const wallets = walletsRes.data || [];

      const completed = orders.filter((o) => o.status === "completed");
      const refunded = orders.filter((o) => o.status === "refunded");
      const manualCredits = wallets.filter((w) => w.type === "credit" && !w.order_id);
      const manualDebits = wallets.filter((w) => w.type === "debit" && !w.order_id);

      const totalPurchased = completed.reduce((s, o) => s + Number(o.price), 0);
      const totalCredits = completed.reduce((s, o) => s + o.credits, 0);
      const totalRefunded = refunded.reduce((s, o) => s + Number(o.price), 0);

      return {
        totalPurchased,
        totalSpent: totalCredits,
        totalRefunded,
        totalManualCredits: manualCredits.reduce((s, w) => s + Number(w.amount), 0),
        totalManualDebits: manualDebits.reduce((s, w) => s + Number(w.amount), 0),
        orderCount: completed.length,
        avgTicket: completed.length > 0 ? totalPurchased / completed.length : 0,
        lastPurchase: completed.length > 0 ? completed.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at : null,
        walletHistory: wallets.slice(0, 20) as WalletTx[],
        orders: orders.slice(0, 10),
      };
    },
  });

  // Audit log
  const { data: auditLog } = useQuery({
    queryKey: ["user-audit", user.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("admin_audit_log")
        .select("*")
        .eq("target_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);
      return data || [];
    },
  });

  const kpis = [
    { label: "Saldo", value: formatCurrency(user.wallet_balance), color: "text-green-500" },
    { label: "Total Comprado", value: formatCurrency(financials?.totalPurchased || 0), color: "text-primary" },
    { label: "Pedidos", value: String(financials?.orderCount || 0), color: "text-foreground" },
    { label: "Ticket Médio", value: formatCurrency(financials?.avgTicket || 0), color: "text-foreground" },
  ];

  const auditActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      ban: "Conta bloqueada",
      unban: "Conta desbloqueada",
      add_credits: "Saldo adicionado",
      remove_credits: "Saldo removido",
      set_password: "Senha redefinida",
      delete: "Conta excluída",
      set_role: "Permissão alterada",
    };
    return labels[action] || action;
  };

  const auditActionIcon = (action: string) => {
    switch (action) {
      case "ban": return <Ban className="h-3.5 w-3.5 text-destructive" />;
      case "unban": return <UserCheck className="h-3.5 w-3.5 text-green-500" />;
      case "add_credits": return <ArrowUpRight className="h-3.5 w-3.5 text-green-500" />;
      case "remove_credits": return <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />;
      case "set_password": return <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />;
      case "delete": return <UserX className="h-3.5 w-3.5 text-destructive" />;
      case "set_role": return <Shield className="h-3.5 w-3.5 text-primary" />;
      default: return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
              {(user.full_name || user.email)[0].toUpperCase()}
            </div>
            <div>
              <DialogTitle className="text-lg">{user.full_name || user.email}</DialogTitle>
              <DialogDescription className="text-xs">{user.email} · {user.id.slice(0, 8)}...</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-lg border border-border/50 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{k.label}</p>
              <p className={`text-lg font-bold ${k.color}`}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* Account badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {accountType === "admin" && <Badge className="bg-primary/10 text-primary border-primary/20"><Shield className="h-3 w-3 mr-1" />Admin</Badge>}
          {accountType === "reseller" && <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20"><Store className="h-3 w-3 mr-1" />Revendedor</Badge>}
          {accountType === "client" && <Badge variant="secondary">Cliente</Badge>}
          {user.banned ? <Badge variant="destructive"><Ban className="h-3 w-3 mr-1" />Bloqueado</Badge> : <Badge variant="outline" className="text-green-500 border-green-500/30">Ativo</Badge>}
        </div>

        <Separator />

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="summary" className="text-xs">Resumo</TabsTrigger>
            <TabsTrigger value="financial" className="text-xs">Financeiro</TabsTrigger>
            <TabsTrigger value="reseller" className="text-xs">Revenda</TabsTrigger>
            <TabsTrigger value="activity" className="text-xs">Atividade</TabsTrigger>
            <TabsTrigger value="security" className="text-xs flex items-center gap-1">
              <Lock className="h-3 w-3" /> Segurança
            </TabsTrigger>
          </TabsList>

          {/* ── SUMMARY ── */}
          <TabsContent value="summary" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-xs text-muted-foreground">Nome</p><p className="font-medium">{user.full_name || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">E-mail</p><p className="font-medium">{user.email}</p></div>
              <div><p className="text-xs text-muted-foreground">ID</p><p className="font-mono text-xs">{user.id}</p></div>
              <div><p className="text-xs text-muted-foreground">Tipo de Conta</p><p className="font-medium capitalize">{accountType}</p></div>
              <div><p className="text-xs text-muted-foreground">Cadastro</p><p className="font-medium">{new Date(user.created_at).toLocaleDateString("pt-BR")}</p></div>
              <div><p className="text-xs text-muted-foreground">Último Login</p><p className="font-medium">{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString("pt-BR") : "—"}</p></div>
            </div>

            {/* Common actions — only non-destructive ones */}
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Ações Rápidas</h4>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => onAction("add_credits")}>
                  <Wallet className="h-3 w-3" /> Adicionar Saldo
                </Button>
                <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => onAction("remove_credits")}>
                  <DollarSign className="h-3 w-3" /> Remover Saldo
                </Button>
                <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => onAction("reset_password")}>
                  <Mail className="h-3 w-3" /> Resetar Senha
                </Button>
                <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => onAction("set_password")}>
                  <KeyRound className="h-3 w-3" /> Definir Senha
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ── FINANCIAL ── */}
          <TabsContent value="financial" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "Total Comprado", value: financials?.totalPurchased || 0, icon: ShoppingCart },
                { label: "Total Reembolsado", value: financials?.totalRefunded || 0, icon: ArrowDownRight },
                { label: "Créditos Manuais (+)", value: financials?.totalManualCredits || 0, icon: ArrowUpRight },
                { label: "Débitos Manuais (-)", value: financials?.totalManualDebits || 0, icon: ArrowDownRight },
                { label: "Ticket Médio", value: financials?.avgTicket || 0, icon: TrendingUp },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-border/50 p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <item.icon className="h-3.5 w-3.5" />
                    <span className="text-[10px] uppercase tracking-wider">{item.label}</span>
                  </div>
                  <p className="text-base font-bold text-foreground">{formatCurrency(item.value)}</p>
                </div>
              ))}
            </div>
            {financials?.lastPurchase && (
              <p className="text-xs text-muted-foreground">
                Última compra: {new Date(financials.lastPurchase).toLocaleString("pt-BR")}
              </p>
            )}

            {/* Wallet history */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Histórico de Saldo</h4>
              {financials?.walletHistory && financials.walletHistory.length > 0 ? (
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {financials.walletHistory.map((tx: WalletTx) => (
                    <div key={tx.id} className="flex items-center justify-between rounded-lg border border-border/30 px-3 py-2">
                      <div>
                        <p className="text-xs text-foreground">{tx.description || tx.type}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(tx.created_at).toLocaleString("pt-BR")}</p>
                      </div>
                      <span className={`text-sm font-bold ${tx.type === "credit" ? "text-green-500" : "text-destructive"}`}>
                        {tx.type === "credit" ? "+" : "-"}{formatCurrency(tx.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Nenhuma movimentação.</p>
              )}
            </div>
          </TabsContent>

          {/* ── RESELLER ── */}
          <TabsContent value="reseller" className="space-y-4 mt-4">
            {reseller ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border/50 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</p>
                    <Badge variant={reseller.status === "active" ? "default" : "secondary"} className="mt-1">{reseller.status}</Badge>
                  </div>
                  <div className="rounded-lg border border-border/50 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Margem</p>
                    <p className="text-lg font-bold text-foreground">{reseller.margin_pct}%</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Revendedor desde {new Date(reseller.created_at || "").toLocaleDateString("pt-BR")}
                </p>
              </div>
            ) : (
              <div className="text-center py-6 space-y-2">
                <Store className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">Este usuário não é revendedor.</p>
              </div>
            )}
          </TabsContent>

          {/* ── ACTIVITY ── */}
          <TabsContent value="activity" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border/50 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Cadastro</p>
                <p className="text-sm font-medium mt-1">{new Date(user.created_at).toLocaleString("pt-BR")}</p>
              </div>
              <div className="rounded-lg border border-border/50 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Último Login</p>
                <p className="text-sm font-medium mt-1">{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString("pt-BR") : "—"}</p>
              </div>
            </div>

            {/* Recent orders */}
            {financials?.orders && financials.orders.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Últimos Pedidos</h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {financials.orders.map((o: any) => (
                    <div key={o.id} className="flex items-center justify-between rounded-lg border border-border/30 px-3 py-2 text-xs">
                      <div>
                        <p className="text-foreground">{o.credits} créditos</p>
                        <p className="text-muted-foreground">{new Date(o.created_at).toLocaleDateString("pt-BR")}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(o.price)}</p>
                        <Badge variant={o.status === "completed" ? "default" : "secondary"} className="text-[10px]">{o.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── SECURITY — ALL permissions & destructive actions live here ── */}
          <TabsContent value="security" className="space-y-6 mt-4">
            {/* Current permissions */}
            <div className="rounded-xl border border-border/50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-semibold">Permissões Atuais</h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border/50 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Role</p>
                  <p className="text-sm font-medium mt-1 capitalize">{user.role}</p>
                </div>
                <div className="rounded-lg border border-border/50 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Status da Conta</p>
                  <p className="text-sm font-medium mt-1">{user.banned ? "Bloqueado" : "Ativo"}</p>
                </div>
              </div>

              {/* Info about role changes being disabled */}
              <div className="rounded-lg bg-muted/50 border border-border/30 p-3">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Lock className="h-3 w-3" />
                  Alteração de role está desabilitada por segurança. Promoção a admin não é permitida pelo sistema.
                </p>
              </div>
            </div>

            {/* Account actions — separated by severity */}
            <div className="rounded-xl border border-border/50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-semibold">Acesso e Autenticação</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => onAction("reset_password")}>
                  <Mail className="h-3 w-3" /> Enviar Reset por E-mail
                </Button>
                <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => onAction("set_password")}>
                  <KeyRound className="h-3 w-3" /> Definir Senha Manual
                </Button>
              </div>
            </div>

            {/* Blocking */}
            <div className="rounded-xl border border-border/50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Ban className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-semibold">Controle de Acesso</h4>
              </div>
              {user.banned ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Esta conta está bloqueada. O usuário não pode acessar o sistema.</p>
                  <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => onAction("unban")}>
                    <UserCheck className="h-3 w-3" /> Desbloquear Conta
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Bloquear impede o acesso do usuário ao sistema. O saldo é mantido.</p>
                  <Button size="sm" variant="outline" className="text-xs gap-1 border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => onAction("ban")}>
                    <Ban className="h-3 w-3" /> Bloquear Conta
                  </Button>
                </div>
              )}
            </div>

            {/* Destructive — visually isolated */}
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-destructive" />
                <h4 className="text-sm font-semibold text-destructive">Zona de Perigo</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Ações irreversíveis. Exigem confirmação textual forte.
              </p>
              <Button size="sm" variant="destructive" className="text-xs gap-1" onClick={() => onAction("delete")}>
                <UserX className="h-3 w-3" /> Excluir Conta Permanentemente
              </Button>
            </div>

            <Separator />

            {/* Audit log — always visible in security tab */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-semibold">Histórico Administrativo</h4>
              </div>
              {auditLog && auditLog.length > 0 ? (
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {auditLog.map((log: any) => (
                    <div key={log.id} className="flex items-start gap-3 rounded-lg border border-border/30 px-3 py-2.5">
                      <div className="mt-0.5">{auditActionIcon(log.action)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground">{auditActionLabel(log.action)}</p>
                        {log.payload && Object.keys(log.payload).length > 0 && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {log.payload.reason && `Motivo: ${log.payload.reason}`}
                            {log.payload.amount && ` · R$ ${Number(log.payload.amount).toFixed(2)}`}
                            {log.payload.type && ` · Tipo: ${log.payload.type}`}
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(log.created_at).toLocaleString("pt-BR")}
                          {log.admin_id && ` · Admin: ${log.admin_id.slice(0, 8)}...`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Nenhuma ação administrativa registrada.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
