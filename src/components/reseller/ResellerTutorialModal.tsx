import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlayCircle } from "lucide-react";

const STORAGE_KEY = "reseller_tutorial_seen";

export function ResellerTutorialModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) setOpen(true);
  }, []);

  const dismiss = (remember: boolean) => {
    if (remember) localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  };

  return (
    <>
      {/* Small button when dismissed */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <PlayCircle className="h-3.5 w-3.5" />
          🎬 Como vender (1 min)
        </button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl p-0 bg-background border-border/50 overflow-hidden">
          <div className="aspect-video">
            <iframe
              src="https://www.youtube.com/embed/l7SWpBItfkI?autoplay=1"
              title="Tutorial - Como Usar o Painel de Revenda"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="p-4 flex gap-3">
            <Button onClick={() => dismiss(true)} className="flex-1 font-bold rounded-xl py-5">
              ✅ Já entendi
            </Button>
            <Button variant="ghost" onClick={() => dismiss(false)} className="text-xs text-muted-foreground">
              Ver depois
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
