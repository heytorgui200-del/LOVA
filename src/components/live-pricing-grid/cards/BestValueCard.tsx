import { Trophy } from "lucide-react";
import { CardShell } from "./CardShell";

interface Props {
  credits: number;
  total: number;
  calculateTotal: (n: number) => number;
}

const TIERS = [100, 500, 1000, 2000, 5000, 10000];

export function BestValueCard({ credits, total, calculateTotal }: Props) {
  let bestTier = TIERS[0];
  let bestUnit = calculateTotal(bestTier) / bestTier;
  for (const t of TIERS) {
    const u = calculateTotal(t) / t;
    if (u < bestUnit) {
      bestUnit = u;
      bestTier = t;
    }
  }

  const currentUnit = credits > 0 ? total / credits : Infinity;
  const isBest = currentUnit <= bestUnit * 1.02;

  return (
    <CardShell icon={Trophy} title="Custo-benefício" badge={isBest ? "top" : undefined}>
      <div className="text-sm font-semibold tracking-tight text-foreground leading-tight">
        {isBest ? "Você está no top" : `${bestTier.toLocaleString("pt-BR")} é o ideal`}
      </div>
      <p className="text-[10px] text-muted-foreground mt-1">
        melhor R$/crédito da tabela
      </p>
    </CardShell>
  );
}
