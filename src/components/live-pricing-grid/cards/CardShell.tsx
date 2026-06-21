import { motion } from "framer-motion";
import { LucideIcon, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  icon: LucideIcon;
  title: string;
  tone?: "primary" | "success" | "warning" | "neutral";
  children: React.ReactNode;
  badge?: string;
}

const VALUE_TONES: Record<string, string> = {
  primary: "text-foreground",
  success: "text-foreground",
  warning: "text-foreground",
  neutral: "text-foreground",
};

export function CardShell({ icon: Icon, title, children, badge }: Props) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "relative rounded-2xl border border-border/40 bg-card/60 p-4 transition-colors hover:border-primary/30",
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
          {title}
        </span>
      </div>
      <div className={VALUE_TONES.neutral}>{children}</div>
      {badge && (
        <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
          <Check className="h-2.5 w-2.5" />
          {badge}
        </span>
      )}
    </motion.div>
  );
}
