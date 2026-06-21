import { useEffect } from "react";
import type { SeoPageData } from "../data/seoPages";

const BASE_URL = "https://lovaboost.com.br";

export function SeoHead({ page }: { page: SeoPageData }) {
  useEffect(() => {
    document.title = page.title;

    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.name = name;
        document.head.appendChild(el);
      }
      el.content = content;
    };

    const setOg = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("property", property);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    setMeta("description", page.metaDescription);
    setMeta("keywords", page.keywords.join(", "));
    setOg("og:title", page.title);
    setOg("og:description", page.metaDescription);
    setOg("og:url", `${BASE_URL}/${page.slug}`);
    setOg("og:type", "article");

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = `${BASE_URL}/${page.slug}`;

    // JSON-LD
    const existingLd = document.querySelector('script[data-seo-jsonld]');
    if (existingLd) existingLd.remove();

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-seo-jsonld", "true");

    if (page.jsonLdType === "FAQPage" || page.faq.length > 0) {
      script.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: page.faq.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      });
    } else if (page.jsonLdType === "Product") {
      script.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Product",
        name: page.h1,
        description: page.metaDescription,
        brand: { "@type": "Brand", name: "LovaBoost" },
        offers: {
          "@type": "Offer",
          priceCurrency: "BRL",
          availability: "https://schema.org/InStock",
        },
      });
    } else {
      script.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        headline: page.h1,
        description: page.metaDescription,
        publisher: { "@type": "Organization", name: "LovaBoost" },
      });
    }
    document.head.appendChild(script);

    return () => {
      const ld = document.querySelector('script[data-seo-jsonld]');
      if (ld) ld.remove();
    };
  }, [page]);

  return null;
}
