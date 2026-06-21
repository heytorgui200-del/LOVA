import { useEffect, useState } from "react";
import { SeoInternalLinks } from "@/components/SeoInternalLinks";
import { Link } from "react-router-dom";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Footer } from "@/components/Footer";
import { Sparkles, Code2, Rocket, Zap, Brain, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const TOOLS = [
  {
    icon: Sparkles,
    name: "Lovable.dev",
    badge: "Mais usado no Brasil",
    badgeColor: "bg-primary/10 text-primary",
    desc: "A ferramenta de vibe coding mais completa para criar aplicações web full-stack. Gera front-end, back-end, banco de dados e autenticação em uma única conversa. Usa créditos, que você pode comprar com desconto no LovaBoost.",
    ideal: "Apps web completos, SaaS, painéis, e-commerce",
  },
  {
    icon: Zap,
    name: "Bolt.new",
    badge: "Rápido para protótipos",
    badgeColor: "bg-yellow-500/10 text-yellow-500",
    desc: "Ferramenta da StackBlitz para criar projetos frontend rapidamente. Ideal para protótipos e projetos menores. Usa tokens que se esgotam rapidamente no plano gratuito.",
    ideal: "Protótipos, landing pages, projetos pequenos",
  },
  {
    icon: Code2,
    name: "Cursor",
    badge: "Para devs",
    badgeColor: "bg-blue-500/10 text-blue-500",
    desc: "Editor de código com IA integrada, baseado no VS Code. Exige mais conhecimento técnico que o Lovable, mas é muito poderoso para desenvolvedores que querem acelerar o trabalho.",
    ideal: "Desenvolvedores, projetos existentes, código complexo",
  },
  {
    icon: Brain,
    name: "v0 by Vercel",
    badge: "UI/Design",
    badgeColor: "bg-purple-500/10 text-purple-500",
    desc: "Especialista em criar interfaces visuais prontas para produção. Excelente para componentes React e designs modernos. Integra bem com o Next.js e o ecossistema Vercel.",
    ideal: "Componentes UI, interfaces, design de telas",
  },
  {
    icon: Rocket,
    name: "Replit",
    badge: "Iniciantes",
    badgeColor: "bg-orange-500/10 text-orange-500",
    desc: "Plataforma de desenvolvimento no navegador com IA integrada. Boa para aprender programação com IA e criar projetos simples. Usa 'cycles' como moeda interna.",
    ideal: "Aprendizado, scripts, automações simples",
  },
];

const STEPS = [
  { n: "1", t: "Escolha uma ideia de aplicativo", d: "Não precisa ser complexo para começar. Escolha algo que resolva um problema real: uma lista de tarefas, um sistema de agendamentos, uma loja simples, um painel de gestão para o seu negócio." },
  { n: "2", t: "Crie uma conta no Lovable.dev", d: "O Lovable.dev é a ferramenta de vibe coding mais completa para iniciantes no Brasil. O cadastro é gratuito e você já recebe créditos iniciais para testar. Acesse lovable.dev e crie sua conta." },
  { n: "3", t: "Descreva seu app em português", d: "No Lovable, você simplesmente escreve o que quer: 'Crie um sistema de agendamento com login, calendário e notificações por email'. A IA entende e começa a construir." },
  { n: "4", t: "Itere e refine com prompts", d: "A cada resposta da IA, você diz o que quer mudar: 'Muda a cor para azul', 'Adiciona um campo de telefone', 'Conecta com banco de dados'. Vá refinando até ficar como você quer." },
  { n: "5", t: "Publique e compartilhe", d: "O Lovable publica seu app automaticamente com um link. Você pode conectar um domínio próprio, integrar com Supabase para banco de dados, e seu app está no ar." },
  { n: "6", t: "Recarregue créditos com desconto", d: "Quando os créditos acabarem, recarregue pelo LovaBoost com até 76% de desconto. Assim você continua criando sem parar e sem gastar muito." },
];

const WHAT_YOU_CAN_BUILD = [
  "Sistemas SaaS completos com assinatura",
  "Lojas virtuais e e-commerce",
  "Painéis administrativos e dashboards",
  "Aplicativos de agendamento online",
  "CRMs e sistemas de gestão de clientes",
  "Plataformas de ensino e cursos online",
  "Marketplaces e plataformas de serviços",
  "Apps de finanças e controle de gastos",
  "Sistemas de delivery e logística",
  "Ferramentas internas para empresas",
  "Landing pages e sites institucionais",
  "Portfólios e sites pessoais profissionais",
];

const FAQ = [
  { q: "Precisa saber programar para fazer vibe coding?", a: "Não. Essa é a grande revolução do vibe coding. Você descreve o que quer em linguagem natural — português mesmo — e a IA escreve o código. Conhecimento técnico ajuda, mas não é necessário para começar." },
  { q: "Qual a melhor ferramenta de vibe coding para iniciantes no Brasil?", a: "O Lovable.dev é considerado a melhor opção para iniciantes brasileiros por ser intuitivo, suportar português, gerar aplicações completas (front e back-end) e ter uma comunidade ativa no Brasil." },
  { q: "Quanto custa fazer vibe coding?", a: "As ferramentas de vibe coding usam um sistema de créditos ou assinaturas. O Lovable.dev, por exemplo, usa créditos. Para economizar, você pode comprar créditos Lovable com até 76% de desconto no LovaBoost, tornando o vibe coding muito acessível." },
  { q: "Aplicativos criados com vibe coding funcionam de verdade?", a: "Sim. Aplicativos criados com ferramentas como Lovable.dev são aplicações web reais, com código limpo, banco de dados, autenticação e tudo que um app profissional precisa. Vários negócios reais no Brasil usam apps criados com vibe coding." },
  { q: "Vibe coding vai substituir programadores?", a: "O vibe coding muda o papel do programador, mas não o elimina. Desenvolvedores que adotam essas ferramentas ficam muito mais produtivos. Para quem não programa, é uma porta de entrada para criar produtos digitais sem depender de terceiros." },
  { q: "Qual a diferença entre Lovable e Bolt.new?", a: "O Lovable.dev é mais completo para aplicações full-stack (front + back-end + banco de dados), enquanto o Bolt.new é mais rápido para protótipos e projetos menores de front-end. Para apps reais que precisam de banco de dados e autenticação, o Lovable é a melhor escolha." },
];

export default function VibeCodingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    document.title = "O Que é Vibe Coding? Guia Completo para Criar Apps com IA | LovaBoost";
    document.querySelector('meta[name="description"]')?.setAttribute("content",
      "Vibe coding é criar aplicativos completos usando IA, sem escrever código manualmente. Conheça as melhores ferramentas de vibe coding — Lovable, Bolt, Cursor, v0 — e como começar hoje."
    );
  }, []);

  return (
    <AnimatedBackground>
      <div className="min-h-screen">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">

          {/* Hero */}
          <header className="text-center space-y-6 mb-20">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs sm:text-sm font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Guia Completo 2025
            </span>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground leading-[1.1] tracking-tighter">
              O Que é Vibe Coding?
              <br />
              <span className="gradient-text">Como Criar Apps com IA</span>
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              Vibe coding é a nova forma de criar aplicativos, sites e sistemas completos usando inteligência
              artificial — sem precisar escrever código manualmente. Qualquer pessoa pode criar um app
              funcional em minutos. Entenda como funciona e quais ferramentas usar.
            </p>
            <Button asChild size="lg" className="mt-4">
              <Link to="/">
                Começar com Lovable.dev <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </header>

          {/* O que é */}
          <section className="mb-20">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-6">
              O Que é Vibe Coding?
            </h2>
            <div className="space-y-4 text-muted-foreground text-sm sm:text-base leading-relaxed">
              <p>
                Vibe coding é um conceito criado pelo pesquisador de IA Andrej Karpathy para descrever
                uma nova forma de programar: em vez de escrever código linha por linha, você descreve em linguagem natural
                o que quer criar, e a IA escreve o código por você. Você "vibra" com a ideia e a IA executa.
              </p>
              <p>
                O termo viralizou em 2024 e 2025 com o avanço das ferramentas de desenvolvimento com IA. Hoje, um empreendedor
                sem nenhum conhecimento técnico consegue criar um aplicativo web completo, funcional e publicado em
                poucas horas — algo que antes levava meses de desenvolvimento e custava dezenas de milhares de reais.
              </p>
              <p>
                No Brasil, o vibe coding explodiu principalmente com ferramentas como <strong className="text-foreground">Lovable.dev</strong>,
                que permite criar aplicações completas com banco de dados, autenticação e pagamentos apenas descrevendo
                o que você quer em português.
              </p>
            </div>
          </section>

          {/* Ferramentas */}
          <section className="mb-20">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-8">
              Principais Ferramentas de Vibe Coding em 2025
            </h2>
            <div className="space-y-4">
              {TOOLS.map((tool, i) => (
                <div key={i} className="glass-card rounded-2xl p-6 flex gap-5 items-start">
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <tool.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-display text-lg font-bold text-foreground">{tool.name}</h3>
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${tool.badgeColor}`}>
                        {tool.badge}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">{tool.desc}</p>
                    <p className="text-xs text-muted-foreground/70">
                      <strong className="text-muted-foreground">Ideal para:</strong> {tool.ideal}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Como começar */}
          <section className="mb-20">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-8">
              Como Começar no Vibe Coding — Passo a Passo
            </h2>
            <div className="space-y-4">
              {STEPS.map((s, i) => (
                <div key={i} className="flex gap-5 items-start">
                  <span className="shrink-0 w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                    {s.n}
                  </span>
                  <div>
                    <h3 className="font-display text-base font-bold text-foreground mb-1">{s.t}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* O que dá para criar */}
          <section className="mb-20">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-8">
              O Que Dá para Criar com Vibe Coding?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {WHAT_YOU_CAN_BUILD.map((item, i) => (
                <div key={i} className="flex items-center gap-3 glass-card rounded-xl p-4">
                  <span className="text-primary font-bold">✓</span>
                  <span className="text-sm text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section className="mb-20">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-8">
              Perguntas Frequentes sobre Vibe Coding
            </h2>
            <div className="space-y-3">
              {FAQ.map((item, i) => (
                <div key={i} className="glass-card rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left"
                  >
                    <span className="text-sm font-semibold text-foreground pr-4">{item.q}</span>
                    <span className="text-muted-foreground shrink-0">{openFaq === i ? "▲" : "▼"}</span>
                  </button>
                  {openFaq === i && (
                    <p className="px-5 pb-5 text-muted-foreground text-sm leading-relaxed">{item.a}</p>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="text-center space-y-6">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              Comece seu Projeto de Vibe Coding Hoje
            </h2>
            <p className="text-muted-foreground text-sm max-w-lg mx-auto">
              Use o Lovable.dev e recarregue seus créditos com até 76% de desconto via PIX.
            </p>
            <Button asChild size="lg">
              <Link to="/">
                Comprar Créditos Lovable <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </section>

          <SeoInternalLinks currentSlug="vibe-coding" />
        </article>
        <Footer />
      </div>
    </AnimatedBackground>
  );
}
