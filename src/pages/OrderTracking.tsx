import { useEffect, useState, useCallback } from "react";
import { useSmartPolling } from "@/hooks/useSmartPolling";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Clock, Loader2, ArrowRight, RotateCcw, MessageCircle, UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { checkStatus, getEvents } from "@/lib/api";
import { formatNumber } from "@/lib/pricing";
import { Confetti } from "@/components/Confetti";
import { useWhatsAppLink } from "@/hooks/useWhatsAppLink";
import { openWhatsApp } from "@/lib/whatsapp";
import { SignupIncentiveBanner } from "@/components/SignupIncentiveBanner";
import { NoIndex } from "@/components/NoIndex";
import { useAuth } from "@/contexts/AuthContext";
import { DeliveryTracker } from "@/components/DeliveryTracker";

interface OrderData {
  ok: boolean;
  order_id: string;
  status: string;
  credits_requested: number;
  credits_delivered: number;
  master_email?: string;
  error_message?: string;
}

interface EventItem {
  id?: string;
  event: string;
  message?: string;
  created_at?: string;
  timestamp?: string;
}

const TERMINAL = ["completed", "partial", "error", "refunded"];

export default function OrderTrackingPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const SUPPORT_LINK = useWhatsAppLink();
  
  const [order, setOrder] = useState<OrderData | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [terminalReached, setTerminalReached] = useState(false);

  const isTerminal = order ? TERMINAL.includes(order.status) : false;

  const poll = useCallback(async () => {
    if (!orderId) return;
    try {
      const [sRes, eRes] = await Promise.all([
        checkStatus(orderId),
        getEvents(orderId),
      ]);
      if (sRes?.ok) setOrder(sRes as OrderData);
      if (eRes?.ok && Array.isArray(eRes.events)) {
        setEvents(
          eRes.events.map((e: EventItem) => ({
            ...e,
            timestamp: e.created_at || e.timestamp,
          }))
        );
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useSmartPolling(poll, {
    enabled: !!orderId && !isTerminal,
    initialInterval: 3000,
    maxInterval: 3000,
    backoffStep: 0,
  });

  useEffect(() => {
    poll();
  }, [poll]);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 text-center">
        <p className="text-muted-foreground">Pedido não encontrado.</p>
      </div>
    );
  }

  const isDone = terminalReached || TERMINAL.includes(order.status);
  const isSuccess = order.status === "completed" || order.status === "partial";
  const creditsDelivered = order.credits_delivered || 0;

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-16 px-4 bg-muted/30">
      <NoIndex />
      <div className="container mx-auto max-w-lg">
        <div className="text-center mb-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground bg-muted/50 rounded-full px-3 py-1 border border-border">
            <Clock className="h-3 w-3" />
            Pedido #{order.order_id}
          </span>
        </div>

        <div className="bg-background rounded-3xl border border-border shadow-xl p-5 sm:p-8 md:p-10">
          {!isDone && (
            <DeliveryTracker
              orderId={orderId!}
              creditsRequested={order.credits_requested}
              externalEvents={events as any}
              externalStatus={{
                ok: true,
                status: order.status,
                master_email: order.master_email,
                credits_requested: order.credits_requested,
                credits_delivered: order.credits_delivered,
                error_message: order.error_message,
              }}
              onComplete={({ status, creditsDelivered: cd }) => {
                setTerminalReached(true);
                setOrder((prev) => prev ? { ...prev, status, credits_delivered: cd } : prev);
                if (status === "completed" || status === "partial") {
                  toast.success("Créditos entregues!");
                }
              }}
            />
          )}

          {isDone && isSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-5"
            >
              <Confetti />
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 mx-auto">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}>
                  <svg className="h-10 w-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              </div>

              <h2 className="font-display text-2xl font-bold text-foreground">
                Créditos injetados com sucesso 🎉
              </h2>

              <div className="rounded-2xl bg-primary/5 border border-primary/20 p-5">
                <p className="text-xs text-muted-foreground mb-1">Créditos adicionados</p>
                <p className="font-display text-4xl font-extrabold text-primary tabular-nums">
                  +{formatNumber(creditsDelivered)}
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

              <div className="pt-2">
                <SignupIncentiveBanner variant="card" />
              </div>
            </motion.div>
          )}

          {isDone && !isSuccess && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mx-auto">
                <span className="text-3xl">❌</span>
              </div>
              <h2 className="font-display text-xl font-bold text-foreground">Erro no processamento</h2>
              <p className="text-sm text-muted-foreground">
                {order.error_message || "Ocorreu um erro ao provisionar seus créditos."} Nosso time foi notificado.
              </p>
              <button onClick={() => navigate("/")} className="w-full rounded-2xl border border-border px-6 py-3.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all min-h-[44px]">
                Voltar ao início
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
