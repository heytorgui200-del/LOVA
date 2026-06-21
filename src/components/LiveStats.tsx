import { memo } from "react";
import { Users, ShoppingCart } from "lucide-react";
import { useMetrics } from "@/contexts/MetricsContext";

export const LiveStats = memo(function LiveStats() {
  const { onlineCount, totalSales, salesLoading } = useMetrics();

  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dot-pulse-soft" />
        <Users className="h-3 w-3" />
        {onlineCount > 0 ? onlineCount : "–"} online
      </span>
      {!salesLoading && (
        <span className="flex items-center gap-1.5">
          <ShoppingCart className="h-3 w-3" />
          {totalSales} vendas
        </span>
      )}
    </div>
  );
});
