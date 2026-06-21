import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { openWhatsApp } from "@/lib/whatsapp";
import { useWhatsAppLink } from "@/hooks/useWhatsAppLink";

export function CtaBlock() {
  const link = useWhatsAppLink();

  return (
    <section className="py-12">
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-8 text-center space-y-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
          <Clock className="h-3.5 w-3.5" />
          Oferta válida hoje
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
          Comece a Economizar Agora
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Créditos Lovable com até 60% de desconto. Pagamento via PIX, entrega em minutos.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg" className="gap-2">
            <Link to="/">
              Comprar Créditos <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="gap-2" onClick={() => openWhatsApp(link)}>
            <MessageCircle className="h-4 w-4" />
            Falar no WhatsApp
          </Button>
        </div>
      </div>
    </section>
  );
}
