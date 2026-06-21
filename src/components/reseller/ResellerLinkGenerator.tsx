import { useState, useCallback, useMemo } from "react";
import { usePricing } from "@/hooks/usePricing";
import { formatCurrency, formatNumber } from "@/lib/pricing";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Copy, Check, ExternalLink, Loader2, Zap, AlertTriangle, Minus, Plus, Wallet } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ResellerMessageTemplates } from "./ResellerMessageTemplates";

interface Props {
  slug: string | null;
  resellerId: string | null;
  storeName?: string | null;
  walletBalance?: number;
  onSelectPackage: (credits: number) => void;
  onLinkGenerated?: () => void;
}

const MIN_CREDITS = 100;
const MAX_CREDITS = 50000;
const STEP = 10;
const SCALE_PREVIEW = [100, 200, 500, 1000, 2000, 5000];

function packSlug(qty: number): string {
  return `${qty}-creditos`;
}

export function ResellerLinkGenerator({ slug, resellerId, storeName, walletBalance = 0, onLinkGenerated }: Props) {
  const { calculateTotal } = usePricing();

  const [credits, setCredits] = useState(1000);
  const [marginPercent, setMarginPercent] = useState(50);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [confirmedPayment, setConfirmedPayment] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const calc = useMemo(() => {
    const cost = calculateTotal(credits);
    const salePrice = Math.ceil(cost * (1 + marginPercent / 100));
    const profit = salePrice - cost;
    return { cost, salePrice, profit };
  }, [credits, marginPercent, calculateTotal]);

  const hasBalance = walletBalance >= calc.cost;

  const scaleRows = useMemo(() =>
    SCALE_PREVIEW.map(qty => {
      const cost = calculateTotal(qty);
      const sp = Math.ceil(cost * (1 + marginPercent / 100));
      return { qty, profit: sp - cost };
    }), [marginPercent, calculateTotal]);

  const adjustCredits = (delta: number) => {
    setCredits(prev => {
      const next = Math.max(MIN_CREDITS, Math.min(MAX_CREDITS, prev + delta));
      return Math.round(next / STEP) * STEP;
    });
    setGeneratedLink(null);
  };

  const handleCreditsInput = (val: string) => {
    const num = parseInt(val) || MIN_CREDITS;
    setCredits(Math.max(MIN_CREDITS, Math.min(MAX_CREDITS, Math.round(num / STEP) * STEP)));
    setGeneratedLink(null);
  };

  const generateLink = async () => {
    if (!resellerId) { toast.error("Configure seu slug primeiro."); return; }
    if (!hasBalance) { toast.error("Saldo insuficiente na carteira."); return; }

    setSaving(true);
    try {
      const linkSlug = packSlug(credits);
      const phoneClean = clientPhone.replace(/\D/g, "");

      const { data, error: fnErr } = await supabase.functions.invoke("process-reseller-delivery", {
        body: {
          action: "create_link_and_reserve",
          reseller_id: resellerId,
          credits,
          cost: calc.cost,
          sale_price: calc.salePrice,
          profit: calc.profit,
          margin_mode: "percent",
          slug: linkSlug,
          client_name: clientName.trim() || null,
          client_phone: phoneClean || null,
        },
      });

      if (fnErr) throw new Error(fnErr.message);
      if (data?.error === "insufficient_balance") {
        toast.error("Saldo insuficiente na carteira.");
        return;
      }
      if (data?.error) throw new Error(data.message || data.error);

      const link = slug
        ? `https://lovaboost.com.br/r/${slug}/${linkSlug}`
        : `https://lovaboost.com.br/r/loja/${linkSlug}`;

      setGeneratedLink(link);
      onLinkGenerated?.();
      toast.success("Link gerado! Saldo reservado.");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar link.");
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink).then(() => {
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => toast.error("Erro ao copiar"));
  };

  const resetForm = () => {
    setGeneratedLink(null);
    setClientName("");
    setClientPhone("");
    setConfirmedPayment(false);
  };

  const glowIntensity = Math.min(1, (marginPercent - 10) / 190);
  const glowColor = glowIntensity > 0.5 ? "text-emerald-400" : "text-primary";

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-primary/20 bg-card p-4 sm:p-6 space-y-5">

        {/* ─── SALDO ─── */}
        <div className="flex items-center justify-between rounded-xl bg-background/60 border border-border/50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wallet className="h-4 w-4" />
            <span>Saldo disponível</span>
          </div>
          <span className={`font-bold tabular-nums ${hasBalance ? 'text-emerald-400' : 'text-destructive'}`}>
            {formatCurrency(walletBalance)}
          </span>
        </div>

        {/* ─── 1. MARGEM DE LUCRO ─── */}
        <div className="space-y-3">
          <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" /> Simulador de Venda
          </h2>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-muted-foreground">Sua margem de lucro</span>
              <motion.span
                key={marginPercent}
                initial={{ scale: 1.2, opacity: 0.7 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`text-2xl sm:text-3xl font-black tabular-nums ${glowColor}`}
              >
                {marginPercent}%
              </motion.span>
            </div>
            <Slider
              value={[marginPercent]}
              onValueChange={([v]) => { setMarginPercent(v); setGeneratedLink(null); }}
              min={10} max={200} step={5}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>10% agressivo</span>
              <span>100%</span>
              <span>200% premium</span>
            </div>
          </div>
        </div>

        {/* ─── 2. CRÉDITOS ─── */}
        <div className="space-y-2">
          <span className="text-xs sm:text-sm font-medium text-foreground">Quantidade de créditos</span>
          <div className="flex items-center gap-2 justify-center">
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl"
              onClick={() => adjustCredits(-100)} disabled={credits <= MIN_CREDITS}>
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              value={credits}
              onChange={(e) => handleCreditsInput(e.target.value)}
              onBlur={() => setCredits(Math.max(MIN_CREDITS, Math.round(credits / STEP) * STEP))}
              className="w-28 sm:w-36 text-center text-xl sm:text-2xl font-black py-5 bg-background/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              min={MIN_CREDITS} max={MAX_CREDITS} step={STEP}
            />
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl"
              onClick={() => adjustCredits(100)} disabled={credits >= MAX_CREDITS}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ─── 3. RESULTADO EM TEMPO REAL ─── */}
        <div className="rounded-xl border border-border/50 bg-background/60 p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Custo (API)</span>
            <span className="font-mono font-medium">{formatCurrency(calc.cost)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Preço para o cliente</span>
            <AnimatePresence mode="popLayout">
              <motion.span key={calc.salePrice} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                className="font-mono font-bold text-foreground">
                {formatCurrency(calc.salePrice)}
              </motion.span>
            </AnimatePresence>
          </div>
          <div className="border-t border-border/30 pt-2 flex justify-between items-center">
            <span className="text-sm font-semibold text-emerald-500">💰 Seu lucro</span>
            <AnimatePresence mode="popLayout">
              <motion.span key={calc.profit} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                className="text-xl font-black text-emerald-400 tabular-nums">
                {formatCurrency(calc.profit)}
              </motion.span>
            </AnimatePresence>
          </div>
          <p className="text-[10px] text-muted-foreground text-center pt-1">
            Será debitado da carteira agora: <span className="font-bold text-foreground">{formatCurrency(calc.cost)}</span>
          </p>
        </div>

        {/* ─── 4. ESCALA VISUAL ─── */}
        <div className="space-y-1.5">
          <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Escala de lucro com {marginPercent}%:</p>
          <div className="flex flex-wrap gap-1.5">
            {scaleRows.map(r => (
              <button key={r.qty}
                onClick={() => { setCredits(r.qty); setGeneratedLink(null); }}
                className={`rounded-lg px-2 py-1 text-[10px] sm:text-xs transition-all border ${
                  credits === r.qty
                    ? "border-primary bg-primary/10 text-primary font-bold"
                    : "border-border/50 bg-card text-muted-foreground hover:border-primary/30"
                }`}>
                {formatNumber(r.qty)} → <span className="text-emerald-400 font-bold">{formatCurrency(r.profit)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ─── 5. DADOS DO CLIENTE ─── */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Dados do cliente (opcional)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input value={clientName} onChange={(e) => setClientName(e.target.value)}
              placeholder="Nome do cliente" className="bg-background/50 text-sm" />
            <Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)}
              placeholder="WhatsApp (ex: 11999999999)" type="tel" className="bg-background/50 text-sm" />
          </div>
        </div>

        {/* ─── 6. CONFIRMAÇÃO + GERAR ─── */}
        {!generatedLink && (
          <div className="space-y-3">
            {!hasBalance && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-destructive leading-relaxed">
                  <span className="font-bold">Saldo insuficiente.</span> Você precisa de {formatCurrency(calc.cost)} na carteira para gerar este link. Adicione saldo primeiro.
                </p>
              </div>
            )}

            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-3 space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-200/90 leading-relaxed">
                  <span className="font-bold">Atenção:</span> O valor de <span className="font-bold">{formatCurrency(calc.cost)}</span> será debitado da sua carteira <span className="font-bold">imediatamente</span>.
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={confirmedPayment} onCheckedChange={(v) => setConfirmedPayment(!!v)} />
                <span className="text-xs sm:text-sm text-foreground font-medium">Confirmo que recebi o pagamento do cliente</span>
              </label>
            </div>

            <Button onClick={generateLink} disabled={saving || !confirmedPayment || !hasBalance}
              className="w-full gap-2 font-bold py-5 rounded-xl text-sm sm:text-base">
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />}
              {saving ? "Gerando e reservando saldo..." : "⚡ Gerar link de venda"}
            </Button>
          </div>
        )}

        {/* ─── RESULTADO ─── */}
        <AnimatePresence>
          {generatedLink && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden">
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 space-y-3">
                <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">
                  ✅ Link pronto! Saldo reservado. {clientName && `— para ${clientName}`}
                </p>
                <div className="flex gap-2">
                  <Input value={generatedLink} readOnly className="text-[10px] sm:text-xs bg-background/50 font-mono truncate" />
                  <Button onClick={handleCopy} variant="outline" size="sm" className="shrink-0 gap-1 text-xs">
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copiado!" : "Copiar"}
                  </Button>
                </div>
                {slug && (
                  <Button variant="ghost" size="sm" className="gap-1.5 text-xs"
                    onClick={() => window.open(generatedLink, "_blank")}>
                    <ExternalLink className="h-3.5 w-3.5" /> Abrir página
                  </Button>
                )}
                <ResellerMessageTemplates credits={credits} salePrice={calc.salePrice} link={generatedLink}
                  clientName={clientName || undefined} storeName={storeName || undefined} />
                <Button variant="outline" onClick={resetForm} className="w-full rounded-xl text-xs gap-1.5">
                  <Zap className="h-3.5 w-3.5" /> Gerar outro link
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
