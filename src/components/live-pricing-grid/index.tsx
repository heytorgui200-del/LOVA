import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { usePricing } from "@/hooks/usePricing";
import { PriceController } from "./PriceController";
import { DynamicCardsGrid } from "./DynamicCardsGrid";
import { LiveDeliveryCounter } from "@/components/LiveDeliveryCounter";

const STORAGE_KEY = "lovaboost.live-grid.credits";
const MAX_CREDITS = 10000;
const DEFAULT_CREDITS = 1500;

interface Props {
  loading: boolean;
  onBuyPix: (credits: number) => void;
}

export function LivePricingGrid({ loading, onBuyPix }: Props) {
  const { calculateTotal, getDetails, minCredits } = usePricing();

  const [credits, setCreditsState] = useState<number>(() => {
    if (typeof window === "undefined") return DEFAULT_CREDITS;
    const stored = Number(localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(stored) && stored >= 10 ? stored : DEFAULT_CREDITS;
  });

  const setCredits = (n: number) => {
    const clamped = Math.max(minCredits, Math.min(MAX_CREDITS, Math.round(n)));
    setCreditsState(clamped);
    try {
      localStorage.setItem(STORAGE_KEY, String(clamped));
    } catch {}
  };

  useEffect(() => {
    if (credits < minCredits) setCredits(minCredits);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minCredits]);

  const details = useMemo(() => getDetails(credits), [credits, getDetails]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-3xl mx-auto space-y-4 sm:space-y-5"
    >
      <LiveDeliveryCounter />

      <PriceController
        credits={credits}
        setCredits={setCredits}
        total={details.total}
        minCredits={minCredits}
        maxCredits={MAX_CREDITS}
        loading={loading}
        onBuy={() => onBuyPix(credits)}
        calculateTotal={calculateTotal}
      />

      <DynamicCardsGrid
        credits={credits}
        total={details.total}
        savings={details.savings}
        discountPct={details.discountPct}
      />
    </motion.div>
  );
}
