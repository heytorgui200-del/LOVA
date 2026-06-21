import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, formatNumber } from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2, CheckCircle2, ArrowRight, XCircle,
  Play, ChevronRight, ShieldCheck, RotateCcw, MessageCircle
} from "lucide-react";

const YOUTUBE_EMBED_URL = "https://www.youtube.com/embed/l7SWpBItfkI";

const TUTORIAL_SLIDES = [
  {
    title: "Acesse sua Workspace",
    description: "Entre no Lovable e vá até Settings → Team da sua workspace.",
  },
  {
    title: "Adicione como Owner",
    description: "Adicione o e-mail que vamos informar como OWNER da workspace.",
  },
  {
    title: "Receba seus créditos",
    description: "Clique em 'Receber créditos' e a entrega será feita automaticamente!",
  },
];

interface DeliveryLog {
  message: string;
  type: "info" | "success" | "error" | "warning";
  timestamp: string;
}

interface OrderData {
  id: string;
  public_token: string;
  credits: number;
  final_price: number;
  status: string;
  delivery_logs: DeliveryLog[];
  tutorial_viewed_at: string | null;
  completed_at: string | null;
  created_at: string;
  client_whatsapp: string | null;
  expires_at: string | null;
  resellers: { store_name: string | null; whatsapp: string | null } | null;
}

function friendlyMessage(msg: string): string {
  const map: [RegExp, string][] = [
    [/pedido criado/i, "Pedido registrado"],
    [/tutorial conclu/i, "Tutorial concluído"],
    [/validando saldo/i, "Conectando ao sistema..."],
    [/saldo validado/i, "Verificação concluída"],
    [/reservando/i, "Preparando créditos..."],
    [/saldo debitado/i, "Processando..."],
    [/saldo já reservado/i, "Saldo confirmado"],
    [/iniciando entrega/i, "Iniciando envio dos créditos..."],
    [/enviando pedido/i, "Processando..."],
    [/api oficial respondeu/i, "Sistema confirmou"],
    [/provisionados/i, "Créditos sendo enviados para sua conta"],
    [/estornado/i, "Processo revertido"],
    [/saldo insuficiente/i, "Erro temporário, tente novamente"],
    [/expirado/i, "Pedido expirado"],
    [/falha/i, "Ocorreu um problema, tente novamente"],
    [/erro/i, "Ocorreu um problema"],
    [/tentativa.*falhou/i, "Reconectando..."],
  ];
  for (const [re, friendly] of map) {
    if (re.test(msg)) return friendly;
  }
  return msg;
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "Aguardando...",
    reserved: "Créditos reservados",
    tutorial_viewed: "Tutorial concluído",
    validating: "Verificando...",
    ready_to_deliver: "Preparando entrega...",
    processing: "Enviando créditos...",
    completed: "Créditos entregues!",
    failed: "Houve um problema",
    expired: "Pedido expirado",
    cancelled: "Cancelado",
  };
  return labels[status] || "Processando...";
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export default function ResellerPublicPage() {
  const { slug, packSlug } = useParams<{ slug: string; packSlug?: string }>();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [linkData, setLinkData] = useState<{
    id: string; pack: number; sale_price: number; reseller_id: string;
    resellers: { store_name: string | null; slug: string | null; whatsapp: string | null } | null;
  } | null>(null);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [step, setStep] = useState<"landing" | "video" | "tutorial" | "phone" | "tracking" | "done" | "expired">("landing");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tutorialSlide, setTutorialSlide] = useState(0);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const videoStartTime = useRef<number>(0);
  const MIN_VIDEO_SECONDS = 30;

  const credits = order?.credits || linkData?.pack || 0;
  const price = order?.final_price || linkData?.sale_price || 0;
  const storeName = order?.resellers?.store_name || linkData?.resellers?.store_name || null;
  const resellerWhatsapp = order?.resellers?.whatsapp || linkData?.resellers?.whatsapp || null;

  // ═══ LOAD LINK DATA ═══
  useEffect(() => {
    if (!slug || !packSlug) { setNotFound(true); setLoading(false); return; }
    (async () => {
      // Use security-definer functions instead of direct table access
      const { data: resellerRows } = await supabase.rpc("get_public_reseller_info", { _slug: slug });
      const reseller = Array.isArray(resellerRows) ? resellerRows[0] : null;

      if (!reseller) { setNotFound(true); setLoading(false); return; }

      const { data: linkRows } = await supabase.rpc("get_public_link_info", { _reseller_id: reseller.id, _slug: packSlug });
      const link = Array.isArray(linkRows) ? linkRows[0] : null;

      if (!link) { setNotFound(true); setLoading(false); return; }

      setLinkData({ ...link, resellers: { ...reseller, whatsapp: null } });
      supabase.rpc("increment_link_views", { _link_id: link.id }).then(() => {});

      // Lookup existing order via edge function (anon can't read reseller_orders directly)
      try {
        const { data: lookupData } = await supabase.functions.invoke("process-reseller-delivery", {
          body: { action: "lookup_order", reseller_link_id: link.id },
        });

        const existingOrder = lookupData?.order;
        if (existingOrder) {
          const orderData: OrderData = {
            ...existingOrder,
            delivery_logs: (existingOrder.delivery_logs as DeliveryLog[]) || [],
            resellers: existingOrder.resellers || reseller,
          };
          setOrder(orderData);

          // Check expiration
          if (existingOrder.expires_at && new Date(existingOrder.expires_at) < new Date()) {
            if (!["completed", "cancelled", "expired", "failed"].includes(existingOrder.status)) {
              setStep("expired");
              setLoading(false);
              return;
            }
          }

          if (existingOrder.status === "completed") {
            setStep("done");
          } else if (existingOrder.status === "expired") {
            setStep("expired");
          } else if (["processing", "validating", "ready_to_deliver"].includes(existingOrder.status)) {
            setStep("tracking");
          } else if (existingOrder.tutorial_viewed_at) {
            setStep(existingOrder.client_whatsapp ? "phone" : "tracking");
          } else {
            setStep("video");
          }
        }
      } catch {
        // No existing order, stay on landing
      }

      setLoading(false);
    })();
  }, [slug, packSlug]);

  // ═══ POLL STATUS ═══
  useEffect(() => {
    if (!order?.public_token) return;
    if (["completed", "failed", "cancelled", "expired"].includes(order.status)) return;

    const interval = setInterval(async () => {
      try {
        const { data } = await supabase.functions.invoke("process-reseller-delivery", {
          body: { action: "get_status", public_token: order.public_token },
        });
        if (data && !data.error) {
          setOrder(prev => prev ? {
            ...prev,
            status: data.status,
            delivery_logs: (data.delivery_logs as DeliveryLog[]) || prev.delivery_logs,
            tutorial_viewed_at: data.tutorial_viewed_at || prev.tutorial_viewed_at,
            completed_at: data.completed_at || prev.completed_at,
          } : null);
          if (data.status === "completed") setStep("done");
          if (data.status === "expired") setStep("expired");
          if (data.status === "failed") setError("Houve um problema na entrega. Entre em contato com o vendedor.");
        }
      } catch { /* silent */ }
    }, 3000);

    return () => clearInterval(interval);
  }, [order?.public_token, order?.status]);

  // ═══ FULLSCREEN LISTENER (L4 FIX: min 30s timer) ═══
  useEffect(() => {
    if (step !== "video") return;
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        const elapsed = (Date.now() - videoStartTime.current) / 1000;
        if (elapsed >= MIN_VIDEO_SECONDS) {
          advanceFromVideo();
        }
        // If not enough time, user stays on video step
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [step, order]);

  const advanceFromVideo = useCallback(() => {
    const elapsed = (Date.now() - videoStartTime.current) / 1000;
    if (elapsed < MIN_VIDEO_SECONDS) {
      setError(`Assista pelo menos ${Math.ceil(MIN_VIDEO_SECONDS - elapsed)}s antes de continuar.`);
      return;
    }
    setError(null);
    setStep("tutorial");
    if (order) {
      supabase.functions.invoke("process-reseller-delivery", {
        body: { action: "tutorial_viewed", public_token: order.public_token },
      });
    }
  }, [order]);

  // ═══ ACTIONS ═══
  const createOrderAndPlay = useCallback(async () => {
    if (!linkData) return;
    setActionLoading(true);
    setError(null);
    try {
      // Lookup existing order via edge function
      const { data: lookupData } = await supabase.functions.invoke("process-reseller-delivery", {
        body: { action: "lookup_order", reseller_link_id: linkData.id },
      });

      if (lookupData?.order) {
        const existingOrder = lookupData.order;

        // Check expiration
        if (existingOrder.expires_at && new Date(existingOrder.expires_at) < new Date()) {
          setStep("expired");
          return;
        }

        setOrder({
          ...existingOrder,
          delivery_logs: (existingOrder.delivery_logs as DeliveryLog[]) || [],
          resellers: existingOrder.resellers || linkData.resellers,
        });
      setStep("video");
      videoStartTime.current = Date.now();
      setTimeout(() => {
        videoContainerRef.current?.requestFullscreen?.().catch(() => {});
      }, 300);
      return;
    }

      // Legacy fallback: create order via edge function
      const { data, error: fnErr } = await supabase.functions.invoke("process-reseller-delivery", {
        body: { action: "create_order", reseller_link_id: linkData.id },
      });
      if (fnErr) throw new Error(fnErr.message);

      // Fetch fresh order via get_status
      const { data: freshData } = await supabase.functions.invoke("process-reseller-delivery", {
        body: { action: "get_status", public_token: data.token },
      });

      if (freshData && !freshData.error) {
        setOrder({
          ...freshData,
          delivery_logs: (freshData.delivery_logs as DeliveryLog[]) || [],
          resellers: freshData.resellers || linkData.resellers,
        });
      }

      setStep("video");
      videoStartTime.current = Date.now();
      setTimeout(() => {
        videoContainerRef.current?.requestFullscreen?.().catch(() => {});
      }, 300);
    } catch {
      setError("Não foi possível iniciar. Tente novamente.");
    } finally {
      setActionLoading(false);
    }
  }, [linkData]);

  const validatePhone = useCallback(() => {
    const expectedPhone = order?.client_whatsapp;
    if (!expectedPhone) {
      startDelivery();
      return;
    }
    const normalized = normalizePhone(phone);
    const expected = normalizePhone(expectedPhone);
    if (normalized.length < 10) {
      setPhoneError("Digite um número válido com DDD");
      return;
    }
    const last9 = (n: string) => n.slice(-9);
    if (last9(normalized) !== last9(expected)) {
      setPhoneError("Número não confere. Verifique com o vendedor.");
      return;
    }
    setPhoneError(null);
    startDelivery();
  }, [phone, order, linkData]);

  const startDelivery = useCallback(async () => {
    if (!order) return;
    setActionLoading(true);
    setError(null);
    setStep("tracking");
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("process-reseller-delivery", {
        body: { action: "start_delivery", public_token: order.public_token },
      });
      if (fnErr) throw new Error(fnErr.message);
      if (data?.status === "failed") {
        setError("Houve um problema na entrega. Entre em contato com o vendedor.");
      }
      if (data?.status === "expired") {
        setStep("expired");
      }
    } catch {
      setError("Não foi possível completar a entrega. Tente novamente.");
    } finally {
      setActionLoading(false);
    }
  }, [order]);

  const openResellerWhatsapp = () => {
    if (!resellerWhatsapp) return;
    const clean = resellerWhatsapp.replace(/\D/g, "");
    const number = clean.startsWith("55") ? clean : `55${clean}`;
    window.open(`https://wa.me/${number}?text=Olá, preciso de ajuda com meu pedido de créditos`, "_blank");
  };

  // ═══ RENDER ═══
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-white/40">Carregando...</p>
      </div>
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0f] gap-4 px-4">
      <XCircle className="h-14 w-14 text-red-400/60" />
      <h1 className="text-2xl font-bold text-white">Link não encontrado</h1>
      <p className="text-white/50 text-center text-sm">Este link não existe ou já foi utilizado.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      {/* Minimal header */}
      <div className="w-full border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-sm">
        <div className="container mx-auto max-w-lg px-4 py-4 flex items-center justify-between">
          <p className="text-xs text-white/30 uppercase tracking-widest font-medium">
            {storeName || "Loja"}
          </p>
          {resellerWhatsapp && (
            <button onClick={openResellerWhatsapp} className="flex items-center gap-1.5 text-xs text-white/30 hover:text-[#25D366] transition-colors">
              <MessageCircle className="h-3.5 w-3.5" />
              <span>Suporte</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg space-y-6">

          {/* ═══ STEP: LANDING ═══ */}
          {step === "landing" && (
            <div className="text-center space-y-8">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-medium text-primary">Acesso liberado</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black leading-tight">
                  Parabéns! 🎉
                </h1>
                <p className="text-lg sm:text-xl text-white/70">
                  Seu pacote de <span className="text-white font-bold">{formatNumber(credits)} créditos</span> está pronto
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Resumo</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Créditos</span>
                    <span className="font-bold">{formatNumber(credits)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Valor</span>
                    <span className="font-bold">{formatCurrency(price)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-white/40">
                  Assista o vídeo tutorial para liberar seus créditos
                </p>
                <Button
                  onClick={createOrderAndPlay}
                  disabled={actionLoading}
                  size="lg"
                  className="w-full gap-2 text-base font-bold py-6 rounded-xl bg-primary hover:bg-primary/90"
                >
                  {actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
                  {actionLoading ? "Preparando..." : "Assistir e liberar créditos"}
                </Button>
              </div>
            </div>
          )}

          {/* ═══ STEP: VIDEO ═══ */}
          {step === "video" && (
            <div className="space-y-5">
              <div className="text-center space-y-2">
                <h2 className="text-xl font-bold">Assista antes de continuar</h2>
                <p className="text-sm text-white/40">
                  Veja o tutorial completo para liberar seus créditos
                </p>
              </div>
              <div
                ref={videoContainerRef}
                className="aspect-video rounded-xl overflow-hidden border border-white/10 bg-black"
              >
                <iframe
                  src={YOUTUBE_EMBED_URL + "?autoplay=1"}
                  title="Tutorial"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                />
              </div>
              <Button
                onClick={() => {
                  if (document.fullscreenElement) {
                    document.exitFullscreen();
                  } else {
                    advanceFromVideo();
                  }
                }}
                size="lg"
                className="w-full gap-2 font-bold py-5 rounded-xl"
              >
                <CheckCircle2 className="h-4 w-4" />
                Já assisti, continuar
              </Button>
            </div>
          )}

          {/* ═══ STEP: TUTORIAL ═══ */}
          {step === "tutorial" && (
            <div className="space-y-6">
              <div className="text-center space-y-1">
                <h2 className="text-xl font-bold">Como resgatar</h2>
                <p className="text-xs text-white/40">
                  Passo {tutorialSlide + 1} de {TUTORIAL_SLIDES.length}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center space-y-4">
                <div className="h-14 w-14 rounded-full bg-primary/10 text-primary font-bold text-xl flex items-center justify-center mx-auto">
                  {tutorialSlide + 1}
                </div>
                <h3 className="text-lg font-bold">{TUTORIAL_SLIDES[tutorialSlide].title}</h3>
                <p className="text-white/50 text-sm">{TUTORIAL_SLIDES[tutorialSlide].description}</p>
              </div>

              <div className="flex justify-center gap-2">
                {TUTORIAL_SLIDES.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === tutorialSlide ? "w-6 bg-primary" : "w-2 bg-white/10"
                    }`}
                  />
                ))}
              </div>

              <Button
                onClick={() => {
                  if (tutorialSlide < TUTORIAL_SLIDES.length - 1) {
                    setTutorialSlide(tutorialSlide + 1);
                  } else {
                    const expectedPhone = order?.client_whatsapp;
                    if (expectedPhone) {
                      setStep("phone");
                    } else {
                      startDelivery();
                    }
                  }
                }}
                disabled={actionLoading}
                size="lg"
                className="w-full gap-2 font-bold py-5 rounded-xl"
              >
                {actionLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Iniciando...</>
                ) : tutorialSlide < TUTORIAL_SLIDES.length - 1 ? (
                  <>Próximo <ChevronRight className="h-4 w-4" /></>
                ) : (
                  <>Receber meus créditos <ArrowRight className="h-4 w-4" /></>
                )}
              </Button>
            </div>
          )}

          {/* ═══ STEP: PHONE VALIDATION ═══ */}
          {step === "phone" && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <ShieldCheck className="h-10 w-10 text-primary mx-auto" />
                <h2 className="text-xl font-bold">Verificação de segurança</h2>
                <p className="text-sm text-white/40">
                  Digite o WhatsApp usado na compra para confirmar
                </p>
              </div>

              <div className="space-y-3">
                <Input
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setPhoneError(null); }}
                  className="py-5 text-center text-lg bg-white/5 border-white/10 text-white placeholder:text-white/20"
                />
                {phoneError && (
                  <p className="text-sm text-red-400 text-center">{phoneError}</p>
                )}
              </div>

              <Button
                onClick={validatePhone}
                disabled={actionLoading || phone.replace(/\D/g, "").length < 10}
                size="lg"
                className="w-full gap-2 font-bold py-5 rounded-xl"
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                {actionLoading ? "Verificando..." : "Confirmar e receber créditos"}
              </Button>
            </div>
          )}

          {/* ═══ STEP: TRACKING ═══ */}
          {step === "tracking" && order && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
                <h2 className="text-xl font-bold">{statusLabel(order.status)}</h2>
                <p className="text-sm text-white/40">Aguarde enquanto processamos sua entrega</p>
              </div>

              {/* Timeline */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="space-y-0">
                  {order.delivery_logs.map((log, i) => (
                    <div key={i} className="flex gap-3 relative">
                      {i < order.delivery_logs.length - 1 && (
                        <div className="absolute left-[9px] top-5 bottom-0 w-0.5 bg-white/5" />
                      )}
                      <div className={`relative z-10 h-5 w-5 rounded-full shrink-0 mt-0.5 flex items-center justify-center ${
                        log.type === "success" ? "bg-primary" :
                        log.type === "error" ? "bg-red-500" :
                        log.type === "warning" ? "bg-yellow-500" : "bg-white/10"
                      }`}>
                        {log.type === "success" && <CheckCircle2 className="h-3 w-3 text-white" />}
                        {log.type === "error" && <XCircle className="h-3 w-3 text-white" />}
                        {log.type === "info" && <div className="h-1.5 w-1.5 rounded-full bg-white/60" />}
                        {log.type === "warning" && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </div>
                      <div className="pb-4">
                        <p className="text-sm text-white/70">{friendlyMessage(log.message)}</p>
                        <p className="text-[10px] text-white/20 mt-0.5">
                          {new Date(log.timestamp).toLocaleTimeString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  ))}
                  {["processing", "validating", "ready_to_deliver"].includes(order.status) && (
                    <div className="flex gap-3 items-center">
                      <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
                      <p className="text-sm text-white/40 animate-pulse">Processando...</p>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center space-y-3">
                  <p className="text-sm text-red-300">{error}</p>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" size="sm" onClick={startDelivery} className="gap-2 text-xs border-white/10">
                      <RotateCcw className="h-3.5 w-3.5" /> Tentar novamente
                    </Button>
                    {resellerWhatsapp && (
                      <Button variant="outline" size="sm" onClick={openResellerWhatsapp} className="gap-2 text-xs border-white/10 text-[#25D366]">
                        <MessageCircle className="h-3.5 w-3.5" /> Falar com vendedor
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ STEP: EXPIRED ═══ */}
          {step === "expired" && (
            <div className="text-center space-y-6">
              <div className="space-y-3">
                <XCircle className="h-14 w-14 text-yellow-500/60 mx-auto" />
                <h2 className="text-2xl font-bold text-white">Pedido expirado</h2>
                <p className="text-white/50 text-sm">
                  Este pedido expirou. Entre em contato com o vendedor para um novo link.
                </p>
              </div>
              {resellerWhatsapp && (
                <Button onClick={openResellerWhatsapp} className="gap-2 rounded-xl bg-[#25D366] hover:bg-[#1DA851]">
                  <MessageCircle className="h-4 w-4" /> Falar com vendedor
                </Button>
              )}
            </div>
          )}

          {/* ═══ STEP: DONE ═══ */}
          {step === "done" && order && (
            <div className="text-center space-y-6">
              <div className="space-y-3">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-black">Créditos enviados! ✅</h2>
                <p className="text-white/50 text-sm">
                  Seus {formatNumber(credits)} créditos já foram adicionados à sua conta.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Créditos</span>
                  <span className="font-bold">{formatNumber(credits)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Status</span>
                  <span className="font-bold text-primary">Entregue</span>
                </div>
              </div>

              {storeName && (
                <p className="text-xs text-white/30">
                  Compra realizada via {storeName}
                </p>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
