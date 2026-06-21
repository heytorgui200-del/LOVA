import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight, Sparkles, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber, getLovableOfficialPrice } from "@/lib/pricing";
import { useAuth } from "@/contexts/AuthContext";
import { adminGrantCredits } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const PRESETS = [100, 500, 1000, 2000, 5000, 10000];
const TOP_PRESET = 5000;

interface Props {
  credits: number;
  setCredits: (n: number) => void;
  total: number;
  minCredits: number;
  maxCredits: number;
  loading: boolean;
  onBuy: () => void;
  calculateTotal: (n: number) => number;
}

export function PriceController({
  credits,
  setCredits,
  total,
  minCredits,
  maxCredits,
  loading,
  onBuy,
  calculateTotal,
}: Props) {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [adminLoading, setAdminLoading] = useState(false);
  const lovablePrice = getLovableOfficialPrice(credits);
  const discountPct = lovablePrice > 0 ? Math.round((1 - total / lovablePrice) * 100) : 0;

  const totalMV = useMotionValue(total);
  const totalDisplay = useTransform(totalMV, (v) => formatCurrency(v));
  useEffect(() => {
    const ctrl = animate(totalMV, total, { duration: 0.35, ease: "easeOut" });
    return () => ctrl.stop();
  }, [total, totalMV]);

  const inputRef = useRef<HTMLInputElement>(null);
  const clamp = (n: number) => Math.max(minCredits, Math.min(maxCredits, Math.round(n)));

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) onBuy();
  };

  const handleAdminGrant = async () => {
    if (adminLoading) return;
    setAdminLoading(true);
    try {
      const result = await adminGrantCredits(credits);
      toast.success(`${credits} créditos gerados!`);
      navigate(`/pix/${result.order_id}?credits=${credits}&amount=0`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar créditos");
    } finally {
      setAdminLoading(false);
    }
  };

  // Tier-cross animation: detect when discount goes UP
  const prevDiscountRef = useRef(discountPct);
  const [tierJump, setTierJump] = useState<number | null>(null);
  useEffect(() => {
    const prev = prevDiscountRef.current;
    if (discountPct > prev + 0.5) {
      const delta = discountPct - prev;
      setTierJump(delta);
      const t = setTimeout(() => setTierJump(null), 1400);
      prevDiscountRef.current = discountPct;
      return () => clearTimeout(t);
    }
    prevDiscountRef.current = discountPct;
  }, [discountPct]);

  // Upgrade hint
  const upgradeHint = useMemo(() => {
    const currentUnit = credits > 0 ? total / credits : Infinity;
    const next = PRESETS.find((p) => p > credits);
    if (!next) return null;
    const nextTotal = calculateTotal(next);
    const nextUnit = nextTotal / next;
    if (nextUnit < currentUnit * 0.95) {
      return { extra: next - credits, nextUnit };
    }
    return null;
  }, [credits, total, calculateTotal]);

  // Tick positions on the slider track
  const tickPositions = useMemo(() => {
    const range = maxCredits - minCredits;
    return PRESETS.filter((p) => p >= minCredits && p <= maxCredits).map((p) => {
      const unit = calculateTotal(p) / p;
      return {
        value: p,
        leftPct: ((p - minCredits) / range) * 100,
        unit,
        isTop: p === TOP_PRESET,
      };
    });
  }, [minCredits, maxCredits, calculateTotal]);

  return (
    <div
      onKeyDown={handleKey}
      className="rounded-2xl border border-border/50 bg-card/80 p-5 sm:p-7 space-y-5 shadow-xl shadow-black/20"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">
            Créditos
          </span>
          <Input
            ref={inputRef}
            type="number"
            inputMode="numeric"
            value={credits}
            min={minCredits}
            max={maxCredits}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (Number.isFinite(n)) setCredits(clamp(n));
            }}
            onFocus={(e) => e.target.select()}
            className="h-auto w-32 sm:w-40 p-0 text-3xl sm:text-4xl font-semibold tracking-tight font-mono tabular-nums bg-transparent border-0 focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            aria-label="Quantidade de créditos"
          />
        </div>

        <div className="flex flex-col items-end relative">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">
            Total
          </span>
          <motion.div
            animate={tierJump ? { color: ["hsl(var(--primary))", "rgb(52,211,153)", "hsl(var(--primary))"] } : {}}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-4xl font-semibold tracking-tight font-mono tabular-nums text-primary"
          >
            {totalDisplay}
          </motion.div>
          {discountPct > 0 && (
            <span className="text-[11px] font-medium text-emerald-400 mt-0.5">
              −{discountPct}% vs preço oficial
            </span>
          )}

          {/* Tier-jump chip */}
          <AnimatePresence>
            {tierJump && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.9 }}
                animate={{ opacity: 1, y: -4, scale: 1 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.45 }}
                className="absolute -top-3 right-0 inline-flex items-center gap-1 rounded-full bg-emerald-500/95 px-2 py-0.5 text-[10px] font-bold text-white shadow-lg shadow-emerald-500/40"
              >
                −{Math.round(tierJump)}% 🎉
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Slider with discount ticks overlay */}
      <div className="px-1">
        <TooltipProvider delayDuration={150}>
          <div className="relative">
            <Slider
              value={[credits]}
              min={minCredits}
              max={maxCredits}
              step={10}
              onValueChange={(v) => setCredits(clamp(v[0]))}
              aria-label="Ajustar créditos"
            />
            {/* Tick overlay positioned over the slider track */}
            <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5">
              {tickPositions.map((t) => (
                <Tooltip key={t.value}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setCredits(t.value)}
                      style={{ left: `${t.leftPct}%` }}
                      className={cn(
                        "pointer-events-auto absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full",
                        t.isTop
                          ? "h-3 w-1 bg-emerald-400/90 ring-1 ring-emerald-300/40"
                          : "h-2 w-px bg-foreground/30",
                      )}
                      aria-label={`Tier ${t.value} créditos`}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <span className="font-mono tabular-nums">
                      {formatNumber(t.value)} créditos
                    </span>{" "}
                    →{" "}
                    <span className="font-mono tabular-nums text-emerald-400">
                      R$ {t.unit.toFixed(3)}
                    </span>{" "}
                    /crédito
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
        </TooltipProvider>

        <div className="flex justify-between text-[10px] text-muted-foreground mt-2 tabular-nums font-mono">
          <span>{formatNumber(minCredits)}</span>
          <span>{formatNumber(maxCredits)}</span>
        </div>
      </div>

      {/* Presets */}
      <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
        {PRESETS.map((p) => {
          const active = credits === p;
          const isTop = p === TOP_PRESET;
          return (
            <button
              key={p}
              type="button"
              onClick={() => setCredits(p)}
              className={cn(
                "relative h-10 text-xs font-medium rounded-lg border transition-colors tabular-nums font-mono",
                active
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border/40 bg-card/40 text-muted-foreground hover:text-foreground hover:border-border",
              )}
            >
              {p >= 1000 ? `${p / 1000}k` : formatNumber(p)}
              {isTop && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-emerald-500/90 text-[8px] font-bold uppercase tracking-wider text-white shadow">
                  Top
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* CTA */}
      <Button
        onClick={onBuy}
        disabled={loading}
        size="lg"
        className="w-full h-13 py-3 text-sm sm:text-base font-semibold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            Comprar {formatNumber(credits)} créditos via PIX — {formatCurrency(total)}
            <ArrowRight className="h-4 w-4 ml-1" />
          </>
        )}
      </Button>

      {/* Admin grant button */}
      {isAdmin && (
        <Button
          onClick={handleAdminGrant}
          disabled={adminLoading}
          variant="outline"
          size="lg"
          className="w-full h-11 py-2.5 text-sm font-semibold rounded-xl border-emerald-500/30 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-colors"
        >
          {adminLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Shield className="h-4 w-4 mr-1.5" />
              Gerar grátis (Admin)
            </>
          )}
        </Button>
      )}

      {/* Upgrade hint */}
      {upgradeHint && (
        <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground -mt-2">
          <Sparkles className="h-3 w-3 text-amber-400/70" />
          Compre +{formatNumber(upgradeHint.extra)} e pague só{" "}
          <span className="font-mono tabular-nums text-foreground/80">
            R$ {upgradeHint.nextUnit.toFixed(3)}
          </span>{" "}
          por crédito
        </p>
      )}
    </div>
  );
}
