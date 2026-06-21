import { Users, ShoppingCart, Shield } from "lucide-react";
import { useMetrics } from "@/contexts/MetricsContext";

export function SocialProofBlock() {
  const { onlineCount, totalSales } = useMetrics();

  return (
    <section className="py-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border/50 bg-card/50 p-5 text-center space-y-2">
          <ShoppingCart className="h-6 w-6 mx-auto text-primary" />
          <p className="text-2xl font-bold text-foreground">+{totalSales}</p>
          <p className="text-sm text-muted-foreground">Compras realizadas</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/50 p-5 text-center space-y-2">
          <Users className="h-6 w-6 mx-auto text-green-500" />
          <p className="text-2xl font-bold text-foreground">{onlineCount}</p>
          <p className="text-sm text-muted-foreground">Pessoas online agora</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/50 p-5 text-center space-y-2">
          <Shield className="h-6 w-6 mx-auto text-primary" />
          <p className="text-2xl font-bold text-foreground">100%</p>
          <p className="text-sm text-muted-foreground">Transações seguras</p>
        </div>
      </div>
    </section>
  );
}
