import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { FaqItem } from "../data/seoPages";

export function FaqBlock({ items }: { items: FaqItem[] }) {
  if (!items.length) return null;
  return (
    <section className="py-12">
      <h2 className="text-2xl font-bold text-foreground mb-6">Perguntas Frequentes</h2>
      <Accordion type="single" collapsible className="w-full space-y-2">
        {items.map((item, i) => (
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
  );
}
