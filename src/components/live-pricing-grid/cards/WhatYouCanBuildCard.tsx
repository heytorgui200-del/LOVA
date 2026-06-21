import { Target } from "lucide-react";
import { CardShell } from "./CardShell";

const RANGES: { max: number; label: string; sub: string }[] = [
  { max: 100, label: "Ajustes pequenos", sub: "tweaks de UI" },
  { max: 300, label: "Landing page", sub: "1 página completa" },
  { max: 700, label: "Site institucional", sub: "3-5 páginas" },
  { max: 1200, label: "Dashboard simples", sub: "auth + CRUD" },
  { max: 2000, label: "App SaaS MVP", sub: "funcional ponta-a-ponta" },
  { max: 3500, label: "E-commerce", sub: "loja com checkout" },
  { max: 6000, label: "SaaS completo", sub: "multi-tenant + admin" },
  { max: 999999, label: "Produto inteiro", sub: "meses de dev" },
];

export function WhatYouCanBuildCard({ credits }: { credits: number }) {
  const match = RANGES.find((r) => credits <= r.max) ?? RANGES[RANGES.length - 1];
  return (
    <CardShell icon={Target} title="Dá pra fazer">
      <div className="text-base sm:text-lg font-semibold tracking-tight text-foreground leading-tight">
        {match.label}
      </div>
      <p className="text-[10px] text-muted-foreground mt-1">{match.sub}</p>
    </CardShell>
  );
}
