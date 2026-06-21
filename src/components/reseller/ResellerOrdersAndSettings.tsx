import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2, Check,
  Clock, CheckCircle2, XCircle,
  Package, Link2, Settings,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatNumber } from "@/lib/pricing";

interface ResellerOrder {
  id: string;
  public_token: string;
  credits: number;
  final_price: number;
  cost: number;
  profit: number;
  status: string;
  created_at: string;
  completed_at: string | null;
  client_whatsapp: string | null;
  expires_at: string | null;
}

const statusConfig: Record<string, { label: string; icon: typeof Clock; cls: string }> = {
  reserved: { label: "Reservado", icon: Clock, cls: "text-yellow-500" },
  pending: { label: "Pendente", icon: Clock, cls: "text-yellow-500" },
  tutorial_viewed: { label: "Tutorial visto", icon: Clock, cls: "text-blue-500" },
  validating: { label: "Validando", icon: Loader2, cls: "text-blue-500" },
  processing: { label: "Processando", icon: Loader2, cls: "text-blue-500" },
  completed: { label: "Entregue", icon: CheckCircle2, cls: "text-emerald-500" },
  failed: { label: "Falhou", icon: XCircle, cls: "text-destructive" },
  expired: { label: "Expirado", icon: XCircle, cls: "text-muted-foreground" },
  cancelled: { label: "Cancelado", icon: XCircle, cls: "text-muted-foreground" },
};

export function ResellerOrdersTab({ resellerId }: { resellerId: string | null }) {
  const { data: orders, isLoading } = useQuery({
    queryKey: ["reseller-order-history", resellerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reseller_orders")
        .select("id, public_token, credits, final_price, cost, profit, status, created_at, completed_at, client_whatsapp, expires_at")
        .eq("reseller_id", resellerId!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as ResellerOrder[];
    },
    enabled: !!resellerId,
    refetchInterval: 15_000,
  });

  const handleCancel = async (token: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("process-reseller-delivery", {
        body: { action: "cancel_order", public_token: token },
      });
      if (error) throw error;
      if (data?.status === "cancelled") toast.success("Pedido cancelado e saldo estornado.");
      else toast.error(data?.error || "Erro ao cancelar.");
    } catch {
      toast.error("Erro ao cancelar pedido.");
    }
  };

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!orders?.length) return <p className="text-center py-10 text-muted-foreground text-sm">Nenhum pedido de revenda ainda.</p>;

  return (
    <div className="space-y-2">
      {orders.map((o) => {
        const st = statusConfig[o.status] || statusConfig.pending;
        const Icon = st.icon;
        const canCancel = ["reserved", "pending", "tutorial_viewed"].includes(o.status);
        return (
          <div key={o.id} className="rounded-xl border border-border/50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${st.cls} ${Icon === Loader2 ? "animate-spin" : ""}`} />
                <div>
                  <span className="text-sm font-semibold text-foreground">{formatNumber(o.credits)} créditos</span>
                  <span className="text-xs text-muted-foreground ml-2">{st.label}</span>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("pt-BR")}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Custo: {formatCurrency(o.cost)} → Venda: {formatCurrency(o.final_price)} → <span className="text-emerald-500 font-bold">Lucro: {formatCurrency(o.profit)}</span></span>
              {canCancel && (
                <Button variant="ghost" size="sm" className="text-xs text-destructive h-6 px-2" onClick={() => handleCancel(o.public_token)}>
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ResellerSettingsTab({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const [slug, setSlug] = useState("");
  const [storeName, setStoreName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: reseller } = useQuery({
    queryKey: ["reseller-settings", userId],
    queryFn: async () => {
      const { data } = await supabase.from("resellers").select("slug, store_name, whatsapp").eq("user_id", userId).single();
      return data;
    },
    enabled: !!userId,
  });

  useEffect(() => {
    if (reseller) {
      setSlug(reseller.slug || "");
      setStoreName(reseller.store_name || "");
      setWhatsapp((reseller as Record<string, unknown>).whatsapp as string || "");
    }
  }, [reseller]);

  const handleSave = async () => {
    if (!slug.trim()) { toast.error("Defina um slug."); return; }
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 30);
    setSaving(true);
    const { error } = await supabase.from("resellers").update({
      slug: cleanSlug,
      store_name: storeName.trim() || null,
      whatsapp: whatsapp.replace(/\D/g, "") || null,
    } as Record<string, unknown>).eq("user_id", userId);
    setSaving(false);
    if (error) {
      if (error.code === "23505") toast.error("Slug em uso.");
      else toast.error("Erro ao salvar.");
      return;
    }
    toast.success("Salvo!");
    queryClient.invalidateQueries({ queryKey: ["reseller-settings"] });
    queryClient.invalidateQueries({ queryKey: ["reseller-slug"] });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Slug da página</label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">/r/</span>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="meu-nome" className="flex-1" />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Nome da loja</label>
        <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Ex: Créditos do João" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Seu WhatsApp (suporte ao cliente)</label>
        <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="11999999999" type="tel" />
        <p className="text-[10px] text-muted-foreground">Aparece na página de entrega para o cliente entrar em contato</p>
      </div>
      <Button onClick={handleSave} disabled={saving} className="w-full gap-2 rounded-xl">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Salvar
      </Button>
    </div>
  );
}
