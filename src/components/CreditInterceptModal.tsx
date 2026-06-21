import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { PlayCircle, ArrowRight, Shield } from "lucide-react";

interface CreditInterceptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: () => void;
  onTutorial: () => void;
}

export function CreditInterceptModal({
  open,
  onOpenChange,
  onContinue,
  onTutorial,
}: CreditInterceptModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl border-border/50 bg-background/95 backdrop-blur-xl p-0 overflow-hidden">
        <div className="p-6 sm:p-8 space-y-6">
          <DialogHeader className="space-y-3 text-center">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Shield className="h-7 w-7 text-primary" />
            </div>
            <DialogTitle className="font-display text-xl font-bold">
              Como funciona a recarga?
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Veja um tutorial rápido ou continue direto para o pagamento seguro via Pix.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onTutorial}
              className="flex items-center gap-3 rounded-2xl border border-border bg-muted/30 px-5 py-4 text-left transition-colors hover:border-primary/40 hover:bg-muted/50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <PlayCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Ver Tutorial Rápido</p>
                <p className="text-xs text-muted-foreground">Entenda o processo em 1 minuto</p>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onContinue}
              className="flex items-center gap-3 rounded-2xl bg-primary px-5 py-4 text-left transition-all hover:bg-primary/90 shadow-lg shadow-primary/20"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/20">
                <ArrowRight className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-primary-foreground">Continuar para Recarga</p>
                <p className="text-xs text-primary-foreground/70">Pagamento rápido via Pix</p>
              </div>
            </motion.button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Processo 100% seguro · Créditos vinculados via ID
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
