import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const ALL_LINKS = [
  { to: "/", label: "Comprar Créditos Lovable", slug: "home" },
  { to: "/como-funciona", label: "Como Funciona a LovaBoost", slug: "como-funciona" },
  { to: "/comprar-creditos-lovable", label: "Comprar Créditos Lovable com Desconto", slug: "comprar-creditos-lovable" },
  { to: "/vibe-coding", label: "O que é Vibe Coding?", slug: "vibe-coding" },
  { to: "/lovable-vs-bolt", label: "Lovable vs Bolt.new — Comparação", slug: "lovable-vs-bolt" },
  { to: "/criar-app-com-ia", label: "Criar App com IA sem Programar", slug: "criar-app-com-ia" },
  { to: "/como-recarregar-lovable", label: "Como Recarregar Créditos Lovable", slug: "como-recarregar-lovable" },
  { to: "/revenda-creditos-lovable", label: "Revenda de Créditos Lovable", slug: "revenda-creditos-lovable" },
  { to: "/creditos-lovable-ilimitados", label: "Créditos Lovable Ilimitados", slug: "creditos-lovable-ilimitados" },
];

export function SeoInternalLinks({ currentSlug }: { currentSlug: string }) {
  const links = ALL_LINKS.filter((l) => l.slug !== currentSlug).slice(0, 6);

  return (
    <section className="mt-16 pt-10 border-t border-border/30">
      <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-6">
        Artigos Relacionados
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors group"
          >
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform shrink-0" />
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
