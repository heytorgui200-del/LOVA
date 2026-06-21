import { AlertTriangle } from "lucide-react";
import { SeoHead } from "../components/SeoHead";
import { FaqBlock } from "../components/FaqBlock";
import { CtaBlock } from "../components/CtaBlock";
import { SocialProofBlock } from "../components/SocialProofBlock";
import { InternalLinks } from "../components/InternalLinks";
import { Footer } from "@/components/Footer";
import type { SeoPageData } from "../data/seoPages";

export function BaitPage({ page }: { page: SeoPageData }) {
  return (
    <>
      <SeoHead page={page} />
      <main className="container mx-auto max-w-4xl px-4 pt-28 pb-16">
        {/* Hero */}
        <div className="text-center mb-12">
          {page.baitHook && (
            <span className="inline-flex items-center gap-2 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-4 py-1.5 text-xs font-bold text-yellow-400 mb-4">
              <AlertTriangle className="h-3.5 w-3.5" />
              {page.baitHook}
            </span>
          )}
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
            {page.h1}
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">{page.intro}</p>
        </div>

        {/* Truth reveal */}
        {page.truthReveal && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 mb-12">
            <p className="text-foreground font-medium leading-relaxed">{page.truthReveal}</p>
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
