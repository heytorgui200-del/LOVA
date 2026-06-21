import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatNumber } from "@/lib/pricing";

export function LiveDeliveryCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchCount = async () => {
      const { data, error } = await supabase.rpc("get_credits_delivered_24h");
      if (!cancelled && !error && typeof data === "number") {
        setCount(data);
      }
    };
    fetchCount();
    const id = setInterval(fetchCount, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (count === null || count <= 0) return null;

  return (
    <div className="flex items-center justify-center gap-2 text-xs sm:text-[13px] text-muted-foreground">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      <Zap className="h-3.5 w-3.5 text-amber-400/80" />
      <span>
        <AnimatePresence mode="popLayout">
          <motion.span
            key={count}
            initial={{ y: -6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 6, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="font-mono tabular-nums font-semibold text-foreground inline-block"
          >
            {formatNumber(count)}
          </motion.span>
        </AnimatePresence>{" "}
        créditos entregues nas últimas 24h
      </span>
    </div>
  );
}
