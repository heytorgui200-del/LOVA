import { Gem } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/pricing";
import { CardShell } from "./CardShell";

interface Props {
  credits: number;
  total: number;
  calculateTotal: (n: number) => number;
}

const TIERS = [100, 500, 1000, 2000, 5000, 10000];

export function NextDiscountCard({ credits, total, calculateTotal }: Props) {
  const currentUnit = credits > 0 ? total / credits : Infinity;
  const next = TIERS.find((t) => t > credits && calculateTotal(t) / t < currentUnit);

  if (!next) {
    return (
      <CardShell icon={Gem} title="Próximo desconto">
        <div className="text-sm font-semibold text-foreground tracking-tight">Você já está no melhor preço</div>
        <p className="text-[10px] text-muted-foreground mt-1">por unidade</p>
      </CardShell>
    );
  }

  const nextTotal = calculateTotal(next);
  const diffCredits = next - credits;
  const diffPrice = nextTotal - total;

  return (
    <CardShell icon={Gem} title="Próximo desconto">
      <div className="text-sm font-semibold text-foreground leading-tight tracking-tight font-mono tabular-nums">
        +{formatNumber(diffCredits)} por {formatCurrency(diffPrice)}
      </div>
      <p className="text-[10px] text-muted-foreground mt-1 font-mono tabular-nums">
        cai pra {formatCurrency(nextTotal / next)}/un
      </p>
    </CardShell>
  );
}
