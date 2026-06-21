import { useEffect } from "react";
import { Link } from "react-router-dom";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Footer } from "@/components/Footer";
import { SeoInternalLinks } from "@/components/SeoInternalLinks";
import { ArrowRight, Sparkles, Code2, Rocket, CreditCard, Zap, Brain, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURES = [
  { icon: Sparkles, title: "Geração de código com IA", desc: "Descreva o que quer construir em linguagem natural e o Lovable gera todo o código automaticamente — React, TypeScript, Tailwind CSS e mais." },
  { icon: Code2, title: "Full-stack completo", desc: "O Lovable cria não apenas o frontend, mas também backend, banco de dados, autenticação de usuários e APIs. Tudo integrado." },
  { icon: Globe, title: "Deploy com 1 clique", desc: "Publique seu app na internet com um clique. O Lovable cuida de hospedagem, HTTPS e domínio personalizado." },
  { icon: Brain, title: "Iteração inteligente", desc: "Peça ajustes, correções e novas funcionalidades por mensagem. A IA entende o contexto do seu projeto e faz as alterações." },
];

const STEPS = [
  { n: "1", title: "Crie sua conta no Lovable.dev", desc: "Acesse lovable.dev e faça seu cadastro gratuito. Você recebe créditos iniciais para testar a plataforma sem gastar nada." },
  { n: "2", title: "Descreva seu app em um prompt", desc: "Escreva em português o que quer criar. Exemplo: 'Crie um sistema de agendamentos para salão de beleza com login, painel admin e calendário.' Quanto mais detalhado, melhor o resultado." },
  { n: "3", title: "A IA gera o app completo", desc: "O Lovable analisa seu prompt e cria todo o código: páginas, componentes, banco de dados, rotas e estilização. Você vê o resultado em tempo real." },
  { n: "4", title: "Itere e refine", desc: "Peça ajustes por mensagem: 'mude a cor do botão', 'adicione um filtro por data', 'integre com Stripe'. Cada mensagem consome créditos." },
  { n: "5", title: "Publique e compartilhe", desc: "Com um clique, seu app vai pro ar com URL própria. Você pode conectar seu domínio personalizado e começar a usar imediatamente." },
];

export default function LovableDevComoFuncionaPage() {
  useEffect(() => {
    document.title = "Lovable Dev: Como Funciona? Guia Completo 2025 | LovaBoost";
    document.querySelector('meta[name="description"]')?.setAttribute("content",
      "Entenda como o Lovable.dev funciona: crie apps completos com inteligência artificial, sem programar. Guia passo a passo, preços e como economizar créditos."
    );
  }, []);

  return (
    <AnimatedBackground>
      <div className="min-h-screen">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">

          {/* Hero */}
          <header className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
              <Brain className="h-3.5 w-3.5" />
              Guia Atualizado 2025
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground leading-tight">
              Lovable Dev: Como Funciona?<br />
              <span className="gradient-text">Guia Completo para Iniciantes</span>
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
              O Lovable.dev é uma plataforma de inteligência artificial que transforma descrições em texto em aplicativos
              web completos — frontend, backend, banco de dados e deploy. Tudo sem precisar escrever uma linha de código.
            </p>
          </header>

          {/* O que é */}
          <section className="mb-16 space-y-6">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              O que é o Lovable.dev?
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              O <strong>Lovable.dev</strong> (antes conhecido como GPT Engineer) é uma das ferramentas de <strong>vibe coding</strong> mais
              populares do mundo. Ele permite que qualquer pessoa — desenvolvedores, designers, empreendedores ou iniciantes — crie
              aplicativos web profissionais usando apenas linguagem natural em português ou inglês.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Diferente de outras ferramentas de IA que geram apenas trechos de código, o Lovable cria <strong>aplicações completas</strong>:
              páginas com React e TypeScript, estilização com Tailwind CSS, banco de dados com Supabase, autenticação de usuários,
              e até deploy automático. É a forma mais rápida de transformar uma ideia em um produto funcional.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              O Lovable funciona com um sistema de <strong>créditos</strong>: cada mensagem que você envia para a IA consome créditos.
              Os planos oficiais custam entre US$ 20 e US$ 100/mês, o que pode ser caro para muitos brasileiros. É por isso que a
              <strong> LovaBoost</strong> existe — oferecemos créditos Lovable com até <strong>76% de desconto</strong> via PIX.
            </p>
          </section>

          {/* Recursos */}
          <section className="mb-16 space-y-8">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              Principais recursos do Lovable
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FEATURES.map((f, i) => (
                <div key={i} className="rounded-2xl border border-border/50 bg-card/50 p-6 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-display text-base font-bold text-foreground">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Passo a passo */}
          <section className="mb-16 space-y-8">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              Como usar o Lovable.dev — Passo a Passo
            </h2>
            <div className="space-y-4">
              {STEPS.map((step) => (
                <div key={step.n} className="rounded-2xl border border-border/50 bg-card/50 p-6 flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">{step.n}</span>
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-foreground mb-1">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Preços */}
          <section className="mb-16 space-y-6">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              Quanto custa usar o Lovable?
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              O Lovable tem um <strong>plano gratuito</strong> com créditos limitados para experimentar. Os planos pagos oficiais
              custam entre <strong>US$ 20 e US$ 100 por mês</strong>, cobrados em dólar no cartão de crédito internacional.
              Para muitos brasileiros, isso representa um custo alto — especialmente quando o câmbio está desfavorável.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              A <strong>LovaBoost</strong> resolve esse problema: vendemos créditos Lovable com até <strong>76% de desconto</strong>,
              com pagamento em reais via PIX instantâneo. Não é preciso ter cartão internacional. Você compra exatamente a quantidade
              de créditos que precisa, sem assinar planos mensais.
            </p>
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 space-y-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <h3 className="font-display text-base font-bold text-foreground">Comparação de preços</h3>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
                <li><strong>Site oficial:</strong> US$ 20–100/mês (~R$ 100–500 com câmbio e IOF)</li>
                <li><strong>LovaBoost:</strong> A partir de R$ 9 por pacote de créditos — até 76% mais barato</li>
                <li><strong>Pagamento:</strong> PIX instantâneo, sem cartão internacional</li>
                <li><strong>Entrega:</strong> Automática em segundos</li>
              </ul>
            </div>
          </section>

          {/* Para quem */}
          <section className="mb-16 space-y-6">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              Para quem o Lovable é ideal?
            </h2>
            <ul className="text-muted-foreground space-y-3 list-disc pl-5">
              <li><strong>Empreendedores:</strong> valide ideias de negócio criando MVPs em horas, não semanas</li>
              <li><strong>Designers:</strong> transforme wireframes e mockups em apps funcionais sem depender de dev</li>
              <li><strong>Freelancers:</strong> entregue projetos mais rápido e aumente sua capacidade de produção</li>
              <li><strong>Estudantes:</strong> aprenda desenvolvimento web na prática, com a IA como mentora</li>
              <li><strong>Desenvolvedores:</strong> acelere tarefas repetitivas e protótipos para focar no que importa</li>
            </ul>
          </section>

          {/* FAQ */}
          <section className="mb-16 space-y-6">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              Perguntas Frequentes
            </h2>
            <div className="space-y-4">
              {[
                { q: "Preciso saber programar para usar o Lovable?", a: "Não. O Lovable foi feito para qualquer pessoa criar apps usando linguagem natural. Saber programar ajuda a refinar os resultados, mas não é obrigatório." },
                { q: "O Lovable gera código de qualidade?", a: "Sim. O código gerado usa React, TypeScript, Tailwind CSS e Supabase — tecnologias profissionais usadas por grandes empresas. O código é editável e exportável." },
                { q: "Posso usar o Lovable em português?", a: "Sim! O Lovable entende prompts em português e gera interfaces que podem ser totalmente em PT-BR." },
                { q: "Como economizar créditos no Lovable?", a: "Use prompts detalhados para evitar iterações desnecessárias. E compre créditos com desconto na LovaBoost — até 76% mais barato que o preço oficial." },
                { q: "O que acontece quando meus créditos acabam?", a: "Você não perde seu projeto. Apenas não pode enviar novas mensagens para a IA. Recarregue na LovaBoost e continue de onde parou." },
              ].map((faq, i) => (
                <div key={i} className="rounded-xl border border-border/50 bg-card/50 p-5">
                  <h3 className="font-display text-sm font-bold text-foreground mb-2">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="text-center space-y-6 mb-12">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              Comece a Criar com Lovable Hoje
            </h2>
            <p className="text-muted-foreground text-sm max-w-lg mx-auto">
              Recarregue seus créditos Lovable com até 76% de desconto via PIX e transforme suas ideias em apps funcionais.
            </p>
            <Button asChild size="lg">
              <Link to="/">
                Comprar Créditos Lovable <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </section>

          <SeoInternalLinks currentSlug="lovable-dev-como-funciona" />
        </article>
        <Footer />
      </div>
    </AnimatedBackground>
  );
}
