import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatNumber } from "@/lib/pricing";

interface Purchase {
  first_name: string;
  credits: number;
  minutes_ago: number;
}

const SHOW_INTERVAL = 25_000;
const VISIBLE_DURATION = 5_000;
const PAUSE_AFTER_INTERACTION = 15_000;

function formatAge(min: number) {
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  return `há ${Math.floor(h / 24)}d`;
}

export function RecentPurchaseToast() {
  const [current, setCurrent] = useState<Purchase | null>(null);
  const purchasesRef = useRef<Purchase[]>([]);
  const indexRef = useRef(0);
  const pausedUntilRef = useRef(0);

  // Fetch purchases initially and refresh periodically
  useEffect(() => {
    let cancelled = false;
    const fetchPurchases = async () => {
      const { data, error } = await supabase.rpc("get_recent_purchases", { _limit: 10 });
      if (!cancelled && !error && Array.isArray(data)) {
        purchasesRef.current = data as Purchase[];
      }
    };
    fetchPurchases();
    const id = setInterval(fetchPurchases, 120_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // Pause when user interacts with the simulator area
  useEffect(() => {
    const handleInteract = () => {
      pausedUntilRef.current = Date.now() + PAUSE_AFTER_INTERACTION;
    };
    window.addEventListener("pointerdown", handleInteract);
    return () => window.removeEventListener("pointerdown", handleInteract);
  }, []);

  // Cycle through toasts
  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout>;
    const showNext = () => {
      if (Date.now() < pausedUntilRef.current) return;
      const list = purchasesRef.current;
      if (!list.length) return;
      const next = list[indexRef.current % list.length];
      indexRef.current += 1;
      setCurrent(next);
      hideTimer = setTimeout(() => setCurrent(null), VISIBLE_DURATION);
    };
    const id = setInterval(showNext, SHOW_INTERVAL);
    const initial = setTimeout(showNext, 8_000);
    return () => {
      clearInterval(id);
      clearTimeout(initial);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-4 left-4 z-40 max-w-[calc(100vw-2rem)] sm:max-w-xs">
      <AnimatePresence>
        {current && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="pointer-events-auto flex items-start gap-3 rounded-xl border border-border/60 bg-card/95 backdrop-blur-md px-3.5 py-2.5 shadow-xl shadow-black/40"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
            <div className="text-[12px] leading-snug">
              <p className="text-foreground">
                <span className="font-semibold">{current.first_name}</span>{" "}
                comprou{" "}
                <span className="font-mono tabular-nums">
                  {formatNumber(current.credits)}
                </span>{" "}
                créditos
              </p>
              <p className="text-muted-foreground text-[11px] mt-0.5">
                {formatAge(current.minutes_ago)}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
