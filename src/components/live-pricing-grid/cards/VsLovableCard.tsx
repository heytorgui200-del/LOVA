import { Swords } from "lucide-react";
import { formatCurrency, getLovableOfficialPrice } from "@/lib/pricing";
import { CardShell } from "./CardShell";

export function VsLovableCard({ credits, total }: { credits: number; total: number }) {
  const official = getLovableOfficialPrice(credits);
  return (
    <CardShell icon={Swords} title="Vs Lovable.dev">
      <div className="flex items-baseline gap-1.5 flex-wrap font-mono tabular-nums">
        <span className="text-sm sm:text-base text-muted-foreground line-through">
          {formatCurrency(official)}
        </span>
        <span className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
          {formatCurrency(total)}
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground mt-1">oficial → aqui</p>
    </CardShell>
  );
}
