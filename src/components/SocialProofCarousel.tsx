import { memo, useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";

import proof1 from "@/assets/proofs/proof-1.jpeg";
import proof2 from "@/assets/proofs/proof-2.jpeg";
import proof3 from "@/assets/proofs/proof-3.jpeg";
import proof4 from "@/assets/proofs/proof-4.jpeg";
import proof5 from "@/assets/proofs/proof-5.jpeg";
import proof6 from "@/assets/proofs/proof-6.jpeg";
import proof8 from "@/assets/proofs/proof-8.jpeg";

const PROOFS = [
  { src: proof1, alt: "Cliente confirmando 500 créditos gerados com sucesso" },
  { src: proof2, alt: "Cliente elogiando velocidade: 200 créditos em 20 segundos" },
  { src: proof3, alt: "Cliente confirmando 900 créditos creditados" },
  { src: proof4, alt: "Cliente reagindo: Top de mais!" },
  { src: proof5, alt: "Cliente confirmando créditos funcionando perfeitamente" },
  { src: proof6, alt: "Cliente elogiando: foi muito rápido" },
  { src: proof8, alt: "Cliente elogiando: caralho bem melhor, Parabéns!" },
];

const INTERVAL = 4500;

export const SocialProofCarousel = memo(function SocialProofCarousel() {
  const [current, setCurrent] = useState(0);
  const currentRef = useRef(0);

  const goTo = useCallback((next: number) => {
    setCurrent(next);
    currentRef.current = next;
  }, []);

  const prev = useCallback(() => {
    const c = currentRef.current;
    goTo((c - 1 + PROOFS.length) % PROOFS.length);
  }, [goTo]);

  const next = useCallback(() => {
    const c = currentRef.current;
    goTo((c + 1) % PROOFS.length);
  }, [goTo]);

  useEffect(() => {
    const timer = setInterval(() => {
      const c = currentRef.current;
      const n = (c + 1) % PROOFS.length;
      setCurrent(n);
      currentRef.current = n;
    }, INTERVAL);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-14"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-xs font-medium text-emerald-400 mb-4">
            <MessageCircle className="h-3.5 w-3.5" />
            Feedback real dos clientes
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
            Veja o que nossos clientes estão dizendo
          </h2>
          <p className="text-muted-foreground text-sm mt-2">
            Prints reais de conversas no WhatsApp
          </p>
        </motion.div>

        <div className="relative flex items-center justify-center">
          <button
            onClick={prev}
            className="absolute left-0 z-10 p-3 rounded-full bg-background/80 border border-border/50 text-muted-foreground hover:text-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="w-[240px] sm:w-[280px] h-[420px] sm:h-[500px] relative overflow-hidden rounded-2xl border border-border/50 bg-card/30 shadow-xl">
            {PROOFS.map((p, i) => (
              <img
                key={i}
                src={p.src}
                alt={p.alt}
                className="absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-500 ease-in-out"
                style={{ opacity: i === current ? 1 : 0 }}
                loading={i === 0 ? "eager" : "lazy"}
                decoding="async"
              />
            ))}
          </div>

          <button
            onClick={next}
            className="absolute right-0 z-10 p-3 rounded-full bg-background/80 border border-border/50 text-muted-foreground hover:text-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
            aria-label="Próximo"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="flex justify-center gap-1.5 mt-6">
          {PROOFS.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current
                  ? "w-6 bg-primary"
                  : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              aria-label={`Ir para prova ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
});
