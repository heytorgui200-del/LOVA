import { useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/pricing";
import { CardShell } from "./CardShell";

export function PriceCard({ total }: { total: number }) {
  const mv = useMotionValue(total);
  const display = useTransform(mv, (v) => formatCurrency(v));
  useEffect(() => {
    const c = animate(mv, total, { duration: 0.35, ease: "easeOut" });
    return () => c.stop();
  }, [total, mv]);

  return (
    <CardShell icon={Wallet} title="Preço total">
      <motion.div className="text-xl sm:text-2xl font-semibold font-mono tabular-nums tracking-tight text-foreground">
        {display}
      </motion.div>
      <p className="text-[10px] text-muted-foreground mt-1">à vista no PIX</p>
    </CardShell>
  );
}
