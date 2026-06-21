import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, formatNumber } from "@/lib/pricing";

interface Order {
  id: string;
  credits: number;
  price: number;
  completed_at: string | null;
}

function formatRelative(iso: string | null) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 60) return `há ${Math.max(1, min)} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `há ${d}d`;
  const w = Math.floor(d / 7);
  return `há ${w} sem`;
}

export function InlinePurchaseHistory() {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    if (!user) {
      setOrders(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, credits, price, completed_at")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(3);
      if (!cancelled && !error && data) setOrders(data as Order[]);
    })();
  }, [user]);

  if (!user || !profile || !orders || orders.length === 0) return null;

  return (
    <div className="w-full max-w-3xl mx-auto rounded-2xl border border-border/50 bg-card/60 p-5 sm:p-6 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground">
          Suas últimas compras
        </h3>
        <Link
          to="/order-history"
          className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
        >
          Ver todas <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <ul className="divide-y divide-border/40">
        {orders.map((o) => (
          <li
            key={o.id}
            className="flex items-center justify-between py-2.5 text-sm"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="font-mono tabular-nums text-foreground">
                {formatNumber(o.credits)}
              </span>
              <span className="text-muted-foreground">créditos</span>
              <span className="text-muted-foreground hidden sm:inline">·</span>
              <span className="font-mono tabular-nums text-muted-foreground hidden sm:inline">
                {formatCurrency(o.price)}
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {formatRelative(o.completed_at)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
