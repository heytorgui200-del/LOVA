import { memo } from "react";
import { motion } from "framer-motion";
import { Star, Users } from "lucide-react";
import { useMetrics } from "@/contexts/MetricsContext";

const TESTIMONIALS = [
  {
    name: "Lucas M.",
    role: "Desenvolvedor Full-Stack",
    text: "Uso há 4 meses direto, nunca tive problema. Créditos caem na hora e o preço é imbatível.",
    stars: 5,
  },
  {
    name: "Ana C.",
    role: "Product Designer",
    text: "Já fiz mais de 15 recargas. Processo super rápido pelo PIX e suporte excelente pelo WhatsApp.",
    stars: 5,
  },
  {
    name: "Rafael S.",
    role: "Fundador de Startup",
    text: "Economizei mais de R$2.000 em créditos. 100% estável, zero risco de ban. Recomendo demais.",
    stars: 5,
  },
  {
    name: "Mariana F.",
    role: "Freelancer",
    text: "Achei que fosse golpe mas resolvi testar com pouco. Funcionou perfeito! Agora sou cliente fiel.",
    stars: 5,
  },
];

export const Testimonials = memo(function Testimonials() {
  const { totalSales } = useMetrics();
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-14"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-4">
            <Users className="h-3.5 w-3.5" />
            +{totalSales} compras realizadas
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            O que nossos clientes dizem
          </h2>
          <p className="text-muted-foreground text-sm mt-2">
            Centenas de devs já economizam com a gente
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="glass-card rounded-2xl p-5 sm:p-6 space-y-3"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: t.stars }).map((_, si) => (
                  <Star key={si} className="h-4 w-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed">"{t.text}"</p>
              <div>
                <p className="text-sm font-semibold text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
});
