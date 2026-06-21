import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { getRelatedPages } from "../data/seoPages";

export function InternalLinks({ currentSlug }: { currentSlug: string }) {
  const related = getRelatedPages(currentSlug, 4);
  if (!related.length) return null;

  return (
    <section className="py-12 border-t border-border/30">
      <h2 className="text-xl font-bold text-foreground mb-6">Artigos Relacionados</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {related.map((page) => (
          <Link
            key={page.slug}
            to={`/${page.slug}`}
            className="group rounded-xl border border-border/50 bg-card/50 p-5 hover:border-primary/30 transition-colors"
          >
            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
              {page.h1}
            </p>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {page.metaDescription}
            </p>
            <span className="inline-flex items-center gap-1 text-xs text-primary mt-3">
              Ler mais <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
