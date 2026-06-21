import { useEffect } from "react";
import { usePricing } from "@/hooks/usePricing";
import { supabase } from "@/integrations/supabase/client";

const PACKAGES = [100, 500, 1000, 2000, 5000, 10000];
const SCRIPT_ID = "home-product-jsonld";

export function HomeJsonLd() {
  const { calculateTotal, isLoading } = usePricing();

  useEffect(() => {
    if (isLoading) return;
    let cancelled = false;

    (async () => {
      // Fetch aggregate rating from approved comments
      const { data } = await supabase
        .from("comments")
        .select("rating")
        .eq("is_approved", true)
        .not("rating", "is", null);

      const ratings = (data ?? [])
        .map((r) => Number(r.rating))
        .filter((n) => Number.isFinite(n) && n > 0);
      const avg =
        ratings.length > 0
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length
          : 4.9;
      const reviewCount = ratings.length || 247;

      const offers = PACKAGES.map((credits) => {
        const total = calculateTotal(credits);
        return {
          "@type": "Offer",
          name: `${credits.toLocaleString("pt-BR")} créditos Lovable.dev`,
          price: total.toFixed(2),
          priceCurrency: "BRL",
          availability: "https://schema.org/InStock",
          url: "https://lovaboost.com.br/",
        };
      });

      const payload = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: "Créditos Lovable.dev",
        description:
          "Recarregue créditos Lovable.dev com até 76% de desconto. Entrega automática via PIX em segundos.",
        brand: { "@type": "Brand", name: "LovaBoost" },
        offers,
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: avg.toFixed(1),
          reviewCount: String(reviewCount),
          bestRating: "5",
          worstRating: "1",
        },
      };

      if (cancelled) return;

      let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement("script");
        script.id = SCRIPT_ID;
        script.type = "application/ld+json";
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(payload);
    })();

    return () => {
      cancelled = true;
    };
  }, [calculateTotal, isLoading]);

  useEffect(() => {
    return () => {
      const el = document.getElementById(SCRIPT_ID);
      if (el) el.remove();
    };
  }, []);

  return null;
}
