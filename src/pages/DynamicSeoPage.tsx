import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useMetrics } from "@/contexts/MetricsContext";
import { useWhatsAppLink } from "@/hooks/useWhatsAppLink";
import { openWhatsApp } from "@/lib/whatsapp";
import { Footer } from "@/components/Footer";
import {
  Loader2, ArrowRight, MessageCircle, Users, ShoppingCart, Shield,
  Check, X, Zap, Clock, Star, TrendingUp, Target, AlertTriangle, ChevronRight, Home,
} from "lucide-react";

interface InternalLink {
  title: string;
  slug: string;
}

interface SeoPageRow {
  id: string;
  slug: string;
  keyword: string;
  title: string;
  meta_description: string;
  h1: string;
  content_json: {
    intro: string;
    heroSubheadline?: string;
    problem?: string;
    desire?: string;
    solution?: string;
    offer?: string;
    sections: { heading: string; content: string }[];
    benefits?: string[];
    comparison?: { feature: string; us: string; them: string }[];
    testimonials?: { name: string; role: string; text: string }[];
    faq: { question: string; answer: string }[];
    keywords?: string[];
  };
  is_published: boolean;
  cluster_id?: string | null;
  intent_type?: string;
  internal_links_json?: InternalLink[];
}

interface ClusterInfo {
  name: string;
  slug: string;
}

export default function DynamicSeoPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<SeoPageRow | null>(null);
  const [cluster, setCluster] = useState<ClusterInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { onlineCount, totalSales } = useMetrics();
  const whatsappLink = useWhatsAppLink();

  useEffect(() => {
    if (!slug) { setNotFound(true); setLoading(false); return; }

    (async () => {
      const { data, error } = await supabase
        .from("seo_pages")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

      if (error || !data) {
        setNotFound(true);
      } else {
        const pageData = data as unknown as SeoPageRow;
        setPage(pageData);
        document.title = data.title;

        // Set meta tags
        const setMeta = (name: string, content: string) => {
          let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
          if (!el) { el = document.createElement("meta"); el.name = name; document.head.appendChild(el); }
          el.content = content;
        };
        const setProperty = (property: string, content: string) => {
          let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
          if (!el) { el = document.createElement("meta"); el.setAttribute("property", property); document.head.appendChild(el); }
          el.content = content;
        };

        const baseUrl = "https://lovaboost.com.br";
        const pageUrl = `${baseUrl}/s/${data.slug}`;
        const ogImage = `${baseUrl}/og-image.png`;

        setMeta("description", data.meta_description);
        setMeta("keywords", data.h1);
        setMeta("robots", "index, follow");

        // Open Graph
        setProperty("og:title", data.title);
        setProperty("og:description", data.meta_description);
        setProperty("og:url", pageUrl);
        setProperty("og:type", "website");
        setProperty("og:image", ogImage);
        setProperty("og:site_name", "LovaBoost");

        // Twitter Card
        setMeta("twitter:card", "summary_large_image");
        setMeta("twitter:title", data.title);
        setMeta("twitter:description", data.meta_description);
        setMeta("twitter:image", ogImage);

        // Canonical
        let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
        if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
        canonical.href = pageUrl;

        // Fetch cluster info
        let fetchedCluster: ClusterInfo | null = null;
        if (pageData.cluster_id) {
          const { data: clusterData } = await supabase
            .from("seo_clusters")
            .select("name, slug")
            .eq("id", pageData.cluster_id)
            .maybeSingle();
          if (clusterData) {
            fetchedCluster = clusterData as ClusterInfo;
            setCluster(fetchedCluster);
          }
        }

        // Inject structured data
        document.querySelectorAll('script[data-seo-jsonld]').forEach(el => el.remove());
        const content = data.content_json as SeoPageRow["content_json"];

        // FAQPage schema
        if (content.faq?.length) {
          const faqScript = document.createElement("script");
          faqScript.type = "application/ld+json";
          faqScript.setAttribute("data-seo-jsonld", "true");
          faqScript.textContent = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: content.faq.map((f) => ({
              "@type": "Question",
              name: f.question,
              acceptedAnswer: { "@type": "Answer", text: f.answer },
            })),
          });
          document.head.appendChild(faqScript);
        }

        // BreadcrumbList schema
        const breadcrumbScript = document.createElement("script");
        breadcrumbScript.type = "application/ld+json";
        breadcrumbScript.setAttribute("data-seo-jsonld", "true");
        const breadcrumbItems = [
          { "@type": "ListItem", position: 1, name: "Home", item: window.location.origin },
        ];
        if (fetchedCluster) {
          breadcrumbItems.push({ "@type": "ListItem", position: 2, name: fetchedCluster.name, item: `${window.location.origin}/s` });
        }
        breadcrumbItems.push({ "@type": "ListItem", position: breadcrumbItems.length + 1, name: data.h1, item: window.location.href });
        breadcrumbScript.textContent = JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: breadcrumbItems,
        });
        document.head.appendChild(breadcrumbScript);

        // Product schema for transactional intent
        if (pageData.intent_type === "transactional") {
          const productScript = document.createElement("script");
          productScript.type = "application/ld+json";
          productScript.setAttribute("data-seo-jsonld", "true");
          productScript.textContent = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: "Créditos Lovable - LovaBoost",
            description: data.meta_description,
            brand: { "@type": "Organization", name: "LovaBoost" },
            offers: {
              "@type": "Offer",
              priceCurrency: "BRL",
              availability: "https://schema.org/InStock",
            },
          });
          document.head.appendChild(productScript);
        }

        // Organization schema
        const orgScript = document.createElement("script");
        orgScript.type = "application/ld+json";
        orgScript.setAttribute("data-seo-jsonld", "true");
        orgScript.textContent = JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "LovaBoost",
          url: window.location.origin,
        });
        document.head.appendChild(orgScript);
      }
      setLoading(false);
    })();

    return () => {
      document.querySelectorAll('script[data-seo-jsonld]').forEach(el => el.remove());
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !page) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h1 className="text-2xl font-bold text-foreground">Página não encontrada</h1>
        <Button asChild><Link to="/">Voltar ao início</Link></Button>
      </div>
    );
  }

  const c = page.content_json;
  const internalLinks = (page.internal_links_json || []) as InternalLink[];

  return (
    <>
      <main className="container mx-auto max-w-4xl px-4 pt-28 pb-16 space-y-16">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground -mb-10">
          <Link to="/" className="hover:text-foreground flex items-center gap-1"><Home className="h-3 w-3" /> Home</Link>
          <ChevronRight className="h-3 w-3" />
          {cluster && (
            <>
              <span>{cluster.name}</span>
              <ChevronRight className="h-3 w-3" />
            </>
          )}
          <span className="text-foreground truncate max-w-[200px]">{page.keyword}</span>
        </nav>

        {/* ─── 1. HERO ─── */}
        <section className="text-center space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-4 py-1.5 text-xs font-bold text-green-400">
            <Zap className="h-3.5 w-3.5" /> Até 60% OFF
          </span>
          <h1 className="font-display text-3xl sm:text-5xl font-bold text-foreground leading-tight">
            {page.h1}
          </h1>
          {c.heroSubheadline && (
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">{c.heroSubheadline}</p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="gap-2 text-base">
              <Link to="/">Comprar Créditos <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button variant="outline" size="lg" className="gap-2" onClick={() => openWhatsApp(whatsappLink)}>
              <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            <ShoppingCart className="inline h-3 w-3 mr-1" />
            +{totalSales} compras realizadas • {onlineCount} pessoas online agora
          </p>
        </section>

        {/* ─── 2. PROBLEMA + DESEJO ─── */}
        {(c.problem || c.desire) && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {c.problem && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 space-y-3">
                <div className="flex items-center gap-2 text-destructive font-semibold">
                  <AlertTriangle className="h-5 w-5" /> O Problema
                </div>
                <p className="text-muted-foreground leading-relaxed">{c.problem}</p>
              </div>
            )}
            {c.desire && (
              <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-6 space-y-3">
                <div className="flex items-center gap-2 text-green-500 font-semibold">
                  <Target className="h-5 w-5" /> O Que Você Quer
                </div>
                <p className="text-muted-foreground leading-relaxed">{c.desire}</p>
              </div>
            )}
          </section>
        )}

        {/* ─── 3. SOLUÇÃO + BENEFÍCIOS ─── */}
        <section className="space-y-6">
          {c.solution && (
            <div className="text-center space-y-3">
              <h2 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
                <TrendingUp className="h-6 w-6 text-primary" /> A Solução
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">{c.solution}</p>
            </div>
          )}
          {c.benefits && c.benefits.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {c.benefits.map((b, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 p-4">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-foreground/90">{b}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ─── 4. OFERTA COM URGÊNCIA ─── */}
        {c.offer && (
          <section className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-8 text-center space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary animate-pulse">
              <Clock className="h-3.5 w-3.5" /> Oferta por Tempo Limitado
            </div>
            <p className="text-lg text-foreground font-medium max-w-xl mx-auto">{c.offer}</p>
            <Button asChild size="lg" className="gap-2">
              <Link to="/">Aproveitar Agora <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </section>
        )}

        {/* ─── 5. PROVA SOCIAL ─── */}
        <section className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-border/50 bg-card/50 p-5 text-center space-y-2">
              <ShoppingCart className="h-6 w-6 mx-auto text-primary" />
              <p className="text-2xl font-bold text-foreground">+{totalSales}</p>
              <p className="text-sm text-muted-foreground">Compras realizadas</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card/50 p-5 text-center space-y-2">
              <Users className="h-6 w-6 mx-auto text-green-500" />
              <p className="text-2xl font-bold text-foreground">{onlineCount}</p>
              <p className="text-sm text-muted-foreground">Pessoas online agora</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card/50 p-5 text-center space-y-2">
              <Shield className="h-6 w-6 mx-auto text-primary" />
              <p className="text-2xl font-bold text-foreground">100%</p>
              <p className="text-sm text-muted-foreground">Transações seguras</p>
            </div>
          </div>

          {c.testimonials && c.testimonials.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {c.testimonials.map((t, i) => (
                <div key={i} className="rounded-xl border border-border/50 bg-card/50 p-5 space-y-3">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground italic">"{t.text}"</p>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ─── 6. COMPARAÇÃO ─── */}
        {c.comparison && c.comparison.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground text-center">LovaBoost vs Comprar Direto</h2>
            <div className="rounded-xl border border-border/50 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-card/80">
                    <th className="text-left p-4 text-muted-foreground font-medium">Recurso</th>
                    <th className="text-center p-4 text-primary font-bold">LovaBoost</th>
                    <th className="text-center p-4 text-muted-foreground font-medium">Outros</th>
                  </tr>
                </thead>
                <tbody>
                  {c.comparison.map((row, i) => (
                    <tr key={i} className="border-t border-border/30">
                      <td className="p-4 text-foreground/90">{row.feature}</td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1 text-green-500 font-medium">
                          <Check className="h-4 w-4" /> {row.us}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <X className="h-4 w-4 text-destructive/60" /> {row.them}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ─── CONTENT SECTIONS ─── */}
        {c.sections.map((s, i) => (
          <section key={i}>
            <h2 className="text-xl font-bold text-foreground mb-3">{s.heading}</h2>
            <p className="text-muted-foreground leading-relaxed">{s.content}</p>
          </section>
        ))}

        {/* ─── 7. FAQ ─── */}
        {c.faq.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-6">Perguntas Frequentes</h2>
            <Accordion type="single" collapsible className="w-full space-y-2">
              {c.faq.map((item, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border border-border/50 rounded-lg px-4 bg-card/50">
                  <AccordionTrigger className="text-left text-foreground/90 hover:no-underline">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        )}

        {/* ─── INTERNAL LINKS ─── */}
        {internalLinks.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">Artigos Relacionados</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {internalLinks.map((link, i) => (
                <Link
                  key={i}
                  to={`/s/${link.slug}`}
                  className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 p-4 hover:bg-muted/50 transition-colors"
                >
                  <ArrowRight className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm text-foreground/90">{link.title}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ─── 8. CTA FINAL ─── */}
        <section>
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-8 text-center space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
              <Clock className="h-3.5 w-3.5" /> Oferta válida hoje
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Comece a Economizar Agora
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Créditos Lovable com até 60% de desconto. Pagamento via PIX, entrega em minutos.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="gap-2">
                <Link to="/">Comprar Créditos <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button variant="outline" size="lg" className="gap-2" onClick={() => openWhatsApp(whatsappLink)}>
                <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
