import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Loader2, Minus, Plus } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { formatCurrency, formatNumber } from "@/lib/pricing";
import { usePricing } from "@/hooks/usePricing";

const PRESETS = [50, 100, 500, 1000, 2000, 5000, 10000];
const THRESHOLDS = [500, 1000, 2000, 5000];

const springBounce = { type: "spring" as const, stiffness: 300, damping: 20 };

interface CreditReactorProps {
  onGenerate: () => void;
  loading: boolean;
  credits: number;
  setCredits: (v: number) => void;
  isLoggedIn: boolean;
}

export function CreditReactor({ onGenerate, loading, credits, setCredits, isLoggedIn }: CreditReactorProps) {
  const [lastThreshold, setLastThreshold] = useState<number | null>(null);
  const { getDetails, minCredits } = usePricing();

  const { total, lovablePrice, savings, discountPct } = getDetails(credits);
  const unitPrice = credits > 0 ? total / credits : 0;
  const belowMin = credits < minCredits;

  const colorProgress = useMemo(() => Math.min(credits / 5000, 1), [credits]);
  const orbHue = useMemo(() => 217 + (140 - 217) * colorProgress, [colorProgress]);
  const orbSat = useMemo(() => 91 + (70 - 91) * colorProgress, [colorProgress]);
  const particleCount = useMemo(() => Math.min(Math.floor(credits / 400) + 3, 12), [credits]);

  useEffect(() => {
    const hit = THRESHOLDS.find((t) => credits >= t && (lastThreshold === null || lastThreshold < t));
    if (hit && hit !== lastThreshold) setLastThreshold(hit);
  }, [credits, lastThreshold]);

  useEffect(() => {
    if (lastThreshold && credits < lastThreshold) {
      const prev = THRESHOLDS.filter((t) => t <= credits);
      setLastThreshold(prev.length > 0 ? prev[prev.length - 1] : null);
    }
  }, [credits, lastThreshold]);

  const handleSlider = useCallback(([v]: number[]) => setCredits(v), [setCredits]);

  // Filter presets to only show those >= minCredits
  const visiblePresets = PRESETS.filter((p) => p >= minCredits);

  return (
    <div className="bg-background rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12)] border border-border/80 p-8 md:p-10 relative overflow-hidden">
      <div
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-[120px] pointer-events-none transition-colors duration-1000"
        style={{ backgroundColor: `hsl(${orbHue} ${orbSat}% 60% / 0.08)` }}
      />

      <h2 className="text-center font-display text-lg font-bold text-foreground mb-8">
        Credit Fusion Reactor
      </h2>

      {/* ─── REACTOR ORB ─── */}
      <div className="relative flex items-center justify-center mb-8">
        <div className="absolute w-64 h-64 md:w-72 md:h-72">
          {Array.from({ length: particleCount }).map((_, i) => (
            <div
              key={i}
              className="absolute inset-0"
              style={{
                animation: `orbit ${6 + i * 0.5}s linear infinite`,
                animationDelay: `${(i * 360) / particleCount / 60}s`,
              }}
            >
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full transition-colors duration-700"
                style={{
                  backgroundColor: `hsl(${orbHue} ${orbSat}% 55%)`,
                  boxShadow: `0 0 8px hsl(${orbHue} ${orbSat}% 55% / 0.6)`,
                }}
              />
            </div>
          ))}
        </div>

        <motion.div
          className="relative w-48 h-48 md:w-56 md:h-56 rounded-full flex flex-col items-center justify-center z-10 transition-all duration-700"
          style={{
            background: `radial-gradient(circle at 40% 35%, hsl(${orbHue} ${orbSat}% 65% / 0.15), hsl(${orbHue} ${orbSat}% 50% / 0.05))`,
            border: `2px solid hsl(${orbHue} ${orbSat}% 60% / 0.25)`,
            boxShadow: `0 0 40px hsl(${orbHue} ${orbSat}% 55% / 0.15), inset 0 0 40px hsl(${orbHue} ${orbSat}% 60% / 0.05)`,
          }}
          animate={{ boxShadow: [
            `0 0 30px hsl(${orbHue} ${orbSat}% 55% / 0.1), inset 0 0 30px hsl(${orbHue} ${orbSat}% 60% / 0.03)`,
            `0 0 50px hsl(${orbHue} ${orbSat}% 55% / 0.2), inset 0 0 50px hsl(${orbHue} ${orbSat}% 60% / 0.08)`,
            `0 0 30px hsl(${orbHue} ${orbSat}% 55% / 0.1), inset 0 0 30px hsl(${orbHue} ${orbSat}% 60% / 0.03)`,
          ]}}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setCredits(Math.max(minCredits, credits - 10))}
              disabled={credits <= minCredits}
              className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full border border-border/50 bg-background/50 text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground active:scale-90 disabled:opacity-30"
              aria-label="Diminuir créditos"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>

            <input
              type="number"
              value={credits}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v) && v >= 0) setCredits(Math.min(v, 10000));
              }}
              onBlur={() => {
                if (credits < minCredits) setCredits(minCredits);
              }}
              className="w-20 md:w-24 bg-transparent text-center font-display text-4xl md:text-5xl font-extrabold text-foreground tabular-nums outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:ring-2 focus:ring-primary/30 rounded-lg transition-shadow"
              min={minCredits}
              max={10000}
            />

            <button
              onClick={() => setCredits(Math.min(10000, credits + 10))}
              disabled={credits >= 10000}
              className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full border border-border/50 bg-background/50 text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground active:scale-90 disabled:opacity-30"
              aria-label="Aumentar créditos"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-muted-foreground text-sm mt-1">créditos</p>
          <motion.p
            key={unitPrice.toFixed(3)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-muted-foreground mt-2 tabular-nums"
          >
            {formatCurrency(unitPrice)}/un
          </motion.p>
        </motion.div>

        <AnimatePresence>
          {lastThreshold && credits >= lastThreshold && (
            <motion.div
              key={lastThreshold}
              initial={{ scale: 0, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: -10 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={springBounce}
              className="absolute -top-2 right-4 md:right-8 z-20"
            >
              <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 border border-green-500/30 px-3 py-1 text-xs font-bold text-green-600">
                🎉 ECONOMIA {discountPct}%
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── SLIDER ─── */}
      <div className="px-2 mb-2">
        <Slider
          value={[credits]}
          onValueChange={handleSlider}
          min={minCredits}
          max={10000}
          step={10}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>{formatNumber(minCredits)}</span>
          <span>10.000</span>
        </div>
      </div>

      {/* ─── Min credits info ─── */}
      <p className="text-center text-[10px] text-muted-foreground/60 mb-5 font-medium">
        Pedido mínimo atual: <span className="text-primary/80 font-bold">{formatNumber(minCredits)} créditos</span>
      </p>

      {/* Quick presets */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {visiblePresets.map((p) => (
          <button
            key={p}
            onClick={() => setCredits(p)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
              credits === p
                ? "bg-primary text-primary-foreground shadow-md scale-105"
                : "border border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {formatNumber(p)}
          </button>
        ))}
      </div>

      {/* ─── PRICING ─── */}
      <div className="rounded-2xl bg-muted/50 border border-border p-6 mb-6 text-center">
        <p className="text-sm font-semibold text-foreground mb-1">Seu Preço Final</p>
        <AnimatePresence mode="popLayout">
          <motion.span
            key={total}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.05, opacity: 0 }}
            transition={springBounce}
            className="font-display text-4xl md:text-5xl font-extrabold text-primary inline-block tabular-nums"
          >
            {formatCurrency(total)}
          </motion.span>
        </AnimatePresence>

        {savings > 0 && (
          <motion.p
            key={savings}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-bold text-green-600 mt-2"
          >
            Economia de {formatCurrency(savings)} ({discountPct}% OFF)
          </motion.p>
        )}

        <p className="text-xs text-muted-foreground mt-2">
          Preço normal na Lovable:{" "}
          <span className="line-through">{formatCurrency(lovablePrice)}</span>
        </p>
      </div>

      {/* ─── CTA ─── */}
      <button
        onClick={onGenerate}
        disabled={loading || belowMin}
        className="btn-shine w-full rounded-2xl bg-primary px-8 py-4 font-display text-lg font-bold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:hover:translate-y-0"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Criando pedido...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Zap className="h-5 w-5" />
            ⚡ Gerar {formatNumber(credits)} créditos via PIX
          </span>
        )}
      </button>

      {belowMin && (
        <p className="text-center text-xs text-red-400 font-semibold mt-3">
          ⚠ Mínimo de {formatNumber(minCredits)} créditos para compra
        </p>
      )}

      <p className="text-center text-xs text-muted-foreground mt-4">
        {isLoggedIn ? "✅ Logado" : "🔓 Sem login obrigatório"} • PIX • Entrega automática • Reembolso garantido
      </p>
    </div>
  );
}
