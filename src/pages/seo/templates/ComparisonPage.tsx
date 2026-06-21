import { Check, X, Minus } from "lucide-react";
import { SeoHead } from "../components/SeoHead";
import { FaqBlock } from "../components/FaqBlock";
import { CtaBlock } from "../components/CtaBlock";
import { SocialProofBlock } from "../components/SocialProofBlock";
import { InternalLinks } from "../components/InternalLinks";
import { Footer } from "@/components/Footer";
import type { SeoPageData } from "../data/seoPages";

function CellValue({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="h-5 w-5 text-green-500 mx-auto" />;
  if (value === false) return <X className="h-5 w-5 text-red-400 mx-auto" />;
  if (value === "N/A") return <Minus className="h-5 w-5 text-muted-foreground mx-auto" />;
  return <span className="text-sm font-medium text-primary">{value}</span>;
}

export function ComparisonPage({ page }: { page: SeoPageData }) {
  return (
    <>
      <SeoHead page={page} />
      <main className="container mx-auto max-w-4xl px-4 pt-28 pb-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-4">
            Comparação Completa 2025
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
            {page.h1}
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">{page.intro}</p>
        </div>

        {/* Comparison table */}
        {page.comparisonRows && (
          <div className="rounded-xl border border-border/50 overflow-hidden mb-12">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-card">
                  <th className="text-left p-4 text-muted-foreground font-medium">Recurso</th>
                  <th className="text-center p-4 text-primary font-semibold">Lovable + LovaBoost</th>
                  <th className="text-center p-4 text-muted-foreground font-medium">{page.competitorName}</th>
                </tr>
              </thead>
              <tbody>
                {page.comparisonRows.map((row, i) => (
                  <tr key={i} className="border-t border-border/30">
                    <td className="p-4 text-foreground/90">{row.feature}</td>
                    <td className="p-4 text-center"><CellValue value={row.lovaboost} /></td>
                    <td className="p-4 text-center"><CellValue value={row.competitor} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
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
