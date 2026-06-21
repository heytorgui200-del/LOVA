import { Check, Zap } from "lucide-react";
import { SeoHead } from "../components/SeoHead";
import { FaqBlock } from "../components/FaqBlock";
import { CtaBlock } from "../components/CtaBlock";
import { SocialProofBlock } from "../components/SocialProofBlock";
import { InternalLinks } from "../components/InternalLinks";
import { Footer } from "@/components/Footer";
import type { SeoPageData } from "../data/seoPages";

export function ProductPage({ page }: { page: SeoPageData }) {
  return (
    <>
      <SeoHead page={page} />
      <main className="container mx-auto max-w-4xl px-4 pt-28 pb-16">
        {/* Hero */}
        <div className="text-center mb-12">
          {page.highlightDiscount && (
            <span className="inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-4 py-1.5 text-xs font-bold text-green-400 mb-4">
              <Zap className="h-3.5 w-3.5" />
              {page.highlightDiscount}
            </span>
          )}
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
            {page.h1}
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">{page.intro}</p>
        </div>

        {/* Benefits */}
        {page.benefits && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-12">
            {page.benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 p-4">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-sm text-foreground/90">{b}</span>
              </div>
            ))}
          </div>
        )}

        {/* Sections */}
        {page.sections.map((s, i) => (
          <section key={i} className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-3">{s.heading}</h2>
            <p className="text-muted-foreground leading-relaxed">{s.content}</p>
          </section>
        ))}

        <SocialProofBlock />
        <FaqBlock items={page.faq} />
        <CtaBlock />
        <InternalLinks currentSlug={page.slug} />
      </main>
      <Footer />
    </>
  );
}
