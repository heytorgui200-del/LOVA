import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Package } from "lucide-react";
import { NoIndex } from "@/components/NoIndex";
import { listOrders } from "@/lib/api";
import { formatNumber } from "@/lib/pricing";

interface Order {
  order_id: string;
  status: string;
  credits_requested: number;
  credits_delivered: number;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-success-bg text-success border-success/30",
  processing: "bg-blue-50 text-primary border-primary/30",
  pending: "bg-warning-bg text-warning border-warning/30",
  partial: "bg-warning-bg text-warning border-warning/30",
  error: "bg-danger-bg text-danger border-danger/30",
  refunded: "bg-blue-50 text-primary border-primary/30",
};

const STATUS_LABELS: Record<string, string> = {
  completed: "Concluído",
  processing: "Processando",
  pending: "Pendente",
  partial: "Parcial",
  error: "Erro",
  refunded: "Reembolsado",
};

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const data = await listOrders(50);
        if (data.ok && data.orders) setOrders(data.orders);
        else setError(true);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 bg-muted/30">
      <NoIndex />
      <div className="container mx-auto max-w-4xl">
        <h1 className="font-display text-3xl font-bold text-foreground mb-8">Meus Pedidos</h1>

        {error ? (
          <div className="card-surface p-12 text-center">
            <p className="text-muted-foreground mb-4">Sistema ocupado, tente novamente em alguns segundos.</p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-xl bg-primary px-6 py-3 font-display font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="card-surface p-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Nenhum pedido ainda.</p>
            <button
              onClick={() => navigate("/")}
              className="rounded-xl bg-primary px-6 py-3 font-display font-bold text-primary-foreground hover:bg-blue-700 transition-colors"
            >
              Comece agora →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders.map((order) => {
              const progress = order.credits_requested > 0
                ? (order.credits_delivered / order.credits_requested) * 100
                : 0;
              const statusClass = STATUS_COLORS[order.status] || STATUS_COLORS.pending;

              return (
                <button
                  key={order.order_id}
                  onClick={() => navigate(`/order/${order.order_id}`)}
                  className="card-surface p-5 text-left transition-all hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-sm text-muted-foreground">#{order.order_id}</span>
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusClass}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                  </div>
                  <p className="text-sm text-foreground font-medium mb-2">
                    {formatNumber(order.credits_delivered)} / {formatNumber(order.credits_requested)} créditos
                  </p>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-2">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, progress)}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground">{getTimeAgo(order.created_at)}</p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "agora";
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} horas`;
  return `há ${Math.floor(diff / 86400)} dias`;
}
