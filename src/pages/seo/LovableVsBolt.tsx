import { useEffect, useState } from "react";
import { SeoInternalLinks } from "@/components/SeoInternalLinks";
import { Link } from "react-router-dom";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Footer } from "@/components/Footer";
import { CheckCircle, XCircle, ArrowRight, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

const TOOLS = [
  { name: "Lovable.dev", fullStack: true, semCodigo: true, ptBR: true, banco: true, auth: true, deploy: true, preco_real: "R$ 0,09–0,20/crédito c/ LovaBoost", destaque: true },
  { name: "Bolt.new", fullStack: false, semCodigo: true, ptBR: false, banco: false, auth: false, deploy: true, preco_real: "US$ 20–50/mês", destaque: false },
  { name: "Cursor", fullStack: false, semCodigo: false, ptBR: false, banco: false, auth: false, deploy: false, preco_real: "US$ 20/mês fixo", destaque: false },
  { name: "v0 by Vercel", fullStack: false, semCodigo: true, ptBR: false, banco: false, auth: false, deploy: true, preco_real: "US$ 20/mês", destaque: false },
];

const FEATURES = [
  { label: "App full-stack completo", key: "fullStack" },
  { label: "Sem precisar saber codificar", key: "semCodigo" },
  { label: "Suporte ao português (BR)", key: "ptBR" },
  { label: "Banco de dados integrado", key: "banco" },
  { label: "Autenticação de usuários", key: "auth" },
  { label: "Deploy automático", key: "deploy" },
];

const FAQ = [
  { q: "Lovable ou Bolt — qual o melhor para iniciantes?", a: "Para iniciantes brasileiros que querem criar um app completo, o Lovable.dev é superior. Suporta português, cria front e back-end, e tem banco de dados integrado. O Bolt é mais limitado, focado apenas em front-end." },
  { q: "Posso usar Lovable e Cursor juntos?", a: "Sim. Muitos desenvolvedores usam o Lovable para criar a base do app rapidamente e depois refinam o código no Cursor. É uma combinação poderosa para quem tem conhecimento técnico." },
  { q: "Qual ferramenta de vibe coding é mais usada no Brasil?", a: "O Lovable.dev é a ferramenta de vibe coding mais usada no Brasil em 2025, principalmente pela comunidade de empreendedores digitais e criadores de SaaS. A comunidade brasileira de Lovable cresce rapidamente." },
  { q: "v0 ou Lovable — qual gera melhor interface?", a: "O v0 by Vercel gera interfaces visuais de altíssima qualidade, mas apenas componentes isolados. O Lovable gera a aplicação inteira, com interfaces muito boas também. Para a maioria dos projetos, o Lovable é mais prático pois entrega o app completo." },
];

export default function LovableVsBoltPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    document.title = "Lovable vs Bolt vs Cursor vs v0 — Qual a Melhor Ferramenta de Vibe Coding? | LovaBoost";
    document.querySelector('meta[name="description"]')?.setAttribute("content",
      "Comparativo completo: Lovable.dev vs Bolt.new vs Cursor vs v0. Qual a melhor ferramenta de vibe coding? Preços, recursos e qual escolher em 2025."
    );
  }, []);

  return (
    <AnimatedBackground>
      <div className="min-h-screen">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">

          {/* Hero */}
          <header className="text-center space-y-6 mb-20">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs sm:text-sm font-medium text-primary">
              <Trophy className="h-3.5 w-3.5" />
              Comparativo 2025
            </span>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground leading-[1.1] tracking-tighter">
              Lovable vs Bolt vs Cursor vs v0
              <br />
              <span className="gradient-text">Qual Escolher em 2025?</span>
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              Comparativo completo das principais ferramentas de vibe coding: recursos, preços e qual
              faz mais sentido para o seu projeto. Análise honesta sem blá-blá-blá.
            </p>
          </header>

          {/* Tabela comparativa */}
          <section className="mb-20">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-8">
              Tabela Comparativa — Vibe Coding Tools
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Recurso</th>
                    {TOOLS.map((t) => (
                      <th key={t.name} className={`py-3 px-4 text-center font-bold ${t.destaque ? "text-primary" : "text-foreground"}`}>
                        {t.name} {t.destaque && <span className="block text-xs">⭐ Recomendado</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FEATURES.map((row) => (
                    <tr key={row.key} className="border-b border-white/5">
                      <td className="py-3 px-4 text-muted-foreground">{row.label}</td>
                      {TOOLS.map((t) => (
                        <td key={t.name} className="py-3 px-4 text-center">
                          {t[row.key as keyof typeof t] === true
                            ? <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                            : <XCircle className="h-5 w-5 text-red-400/50 mx-auto" />}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="border-t border-white/10">
                    <td className="py-3 px-4 text-muted-foreground font-medium">Preço no Brasil</td>
                    {TOOLS.map((t) => (
                      <td key={t.name} className={`py-3 px-4 text-center text-xs ${t.destaque ? "text-primary font-bold" : "text-muted-foreground"}`}>
                        {t.preco_real}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground/60 mt-4">
              * Preço do Lovable com desconto via LovaBoost. Preços podem variar.
            </p>
          </section>

          {/* Análise individual */}
          <section className="mb-20">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-8">
              Análise Detalhada de Cada Ferramenta
            </h2>
            <div className="space-y-6">

              <div className="glass-card rounded-2xl p-6 border-primary/30">
                <div className="flex items-center gap-3 mb-4">
                  <Trophy className="h-6 w-6 text-primary" />
                  <h3 className="font-display text-lg font-bold text-foreground">Lovable.dev — Melhor para Apps Completos</h3>
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">Nossa escolha</span>
                </div>
                <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                  <p><strong className="text-foreground">O que faz bem:</strong> É a única ferramenta que cria o app completo — front-end bonito, back-end funcional, banco de dados Supabase, autenticação de usuários e deploy — tudo em uma conversa. Ideal para criar SaaS, painéis, marketplaces e qualquer app que precise de um sistema real por trás.</p>
                  <p><strong className="text-foreground">Ponto de atenção:</strong> Usa créditos, que se esgotam com o uso. A solução é comprar créditos com desconto no LovaBoost (até 76% mais barato que o oficial).</p>
                  <p><strong className="text-foreground">Para quem é:</strong> Empreendedores, agências, freelancers e qualquer pessoa que quer criar um app real sem equipe de desenvolvimento.</p>
                </div>
              </div>

              <div className="glass-card rounded-2xl p-6">
                <h3 className="font-display text-lg font-bold text-foreground mb-4">Bolt.new — Melhor para Protótipos Rápidos</h3>
                <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                  <p><strong className="text-foreground">O que faz bem:</strong> Cria protótipos de front-end muito rapidamente. Bom para validar ideias e criar landing pages.</p>
                  <p><strong className="text-foreground">Ponto de atenção:</strong> Não inclui back-end, banco de dados ou autenticação nativamente. Tokens esgotam rápido no plano gratuito. Preço em dólar.</p>
                  <p><strong className="text-foreground">Para quem é:</strong> Quem quer testar uma ideia rapidamente ou criar algo simples sem funcionalidades complexas.</p>
                </div>
              </div>

              <div className="glass-card rounded-2xl p-6">
                <h3 className="font-display text-lg font-bold text-foreground mb-4">Cursor — Melhor para Desenvolvedores</h3>
                <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                  <p><strong className="text-foreground">O que faz bem:</strong> IA integrada ao editor de código. Acelera muito o trabalho de quem já sabe programar.</p>
                  <p><strong className="text-foreground">Ponto de atenção:</strong> Exige conhecimento técnico de programação. Não é para iniciantes em vibe coding. Assinatura mensal em dólar.</p>
                  <p><strong className="text-foreground">Para quem é:</strong> Desenvolvedores que querem ser mais produtivos, não para quem quer criar sem saber programar.</p>
                </div>
              </div>

              <div className="glass-card rounded-2xl p-6">
                <h3 className="font-display text-lg font-bold text-foreground mb-4">v0 by Vercel — Melhor para Interfaces Visuais</h3>
                <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                  <p><strong className="text-foreground">O que faz bem:</strong> Cria componentes e interfaces React de altíssima qualidade visual. Excelente integração com Next.js.</p>
                  <p><strong className="text-foreground">Ponto de atenção:</strong> Focado em UI, não cria o app completo. Precisa de conhecimento técnico para integrar os componentes. Preço em dólar.</p>
                  <p><strong className="text-foreground">Para quem é:</strong> Designers e desenvolvedores front-end que querem componentes prontos de alta qualidade.</p>
                </div>
              </div>

            </div>
          </section>

          {/* Custo comparado */}
          <section className="mb-20">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-6">
              Qual Fica Mais Barato para Brasileiros?
            </h2>
            <div className="space-y-4 text-muted-foreground text-sm sm:text-base leading-relaxed">
              <p>A maioria das ferramentas de vibe coding cobra em dólar americano, o que encarece bastante para quem está no Brasil. Com o dólar acima de R$ 5,00, uma assinatura de US$ 20/mês vira R$ 100+ por mês.</p>
              <p>O <strong className="text-foreground">Lovable.dev com créditos via LovaBoost</strong> é a exceção: você paga em reais via PIX, com preços muito abaixo do oficial. Quem usa o Lovable intensamente economiza centenas de reais por mês em comparação com as assinaturas dolarizadas dos concorrentes.</p>
              <p>Para projetos profissionais no Brasil, a combinação <strong className="text-foreground">Lovable.dev + LovaBoost</strong> oferece o melhor custo-benefício: app completo, preço acessível, pagamento em reais.</p>
            </div>
          </section>

          {/* FAQ */}
          <section className="mb-20">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-8">
              Dúvidas sobre as Ferramentas de Vibe Coding
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
              Use Lovable.dev com o Menor Custo Possível
            </h2>
            <p className="text-muted-foreground text-sm max-w-lg mx-auto">
              Créditos com até 76% de desconto. PIX instantâneo. 100% brasileiro.
            </p>
            <Button asChild size="lg">
              <Link to="/">
                Comprar Créditos com Desconto <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </section>

          <SeoInternalLinks currentSlug="lovable-vs-bolt" />
        </article>
        <Footer />
      </div>
    </AnimatedBackground>
  );
}
