import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, formatNumber } from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, Eye, ShoppingCart, ToggleLeft, ToggleRight, Loader2, Link2, User, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  resellerId: string | null;
  slug: string | null;
}

export function ResellerRecentLinks({ resellerId, slug }: Props) {
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const { data: links, isLoading, refetch } = useQuery({
    queryKey: ["reseller-links", resellerId],
    queryFn: async () => {
      if (!resellerId) return [];
      const { data, error } = await supabase
        .from("reseller_links")
        .select("*")
        .eq("reseller_id", resellerId)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data;
    },
    enabled: !!resellerId,
  });

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from("reseller_links")
      .update({ is_active: !current })
      .eq("id", id);
    if (error) { toast.error("Erro ao atualizar"); return; }
    toast.success(current ? "Link desativado" : "Link reativado");
    refetch();
  };

  const cancelLink = async (linkId: string) => {
    setCancellingId(linkId);
    try {
      // Find pending orders for this link and cancel them (with refund)
      const { data: orders } = await supabase
        .from("reseller_orders")
        .select("public_token, status")
        .eq("reseller_link_id", linkId)
        .not("status", "in", '("completed","cancelled","failed")');

      if (orders && orders.length > 0) {
        for (const order of orders) {
          await supabase.functions.invoke("process-reseller-delivery", {
            body: { action: "cancel_order", public_token: order.public_token },
          });
        }
      }

      // Deactivate the link
      await supabase
        .from("reseller_links")
        .update({ is_active: false })
        .eq("id", linkId);

      toast.success("Link cancelado e saldo estornado!");
      refetch();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao cancelar link");
    } finally {
      setCancellingId(null);
    }
  };

  const buildUrl = (linkSlug: string, price: number) => {
    const base = window.location.origin;
    return slug
      ? `${base}/r/${slug}/${linkSlug}?price=${price}`
      : `${base}/?pack=${linkSlug.replace("-creditos", "")}&price=${price}`;
  };

  const copyLink = (linkSlug: string, price: number) => {
    const url = buildUrl(linkSlug, price);
    navigator.clipboard.writeText(url).then(() => toast.success("Link copiado!"));
  };

  const sendWhatsApp = (linkSlug: string, price: number, pack: number, clientName?: string) => {
    const url = buildUrl(linkSlug, price);
    const name = clientName || "cliente";
    const msg = `Olá ${name}! 👋\n\n📦 ${formatNumber(pack)} créditos Lovable\n💰 ${formatCurrency(price)}\n⚡ Entrega automática em 3 min\n\n👉 ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  if (isLoading) return <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  if (!links?.length) return (
    <div className="text-center py-8 space-y-2">
      <Link2 className="h-8 w-8 text-muted-foreground/40 mx-auto" />
      <p className="text-sm text-muted-foreground">Nenhum link gerado ainda.</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {links.map((link) => {
        const clientName = (link as any).client_name;
        const isCancelling = cancellingId === link.id;
        return (
          <div key={link.id} className={`rounded-xl border p-2.5 sm:p-3 space-y-1.5 sm:space-y-2 transition-all ${
            link.is_active ? "border-border/50 bg-card" : "border-border/30 bg-muted/30 opacity-60"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-foreground">{formatNumber(link.pack)} créditos</span>
                    {clientName && (
                      <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                        <User className="h-3 w-3" /> {clientName}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] sm:text-xs text-muted-foreground truncate block">
                    {formatCurrency(Number(link.cost))} → {formatCurrency(Number(link.sale_price))}
                  </span>
                </div>
              </div>

              <Badge variant="outline" className="text-emerald-500 border-emerald-500/20 text-xs shrink-0">
                +{formatCurrency(Number(link.profit))}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" /> {link.views}</span>
                <span className="flex items-center gap-0.5"><ShoppingCart className="h-3 w-3" /> {link.conversions}</span>
              </div>

              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" title="Copiar link"
                  onClick={() => copyLink(link.slug, Number(link.sale_price))}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" title="Enviar WhatsApp"
                  onClick={() => sendWhatsApp(link.slug, Number(link.sale_price), link.pack, clientName)}>
                  <Send className="h-3.5 w-3.5 text-emerald-500" />
                </Button>
                {slug && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" title="Abrir preview"
                    onClick={() => window.open(buildUrl(link.slug, Number(link.sale_price)), "_blank")}>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7" title={link.is_active ? "Desativar" : "Reativar"}
                  onClick={() => toggleActive(link.id, link.is_active)}>
                  {link.is_active ? <ToggleRight className="h-4 w-4 text-emerald-500" /> : <ToggleLeft className="h-4 w-4" />}
                </Button>
                {link.is_active && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" title="Cancelar link e estornar"
                    onClick={() => cancelLink(link.id)} disabled={isCancelling}>
                    {isCancelling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
