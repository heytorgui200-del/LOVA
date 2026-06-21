import { SeoHead } from "../components/SeoHead";
import { FaqBlock } from "../components/FaqBlock";
import { CtaBlock } from "../components/CtaBlock";
import { SocialProofBlock } from "../components/SocialProofBlock";
import { InternalLinks } from "../components/InternalLinks";
import { Footer } from "@/components/Footer";
import type { SeoPageData } from "../data/seoPages";

export function GuidePage({ page }: { page: SeoPageData }) {
  return (
    <>
      <SeoHead page={page} />
      <main className="container mx-auto max-w-4xl px-4 pt-28 pb-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-4">
            Guia Completo 2025
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
            {page.h1}
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">{page.intro}</p>
        </div>

        {/* Steps */}
        <div className="space-y-8 mb-12">
          {page.sections.map((s, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                {i + 1}
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-foreground mb-2">{s.heading}</h2>
                <p className="text-muted-foreground leading-relaxed">{s.content}</p>
              </div>
            </div>
          ))}
        </div>

        <SocialProofBlock />
        <FaqBlock items={page.faq} />
        <CtaBlock />
        <InternalLinks currentSlug={page.slug} />
      </main>
      <Footer />
    </>
  );
}
