import { motion } from "framer-motion";
import { Zap, Star, Crown, Rocket, Building2 } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/pricing";
import { usePricing } from "@/hooks/usePricing";

const TIERS = [
  { name: "Starter", credits: 100, icon: Zap, popular: false },
  { name: "Popular", credits: 500, icon: Star, popular: true },
  { name: "Pro", credits: 1000, icon: Crown, popular: false },
  { name: "Business", credits: 5000, icon: Rocket, popular: false },
  { name: "Enterprise", credits: 10000, icon: Building2, popular: false },
];

interface PricingCardsProps {
  onSelectPlan: (credits: number) => void;
}

export function PricingCards({ onSelectPlan }: PricingCardsProps) {
  const { getDetails } = usePricing();

  return (
    <section className="py-20">
      <div className="container mx-auto max-w-6xl px-4">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2 tracking-tight">
            Escolha seu pacote
          </h2>
          <p className="text-muted-foreground text-lg">
            Preços até <span className="font-bold text-primary">93% mais baratos</span> que comprar direto na Lovable
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {TIERS.map((tier, i) => {
            const { total, lovablePrice, discountPct } = getDetails(tier.credits);
            const unitPrice = total / tier.credits;

            return (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className={`relative rounded-2xl border p-6 flex flex-col items-center text-center transition-all hover:shadow-lg hover:-translate-y-1 ${
                  tier.popular
                    ? "border-primary bg-primary/[0.03] shadow-md ring-2 ring-primary/20"
                    : "border-border bg-background"
                }`}
              >
                {tier.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                    Mais Vendido
                  </span>
                )}

                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl mb-3 ${
                  tier.popular ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                }`}>
                  <tier.icon className="h-6 w-6" />
                </div>

                <h3 className="font-display text-lg font-bold text-foreground mb-1">{tier.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{formatNumber(tier.credits)} créditos</p>

                <div className="mb-1">
                  <span className="font-display text-3xl font-extrabold text-foreground">
                    {formatCurrency(total)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  {formatCurrency(unitPrice)}/crédito
                </p>
                <p className="text-xs text-muted-foreground line-through mb-2">
                  Lovable: {formatCurrency(lovablePrice)}
                </p>

                <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700 mb-4">
                  {discountPct}% OFF
                </span>

                <button
                  onClick={() => onSelectPlan(tier.credits)}
                  className={`w-full rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                    tier.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                      : "border border-border bg-background text-foreground hover:border-primary hover:text-primary"
                  }`}
                >
                  Comprar via PIX
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
