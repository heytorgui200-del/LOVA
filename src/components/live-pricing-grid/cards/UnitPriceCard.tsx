import { Coins } from "lucide-react";
import { formatCurrency } from "@/lib/pricing";
import { CardShell } from "./CardShell";

export function UnitPriceCard({ total, credits }: { total: number; credits: number }) {
  const unit = credits > 0 ? total / credits : 0;
  const great = unit < 0.1;
  return (
    <CardShell icon={Coins} title="Por crédito" badge={great ? "ótimo" : undefined}>
      <div className="text-xl sm:text-2xl font-semibold font-mono tabular-nums tracking-tight text-foreground">
        {formatCurrency(unit)}
      </div>
      <p className="text-[10px] text-muted-foreground mt-1">por unidade</p>
    </CardShell>
  );
}
