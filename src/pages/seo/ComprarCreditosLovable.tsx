import { useEffect } from "react";
import { SeoInternalLinks } from "@/components/SeoInternalLinks";
import { Link } from "react-router-dom";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Footer } from "@/components/Footer";
import { ArrowRight, CreditCard, Zap, ShieldCheck, QrCode, Rocket, Clock, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ComprarCreditosLovablePage() {
  useEffect(() => {
    document.title = "Comprar Créditos Lovable com Desconto via PIX | LovaBoost";
    document.querySelector('meta[name="description"]')?.setAttribute("content",
      "Compre créditos Lovable.dev com até 76% de desconto via PIX instantâneo. Entrega automática em segundos. LovaBoost — a forma mais barata de recarregar o Lovable no Brasil."
    );
  }, []);

  return (
    <AnimatedBackground>
      <div className="min-h-screen">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">

          {/* Hero */}
          <header className="text-center space-y-6 mb-20">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs sm:text-sm font-medium text-primary">
              <TrendingDown className="h-3.5 w-3.5" /> Até 76% de desconto
            </span>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground leading-[1.1] tracking-tighter">
              Comprar Créditos Lovable
              <br />
              <span className="gradient-text">Com o Menor Preço do Brasil</span>
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              O Lovable.dev usa créditos para cada interação com a IA. No LovaBoost você compra esses
              créditos com até 76% de desconto, paga via PIX e recebe em segundos — tudo automatizado.
            </p>
            <Button asChild size="lg">
              <Link to="/">Comprar Créditos Agora <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </header>

          {/* O que são créditos */}
          <section className="mb-20">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground text-center mb-8">
              O Que São Créditos Lovable?
            </h2>
            <div className="prose prose-invert max-w-none space-y-4 text-muted-foreground text-sm sm:text-base leading-relaxed">
              <p>
                Créditos Lovable são a moeda interna da plataforma Lovable.dev. Cada vez que você envia um prompt
                para a IA — seja para criar um componente, corrigir um bug ou adicionar uma funcionalidade —
                a plataforma desconta créditos da sua conta.
              </p>
              <p>
                O plano gratuito do Lovable oferece poucos créditos, que acabam rapidamente. Os planos pagos
                custam a partir de US$ 20/mês (mais de R$ 100 com o câmbio atual) e ainda assim têm limites.
                É aí que o LovaBoost entra: créditos avulsos com preços muito abaixo do oficial.
              </p>
              <p>
                Com o LovaBoost, você paga em reais via PIX e recebe os créditos na sua conta do Lovable
                em segundos. Sem assinatura mensal, sem compromisso — compre apenas quando precisar.
              </p>
            </div>
          </section>

          {/* Vantagens */}
          <section className="mb-20">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground text-center mb-10">
              Por Que Comprar Créditos no LovaBoost?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: TrendingDown, t: "Até 76% de Desconto", d: "Preços muito abaixo do oficial. Quanto mais créditos comprar, maior o desconto." },
                { icon: QrCode, t: "PIX Instantâneo", d: "Pague via PIX pelo app do seu banco. Confirmação em segundos, sem burocracia." },
                { icon: Rocket, t: "Entrega Automática", d: "Nosso sistema em nuvem entrega os créditos automaticamente após a confirmação do pagamento." },
                { icon: CreditCard, t: "Sem Assinatura", d: "Compre avulso, sem compromisso mensal. Use quando quiser, quanto quiser." },
                { icon: ShieldCheck, t: "Zero Risco de Ban", d: "Processo seguro via convite de workspace. Sua conta está 100% protegida." },
                { icon: Clock, t: "Suporte 24h", d: "Atendimento via WhatsApp para qualquer dúvida ou problema com seu pedido." },
              ].map((b, i) => (
                <div key={i} className="glass-card rounded-2xl p-6 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <b.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-display text-base font-bold text-foreground">{b.t}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{b.d}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Como comprar */}
          <section className="mb-20">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground text-center mb-10">
              Como Comprar Créditos Lovable no LovaBoost
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { icon: Zap, n: "1", t: "Escolha a quantidade", d: "Use o simulador na página inicial para selecionar quantos créditos deseja. Veja o preço em tempo real." },
                { icon: QrCode, n: "2", t: "Pague via PIX", d: "Escaneie o QR Code gerado ou copie o código PIX. Pague pelo app do seu banco em segundos." },
                { icon: Rocket, n: "3", t: "Receba os créditos", d: "Após a confirmação do PIX, nosso sistema entrega os créditos automaticamente na sua conta Lovable." },
              ].map((s, i) => (
                <div key={i} className="glass-card rounded-2xl p-6 text-center space-y-3 relative">
                  <span className="absolute top-4 right-4 text-xs font-bold text-muted-foreground/40 font-mono">{s.n}</span>
                  <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <s.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-display text-base font-bold text-foreground">{s.t}</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">{s.d}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Comparativo de preço */}
          <section className="mb-20">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground text-center mb-8">
              Comparativo de Preço: Lovable Oficial vs LovaBoost
            </h2>
            <div className="glass-card rounded-2xl p-6 sm:p-8 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 text-muted-foreground font-medium">Créditos</th>
                    <th className="text-center py-3 text-muted-foreground font-medium">Preço Oficial (USD→BRL)</th>
                    <th className="text-center py-3 text-primary font-bold">Preço LovaBoost</th>
                    <th className="text-center py-3 text-green-400 font-bold">Economia</th>
                  </tr>
                </thead>
                <tbody className="text-foreground">
                  {[
                    { c: "100", oficial: "~R$ 100", lova: "~R$ 24", eco: "76%" },
                    { c: "500", oficial: "~R$ 500", lova: "~R$ 130", eco: "74%" },
                    { c: "1.000", oficial: "~R$ 1.000", lova: "~R$ 270", eco: "73%" },
                    { c: "5.000", oficial: "~R$ 5.000", lova: "~R$ 1.350", eco: "73%" },
                  ].map((r, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="py-3 font-medium">{r.c}</td>
                      <td className="py-3 text-center text-muted-foreground line-through">{r.oficial}</td>
                      <td className="py-3 text-center font-bold text-primary">{r.lova}</td>
                      <td className="py-3 text-center font-bold text-green-400">{r.eco}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-muted-foreground mt-4">* Valores aproximados. Preço oficial convertido pelo câmbio atual. Preço LovaBoost varia conforme quantidade.</p>
            </div>
          </section>

          {/* FAQ */}
          <section className="mb-20">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground text-center mb-10">
              Perguntas Frequentes
            </h2>
            <div className="space-y-4">
              {[
                { q: "Como os créditos são entregues na minha conta?", a: "Após o PIX ser confirmado, nosso sistema automatizado envia um convite para a workspace vinculada à sua conta Lovable. Os créditos ficam disponíveis em segundos." },
                { q: "Preciso ter plano pago no Lovable para usar?", a: "Não. Você pode ter uma conta gratuita no Lovable e comprar créditos avulsos pelo LovaBoost. Os créditos funcionam independentemente do seu plano." },
                { q: "O desconto de 76% é real? Como é possível?", a: "Sim. Trabalhamos com um sistema de escala e otimização que nos permite oferecer preços muito abaixo do oficial. Mais de 4 meses de operação com milhares de clientes satisfeitos." },
                { q: "E se eu comprar e os créditos não chegarem?", a: "Nosso sistema tem reembolso automático. Se houver qualquer falha na entrega, o valor retorna para você imediatamente. Risco zero." },
                { q: "Posso comprar créditos para outra pessoa?", a: "Sim. Basta informar o e-mail da conta Lovable da pessoa que receberá os créditos no momento da compra." },
              ].map((item, i) => (
                <details key={i} className="glass-card rounded-xl px-6 py-4 group">
                  <summary className="flex items-center justify-between cursor-pointer text-sm font-semibold text-foreground">
                    {item.q}
                    <span className="text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="text-muted-foreground text-sm leading-relaxed mt-3">{item.a}</p>
                </details>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="text-center space-y-6">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              Compre Créditos Lovable Agora
            </h2>
            <p className="text-muted-foreground text-sm">
              PIX instantâneo. Entrega automática. Até 76% de desconto.
            </p>
            <Button asChild size="lg">
              <Link to="/">Ir para o Simulador <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </section>

          <SeoInternalLinks currentSlug="comprar-creditos-lovable" />
        </article>
        <Footer />
      </div>
    </AnimatedBackground>
  );
}
