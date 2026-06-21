import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePricing } from "@/hooks/usePricing";
import { CREDIT_TIERS, formatCurrency, formatNumber, interpolateApiCost } from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { Zap, Copy, Check, Link2, MessageCircle, ExternalLink } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ResellerMessageTemplates } from "./ResellerMessageTemplates";

interface Props {
  resellerMargin: number;
  balance: number;
  slug: string | null;
  onTopUp: () => void;
  onSelectPackage: (credits: number) => void;
}

export function ResellerSellCards({ resellerMargin, balance, slug, onTopUp, onSelectPackage }: Props) {
  const { priceTable, getDetails } = usePricing();
  const isMobile = useIsMobile();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showMessages, setShowMessages] = useState<number | null>(null);
  const { user } = useAuth();

  const rows = CREDIT_TIERS.map((qty) => {
    const resellerCost = Math.ceil(interpolateApiCost(qty, priceTable) * (1 + resellerMargin / 100));
    const { total: retailPrice } = getDetails(qty);
    const suggestedSale = Math.ceil(resellerCost * 1.5);
    const profit = Math.max(0, suggestedSale - resellerCost);
    return { qty, resellerCost, suggestedSale, retailPrice, profit };
  });

  const getLink = useCallback((qty: number) => {
    const base = window.location.origin;
    if (slug) return `${base}/r/${slug}?pack=${qty}`;
    return `${base}/?ref=${user?.id}&pack=${qty}`;
  }, [slug, user?.id]);

  const handleCopyLink = useCallback((qty: number) => {
    const link = getLink(qty);
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(`link-${qty}`);
      toast.success("Link copiado!");
      setTimeout(() => setCopiedId(null), 2500);
    }).catch(() => toast.error("Erro ao copiar"));
  }, [getLink]);

  const handleOpenPage = useCallback(() => {
    if (slug) {
      window.open(`${window.location.origin}/r/${slug}`, "_blank");
    } else {
      toast.info("Configure seu slug na aba Configurações para ter uma página pública.");
    }
  }, [slug]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Vender Agora
        </h2>
        {slug && (
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleOpenPage}>
            <ExternalLink className="h-3.5 w-3.5" /> Minha Página
          </Button>
        )}
      </div>

      <div className={`grid gap-3 ${isMobile ? "grid-cols-1" : "grid-cols-2 xl:grid-cols-3"}`}>
        {rows.map((r) => {
          const canAfford = balance >= r.resellerCost;
          return (
            <motion.div
              key={r.qty}
              layout
              className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-4 space-y-3 flex flex-col"
            >
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-primary" />
                {formatNumber(r.qty)} Créditos
              </h3>

              <div className="space-y-1.5 text-sm flex-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Seu Custo</span>
                  <span className="font-semibold text-foreground">{formatCurrency(r.resellerCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Venda Sugerida</span>
                  <span className="font-bold text-foreground">{formatCurrency(r.suggestedSale)}</span>
                </div>
              </div>

              <div className="rounded-xl bg-emerald-500/10 p-3 text-center">
                <p className="text-[10px] text-muted-foreground mb-0.5">💰 Lucro Estimado</p>
                <p className="text-xl font-black text-emerald-400 tabular-nums">{formatCurrency(r.profit)}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => canAfford ? onSelectPackage(r.qty) : onTopUp()}
                  variant={canAfford ? "default" : "outline"}
                  className="gap-1 text-xs"
                  size="sm"
                >
                  {canAfford ? <><Zap className="h-3.5 w-3.5" /> Vender</> : <>Recarregar</>}
                </Button>
                <Button
                  onClick={() => handleCopyLink(r.qty)}
                  variant="outline"
                  size="sm"
                  className="gap-1 text-xs"
                >
                  {copiedId === `link-${r.qty}` ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
                  {copiedId === `link-${r.qty}` ? "Copiado!" : "Link"}
                </Button>
              </div>

              <Button
                onClick={() => setShowMessages(showMessages === r.qty ? null : r.qty)}
                variant="ghost"
                size="sm"
                className="gap-1 text-xs w-full"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Mensagens Prontas
              </Button>

              <AnimatePresence>
                {showMessages === r.qty && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <ResellerMessageTemplates
                      credits={r.qty}
                      salePrice={r.suggestedSale}
                      link={getLink(r.qty)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
