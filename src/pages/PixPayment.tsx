import { useEffect, useState, useRef, useCallback, memo } from "react";
import { useSmartPolling } from "@/hooks/useSmartPolling";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy, CheckCircle2, Clock, Loader2, QrCode, Shield,
  Check, ArrowRight, RotateCcw, MessageCircle,
  Sparkles, UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatNumber } from "@/lib/pricing";
import { checkPixStatus } from "@/lib/api";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Confetti } from "@/components/Confetti";
import { useWhatsAppLink } from "@/hooks/useWhatsAppLink";
import { openWhatsApp } from "@/lib/whatsapp";
import { useAuth } from "@/contexts/AuthContext";
import { DeliveryTracker } from "@/components/DeliveryTracker";
import { NoIndex } from "@/components/NoIndex";

interface ApiEvent {
  event: string;
  message?: string;
  timestamp?: string;
  [key: string]: unknown;
}

type PaymentPhase = "waiting" | "identified" | "syncing" | "done" | "error";
type DisplayPhase = "waiting" | "delivery" | "done" | "error";

const TERMINAL_PHASES: PaymentPhase[] = ["done", "error"];

/* ─── Memo'd QR Code ─── */
const QrCodeDisplay = memo(function QrCodeDisplay({
  pixBase64, pixCode, copied, onCopy,
}: {
  pixBase64: string; pixCode: string; copied: boolean; onCopy: () => void;
}) {
  return (
    <>
      <div className="flex justify-center mb-3 sm:mb-4">
        {pixBase64 ? (
          <img src={`data:image/png;base64,${pixBase64}`} alt="QR Code PIX" className="w-36 h-36 sm:w-44 sm:h-44 rounded-xl border border-border" />
        ) : (
          <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center bg-muted/30">
            <QrCode className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground">QR Code indisponível</p>
          </div>
        )}
      </div>
      {pixCode && (
        <div className="mb-3 sm:mb-4">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">PIX Copia e Cola</label>
          <div className="flex gap-2">
            <input readOnly value={pixCode} className="flex-1 rounded-xl border border-border bg-muted/30 px-3 py-2.5 sm:px-4 sm:py-3 text-[11px] sm:text-xs font-mono text-foreground truncate" />
            <button onClick={onCopy} className="rounded-xl border border-border bg-background px-3.5 py-2.5 sm:px-4 sm:py-3 text-sm font-medium transition-all hover:border-primary hover:text-primary min-h-[44px]">
              {copied ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Copy className="h-5 w-5" />}
            </button>
          </div>
        </div>
      )}
    </>
  );
});

/* ─── Success Phase ─── */
function SuccessPhase({ creditsDeposited, orderId }: { creditsDeposited: number; orderId?: string }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const SUPPORT_LINK = useWhatsAppLink();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="text-center space-y-5 sm:space-y-6"
    >
      <Confetti />
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
        className="inline-flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-success/10 mx-auto"
      >
        <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12 text-success" />
      </motion.div>

      <div>
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Pronto! Créditos injetados com sucesso 🎉
        </h2>
        <p className="text-muted-foreground text-sm">Seus créditos já estão disponíveis para uso.</p>
      </div>

      <div className="rounded-2xl bg-primary/5 border border-primary/20 p-5 sm:p-6">
        <p className="text-xs text-muted-foreground mb-1">Créditos adicionados</p>
        <p className="font-display text-4xl sm:text-5xl font-extrabold text-primary tabular-nums">
          +{formatNumber(creditsDeposited)}
        </p>
      </div>

      <div className="flex flex-col gap-3 pt-2">
        {!user ? (
          <button onClick={() => navigate("/register")} className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all min-h-[52px] text-base">
            <UserPlus className="h-5 w-5" />
            Criar minha conta agora
          </button>
        ) : (
          <button onClick={() => navigate("/dashboard")} className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all min-h-[52px] text-base">
            <ArrowRight className="h-5 w-5" />
            Acessar meu Painel
          </button>
        )}
        <button
          onClick={() => openWhatsApp(SUPPORT_LINK)}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-6 py-3.5 font-bold text-white hover:bg-[#20bd5a] transition-all min-h-[48px]"
        >
          <MessageCircle className="h-5 w-5" />
          Comprar pelo WhatsApp
        </button>
        <button onClick={() => navigate("/")} className="w-full flex items-center justify-center gap-2 rounded-2xl border border-border px-6 py-3.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all min-h-[44px]">
          <RotateCcw className="h-4 w-4" />
          Nova Recarga
        </button>
      </div>
    </motion.div>
  );
}

/* ─── Main Page ─── */
export default function PixPaymentPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const SUPPORT_LINK = useWhatsAppLink();
  

  const stored = (() => {
    try {
      const raw = localStorage.getItem("active_order");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  })();

  const credits = Number(searchParams.get("credits")) || stored?.credits || 0;
  const amount = Number(searchParams.get("amount")) || stored?.amount || 0;
  const pixCode = searchParams.get("pix_code") || stored?.pix_code || "";
  const pixBase64 = searchParams.get("pix_base64") || stored?.pix_base64 || "";
  const expiresAt = searchParams.get("expires_at") || stored?.expires_at || "";

  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [expired, setExpired] = useState(false);
  const persistedDelivery = (() => {
    try {
      const raw = localStorage.getItem("delivery_state");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  })();

  const [phase, setPhase] = useState<PaymentPhase>(
    (persistedDelivery?.phase as PaymentPhase) || "waiting"
  );
  const [errorReason, setErrorReason] = useState<"cancelled" | "refunded" | "provision_failed" | null>(null);
  const [creditsDeposited, setCreditsDeposited] = useState(persistedDelivery?.creditsDeposited || 0);
  const [creditsTotal, setCreditsTotal] = useState(persistedDelivery?.creditsTotal || credits);
  const [deliveryEvents, setDeliveryEvents] = useState<ApiEvent[]>(persistedDelivery?.events || []);
  const [deliveryStatus, setDeliveryStatus] = useState<Record<string, unknown> | null>(
    persistedDelivery?.status || null
  );

  useEffect(() => {
    if (orderId && credits > 0) {
      localStorage.setItem("active_order", JSON.stringify({
        orderId, credits, amount,
        pix_code: pixCode, pix_base64: pixBase64, expires_at: expiresAt,
      }));
    }
  }, [orderId, credits, amount, pixCode, pixBase64, expiresAt]);

  useEffect(() => {
    if (TERMINAL_PHASES.includes(phase)) {
      localStorage.removeItem("active_order");
      localStorage.removeItem("delivery_state");
    } else if (phase !== "waiting") {
      localStorage.setItem("delivery_state", JSON.stringify({
        phase,
        creditsDeposited,
        creditsTotal,
        events: deliveryEvents,
        status: deliveryStatus,
      }));
    }
  }, [phase, creditsDeposited, creditsTotal, deliveryEvents, deliveryStatus]);

  const phaseRef = useRef<PaymentPhase>("waiting");
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  const visualDeadlineRef = useRef<number | null>(null);
  useEffect(() => {
    if (!expiresAt) return;
    if (!visualDeadlineRef.current) {
      visualDeadlineRef.current = Date.now() + 3 * 60 * 1000;
    }
    const deadline = visualDeadlineRef.current;
    const tick = () => {
      const diff = deadline - Date.now();
      if (diff <= 0) { setExpired(true); setTimeLeft("Expirado"); return; }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${mins}:${secs.toString().padStart(2, "0")}`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const isTerminal = TERMINAL_PHASES.includes(phase);

  const pixPollCallback = useCallback(async () => {
    if (!orderId || TERMINAL_PHASES.includes(phaseRef.current)) return;

    try {
      const res = await checkPixStatus(orderId);
      const serverPhase = res.phase as PaymentPhase | undefined;

      if (serverPhase === "error" || res.status === "cancelled" || res.status === "rejected" || res.status === "refund_pending") {
        setPhase("error");
        setErrorReason(
          res.status === "refunded" ? "refunded"
          : (res.status === "provision_failed" || res.status === "refund_pending") ? "provision_failed"
          : "cancelled"
        );
        if (res.status === "cancelled" || res.status === "rejected") {
          toast.error("Pagamento cancelado ou expirado. Gere um novo PIX.");
        } else {
          toast.error("Erro no processamento. Reembolso será feito automaticamente.");
        }
        return;
      }

      if (res.events) setDeliveryEvents(res.events);
      if (typeof res.credits_deposited === "number") setCreditsDeposited(res.credits_deposited);
      if (typeof res.credits_total === "number" && res.credits_total > 0) setCreditsTotal(res.credits_total);

      setDeliveryStatus({
        ok: true,
        status: res.delivery_status || res.status,
        master_email: res.master_email,
        credits_requested: res.credits_total || credits,
        credits_delivered: res.credits_deposited || 0,
        error_message: res.error_message,
      });

      if (serverPhase === "done" || res.status === "completed") {
        setCreditsDeposited(res.credits_deposited || credits);
        setPhase("done");
        toast.success("Recarga confirmada!");
        return;
      }

      if (res.status === "partial") {
        const cEvents = (res.events || []).filter((e: ApiEvent) => e.event === "credit").length;
        setCreditsDeposited(res.credits_delivered || cEvents * 10);
        setPhase("done");
        toast.success("Entrega parcial concluída");
        return;
      }

      if (serverPhase === "identified" || res.status === "approved" || res.status === "paid") {
        setPhase("identified");
      }

      if (serverPhase === "syncing") {
        setPhase("syncing");
      }
    } catch {
      // keep polling silently
    }
  }, [orderId, credits]);

  const pollInterval = phase === "waiting" ? 5000 : 3000;
  const pollMaxInterval = phase === "waiting" ? 20000 : 3000;
  const pollBackoff = phase === "waiting" ? 5000 : 0;

  useSmartPolling(pixPollCallback, {
    enabled: !!orderId && !isTerminal,
    initialInterval: pollInterval,
    maxInterval: pollMaxInterval,
    backoffStep: pollBackoff,
  });

  const handleCopy = useCallback(async () => {
    if (!pixCode) return;
    try {
      await navigator.clipboard.writeText(pixCode);
      setCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setCopied(false), 3000);
    } catch { toast.error("Erro ao copiar"); }
  }, [pixCode]);

  const displayPhase: DisplayPhase = (() => {
    if (phase === "done") return "done";
    if (phase === "error") return "error";
    if (phase === "waiting") return "waiting";
    return "delivery";
  })();

  return (
    <AnimatedBackground>
      <NoIndex />
      <div className="min-h-screen pt-16 sm:pt-20 pb-6 sm:pb-10">
        <div className="container mx-auto max-w-lg px-3 sm:px-4 py-4 sm:py-10">
          <motion.div
            className="bg-background rounded-3xl border border-border shadow-xl p-4 sm:p-6"
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <AnimatePresence mode="wait">
              {displayPhase === "waiting" && (
                <motion.div key="waiting" initial={{ opacity: 1 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                  <div className="text-center mb-3 sm:mb-4">
                    <div className="inline-flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-2 sm:mb-3">
                      <QrCode className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <h1 className="font-display text-lg sm:text-xl font-bold text-foreground mb-1">
                      Finalize sua recarga
                    </h1>
                    <p className="text-muted-foreground text-xs">
                      Escaneie o QR Code ou copie o código abaixo.
                    </p>
                  </div>

                  {!expired && timeLeft && (
                    <div className="flex justify-center mb-3">
                      <span className="font-display text-3xl sm:text-4xl font-black text-destructive tabular-nums animate-pulse">
                        {timeLeft}
                      </span>
                    </div>
                  )}

                  {expired ? (
                    <div className="text-center py-10 space-y-4">
                      <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mx-auto">
                        <Clock className="h-8 w-8 text-destructive" />
                      </div>
                      <h2 className="text-lg font-bold text-foreground">⏱️ PIX Expirado</h2>
                      <p className="text-sm text-muted-foreground">Gere um novo pedido para continuar.</p>
                      <button onClick={() => navigate("/")} className="w-full rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all min-h-[48px]">
                        Gerar Novo Pedido
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="rounded-2xl bg-muted/50 border border-border p-3 mb-3 sm:mb-4">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-xs sm:text-sm text-muted-foreground">Créditos</span>
                          <span className="font-bold text-sm text-foreground">{formatNumber(credits)}</span>
                        </div>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-xs sm:text-sm text-muted-foreground">Valor</span>
                          <span className="font-display text-xl sm:text-2xl font-extrabold text-primary">{formatCurrency(amount)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Pedido</span>
                          <span className="text-xs font-mono text-muted-foreground">#{orderId?.slice(0, 8)}</span>
                        </div>
                      </div>

                      <QrCodeDisplay pixBase64={pixBase64} pixCode={pixCode} copied={copied} onCopy={handleCopy} />

                      <div className="rounded-2xl bg-primary/5 border border-primary/20 p-3 mb-3 sm:mb-4">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          <span className="text-xs sm:text-sm font-medium text-foreground">Aguardando Pagamento Pix...</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-center gap-2 text-[11px] sm:text-xs text-muted-foreground mb-3">
                        <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                        <span>100% seguro · Créditos via ID, sem senha</span>
                      </div>

                      <button onClick={() => navigate("/")} className="w-full rounded-xl border border-border px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all min-h-[44px]">
                        ← Voltar ao início
                      </button>
                    </>
                  )}
                </motion.div>
              )}

              {displayPhase === "delivery" && orderId && (
                <motion.div key="delivery" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <DeliveryTracker
                    orderId={orderId}
                    creditsRequested={creditsTotal}
                    externalEvents={deliveryEvents}
                    externalStatus={deliveryStatus as any}
                    onComplete={({ status, creditsDelivered }) => {
                      setCreditsDeposited(creditsDelivered);
                      setPhase("done");
                    }}
                  />
                </motion.div>
              )}

              {displayPhase === "done" && (
                <SuccessPhase key="success" creditsDeposited={creditsDeposited || credits} orderId={orderId} />
              )}

              {displayPhase === "error" && (
                <motion.div key="error" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mx-auto">
                    <span className="text-3xl">{errorReason === "cancelled" ? "⏱️" : "❌"}</span>
                  </div>
                  <h2 className="font-display text-xl font-bold text-foreground">
                    {errorReason === "cancelled" ? "PIX Cancelado / Expirado" : errorReason === "refunded" ? "Pagamento Estornado" : "Erro — Reembolso em andamento"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {errorReason === "cancelled"
                      ? "O pagamento PIX foi cancelado ou expirou antes de ser confirmado. Nenhum valor foi cobrado."
                      : errorReason === "refunded"
                        ? "Seu pagamento foi estornado. O valor será devolvido pela sua instituição financeira."
                        : "Ocorreu um erro ao provisionar seus créditos. Seu pagamento será reembolsado automaticamente em até 48h."}
                  </p>
                  {(errorReason === "provision_failed") && (
                    <button
                      onClick={() => openWhatsApp(SUPPORT_LINK)}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-6 py-3.5 text-sm font-bold text-white hover:bg-[#20bd5a] transition-all min-h-[48px]"
                    >
                      <MessageCircle className="h-5 w-5" />
                      Falar no WhatsApp
                    </button>
                  )}
                  <button onClick={() => navigate("/")} className="w-full rounded-2xl bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all min-h-[48px]">
                    {errorReason === "cancelled" ? "Gerar Novo PIX" : "Voltar ao início"}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </AnimatedBackground>
  );
}
