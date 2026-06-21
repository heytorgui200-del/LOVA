import { useState, useEffect } from "react";
import { Rocket, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "reseller-guide-hidden";
const YOUTUBE_EMBED_URL = "https://www.youtube.com/embed/l7SWpBItfkI";

export function ResellerOnboarding() {
  const [hidden, setHidden] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === "true"; } catch { return false; }
  });
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, String(hidden)); } catch {}
  }, [hidden]);

  if (hidden) {
    return (
      <button
        onClick={() => setHidden(false)}
        className="text-xs text-primary hover:underline flex items-center gap-1 mb-2"
      >
        <Rocket className="h-3.5 w-3.5" /> Mostrar Guia Rápido
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-emerald-500/5 overflow-hidden"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <Rocket className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-bold text-foreground">
            🚀 Como Vender e Entregar (Vídeo Tutorial)
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setHidden(true); }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
          >
            Ocultar Guia
          </button>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              expanded && "rotate-180"
            )}
          />
        </div>
      </div>

      {/* Video */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-border">
                <iframe
                  src={YOUTUBE_EMBED_URL}
                  title="Tutorial - Como Vender e Entregar"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
