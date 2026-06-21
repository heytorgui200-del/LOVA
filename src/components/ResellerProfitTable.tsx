import { useState, useCallback } from "react";
import { usePricing } from "@/hooks/usePricing";
import { CREDIT_TIERS, formatCurrency, formatNumber, calculateTotal } from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Target, Copy, Check, MessageCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  resellerMargin: number;
  balance: number;
  onTopUp: () => void;
  onSelectPackage: (credits: number) => void;
}

export function ResellerProfitTable({ resellerMargin, balance, onTopUp, onSelectPackage }: Props) {
  const { priceTable } = usePricing();
  const isMobile = useIsMobile();
  const [sellingMargin, setSellingMargin] = useState(50);
  const [dailyGoal, setDailyGoal] = useState<number | "">("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const numericGoal = typeof dailyGoal === "number" ? dailyGoal : 0;

  // Glow intensity: 10% → blue, 200% → emerald neon
  const glowIntensity = Math.min(1, (sellingMargin - 10) / 190);
  const glowColor = glowIntensity > 0.5 ? "text-emerald-400" : "text-primary";
  const glowShadow = glowIntensity > 0.5
    ? `0 0 ${Math.round(glowIntensity * 30)}px hsl(160 84% 55% / ${glowIntensity * 0.6})`
    : `0 0 ${Math.round(glowIntensity * 20)}px hsl(var(--primary) / ${glowIntensity * 0.4})`;

  const rows = CREDIT_TIERS.map((qty) => {
    const resellerCost = calculateTotal(qty, resellerMargin, priceTable);
    const salePrice = Math.ceil(resellerCost * (1 + sellingMargin / 100));
    const profit = Math.max(0, salePrice - resellerCost);
    const packsForGoal = numericGoal > 0 && profit > 0 ? Math.ceil(numericGoal / profit) : 0;
    return { qty, resellerCost, salePrice, profit, packsForGoal };
  });

  const handleCopyOffer = useCallback((r: typeof rows[0]) => {
    const text = `🔥 Salve! Tô com créditos LovaBoost disponíveis para injeção imediata.\n\n📦 Pacote: ${formatNumber(r.qty)} Créditos\n💰 Valor: ${formatCurrency(r.salePrice)}\n\nManda o PIX que cai na sua workspace em 3 minutos! ⚡`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(r.qty);
      toast.success("Oferta copiada para o WhatsApp!");
      setTimeout(() => setCopiedId(null), 2500);
    }).catch(() => toast.error("Erro ao copiar"));
  }, []);

  return (
    <div className="space-y-5">
      {/* Strategy Panel */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-emerald-500/5 overflow-hidden">
        <CardContent className="p-5 sm:p-6 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Configure sua Estratégia de Venda
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Arraste o slider para definir sua margem. Todos os pacotes recalculam em tempo real.
            </p>
          </div>

          {/* Margin Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Qual sua margem de lucro desejada?</span>
              <motion.span
                key={sellingMargin}
                initial={{ scale: 1.3, opacity: 0.7 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`text-3xl font-black tabular-nums ${glowColor}`}
                style={{ textShadow: glowShadow }}
              >
                {sellingMargin}%
              </motion.span>
            </div>
            <Slider
              value={[sellingMargin]}
              onValueChange={([v]) => setSellingMargin(v)}
              min={10}
              max={200}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>10% (agressivo)</span>
              <span>100%</span>
              <span>200% (premium)</span>
            </div>
          </div>

          {/* Daily Goal */}
          <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/50 p-3">
            <Target className="h-5 w-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground">🎯 Meta de Lucro Hoje</p>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">R$</span>
              <Input
                type="number"
                min={0}
                placeholder="100"
                value={dailyGoal}
                onChange={(e) => setDailyGoal(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-20 h-8 text-sm font-semibold text-right"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reactive Cards */}
      <div className={`grid gap-3 ${isMobile ? "grid-cols-1" : "grid-cols-2 xl:grid-cols-3"}`}>
        {rows.map((r) => {
          const canAfford = balance >= r.resellerCost;
          const isCopied = copiedId === r.qty;
          return (
            <motion.div
              key={r.qty}
              layout
              className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-4 space-y-3 flex flex-col"
            >
              {/* Header */}
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-primary" />
                ⚡ Pacote {formatNumber(r.qty)} Créditos
              </h3>

              {/* Prices */}
              <div className="space-y-1.5 text-sm flex-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Seu Custo</span>
                  <span className="text-foreground font-semibold">{formatCurrency(r.resellerCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Preço de Venda</span>
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={r.salePrice}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="text-foreground font-bold"
                    >
                      {formatCurrency(r.salePrice)}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </div>

              {/* Profit */}
              <div className="rounded-xl bg-emerald-500/10 p-3 text-center">
                <p className="text-[10px] text-muted-foreground mb-0.5">💰 Seu Lucro Limpo</p>
                <AnimatePresence mode="popLayout">
                  <motion.p
                    key={r.profit}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="text-xl font-black text-emerald-400 tabular-nums"
                  >
                    {formatCurrency(r.profit)}
                  </motion.p>
                </AnimatePresence>
                {numericGoal > 0 && r.packsForGoal > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Venda apenas <span className="font-bold text-foreground">{r.packsForGoal}</span> pacote{r.packsForGoal > 1 ? "s" : ""} para bater sua meta
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={() => canAfford ? onSelectPackage(r.qty) : onTopUp()}
                  variant={canAfford ? "default" : "outline"}
                  className="flex-1 gap-1 text-xs"
                  size="sm"
                >
                  {canAfford ? (
                    <><Zap className="h-3.5 w-3.5" /> Vender</>
                  ) : (
                    <>Recarregar</>
                  )}
                </Button>
                <Button
                  onClick={() => handleCopyOffer(r)}
                  variant="outline"
                  size="sm"
                  className="gap-1 text-xs"
                >
                  {isCopied ? <Check className="h-3.5 w-3.5" /> : <MessageCircle className="h-3.5 w-3.5" />}
                  {isCopied ? "Copiado!" : "Oferta"}
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}