import React, { useState, lazy } from "react";
import { motion } from "framer-motion";
import {
  Zap, Shield, CreditCard, ShieldCheck,
  Lock, Cloud, RefreshCw, Infinity,
} from "lucide-react";
import { toast } from "sonner";
import { createPixPayment } from "@/lib/api";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Footer } from "@/components/Footer";
import { PageTransition } from "@/components/PageTransition";
import { LiveStats } from "@/components/LiveStats";
import { PublicAnnouncementBanner } from "@/components/PublicAnnouncementBanner";
import { LivePricingGrid } from "@/components/live-pricing-grid";
import { InlinePurchaseHistory } from "@/components/InlinePurchaseHistory";
import { RecentPurchaseToast } from "@/components/RecentPurchaseToast";
import { HomeJsonLd } from "@/components/HomeJsonLd";
import { LazySection } from "@/components/LazySection";

import { CreditInterceptModal } from "@/components/CreditInterceptModal";
import { usePricing } from "@/hooks/usePricing";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Lazy below-the-fold sections to improve LCP
const CommunityComments = lazy(() =>
  import("@/components/CommunityComments").then((m) => ({ default: m.CommunityComments })),
);
const SocialProofCarousel = lazy(() =>
  import("@/components/SocialProofCarousel").then((m) => ({ default: m.SocialProofCarousel })),
);
const SeoContentBlock = lazy(() =>
  import("@/components/SeoContentBlock").then((m) => ({ default: m.SeoContentBlock })),
);

const FAQ_ITEMS = [
  {
    icon: ShieldCheck,
    q: "Existe risco de banimento da minha conta?",
    a: "Risco ZERO. Nosso sistema opera há mais de 4 meses com 100% de estabilidade. O processo utiliza convites legítimos para a workspace, sem violar diretrizes. Sua conta está totalmente segura.",
  },
  {
    icon: Lock,
    q: "Preciso informar minha senha do Lovable?",
    a: "Absolutamente não. Nunca pediremos sua senha. O processo é feito via convite de e-mail na sua workspace. Privacidade e segurança totais.",
  },
  {
    icon: Zap,
    q: "Quanto tempo leva para os créditos caírem?",
    a: "Questão de segundos. Assim que o seu PIX é aprovado, nosso sistema em nuvem dispara o bot e a injeção de créditos começa em tempo real.",
  },
  {
    icon: Cloud,
    q: "Posso fechar a página durante a geração?",
    a: "Sim! Todo o processamento ocorre em nossos servidores. Se você fechar o navegador ou a internet cair, os créditos continuarão sendo entregues normalmente.",
  },
  {
    icon: RefreshCw,
    q: "E se ocorrer algum erro, perco meu dinheiro?",
    a: "De forma alguma. Nosso sistema possui reembolso automatizado. Se houver qualquer falha e a entrega não for 100% concluída, o saldo retorna para você imediatamente.",
  },
  {
    icon: Infinity,
    q: "Posso comprar várias vezes para a mesma conta?",
    a: "Sim. Você pode recarregar sua conta quantas vezes quiser. Não há limites de uso.",
  },
];

const BENEFITS = [
  { icon: CreditCard, label: "PIX Instantâneo" },
  { icon: Zap, label: "Até 76% de Desconto" },
  { icon: ShieldCheck, label: "Entrega Automática" },
];

export default function BuyCreditsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getDetails, isLoading: pricingLoading } = usePricing();

  const [pendingCredits, setPendingCredits] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [showInterceptModal, setShowInterceptModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePixGuest = (creditsAmount: number) => {
    if (isSubmitting || loading) return;
    setPendingCredits(creditsAmount);
    setShowInterceptModal(true);
  };

  const handleInterceptContinue = () => {
    setShowInterceptModal(false);
    handleGeneratePix(user?.email || "", pendingCredits);
  };

  const handleGeneratePix = async (email: string, creditsAmount: number) => {
    if (isSubmitting || loading) return;
    setIsSubmitting(true);
    setLoading(true);
    const { total } = getDetails(creditsAmount);
    try {
      const pixData = await createPixPayment(null, total, creditsAmount, email);
      if (!pixData.ok) {
        toast.error("Erro ao gerar PIX. Tente novamente.");
        return;
      }

      const params = new URLSearchParams({
        credits: String(creditsAmount),
        amount: String(total),
        pix_code: pixData.qr_code || "",
        pix_base64: pixData.qr_code_base64 || "",
        expires_at: pixData.expires_at || "",
      });
      navigate(`/pix/${pixData.order_id}?${params.toString()}`);
    } catch {
      toast.error("Erro ao processar. Tente novamente em alguns segundos.");
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatedBackground>
      <PageTransition>
        <HomeJsonLd />

        {/* ═══════════ HERO ═══════════ */}
        <section className="w-full max-w-7xl mx-auto flex flex-col items-center justify-start px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-12 gap-12">
          <PublicAnnouncementBanner />
          <motion.header
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-5 mb-8 max-w-2xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-400"
            >
              <Shield className="h-3.5 w-3.5" />
              4 meses ativo · 100% estável
            </motion.div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-[1.05] tracking-tight">
              Sua fonte de{" "}
              <span className="gradient-text-animated">créditos Lovable.dev</span>
            </h1>

            <p className="text-muted-foreground text-base sm:text-lg max-w-lg mx-auto leading-relaxed">
              Compre, recarregue e revenda créditos com até{" "}
              <span className="text-emerald-400 font-semibold">76% de desconto</span>.
              Entrega automática via PIX em segundos.
            </p>

            <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-5 pt-2">
              {BENEFITS.map((b, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex items-center gap-2 rounded-xl border border-border/40 bg-card/50 px-4 py-2.5"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <b.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{b.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.header>

          {/* Simulator */}
          <main className="w-full max-w-3xl mx-auto">
            {pricingLoading ? (
              <div className="simulator-glass rounded-3xl p-6 sm:p-8 lg:p-10 w-full flex flex-col items-center gap-4">
                <Skeleton className="h-20 w-48" />
                <Skeleton className="h-12 w-36" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-14 w-full max-w-xs" />
              </div>
            ) : (
              <>
                <LivePricingGrid
                  loading={loading || isSubmitting}
                  onBuyPix={handlePixGuest}
                />
                <InlinePurchaseHistory />
              </>
            )}
          </main>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-6 space-y-3"
          >
            <LiveStats />
            {!user && (
              <button
                onClick={() => navigate("/login")}
                className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
              >
                Já tem conta? Entrar
              </button>
            )}
          </motion.div>
        </section>

        {/* ═══════════ PROVA SOCIAL (lazy) ═══════════ */}
        <LazySection minHeight={400}>
          <CommunityComments />
        </LazySection>
        <LazySection minHeight={300}>
          <SocialProofCarousel />
        </LazySection>

        {/* ═══════════ SEO CONTENT (lazy) ═══════════ */}
        <LazySection minHeight={400}>
          <SeoContentBlock />
        </LazySection>

        {/* ═══════════ CTA FINAL ═══════════ */}
        <section aria-label="Chamada para ação" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-lg text-center space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-3"
            >
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
                Pronto para economizar?
              </h2>
              <p className="text-muted-foreground text-base">
                Comece agora e pague até <span className="text-emerald-400 font-semibold">74% menos</span> nos seus créditos Lovable.
              </p>
            </motion.div>

            <motion.div
              className="flex flex-col sm:flex-row gap-3 justify-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="btn-shine inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-bold text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:scale-[0.98] transition-all min-h-[52px] touch-manipulation"
              >
                <Zap className="h-5 w-5" />
                Adicionar créditos
              </button>
            </motion.div>
          </div>
        </section>

        {/* ═══════════ FAQ ═══════════ */}
        <section aria-label="Perguntas frequentes" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 pb-32">
          <div className="container mx-auto max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
                Perguntas Frequentes
              </h2>
              <p className="text-muted-foreground text-base mt-2">
                Tire suas dúvidas antes de comprar
              </p>
            </motion.div>
            <Accordion type="single" collapsible className="space-y-3">
              {FAQ_ITEMS.map((item, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="bg-white/5 border border-white/10 rounded-xl px-5 data-[state=open]:bg-white/[0.07] transition-colors">
                  <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline gap-3 py-4">
                    <span className="flex items-center gap-3">
                      <item.icon className="h-5 w-5 text-primary shrink-0" />
                      {item.q}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm leading-relaxed pl-8 pb-4">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <Footer />

        <CreditInterceptModal
          open={showInterceptModal}
          onOpenChange={setShowInterceptModal}
          onContinue={handleInterceptContinue}
          onTutorial={() => {
            setShowInterceptModal(false);
            navigate("/como-funciona");
          }}
        />

        <RecentPurchaseToast />
      </PageTransition>
    </AnimatedBackground>
  );
}
