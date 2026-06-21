import { useEffect, useState } from "react";
import { SeoInternalLinks } from "@/components/SeoInternalLinks";
import { Link } from "react-router-dom";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Footer } from "@/components/Footer";
import { Lightbulb, Smartphone, Globe, ShoppingBag, BarChart3, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const APP_TYPES = [
  { icon: BarChart3, t: "SaaS e Painéis", d: "Sistemas de gestão, dashboards, ferramentas de produtividade, CRMs. O Lovable cria o sistema completo com banco de dados e autenticação." },
  { icon: ShoppingBag, t: "E-commerce e Lojas", d: "Lojas virtuais com catálogo de produtos, carrinho de compras e integração com meios de pagamento." },
  { icon: Smartphone, t: "Apps de Serviço", d: "Plataformas de agendamento, delivery, marketplace de serviços, apps de conexão entre profissionais e clientes." },
  { icon: Globe, t: "Sites e Landing Pages", d: "Sites institucionais, landing pages de alta conversão, portfólios profissionais e blogs." },
  { icon: Lightbulb, t: "Ferramentas Internas", d: "Sistemas de controle de estoque, gestão de funcionários, relatórios automatizados para uso interno da empresa." },
  { icon: BarChart3, t: "Plataformas de Ensino", d: "EADs, plataformas de cursos online, sistemas de quizzes e avaliações, comunidades de aprendizado." },
];

const STEPS = [
  { n: "1", t: "Defina claramente o que seu app vai fazer", d: "Antes de abrir qualquer ferramenta, escreva em papel: qual problema seu app resolve? Quem vai usar? Quais são as 3 funções principais? Quanto mais clara sua visão, melhor a IA vai entender o que criar." },
  { n: "2", t: "Acesse o Lovable.dev e crie sua conta", d: "O Lovable.dev é a melhor ferramenta de vibe coding para criar apps completos no Brasil. Cadastro gratuito em lovable.dev. Você já começa com créditos suficientes para testar." },
  { n: "3", t: "Escreva um prompt detalhado para a IA", d: "No Lovable, descreva seu app com detalhes: 'Crie um sistema de agendamentos para salão de beleza. Quero que clientes possam se cadastrar, ver horários disponíveis e agendar serviços. A dona do salão precisa ver todos os agendamentos em um painel administrativo.' Quanto mais detalhe, melhor." },
  { n: "4", t: "Revise o que a IA criou e peça ajustes", d: "O Lovable vai gerar uma versão inicial do seu app. Teste, veja o que ficou bom e o que precisa mudar. Peça ajustes em linguagem natural: 'Muda a cor do botão para verde', 'Adiciona campo de CPF no cadastro'." },
  { n: "5", t: "Conecte banco de dados e autenticação", d: "O Lovable integra com Supabase para banco de dados e autenticação de usuários. Com um clique você ativa o banco e seu app começa a salvar dados de verdade." },
  { n: "6", t: "Publique e compartilhe seu app", d: "O Lovable gera um link público do seu app automaticamente. Você pode testar com usuários reais, coletar feedback e continuar melhorando." },
  { n: "7", t: "Recarregue créditos com desconto quando precisar", d: "Quando os créditos do Lovable acabarem, recarregue pelo LovaBoost com até 76% de desconto via PIX. Assim você continua desenvolvendo sem parar e sem gastar muito." },
];

const FAQ = [
  { q: "Quanto tempo leva para criar um app com IA?", a: "Um protótipo funcional pode ser criado em 30 minutos a 2 horas. Um app mais completo e refinado para uso real leva de 1 a 3 dias de iterações com a IA. Compare com meses de desenvolvimento tradicional." },
  { q: "Quanto custa criar um app com IA no Brasil?", a: "Com o Lovable.dev e créditos do LovaBoost, você pode criar um app completo por menos de R$ 50,00. Um desenvolvimento tradicional do mesmo app custaria entre R$ 5.000 e R$ 50.000." },
  { q: "O app criado com IA é escalável?", a: "Sim. O Lovable.dev gera código React limpo e usa Supabase como banco de dados, que suporta milhões de usuários. Apps criados com Lovable são escaláveis e podem crescer com o negócio." },
  { q: "Precisa de servidor ou hospedagem para publicar o app?", a: "Não. O Lovable faz o deploy automático e hospeda o app. Para apps maiores, você pode conectar com Vercel ou Netlify facilmente." },
  { q: "O código gerado pela IA é de qualidade?", a: "O Lovable.dev gera código React com TypeScript, usando boas práticas modernas. O código pode ser exportado e modificado por um desenvolvedor se necessário. É um ponto de partida sólido, não um protótipo descartável." },
];

export default function CriarAppComIAPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    document.title = "Como Criar um Aplicativo com IA Sem Saber Programar | LovaBoost";
    document.querySelector('meta[name="description"]')?.setAttribute("content",
      "Guia passo a passo para criar um aplicativo, site ou sistema com inteligência artificial sem saber programar. Use o Lovable.dev e o vibe coding para lançar seu app hoje."
    );
  }, []);

  return (
    <AnimatedBackground>
      <div className="min-h-screen">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">

          {/* Hero */}
          <header className="text-center space-y-6 mb-20">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs sm:text-sm font-medium text-primary">
              <Lightbulb className="h-3.5 w-3.5" />
              Guia Prático
            </span>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground leading-[1.1] tracking-tighter">
              Como Criar um App com IA
              <br />
              <span className="gradient-text">Sem Saber Programar</span>
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              Em 2025 qualquer pessoa consegue criar um aplicativo funcional, bonito e publicado usando
              inteligência artificial. Neste guia você aprende o passo a passo completo para criar seu
              app do zero usando vibe coding — sem escrever uma linha de código.
            </p>
            <Button asChild size="lg" className="mt-4">
              <Link to="/">
                Começar Agora com Lovable <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </header>

          {/* É possível? */}
          <section className="mb-20">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-6">
              É Realmente Possível Criar um App Sem Programar?
            </h2>
            <div className="space-y-4 text-muted-foreground text-sm sm:text-base leading-relaxed">
              <p>Sim, e não é exagero. Com as ferramentas de vibe coding disponíveis em 2025, uma pessoa sem nenhum conhecimento de programação consegue criar um aplicativo web completo — com banco de dados, login de usuários, painel administrativo e sistema de pagamentos — em uma única tarde.</p>
              <p>Isso foi possível graças ao salto de qualidade dos modelos de linguagem (LLMs) como GPT-4, Claude e Gemini, que agora entendem descrições em linguagem natural e geram código de alta qualidade. Ferramentas como o <strong className="text-foreground">Lovable.dev</strong> encapsulam esse poder em uma interface simples onde você só precisa descrever o que quer.</p>
              <p>Empreendedores brasileiros já lançaram dezenas de SaaS reais e rentáveis usando apenas vibe coding — sem contratar um desenvolvedor, sem aprender JavaScript, sem gastar meses de trabalho.</p>
            </div>
          </section>

          {/* Tipos de apps */}
          <section className="mb-20">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-8">
              Tipos de Apps Que Você Pode Criar com IA Hoje
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {APP_TYPES.map((c, i) => (
                <div key={i} className="glass-card rounded-2xl p-6 space-y-3">
                  <c.icon className="h-8 w-8 text-primary" />
                  <h3 className="font-display text-base font-bold text-foreground">{c.t}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{c.d}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Passo a passo */}
          <section className="mb-20">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-8">
              Passo a Passo: Como Criar seu App com IA
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

          {/* FAQ */}
          <section className="mb-20">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-8">
              Perguntas Frequentes — Criar App com IA
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
              Crie seu App com IA pelo Menor Custo
            </h2>
            <p className="text-muted-foreground text-sm max-w-lg mx-auto">
              Créditos Lovable com até 76% de desconto. PIX. Entrega automática.
            </p>
            <Button asChild size="lg">
              <Link to="/">
                Comprar Créditos e Começar <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </section>

          <SeoInternalLinks currentSlug="criar-app-com-ia" />
        </article>
        <Footer />
      </div>
    </AnimatedBackground>
  );
}
