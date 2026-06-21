import { Clock } from "lucide-react";
import { CardShell } from "./CardShell";

const PER_DAY = 500;

export function UsageTimeCard({ credits }: { credits: number }) {
  const days = credits / PER_DAY;
  let label: string;
  if (days < 0.5) label = "algumas horas";
  else if (days < 1) label = "~1 dia";
  else if (days < 7) label = `~${Math.round(days)} dias`;
  else if (days < 30) label = `~${Math.round(days / 7)} semanas`;
  else label = `~${Math.round(days / 30)} meses`;

  return (
    <CardShell icon={Clock} title="Tempo de uso">
      <div className="text-base sm:text-lg font-semibold tracking-tight text-foreground leading-tight">{label}</div>
      <p className="text-[10px] text-muted-foreground mt-1">de dev intenso</p>
    </CardShell>
  );
}
