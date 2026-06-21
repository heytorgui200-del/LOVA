import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrCode, Loader2 } from "lucide-react";

interface GuestEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (contact: string) => void;
  loading: boolean;
  credits: number;
  total: number;
}

export function GuestEmailModal({
  open,
  onOpenChange,
  onConfirm,
  loading,
  credits,
  total,
}: GuestEmailModalProps) {
  const [contact, setContact] = useState("");
  const [error, setError] = useState("");

  const validate = () => {
    const trimmed = contact.trim();
    if (!trimmed) {
      setError("Informe um e-mail ou WhatsApp");
      return false;
    }
    // Simple email or phone validation
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    const isPhone = /^\d{10,13}$/.test(trimmed.replace(/\D/g, ""));
    if (!isEmail && !isPhone) {
      setError("E-mail ou número de WhatsApp inválido");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onConfirm(contact.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl border-border/50 bg-background/95 backdrop-blur-xl p-0 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
          <DialogHeader className="space-y-3 text-center">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <QrCode className="h-7 w-7 text-primary" />
            </div>
            <DialogTitle className="font-display text-xl font-bold">
              Compra Rápida via PIX
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Informe seu e-mail ou WhatsApp para receber o comprovante e acompanhar a entrega.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Input
              placeholder="email@exemplo.com ou 11999998888"
              value={contact}
              onChange={(e) => {
                setContact(e.target.value);
                if (error) setError("");
              }}
              className="rounded-xl h-12 text-base"
              autoFocus
            />
            {error && (
              <p className="text-xs text-destructive font-medium">{error}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-5 text-base font-bold gap-2 min-h-[52px]"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Gerando PIX...
              </>
            ) : (
              <>
                <QrCode className="h-5 w-5" />
                Gerar PIX · R$ {total.toFixed(2)}
              </>
            )}
          </Button>

          <p className="text-center text-[11px] text-muted-foreground">
            Sem cadastro · Pagamento 100% seguro · Créditos em segundos
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
