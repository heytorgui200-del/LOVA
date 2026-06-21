import React, { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Lock, TrendingDown, QrCode, Crown, Minus, Plus } from "lucide-react";
import { getResellerWhatsAppLink, openWhatsApp } from "@/lib/whatsapp";
import { Slider } from "@/components/ui/slider";
import { formatCurrency, formatNumber } from "@/lib/pricing";
import { usePricing } from "@/hooks/usePricing";

const PRESETS = [100, 500, 1000, 2000, 5000, 10000];
const springBounce = { type: "spring" as const, stiffness: 300, damping: 20 };

function PresetGrid({ credits, setCredits, minCredits }: { credits: number; setCredits: (v: number) => void; minCredits: number }) {
  const { getDetails } = usePricing();
  const visible = PRESETS.filter((p) => p >= minCredits);

  return (
    <div className="w-full grid grid-cols-3 gap-2.5">
      {visible.map((p) => {
        const { total } = getDetails(p);
        const active = credits === p;
        return (
          <button
            key={p}
            onClick={() => setCredits(p)}
            className={`group relative flex flex-col items-center justify-center rounded-xl py-3 px-3 transition-all duration-250 min-h-[68px] ${
              active
                ? "bg-primary/[0.12] border-2 border-primary shadow-lg shadow-primary/20 scale-[1.03]"
                : "border border-white/[0.08] bg-white/[0.03] hover:border-primary/30 hover:bg-white/[0.06] active:scale-[0.97]"
            }`}
          >
            <span className={`font-display text-lg font-black tabular-nums leading-none ${active ? "text-primary" : "text-foreground"}`}>
              {formatNumber(p)}
            </span>
            <span className={`text-[10px] font-semibold mt-1 tabular-nums ${active ? "text-primary/70" : "text-muted-foreground/60"}`}>
              {formatCurrency(total)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

interface SimulatorCardProps {
  credits: number;
  setCredits: (v: number) => void;
  total: number;
  lovablePrice: number;
  savings: number;
  discountPct: number;
  loading: boolean;
  onBuyPix: () => void;
  minCredits?: number;
}

export const SimulatorCard = memo(function SimulatorCard({
  credits,
  setCredits,
  total,
  lovablePrice,
  savings,
  discountPct,
  loading,
  onBuyPix,
  minCredits = 10,
}: SimulatorCardProps) {
  const unitPrice = credits > 0 ? total / credits : 0;
  const belowMin = credits < minCredits;
  const resellerWhatsApp = getResellerWhatsAppLink();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.25, duration: 0.5 }}
      className="simulator-glass rounded-3xl p-6 sm:p-8 w-full flex flex-col items-center text-center overscroll-y-none"
    >
      {/* ─── Stepper ─── */}
      <div className="w-full flex flex-col items-center pb-5">
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setCredits(Math.max(minCredits, credits - 10))}
            disabled={credits <= minCredits}
            className="flex items-center justify-center w-11 h-11 rounded-full border border-white/[0.1] bg-white/[0.05] text-muted-foreground transition-all duration-200 hover:border-primary/40 hover:text-primary hover:bg-primary/[0.08] active:scale-90 disabled:opacity-25"
            aria-label="Diminuir créditos"
          >
            <Minus className="h-4 w-4" />
          </button>

          <div className="flex flex-col items-center">
            <input
              type="number"
              value={credits}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v)) setCredits(Math.max(minCredits, Math.min(v, 10000)));
              }}
              className="w-36 sm:w-40 bg-white/[0.03] border border-white/[0.06] text-center font-display text-5xl font-black text-foreground tabular-nums leading-none tracking-tighter outline-none rounded-2xl py-1.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:border-primary/30 focus:bg-primary/[0.04] transition-all duration-200"
              min={minCredits}
              max={10000}
            />
            <p className="text-muted-foreground text-[10px] mt-1.5 font-bold uppercase tracking-[0.25em]">
              créditos
            </p>
          </div>

          <button
            onClick={() => setCredits(Math.min(10000, credits + 10))}
            disabled={credits >= 10000}
            className="flex items-center justify-center w-11 h-11 rounded-full border border-white/[0.1] bg-white/[0.05] text-muted-foreground transition-all duration-200 hover:border-primary/40 hover:text-primary hover:bg-primary/[0.08] active:scale-90 disabled:opacity-25"
            aria-label="Aumentar créditos"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ─── Preço ─── */}
      <div className="w-full flex flex-col items-center pb-5 space-y-2">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={total}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.05, opacity: 0 }}
            transition={springBounce}
            className="font-display text-4xl sm:text-5xl font-black text-primary inline-block tabular-nums leading-none"
          >
            {formatCurrency(total)}
          </motion.span>
        </AnimatePresence>

        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          {savings > 0 && (
            <motion.span
              key={savings}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-green-500/15 to-emerald-500/10 border border-green-500/20 px-2.5 py-1 text-[11px] font-bold text-green-400"
            >
              <TrendingDown className="h-3 w-3" />
              {discountPct}% OFF
            </motion.span>
          )}
          <span className="text-[10px] text-muted-foreground/70 font-mono tabular-nums">
            R$ {unitPrice.toFixed(4)}/crédito
          </span>
        </div>

        <p className="text-[10px] text-muted-foreground/50">
          Oficial:{" "}
          <span className="line-through">{formatCurrency(lovablePrice)}</span>
          {savings > 0 && (
            <span className="text-green-400/70 ml-1 font-semibold">
              (−{formatCurrency(savings)})
            </span>
          )}
        </p>
      </div>

      {/* ─── Divider ─── */}
      <div className="w-full border-t border-white/[0.06] mb-5" />

      {/* ─── Slider ─── */}
      <div className="w-full px-1 mb-1">
        <Slider
          value={[credits]}
          onValueChange={([v]) => setCredits(v)}
          min={minCredits}
          max={10000}
          step={10}
          className="w-full"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground/40 mt-1.5 font-mono tabular-nums">
          <span>{formatNumber(minCredits)}</span>
          <span>10.000</span>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground/50 mb-5 font-medium">
        Mínimo: <span className="text-primary/70 font-bold">{formatNumber(minCredits)} créditos</span>
      </p>

      {/* ─── Presets ─── */}
      <div className="w-full mb-6">
        <PresetGrid credits={credits} setCredits={setCredits} minCredits={minCredits} />
      </div>

      {/* ─── CTAs ─── */}
      <div className="w-full flex flex-col gap-2.5">
        <button
          onClick={onBuyPix}
          disabled={loading || belowMin}
          className="btn-shine w-full rounded-2xl bg-gradient-to-r from-primary to-primary/80 px-6 py-3.5 font-display text-sm sm:text-base font-bold text-primary-foreground transition-all duration-200 hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-40 min-h-[48px] touch-manipulation"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Gerando PIX...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <QrCode className="h-4 w-4" />
              Comprar Rápido via PIX
            </span>
          )}
        </button>

        <button
          onClick={() => openWhatsApp(resellerWhatsApp)}
          className="w-full rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-yellow-500/5 px-6 py-3 font-display text-sm font-bold text-amber-400 transition-all duration-200 hover:border-amber-500/40 hover:from-amber-500/15 hover:to-yellow-500/10 hover:-translate-y-0.5 active:scale-[0.98] min-h-[44px] touch-manipulation text-center"
        >
          <span className="flex items-center justify-center gap-2">
            <Crown className="h-4 w-4 text-amber-400" />
            QUERO SER UM REVENDEDOR (GRUPO VIP)
          </span>
        </button>
      </div>

      {belowMin && (
        <p className="text-xs text-red-400 font-semibold mt-3">
          ⚠ Mínimo de {formatNumber(minCredits)} créditos
        </p>
      )}

      <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground/50 mt-4">
        <Lock className="h-3 w-3 text-primary/50 shrink-0" />
        <span>
          <strong className="text-foreground/50">Privacidade Total</strong> · Sem dados de acesso
        </span>
      </div>
    </motion.div>
  );
});
