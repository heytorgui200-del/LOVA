import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/pricing";

const PRESETS = [100, 500, 1000, 2000, 5000, 10000];

interface Props {
  credits: number;
  onSelect: (n: number) => void;
}

export function PresetShortcuts({ credits, onSelect }: Props) {
  return (
    <div className="flex items-center justify-center gap-2 flex-wrap">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground mr-1">
        Atalhos
      </span>
      {PRESETS.map((p) => {
        const active = credits === p;
        return (
          <button
            key={p}
            type="button"
            onClick={() => onSelect(p)}
            className={cn(
              "h-8 px-3 text-xs font-medium rounded-lg border transition-colors tabular-nums font-mono",
              active
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/40 bg-card/40 text-muted-foreground hover:text-foreground hover:border-border",
            )}
          >
            {p >= 1000 ? `${p / 1000}k` : formatNumber(p)}
          </button>
        );
      })}
    </div>
  );
}
