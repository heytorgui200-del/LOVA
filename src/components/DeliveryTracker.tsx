import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy, Check, Loader2, ExternalLink, MessageCircle,
  ClipboardCopy, Mail, Crown, AlertTriangle,
  CheckCircle2, XCircle, Info, DollarSign, BarChart3,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import { formatNumber } from "@/lib/pricing";
import { checkStatus, getEvents } from "@/lib/api";
import { useWhatsAppLink } from "@/hooks/useWhatsAppLink";
import { openWhatsApp } from "@/lib/whatsapp";

/* ─── Types ─── */
interface ApiEvent {
  id?: string;
  event: string;
  message?: string;
  timestamp?: string;
  created_at?: string;
  [key: string]: unknown;
}

interface StatusData {
  ok?: boolean;
  order_id?: number;
  status?: string;
  credits_requested?: number;
  credits_delivered?: number;
  master_email?: string;
  error_message?: string;
  events?: ApiEvent[];
}

type Phase = "preparing" | "action_needed" | "injecting" | "done" | "error";

const TERMINAL_STATUSES = new Set(["completed", "partial", "error", "refunded"]);

const PERMISSION_DETECTED = "Permissão detectada";

const EVENT_ICONS: Record<string, { icon: typeof Info; color: string }> = {
  info:      { icon: Info,          color: "text-blue-400" },
  action:    { icon: AlertTriangle, color: "text-amber-400" },
  credit:    { icon: DollarSign,    color: "text-emerald-400" },
  progress:  { icon: BarChart3,     color: "text-purple-400" },
  completed: { icon: CheckCircle2,  color: "text-emerald-400" },
  error:     { icon: XCircle,       color: "text-red-400" },
};

/* ─── Helpers ─── */
function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (!domain) return "***@***.com";
  const domParts = domain.split(".");
  const maskedName = name.length <= 2 ? "***" : `${name[0]}***${name[name.length - 1]}`;
  const maskedDomain = domParts[0].length <= 2 ? "***" : `${domParts[0][0]}***`;
  return `${maskedName}@${maskedDomain}.${domParts.slice(1).join(".")}`;
}

function relativeTime(ts?: string): string {
  if (!ts) return "";
  const diff = Math.max(0, Math.floor((Date.now() - new Date(ts).getTime()) / 1000));
  if (diff < 5) return "agora";
  if (diff < 60) return `${diff}s`;
  return `${Math.floor(diff / 60)}min`;
}

function hasPermissionDetected(events: ApiEvent[]): boolean {
  return events.some(
    (e) => e.message?.includes(PERMISSION_DETECTED) || e.event === "credit"
  );
}

function derivePhase(status: string | undefined, masterEmail: string | undefined, events: ApiEvent[]): Phase {
  if (!status) return "preparing";
  if (TERMINAL_STATUSES.has(status)) {
    return status === "completed" || status === "partial" ? "done" : "error";
  }
  if (hasPermissionDetected(events)) return "injecting";
  if (masterEmail) return "action_needed";
  return "preparing";
}

/* ─── Props ─── */
export interface DeliveryTrackerProps {
  orderId: string | number;
  creditsRequested?: number;
  onComplete?: (data: { status: string; creditsDelivered: number }) => void;
  externalEvents?: ApiEvent[];
  externalStatus?: StatusData;
}

/* ═══════════════════════════════════════════════════════════
   DELIVERY TRACKER — Reactive State Machine
   ═══════════════════════════════════════════════════════════ */
export function DeliveryTracker({
  orderId,
  creditsRequested = 0,
  onComplete,
  externalEvents,
  externalStatus,
}: DeliveryTrackerProps) {
  const SUPPORT_LINK = useWhatsAppLink();
  const [statusData, setStatusData] = useState<StatusData | null>(externalStatus ?? null);
  const [events, setEvents] = useState<ApiEvent[]>(externalEvents ?? []);
  const [isTerminal, setIsTerminal] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const completeFiredRef = useRef(false);

  useEffect(() => {
    if (externalEvents) setEvents(externalEvents);
  }, [externalEvents]);
  useEffect(() => {
    if (externalStatus) setStatusData(externalStatus);
  }, [externalStatus]);

  const useInternalPolling = !externalStatus;

  const poll = useCallback(async () => {
    if (!useInternalPolling) return;
    try {
      const [sRes, eRes] = await Promise.all([
        checkStatus(orderId),
        getEvents(orderId),
      ]);
      if (sRes?.ok) setStatusData(sRes as StatusData);
      if (eRes?.ok && Array.isArray(eRes.events)) {
        setEvents(
          eRes.events.map((e: ApiEvent) => ({
            ...e,
            timestamp: e.created_at || e.timestamp,
          }))
        );
      }
    } catch {
      // silent
    }
  }, [orderId, useInternalPolling]);

  useEffect(() => {
    if (!useInternalPolling || isTerminal) return;
    poll();
    intervalRef.current = setInterval(poll, 3000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [poll, isTerminal, useInternalPolling]);

  const status = statusData?.status;
  const masterEmail = statusData?.master_email;
  const totalCredits = statusData?.credits_requested || creditsRequested || 0;
  const creditEvents = events.filter((e) => e.event === "credit");
  const deposited = TERMINAL_STATUSES.has(status || "")
    ? statusData?.credits_delivered || creditEvents.length * 10
    : creditEvents.length * 10;
  const phase = derivePhase(status, masterEmail, events);
  const pct = totalCredits > 0 ? Math.min(100, Math.round((deposited / totalCredits) * 100)) : 0;

  useEffect(() => {
    if (TERMINAL_STATUSES.has(status || "") && !isTerminal) {
      setIsTerminal(true);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (onComplete && !completeFiredRef.current) {
        completeFiredRef.current = true;
        onComplete({ status: status!, creditsDelivered: statusData?.credits_delivered || deposited });
      }
    }
  }, [status, isTerminal, onComplete, statusData, deposited]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events.length]);

  return (
    <div className="space-y-5">
      <AnimatePresence mode="wait">
        {phase === "preparing" && <PreparingUI key="preparing" />}
        {phase === "action_needed" && masterEmail && (
          <ActionNeededUI key="action" masterEmail={masterEmail} orderId={orderId} />
        )}
        {phase === "injecting" && (
          <InjectingUI key="injecting" deposited={deposited} total={totalCredits} pct={pct} />
        )}
        {phase === "done" && (
          <DoneUI key="done" deposited={deposited} status={status!} />
        )}
        {phase === "error" && (
          <ErrorUI key="error" message={statusData?.error_message} status={status} />
        )}
      </AnimatePresence>

      {events.length > 0 && phase !== "done" && phase !== "error" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background)/0.6)] backdrop-blur-xl overflow-hidden"
        >
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[hsl(var(--border))]">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground ml-2">
              Logs em tempo real
            </span>
          </div>
          <div className="max-h-44 overflow-y-auto p-3 space-y-1 scrollbar-thin">
            <AnimatePresence initial={false}>
              {events.map((ev, i) => {
                const cfg = EVENT_ICONS[ev.event] || EVENT_ICONS.info;
                const Icon = cfg.icon;
                return (
                  <motion.div
                    key={`${ev.event}-${i}`}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-start gap-2 font-mono text-[11px] leading-relaxed"
                  >
                    <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${cfg.color}`} />
                    <span className="text-foreground/80 flex-1">
                      {ev.message || ev.event}
                    </span>
                    <span className="text-muted-foreground/40 text-[10px] shrink-0 tabular-nums">
                      {relativeTime(ev.timestamp || ev.created_at)}
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <div ref={logsEndRef} />
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   SUB-COMPONENTS (Phase UIs)
   ═══════════════════════════════════════════ */

function PreparingUI() {
  const SUPPORT_LINK = useWhatsAppLink();
  const [timedOut, setTimedOut] = useState(false);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const check = setInterval(() => {
      if (Date.now() - startRef.current > 5 * 60 * 1000) {
        setTimedOut(true);
        clearInterval(check);
      }
    }, 5000);
    return () => clearInterval(check);
  }, []);

  if (timedOut) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        className="text-center space-y-4 py-6"
      >
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mx-auto">
          <XCircle className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="font-display text-xl font-bold text-foreground">
          Processamento demorou demais
        </h2>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Seu pagamento será reembolsado automaticamente. Caso não receba em até 48h, entre em contato.
        </p>
        <button
          onClick={() => openWhatsApp(SUPPORT_LINK)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-sm font-bold text-white hover:bg-[#20bd5a] transition-all min-h-[44px]"
        >
          <MessageCircle className="h-4 w-4" />
          Falar no WhatsApp
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="text-center space-y-4 py-6"
    >
      <div className="relative mx-auto h-20 w-20 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
        <div className="absolute inset-2 rounded-full border-2 border-primary/10 animate-ping" style={{ animationDelay: "0.5s" }} />
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
      <h2 className="font-display text-xl font-bold text-foreground">
        Na fila — aguardando processamento
      </h2>
      <p className="text-sm text-muted-foreground max-w-xs mx-auto">
        Seu pedido está sendo preparado. Isso leva alguns segundos.
      </p>
    </motion.div>
  );
}

function ActionNeededUI({ masterEmail, orderId }: { masterEmail: string; orderId: string | number }) {
  const SUPPORT_LINK = useWhatsAppLink();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(masterEmail);
      setCopied(true);
      toast.success("Email copiado!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="max-w-md mx-auto space-y-4 p-1"
    >
      <div className="flex items-center justify-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="text-[10px] font-semibold text-emerald-400 tracking-wider uppercase">Ao vivo</span>
      </div>

      <motion.div
        initial={{ scale: 0.97 }}
        animate={{ scale: 1 }}
        className="relative rounded-2xl overflow-hidden"
      >
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/30 via-primary/10 to-emerald-500/20 animate-pulse" />
        <div className="relative m-[1px] rounded-2xl bg-background p-5 space-y-3">
          <p className="text-xs text-muted-foreground font-medium">
            📋 Copie este email e cole no seu projeto:
          </p>

          <button onClick={handleCopy} className="group w-full relative">
            <div className={`font-mono text-lg sm:text-xl p-4 rounded-xl border-2 transition-all text-center font-bold ${
              copied
                ? "border-emerald-500/50 bg-emerald-500/5 text-emerald-400"
                : "border-primary/30 bg-muted/30 text-foreground hover:border-primary/60 hover:bg-muted/50"
            }`}>
              {maskEmail(masterEmail)}
            </div>
            <motion.div
              whileTap={{ scale: 0.9 }}
              className={`absolute top-2 right-2 p-2 rounded-lg transition-all ${
                copied ? "bg-emerald-500 text-white" : "bg-primary text-primary-foreground group-hover:bg-primary/90"
              }`}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </motion.div>
          </button>

          <AnimatePresence>
            {copied && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs text-emerald-400 text-center font-semibold"
              >
                ✅ Copiado!
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <p className="text-center text-xs text-muted-foreground">
        Cole em <strong className="text-foreground">Settings</strong> → <strong className="text-foreground">People</strong> → Convide → Mude para <span className="text-amber-400 font-extrabold">OWNER</span>
      </p>

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center h-5 w-5">
            <div className="absolute h-4 w-4 rounded-full border border-primary/30 animate-ping" />
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
          </div>
          <span className="text-[10px] text-muted-foreground">Aguardando permissão...</span>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://youtu.be/l7SWpBItfkI?si=ydPQPRPpeHPoXMjy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-primary hover:underline flex items-center gap-1"
          >
            <ExternalLink className="h-3 w-3" />
            Tutorial
          </a>
          <button
            onClick={() => openWhatsApp(SUPPORT_LINK)}
            className="flex items-center gap-1 text-[10px] text-[#25D366] hover:underline"
          >
            <MessageCircle className="h-3 w-3" />
            Ajuda
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function InjectingUI({ deposited, total, pct }: { deposited: number; total: number; pct: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="text-center space-y-5"
    >
      <div className="inline-flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-primary/10 mx-auto">
        <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 text-primary animate-spin" />
      </div>

      <div>
        <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-1">
          Injetando créditos...
        </h2>
        <p className="text-muted-foreground text-xs sm:text-sm">
          Os créditos estão sendo depositados. Não feche esta página.
        </p>
      </div>

      <div className="rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-xl p-6 sm:p-8">
        <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3 font-medium">
          Créditos Depositados
        </p>
        <p className="font-display text-5xl sm:text-7xl font-extrabold text-primary tabular-nums leading-none">
          {formatNumber(deposited)}
        </p>
        <p className="text-muted-foreground text-sm mt-2">de {formatNumber(total)}</p>

        <div className="mt-6 relative">
          <div className="h-4 w-full rounded-full bg-muted/50 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{
                boxShadow: "0 0 20px rgba(59,130,246,0.4), 0 0 40px rgba(52,211,153,0.2)",
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 tabular-nums">{pct}% concluído</p>
        </div>
      </div>
    </motion.div>
  );
}

function DoneUI({ deposited, status }: { deposited: number; status: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="text-center space-y-4"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
        className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 mx-auto"
      >
        <CheckCircle2 className="h-10 w-10 text-emerald-400" />
      </motion.div>
      <h2 className="font-display text-2xl font-bold text-foreground">
        {status === "partial" ? "Entrega parcial concluída" : "Créditos injetados com sucesso! 🎉"}
      </h2>
      <div className="rounded-2xl bg-primary/5 border border-primary/20 p-5">
        <p className="text-xs text-muted-foreground mb-1">Créditos adicionados</p>
        <p className="font-display text-4xl sm:text-5xl font-extrabold text-primary tabular-nums">
          +{formatNumber(deposited)}
        </p>
      </div>
    </motion.div>
  );
}

function ErrorUI({ message, status }: { message?: string; status?: string }) {
  const SUPPORT_LINK = useWhatsAppLink();
  const isRefund = status === "refunded" || status === "refund_pending" || status === "provision_failed";
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-4"
    >
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mx-auto">
        <XCircle className="h-8 w-8 text-destructive" />
      </div>
      <h2 className="font-display text-xl font-bold text-foreground">
        {status === "refunded" ? "Pagamento estornado" : isRefund ? "Erro — Reembolso em andamento" : "Erro no processamento"}
      </h2>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
        {isRefund
          ? "Ocorreu um erro ao provisionar seus créditos. Seu pagamento será reembolsado automaticamente em até 48h."
          : message || "Ocorreu um erro ao provisionar seus créditos. Nosso time foi notificado."}
      </p>
      {isRefund && (
      <button
          onClick={() => openWhatsApp(SUPPORT_LINK)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-sm font-bold text-white hover:bg-[#20bd5a] transition-all min-h-[44px]"
        >
          <MessageCircle className="h-4 w-4" />
          Falar no WhatsApp
        </button>
      )}
    </motion.div>
  );
}
