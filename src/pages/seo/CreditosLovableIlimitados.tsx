import { useEffect } from "react";
import { SeoInternalLinks } from "@/components/SeoInternalLinks";
import { Link } from "react-router-dom";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Footer } from "@/components/Footer";
import { ArrowRight, Infinity, AlertTriangle, CheckCircle, XCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CreditosLovableIlimitadosPage() {
  useEffect(() => {
    document.title = "Créditos Lovable Ilimitados? Como Usar Lovable Sem Limites | LovaBoost";
    document.querySelector('meta[name="description"]')?.setAttribute("content",
      "Créditos Lovable ilimitados: é possível? Entenda como funciona o sistema de créditos do Lovable.dev e como recarregar com até 76% de desconto pelo LovaBoost."
    );
  }, []);

  return (
    <AnimatedBackground>
      <div className="min-h-screen">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">

          {/* Hero */}
          <header className="text-center space-y-6 mb-20">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs sm:text-sm font-medium text-primary">
              <Infinity className="h-3.5 w-3.5" /> Guia Completo
            </span>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground leading-[1.1] tracking-tighter">
              Créditos Lovable
              <br />
              <span className="gradient-text">Ilimitados — É Possível?</span>
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              "Créditos Lovable ilimitados" é uma das buscas mais populares sobre a plataforma. Vamos explicar
              a verdade sobre o sistema de créditos e como usar o Lovable de forma praticamente ilimitada
              gastando muito menos.
            </p>
            <Button asChild size="lg">
              <Link to="/">Comprar Créditos com Desconto <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </header>

          {/* A verdade */}
          <section className="mb-20">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground text-center mb-8">
              A Verdade Sobre "Créditos Ilimitados"
            </h2>
            <div className="prose prose-invert max-w-none space-y-4 text-muted-foreground text-sm sm:text-base leading-relaxed">
              <p>
                <strong className="text-foreground">Resposta curta: não, créditos Lovable verdadeiramente ilimitados não existem.</strong> O
                Lovable.dev usa um sistema de créditos controlado no servidor — cada interação com a IA custa
                créditos, e não há como "gerar" créditos do nada ou usar um hack para ter ilimitado.
              </p>
              <p>
                Sites e vídeos que prometem "créditos Lovable ilimitados grátis" são golpes. Não existe
                exploit, extensão de Chrome ou bot que gere créditos. O saldo é verificado no servidor do Lovable
                a cada requisição.
              </p>
              <p>
                <strong className="text-foreground">Porém, existe uma forma prática de usar o Lovable "sem limites":</strong> recarregar
                créditos com preço muito abaixo do oficial pelo LovaBoost. Com até 76% de desconto, você
                pode recarregar sempre que precisar por uma fração do custo normal.
              </p>
            </div>
          </section>

          {/* Mitos vs Verdades */}
          <section className="mb-20">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground text-center mb-10">
              Mitos vs Verdades sobre Créditos Lovable
            </h2>
            <div className="space-y-4">
              {[
                { mito: true, t: "Existe hack para créditos ilimitados", d: "Não existe. Créditos são controlados pelo servidor do Lovable. Qualquer site que prometa isso é golpe." },
                { mito: true, t: "Extensões de Chrome dão créditos grátis", d: "Falso. Extensões que prometem créditos grátis são maliciosas e podem roubar dados da sua conta." },
                { mito: false, t: "Você pode comprar créditos avulsos mais baratos", d: "Verdade. O LovaBoost vende créditos com até 76% de desconto em relação ao preço oficial." },
                { mito: true, t: "Contas alternativas resolvem o problema", d: "O Lovable pode detectar e banir contas alternativas. Não vale o risco." },
                { mito: false, t: "Prompts melhores economizam créditos", d: "Verdade. Prompts mais detalhados e precisos reduzem o número de iterações necessárias." },
                { mito: false, t: "Recarregar pelo LovaBoost é seguro", d: "Verdade. O processo usa convites legítimos de workspace. Zero risco de banimento. Mais de 4 meses de operação." },
              ].map((item, i) => (
                <div key={i} className="glass-card rounded-xl p-5 flex items-start gap-4">
                  {item.mito ? (
                    <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${item.mito ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"}`}>
                        {item.mito ? "MITO" : "VERDADE"}
                      </span>
                      <h3 className="text-sm font-bold text-foreground">{item.t}</h3>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">{item.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Planos oficiais */}
          <section className="mb-20">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground text-center mb-8">
              Planos Oficiais do Lovable — Quanto Custa?
            </h2>
            <div className="glass-card rounded-2xl p-6 sm:p-8 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 text-muted-foreground font-medium">Plano</th>
                    <th className="text-center py-3 text-muted-foreground font-medium">Preço (USD)</th>
                    <th className="text-center py-3 text-muted-foreground font-medium">Preço (BRL aprox.)</th>
                    <th className="text-center py-3 text-muted-foreground font-medium">Créditos/mês</th>
                  </tr>
                </thead>
                <tbody className="text-foreground">
                  {[
                    { p: "Free", usd: "US$ 0", brl: "R$ 0", c: "Limitado (~5 prompts)" },
                    { p: "Starter", usd: "US$ 20/mês", brl: "~R$ 110/mês", c: "Limitado" },
                    { p: "Launch", usd: "US$ 50/mês", brl: "~R$ 275/mês", c: "Moderado" },
                    { p: "Scale", usd: "US$ 100/mês", brl: "~R$ 550/mês", c: "Alto" },
                  ].map((r, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="py-3 font-medium">{r.p}</td>
                      <td className="py-3 text-center">{r.usd}</td>
                      <td className="py-3 text-center text-muted-foreground">{r.brl}</td>
                      <td className="py-3 text-center">{r.c}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-muted-foreground mt-4">* Valores convertidos pelo câmbio aproximado. Os créditos dos planos são limitados e se esgotam com uso intenso.</p>
            </div>
          </section>

          {/* Alerta */}
          <section className="mb-20">
            <div className="glass-card rounded-2xl p-6 sm:p-8 border-yellow-500/20 bg-yellow-500/5">
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-6 w-6 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h3 className="font-display text-base font-bold text-foreground">Cuidado com Golpes de "Créditos Grátis"</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Nunca compartilhe sua senha do Lovable com ninguém. Nunca instale extensões que prometem créditos grátis.
                    Nunca acesse sites que pedem login do Lovable para "gerar créditos". Esses são golpes comuns que podem
                    roubar sua conta e seus projetos.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* A solução real */}
          <section className="mb-20">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground text-center mb-8">
              A Solução Real: Créditos com 76% de Desconto
            </h2>
            <div className="prose prose-invert max-w-none space-y-4 text-muted-foreground text-sm sm:text-base leading-relaxed">
              <p>
                Em vez de buscar "créditos ilimitados" (que não existem), a melhor estratégia é usar o Lovable
                de forma inteligente e recarregar créditos com o menor custo possível.
              </p>
              <p>
                O LovaBoost oferece créditos Lovable com até 76% de desconto em relação ao preço oficial.
                Isso significa que com o mesmo valor que você pagaria por 100 créditos oficiais, você compra
                quase 400 créditos no LovaBoost.
              </p>
              <p>
                Na prática, isso torna o uso do Lovable quase "ilimitado" para a maioria dos projetos —
                você pode criar apps completos gastando muito menos do que uma assinatura mensal oficial.
              </p>
            </div>
          </section>

          {/* Dicas */}
          <section className="mb-20">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground text-center mb-10">
              5 Dicas para Usar Lovable Sem Se Preocupar com Créditos
            </h2>
            <div className="space-y-4">
              {[
                { n: "1", t: "Planeje seu app antes de começar", d: "Tenha wireframes e uma lista de funcionalidades clara. Isso evita refações que desperdiçam créditos." },
                { n: "2", t: "Escreva prompts completos", d: "Em vez de 'cria um botão', escreva 'cria um botão verde com texto Comprar, que redireciona para /checkout ao clicar'. Menos iterações = menos créditos." },
                { n: "3", t: "Compre créditos em lote no LovaBoost", d: "Pacotes maiores têm desconto progressivo. Compre de uma vez e economize mais por crédito." },
                { n: "4", t: "Use o histórico de prompts", d: "Se um prompt deu certo antes, reutilize a estrutura. Prompts testados são mais eficientes." },
                { n: "5", t: "Recarregue antes de acabar", d: "Não espere zerar. Mantenha sempre um saldo mínimo para não travar no meio de um projeto." },
              ].map((d, i) => (
                <div key={i} className="glass-card rounded-xl p-5 flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <span className="text-primary font-bold text-sm">{d.n}</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground mb-1">{d.t}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{d.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section className="mb-20">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground text-center mb-10">
              Perguntas Frequentes
            </h2>
            <div className="space-y-4">
              {[
                { q: "Existe algum plano ilimitado no Lovable?", a: "Não. Todos os planos do Lovable têm limites de créditos. Mesmo o plano mais caro tem um teto mensal. A melhor alternativa é recarregar com desconto no LovaBoost." },
                { q: "É seguro comprar créditos no LovaBoost?", a: "Sim. O LovaBoost opera há mais de 4 meses com milhares de entregas. O processo usa convites legítimos de workspace, sem violar termos de uso. Zero risco de banimento." },
                { q: "Quantos créditos eu preciso para um projeto?", a: "Depende da complexidade. Um app simples pode usar 50-100 créditos. Um SaaS completo pode usar 500-2000+. Com o LovaBoost, mesmo projetos grandes ficam acessíveis." },
                { q: "Posso usar créditos do LovaBoost junto com meu plano?", a: "Sim. Os créditos do LovaBoost são adicionais ao que seu plano oferece. Eles se somam ao saldo da sua conta." },
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
              Use o Lovable Sem Limites — Com Desconto
            </h2>
            <p className="text-muted-foreground text-sm">
              Créditos com até 76% de desconto. PIX instantâneo. Entrega em segundos.
            </p>
            <Button asChild size="lg">
              <Link to="/">Comprar Créditos <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </section>

          <SeoInternalLinks currentSlug="creditos-lovable-ilimitados" />
        </article>
        <Footer />
      </div>
    </AnimatedBackground>
  );
}
