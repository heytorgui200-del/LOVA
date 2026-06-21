import { useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/pricing";
import { CardShell } from "./CardShell";

export function SavingsCard({ savings, discountPct }: { savings: number; discountPct: number }) {
  const mv = useMotionValue(savings);
  const display = useTransform(mv, (v) => formatCurrency(v));
  useEffect(() => {
    const c = animate(mv, savings, { duration: 0.4, ease: "easeOut" });
    return () => c.stop();
  }, [savings, mv]);

  return (
    <CardShell icon={TrendingDown} title="Você economiza">
      <motion.div className="text-xl sm:text-2xl font-semibold font-mono tabular-nums tracking-tight text-emerald-400">
        {display}
      </motion.div>
      <p className="text-[10px] text-muted-foreground mt-1">
        {discountPct > 0 ? `${discountPct}% off` : "vs preço oficial"}
      </p>
    </CardShell>
  );
}
