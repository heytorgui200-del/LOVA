import { useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, QrCode, Rocket, Zap } from "lucide-react";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const YOUTUBE_EMBED_URL = "https://www.youtube.com/embed/l7SWpBItfkI";

const STEPS = [
  { icon: Sparkles, title: "Escolha", desc: "Selecione a quantidade de créditos que deseja" },
  { icon: QrCode, title: "Pague via PIX", desc: "Escaneie o QR Code e pague pelo app do banco" },
  { icon: Rocket, title: "Receba", desc: "Créditos na sua conta em poucos segundos" },
];

export default function ComoFuncionaPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Como Funciona | Comprar Créditos Lovable - LovaBoost";
  }, []);

  return (
    <AnimatedBackground>
      <PageTransition>
        <article className="min-h-screen flex flex-col pt-20">
          {/* ─── VIDEO SECTION ─── */}
          <section aria-label="Tutorial em vídeo" className="flex-1 flex items-center justify-center py-16">
            <div className="container mx-auto max-w-4xl px-4">
              <motion.header
                className="text-center mb-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground mb-4 leading-[1.1] tracking-tighter">
                  Como Comprar <span className="gradient-text">Créditos Lovable</span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                  Assista o fluxo completo e entenda como receber seus créditos em segundos
                </p>
              </motion.header>

              <motion.div
                className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-border aspect-video backdrop-blur-xl"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <iframe
                  src={YOUTUBE_EMBED_URL}
                  title="Tutorial - Como Comprar Créditos Lovable"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </motion.div>

              {/* ─── STEPS ─── */}
              <section aria-label="Passo a passo" className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-12">
                {STEPS.map((step, i) => (
                  <motion.article
                    key={i}
                    className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-6 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
                  >
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <step.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-display text-lg font-bold text-foreground mb-1">
                      {i + 1}. {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                  </motion.article>
                ))}
              </section>

              {/* ─── CTA ─── */}
              <motion.div
                className="text-center mt-12"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.8 }}
              >
                <Button
                  size="lg"
                  className="rounded-xl px-8 py-6 text-lg font-bold gap-2"
                  onClick={() => navigate("/buy")}
                >
                  <Zap className="h-5 w-5" />
                  Comprar créditos agora
                </Button>
              </motion.div>
            </div>
          </section>
        </article>
      </PageTransition>
    </AnimatedBackground>
  );
}
