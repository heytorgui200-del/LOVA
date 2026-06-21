import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createPixPayment } from "@/lib/api";
import { formatCurrency } from "@/lib/pricing";

const TOPUP_VALUES = [25, 50, 100, 200];

export function WalletTopUp({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [value, setValue] = useState<number | "">("");
  const [loading, setLoading] = useState(false);

  const numericValue = typeof value === "number" ? value : 0;
  const isValid = numericValue >= 10;

  const handleTopUp = async () => {
    if (loading || !isValid) return;
    setLoading(true);
    try {
      const pixData = await createPixPayment(null, numericValue, 0, user?.email, "wallet_topup");
      if (!pixData.ok) {
        toast.error("Erro ao gerar PIX");
        return;
      }
      const params = new URLSearchParams({
        credits: "0",
        amount: String(numericValue),
        pix_code: pixData.qr_code || "",
        pix_base64: pixData.qr_code_base64 || "",
        expires_at: pixData.expires_at || "",
        wallet_topup: "1",
      });
      navigate(`/pix/${pixData.order_id}?${params.toString()}`);
    } catch {
      toast.error("Erro ao gerar recarga");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-base flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" /> Recarregar Carteira
        </CardTitle>
        <CardDescription className="text-xs">Adicione qualquer valor (mínimo R$10) via PIX</CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="topup-value" className="text-sm font-medium">Valor da recarga (R$)</Label>
          <Input
            id="topup-value"
            type="number"
            min={10}
            step={1}
            placeholder="Ex: 150"
            value={value}
            onChange={(e) => {
              const v = e.target.value;
              setValue(v === "" ? "" : Number(v));
            }}
            className="text-lg font-semibold h-12"
          />
          {value !== "" && !isValid && (
            <p className="text-xs text-destructive">Valor mínimo: R$ 10,00</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {TOPUP_VALUES.map((v) => (
            <button
              key={v}
              onClick={() => setValue(v)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                numericValue === v
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "border border-border bg-background text-muted-foreground hover:border-primary/40"
              }`}
            >
              {formatCurrency(v)}
            </button>
          ))}
        </div>

        <Button onClick={handleTopUp} disabled={loading || !isValid} className="w-full rounded-xl py-5 text-base font-bold gap-2 min-h-[48px]" size="lg">
          {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Gerando PIX...</> : <>Pagar {isValid ? formatCurrency(numericValue) : "R$ ..."} via PIX</>}
        </Button>
        <Button variant="ghost" className="w-full" onClick={onClose}>Voltar</Button>
      </CardContent>
    </Card>
  );
}
