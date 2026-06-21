import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const INTERNAL_LINKS = [
  { to: "/como-funciona", label: "Como funciona a LovaBoost" },
  { to: "/comprar-creditos-lovable", label: "Comprar créditos Lovable" },
  { to: "/vibe-coding", label: "O que é Vibe Coding?" },
  { to: "/lovable-vs-bolt", label: "Lovable vs Bolt.new" },
  { to: "/como-recarregar-lovable", label: "Como recarregar Lovable" },
  { to: "/revenda-creditos-lovable", label: "Revenda de créditos Lovable" },
];

export function SeoContentBlock() {
  return (
    <section aria-label="Sobre a LovaBoost" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-3xl">
        <motion.article
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="prose prose-invert prose-sm sm:prose-base max-w-none space-y-8"
        >
          {/* H2: O que é */}
          <div className="space-y-4">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              O que é a LovaBoost?
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              A <strong>LovaBoost</strong> é a maior plataforma brasileira para <strong>comprar créditos Lovable.dev</strong> com desconto. 
              Oferecemos até <strong>76% de economia</strong> em relação ao preço oficial, com pagamento instantâneo via <strong>PIX</strong> e 
              entrega automática em poucos segundos. Nosso sistema opera há mais de 4 meses com 100% de estabilidade e zero risco de banimento.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              A plataforma <strong>Lovable.dev</strong> é uma das ferramentas de inteligência artificial mais populares para criar aplicativos 
              e sites sem precisar programar. Com ela, qualquer pessoa pode transformar ideias em software funcional usando apenas comandos em 
              linguagem natural. Os créditos Lovable são o combustível dessa criação — e na LovaBoost, você paga muito menos por eles.
            </p>
          </div>

          {/* H2: Como comprar */}
          <div className="space-y-4">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
              Como comprar créditos Lovable com desconto
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              O processo é simples e 100% automatizado. Primeiro, escolha a quantidade de <strong>créditos Lovable</strong> que deseja no 
              simulador acima. O preço é calculado em tempo real com base na cotação atual. Em seguida, gere o <strong>QR Code PIX</strong> e 
              pague pelo aplicativo do seu banco. Assim que o pagamento for confirmado, os créditos são entregues automaticamente na sua conta 
              Lovable.dev em questão de segundos.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Não é necessário informar senha ou dados sensíveis. Todo o processo funciona via convite legítimo para a sua workspace no 
              Lovable.dev. Você pode <strong>recarregar sua conta Lovable</strong> quantas vezes quiser, sem limites.
            </p>
          </div>

          {/* H3: Por que essenciais */}
          <div className="space-y-4">
            <h3 className="font-display text-lg sm:text-xl font-bold text-foreground">
              Por que créditos Lovable são essenciais para desenvolvedores
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Cada interação com a IA do Lovable.dev consome créditos. Seja para gerar código, criar componentes, corrigir bugs ou fazer deploy, 
              você precisa de créditos para manter o fluxo de trabalho. Desenvolvedores que praticam <strong>vibe coding</strong> — a nova forma 
              de programar usando inteligência artificial — consomem créditos rapidamente, tornando o custo oficial proibitivo para muitos brasileiros.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Com a LovaBoost, você elimina essa barreira. Compre <strong>créditos Lovable baratos</strong> via PIX e continue criando sem 
              interrupções. Nossos preços são atualizados em tempo real para garantir sempre o melhor custo-benefício do mercado.
            </p>
          </div>

          {/* H3: Vantagens */}
          <div className="space-y-4">
            <h3 className="font-display text-lg sm:text-xl font-bold text-foreground">
              Vantagens da LovaBoost vs site oficial
            </h3>
            <ul className="text-muted-foreground space-y-2 list-disc pl-5">
              <li><strong>Economia de até 76%</strong> comparado ao preço oficial em dólar</li>
              <li><strong>Pagamento via PIX</strong> — sem necessidade de cartão internacional</li>
              <li><strong>Entrega automática</strong> em segundos, sem esperar atendimento humano</li>
              <li><strong>Processamento em nuvem</strong> — pode fechar o navegador sem perder a entrega</li>
              <li><strong>Reembolso automático</strong> em caso de falha na entrega</li>
              <li><strong>Sem risco de ban</strong> — processo legítimo via convite de workspace</li>
              <li><strong>Programa de revenda</strong> — ganhe dinheiro revendendo créditos para outros usuários</li>
            </ul>
          </div>

          {/* H3: Para quem */}
          <div className="space-y-4">
            <h3 className="font-display text-lg sm:text-xl font-bold text-foreground">
              Para quem a LovaBoost é ideal?
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              A LovaBoost atende desde desenvolvedores independentes que usam o Lovable.dev para projetos pessoais até agências e freelancers 
              que criam aplicativos para clientes. Se você usa <strong>inteligência artificial para criar apps</strong>, precisa de créditos 
              constantes — e aqui é onde você paga menos. Também oferecemos um <strong>programa de revenda de créditos Lovable</strong> para 
              quem quer gerar renda extra indicando a plataforma.
            </p>
          </div>

          {/* Internal links */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="font-display text-lg font-bold text-foreground">
              Artigos relacionados
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {INTERNAL_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors group"
                >
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </motion.article>
      </div>
    </section>
  );
}
