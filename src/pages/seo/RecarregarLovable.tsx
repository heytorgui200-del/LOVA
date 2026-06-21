import { useEffect } from "react";
import { SeoInternalLinks } from "@/components/SeoInternalLinks";
import { Link } from "react-router-dom";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Footer } from "@/components/Footer";
import { ArrowRight, RefreshCw, QrCode, Rocket, AlertTriangle, CheckCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RecarregarLovablePage() {
  useEffect(() => {
    document.title = "Como Recarregar Créditos Lovable via PIX | LovaBoost";
    document.querySelector('meta[name="description"]')?.setAttribute("content",
      "Passo a passo para recarregar créditos Lovable.dev via PIX com até 76% de desconto. Entrega automática em segundos pelo LovaBoost."
    );
  }, []);

  return (
    <AnimatedBackground>
      <div className="min-h-screen">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">

          {/* Hero */}
          <header className="text-center space-y-6 mb-20">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs sm:text-sm font-medium text-primary">
              <RefreshCw className="h-3.5 w-3.5" /> Guia Completo
            </span>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground leading-[1.1] tracking-tighter">
              Como Recarregar
              <br />
              <span className="gradient-text">Créditos Lovable via PIX</span>
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              Seus créditos do Lovable acabaram? Veja como recarregar em minutos pelo LovaBoost — com até
              76% de desconto e pagamento instantâneo via PIX.
            </p>
            <Button asChild size="lg">
              <Link to="/">Recarregar Agora <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </header>

          {/* Por que acabam */}
          <section className="mb-20">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground text-center mb-8">
              Por Que os Créditos do Lovable Acabam Rápido?
            </h2>
            <div className="prose prose-invert max-w-none space-y-4 text-muted-foreground text-sm sm:text-base leading-relaxed">
              <p>
                O Lovable.dev consome créditos a cada interação com a IA. Criar um componente, corrigir um erro,
                adicionar uma funcionalidade — tudo gasta créditos. Um projeto médio pode consumir entre 50 e 200
                créditos em uma única sessão de trabalho.
              </p>
              <p>
                Os planos oficiais do Lovable oferecem créditos limitados, e o plano gratuito é suficiente apenas
                para testes iniciais. Quando você está no meio de um projeto importante e os créditos acabam,
                precisa esperar o próximo ciclo ou pagar caro para continuar.
              </p>
              <p>
                O LovaBoost resolve isso: recarregue seus créditos a qualquer momento, sem esperar, com preço
                em reais e desconto de até 76% em relação ao oficial.
              </p>
            </div>
          </section>

          {/* Passo a passo */}
          <section className="mb-20">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground text-center mb-10">
              Passo a Passo para Recarregar
            </h2>
            <div className="space-y-6">
              {[
                { n: "1", icon: Zap, t: "Acesse o LovaBoost e escolha a quantidade", d: "Na página inicial do LovaBoost, use o simulador para escolher quantos créditos deseja. O preço é calculado em tempo real — quanto mais créditos, maior o desconto por unidade." },
                { n: "2", icon: QrCode, t: "Gere o PIX e pague pelo app do banco", d: "Clique em 'Gerar PIX' e escaneie o QR Code ou copie o código. Abra o app do seu banco, cole o código e confirme o pagamento. Leva menos de 30 segundos." },
                { n: "3", icon: Rocket, t: "Receba os créditos automaticamente", d: "Assim que o PIX é confirmado, nosso sistema em nuvem processa o pedido e entrega os créditos na sua conta do Lovable. O processo é 100% automatizado." },
                { n: "4", icon: CheckCircle, t: "Continue criando seu projeto", d: "Com os créditos recarregados, volte ao Lovable e continue exatamente de onde parou. Sem perder progresso, sem interrupções." },
              ].map((s, i) => (
                <div key={i} className="flex gap-5 items-start glass-card rounded-2xl p-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <span className="text-primary font-bold text-lg">{s.n}</span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-display text-base font-bold text-foreground">{s.t}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Dicas */}
          <section className="mb-20">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground text-center mb-10">
              Dicas para Economizar Créditos no Lovable
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { t: "Escreva prompts detalhados", d: "Quanto mais detalhado o prompt, menos iterações a IA precisa para entregar o que você quer. Isso economiza créditos." },
                { t: "Planeje antes de começar", d: "Tenha uma visão clara do que quer criar antes de abrir o Lovable. Mudanças de direção no meio do projeto consomem muitos créditos." },
                { t: "Use o modo de edição pontual", d: "Para pequenas alterações, peça mudanças específicas em vez de recriar componentes inteiros." },
                { t: "Compre em quantidade maior", d: "No LovaBoost, pacotes maiores têm maior desconto por crédito. Compre de uma vez e economize mais." },
              ].map((d, i) => (
                <div key={i} className="glass-card rounded-2xl p-6 space-y-2">
                  <h3 className="font-display text-base font-bold text-foreground">{d.t}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{d.d}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Aviso */}
          <section className="mb-20">
            <div className="glass-card rounded-2xl p-6 sm:p-8 border-yellow-500/20 bg-yellow-500/5">
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-6 w-6 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h3 className="font-display text-base font-bold text-foreground">Cuidado com "Geradores de Créditos Grátis"</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Existem sites que prometem "créditos Lovable grátis ilimitados". São golpes. Não existe forma
                    de gerar créditos do nada — o Lovable controla isso no servidor. O LovaBoost é um serviço real,
                    operando há mais de 4 meses, com milhares de entregas confirmadas e suporte via WhatsApp.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="mb-20">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground text-center mb-10">
              Perguntas Frequentes sobre Recarga
            </h2>
            <div className="space-y-4">
              {[
                { q: "Posso recarregar mais de uma vez?", a: "Sim. Você pode recarregar quantas vezes quiser, sem limite. Muitos clientes recarregam semanalmente." },
                { q: "Os créditos expiram?", a: "Os créditos comprados pelo LovaBoost seguem a mesma política de expiração do Lovable.dev. Atualmente, os créditos não expiram." },
                { q: "Quanto tempo demora para receber após o PIX?", a: "Normalmente segundos. Em casos raros, pode levar até 5 minutos. Se passar disso, nosso suporte resolve na hora." },
                { q: "Funciona com qualquer banco?", a: "Sim. O PIX é aceito de qualquer banco ou fintech do Brasil — Nubank, Itaú, Bradesco, Inter, PicPay, etc." },
                { q: "E se eu perder a conexão durante a entrega?", a: "Sem problema. O processamento ocorre nos nossos servidores. Mesmo que sua internet caia, os créditos serão entregues normalmente." },
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
              Recarregue Seus Créditos Agora
            </h2>
            <p className="text-muted-foreground text-sm">
              PIX instantâneo. Até 76% de desconto. Entrega em segundos.
            </p>
            <Button asChild size="lg">
              <Link to="/">Recarregar Créditos <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </section>

          <SeoInternalLinks currentSlug="como-recarregar-lovable" />
        </article>
        <Footer />
      </div>
    </AnimatedBackground>
  );
}
