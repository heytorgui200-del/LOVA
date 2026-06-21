import { useEffect } from "react";
import { SeoInternalLinks } from "@/components/SeoInternalLinks";
import { Link } from "react-router-dom";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Footer } from "@/components/Footer";
import { ArrowRight, DollarSign, Users, TrendingUp, Shield, Repeat, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RevendaCreditosLovablePage() {
  useEffect(() => {
    document.title = "Revenda de Créditos Lovable — Ganhe Dinheiro Revendendo | LovaBoost";
    document.querySelector('meta[name="description"]')?.setAttribute("content",
      "Torne-se revendedor de créditos Lovable.dev e ganhe dinheiro revendendo. Margem de lucro atrativa, suporte dedicado e entrega automática. Programa de revenda LovaBoost."
    );
  }, []);

  return (
    <AnimatedBackground>
      <div className="min-h-screen">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">

          {/* Hero */}
          <header className="text-center space-y-6 mb-20">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs sm:text-sm font-medium text-primary">
              <DollarSign className="h-3.5 w-3.5" /> Programa de Revenda
            </span>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground leading-[1.1] tracking-tighter">
              Revenda Créditos Lovable
              <br />
              <span className="gradient-text">E Ganhe Dinheiro</span>
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              Com o programa de revenda do LovaBoost, você compra créditos Lovable.dev com preço de atacado
              e revende com sua própria margem de lucro. Ideal para agências, freelancers e empreendedores digitais.
            </p>
            <Button asChild size="lg">
              <Link to="/revenda">Ver Programa de Revenda <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </header>

          {/* Como funciona */}
          <section className="mb-20">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground text-center mb-8">
              Como Funciona a Revenda de Créditos?
            </h2>
            <div className="prose prose-invert max-w-none space-y-4 text-muted-foreground text-sm sm:text-base leading-relaxed">
              <p>
                O programa de revenda do LovaBoost é simples: você se cadastra como revendedor, deposita
                saldo na sua carteira virtual e compra créditos pelo preço de revendedor — significativamente
                mais baixo que o preço normal.
              </p>
              <p>
                Depois, você revende esses créditos para seus clientes no preço que quiser, mantendo a diferença
                como lucro. A entrega é automática — seu cliente recebe os créditos na conta Lovable dele sem
                você precisar fazer nada manualmente.
              </p>
              <p>
                Muitos revendedores já ganham renda extra (ou até renda principal) vendendo créditos Lovable
                em comunidades de vibe coding, grupos de empreendedores e redes sociais.
              </p>
            </div>
          </section>

          {/* Vantagens */}
          <section className="mb-20">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground text-center mb-10">
              Vantagens do Programa de Revenda
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: TrendingUp, t: "Margem de Lucro Atrativa", d: "Preço de atacado exclusivo para revendedores. Você define sua margem e quanto quer ganhar por venda." },
                { icon: Repeat, t: "Entrega 100% Automática", d: "Você não precisa entregar nada manualmente. O sistema do LovaBoost entrega os créditos para o cliente automaticamente." },
                { icon: Users, t: "Demanda Crescente", d: "A comunidade de vibe coding no Brasil cresce exponencialmente. Mais pessoas usando Lovable = mais pessoas precisando de créditos." },
                { icon: DollarSign, t: "Sem Investimento Inicial", d: "Comece com um depósito mínimo na carteira. Sem estoque físico, sem risco de produto encalhado." },
                { icon: Shield, t: "Painel do Revendedor", d: "Acompanhe suas vendas, lucro e histórico de transações em um painel exclusivo dentro do LovaBoost." },
                { icon: MessageSquare, t: "Suporte Dedicado", d: "Revendedores têm canal de suporte prioritário via WhatsApp para resolver qualquer questão rapidamente." },
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

          {/* Quem pode revender */}
          <section className="mb-20">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground text-center mb-10">
              Quem Pode Ser Revendedor?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { t: "Agências Digitais", d: "Ofereça créditos Lovable como parte do pacote de serviços para seus clientes que usam vibe coding." },
                { t: "Freelancers", d: "Desenvolvedores e designers que criam apps no Lovable para clientes podem revender créditos como serviço adicional." },
                { t: "Influenciadores Tech", d: "Creators de conteúdo sobre vibe coding, IA e no-code podem monetizar sua audiência revendendo créditos." },
                { t: "Comunidades e Grupos", d: "Administradores de grupos de vibe coding podem oferecer créditos com desconto para os membros." },
              ].map((p, i) => (
                <div key={i} className="glass-card rounded-2xl p-6 space-y-2">
                  <h3 className="font-display text-base font-bold text-foreground">{p.t}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{p.d}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Simulação de lucro */}
          <section className="mb-20">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground text-center mb-8">
              Simulação de Lucro Mensal
            </h2>
            <div className="glass-card rounded-2xl p-6 sm:p-8 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 text-muted-foreground font-medium">Cenário</th>
                    <th className="text-center py-3 text-muted-foreground font-medium">Vendas/mês</th>
                    <th className="text-center py-3 text-muted-foreground font-medium">Margem média</th>
                    <th className="text-center py-3 text-green-400 font-bold">Lucro estimado</th>
                  </tr>
                </thead>
                <tbody className="text-foreground">
                  {[
                    { c: "Iniciante", v: "10 vendas", m: "30%", l: "R$ 300–500" },
                    { c: "Intermediário", v: "30 vendas", m: "25%", l: "R$ 800–1.500" },
                    { c: "Avançado", v: "80+ vendas", m: "20%", l: "R$ 2.000–5.000+" },
                  ].map((r, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="py-3 font-medium">{r.c}</td>
                      <td className="py-3 text-center">{r.v}</td>
                      <td className="py-3 text-center">{r.m}</td>
                      <td className="py-3 text-center font-bold text-green-400">{r.l}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-muted-foreground mt-4">* Valores estimados baseados em revendedores ativos. Resultados variam.</p>
            </div>
          </section>

          {/* FAQ */}
          <section className="mb-20">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground text-center mb-10">
              Perguntas Frequentes sobre Revenda
            </h2>
            <div className="space-y-4">
              {[
                { q: "Preciso de CNPJ para ser revendedor?", a: "Não. Qualquer pessoa física pode se cadastrar como revendedor no LovaBoost. Não exigimos CNPJ." },
                { q: "Como eu entrego os créditos para meu cliente?", a: "Você não precisa entregar. O LovaBoost entrega automaticamente os créditos na conta Lovable do seu cliente. Você só precisa vender e receber o pagamento." },
                { q: "Posso definir meu próprio preço de venda?", a: "Sim. Você compra pelo preço de revendedor e vende pelo preço que quiser. A margem é totalmente sua." },
                { q: "Existe meta mínima de vendas?", a: "Não. Você pode vender no seu ritmo. Sem metas, sem pressão, sem prazo." },
                { q: "Como recebo meus lucros?", a: "Seu lucro fica disponível na carteira do LovaBoost. Você pode usar para comprar mais créditos ou solicitar saque." },
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
              Comece a Revender Créditos Lovable Hoje
            </h2>
            <p className="text-muted-foreground text-sm">
              Cadastro rápido. Sem investimento mínimo. Margem de lucro atrativa.
            </p>
            <Button asChild size="lg">
              <Link to="/revenda">Quero Ser Revendedor <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </section>

          <SeoInternalLinks currentSlug="revenda-creditos-lovable" />
        </article>
        <Footer />
      </div>
    </AnimatedBackground>
  );
}
