export type SeoTemplate = "comparison" | "guide" | "product" | "bait";
export type SeoIntent = "transacional" | "comparacao" | "educacional" | "bait" | "b2b";

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ComparisonRow {
  feature: string;
  lovaboost: boolean | string;
  competitor: boolean | string;
}

export interface SeoPageData {
  slug: string;
  template: SeoTemplate;
  intent: SeoIntent;
  category: string;
  title: string;
  h1: string;
  metaDescription: string;
  keywords: string[];
  intro: string;
  sections: { heading: string; content: string }[];
  faq: FaqItem[];
  relatedSlugs: string[];
  jsonLdType: "Article" | "FAQPage" | "Product";
  // Comparison-specific
  competitorName?: string;
  comparisonRows?: ComparisonRow[];
  // Product-specific
  highlightDiscount?: string;
  benefits?: string[];
  // Bait-specific
  baitHook?: string;
  truthReveal?: string;
}

export const seoPages: SeoPageData[] = [
  // 1. Product — Comprar créditos barato
  {
    slug: "creditos/comprar/lovable-barato",
    template: "product",
    intent: "transacional",
    category: "compra",
    title: "Comprar Créditos Lovable Barato — Até 60% OFF | LovaBoost",
    h1: "Compre Créditos Lovable com Até 60% de Desconto",
    metaDescription: "Créditos Lovable com o menor preço do Brasil. Pague via PIX, receba na hora. Até 60% mais barato que o site oficial. Confira os planos.",
    keywords: ["comprar créditos lovable barato", "créditos lovable desconto", "lovable créditos preço", "créditos lovable promoção"],
    intro: "Você usa o Lovable para criar apps incríveis com IA, mas o preço dos créditos no site oficial pesa no bolso? A LovaBoost oferece os mesmos créditos com até 60% de desconto, pagamento via PIX e entrega instantânea.",
    sections: [
      { heading: "Por que os créditos são mais baratos?", content: "A LovaBoost compra créditos em volume e repassa o desconto direto para você. Sem intermediários, sem taxas escondidas. O processo é 100% seguro e seu projeto Lovable continua funcionando normalmente." },
      { heading: "Como funciona a compra?", content: "1. Escolha o pacote de créditos no nosso site. 2. Pague via PIX (aprovação instantânea). 3. Informe seu e-mail Lovable. 4. Receba os créditos em minutos na sua conta." },
      { heading: "É seguro comprar créditos assim?", content: "Sim. Já realizamos mais de 500 transações sem nenhum problema. Seus dados ficam protegidos e nunca pedimos sua senha. A entrega é feita diretamente pela plataforma oficial." },
    ],
    faq: [
      { question: "É seguro comprar créditos Lovable na LovaBoost?", answer: "Sim, 100%. Nunca pedimos sua senha. A entrega é feita de forma segura pela plataforma oficial. Mais de 500 clientes satisfeitos." },
      { question: "Quanto tempo demora para receber os créditos?", answer: "Após a confirmação do PIX, os créditos são entregues em até 30 minutos durante horário comercial." },
      { question: "Posso comprar qualquer quantidade?", answer: "Sim! Oferecemos pacotes de 100 a 10.000 créditos, além de planos personalizados para revendedores." },
      { question: "O desconto é real? Como é possível?", answer: "Compramos em volume direto da plataforma e repassamos o desconto. É simples economia de escala." },
    ],
    relatedSlugs: ["creditos/gratis/lovable-2025", "creditos/revenda/como-ganhar"],
    jsonLdType: "Product",
    highlightDiscount: "Até 60% OFF",
    benefits: ["Pagamento via PIX", "Entrega em minutos", "Suporte via WhatsApp 24h", "Sem risco de ban", "Desconto progressivo por volume"],
  },

  // 2. Bait — Créditos grátis
  {
    slug: "creditos/gratis/lovable-2025",
    template: "bait",
    intent: "bait",
    category: "compra",
    title: "Créditos Lovable Grátis em 2025? A Verdade que Ninguém Conta",
    h1: "Créditos Lovable Grátis: Mito ou Realidade?",
    metaDescription: "Descubra a verdade sobre créditos Lovable grátis em 2025. Saiba como economizar até 60% com segurança, sem golpes ou geradores fake.",
    keywords: ["créditos lovable grátis", "lovable free credits", "créditos lovable grátis 2025", "gerador de créditos lovable"],
    intro: "Se você chegou aqui procurando créditos Lovable grátis, precisa saber de uma coisa: a maioria dos sites que prometem isso são golpes. Vamos te explicar o que funciona de verdade.",
    sections: [
      { heading: "Os golpes mais comuns", content: "Geradores de créditos, extensões de navegador, bots no Telegram — todos fake. Eles pedem seu login para roubar sua conta ou instalam malware no seu computador. Nunca compartilhe suas credenciais." },
      { heading: "O que realmente funciona", content: "O Lovable oferece um tier gratuito limitado para novos usuários. Além disso, a LovaBoost oferece créditos com até 60% de desconto — a forma mais acessível de usar o Lovable sem gastar uma fortuna." },
      { heading: "Economize de verdade", content: "Em vez de arriscar sua conta com golpes, compre créditos por uma fração do preço oficial. Pagamento via PIX, entrega instantânea, e suporte humano via WhatsApp." },
    ],
    faq: [
      { question: "Existe gerador de créditos Lovable?", answer: "Não. Todos os geradores são golpes que roubam sua conta ou instalam malware." },
      { question: "Como conseguir créditos Lovable baratos?", answer: "A LovaBoost oferece créditos com até 60% de desconto via PIX. Entrega segura em minutos." },
      { question: "O Lovable dá créditos grátis?", answer: "O Lovable tem um tier gratuito limitado para novos usuários. Para uso contínuo, você precisa comprar créditos." },
    ],
    relatedSlugs: ["creditos/comprar/lovable-barato", "lovable/alternativa/barata"],
    jsonLdType: "Article",
    baitHook: "🚨 Créditos Grátis? Cuidado com Golpes!",
    truthReveal: "A verdade é simples: créditos grátis ilimitados não existem. Mas você pode pagar até 60% menos que o preço oficial.",
  },

  // 3. Comparison — Lovable vs Cursor
  {
    slug: "lovable/vs/cursor",
    template: "comparison",
    intent: "comparacao",
    category: "comparacao",
    title: "Lovable vs Cursor: Qual é Melhor para Criar Apps com IA? [2025]",
    h1: "Lovable vs Cursor: Comparação Completa 2025",
    metaDescription: "Comparação detalhada entre Lovable e Cursor. Descubra qual ferramenta de IA é melhor para criar apps e como economizar créditos.",
    keywords: ["lovable vs cursor", "cursor ou lovable", "lovable ou cursor qual melhor", "comparação lovable cursor"],
    intro: "Lovable e Cursor são duas das ferramentas mais populares para criar software com IA, mas servem propósitos diferentes. Vamos comparar de forma honesta para você escolher a melhor opção.",
    sections: [
      { heading: "Para que serve cada ferramenta?", content: "O Lovable é uma plataforma visual que gera aplicações web completas a partir de prompts. O Cursor é um editor de código com IA integrada (fork do VS Code). O Lovable é ideal para quem quer um app funcionando rápido; o Cursor é para devs que querem acelerar a escrita de código." },
      { heading: "Quando escolher o Lovable?", content: "Escolha o Lovable quando: precisa de um MVP rápido, não quer configurar ambiente de dev, quer deploy automático, ou é designer/PM sem experiência em código." },
      { heading: "Quando escolher o Cursor?", content: "Escolha o Cursor quando: já tem um projeto existente, precisa de controle total sobre o código, trabalha com múltiplas linguagens, ou prefere um fluxo de trabalho tradicional com boost de IA." },
    ],
    faq: [
      { question: "Lovable ou Cursor: qual é mais barato?", answer: "Depende do uso. O Lovable cobra por créditos (mensagens); o Cursor tem assinatura mensal. Com a LovaBoost, créditos Lovable saem até 60% mais baratos." },
      { question: "Posso usar os dois juntos?", answer: "Sim! Muitos devs usam o Lovable para prototipar e o Cursor para refinar o código exportado." },
      { question: "Qual gera código melhor?", answer: "O Lovable gera apps completos (frontend + backend). O Cursor é melhor para editar código existente com precisão." },
    ],
    relatedSlugs: ["lovable/vs/replit", "lovable/vs/v0", "lovable/alternativa/barata"],
    jsonLdType: "Article",
    competitorName: "Cursor",
    comparisonRows: [
      { feature: "Gera app completo", lovaboost: true, competitor: false },
      { feature: "Deploy automático", lovaboost: true, competitor: false },
      { feature: "Sem setup necessário", lovaboost: true, competitor: false },
      { feature: "Edição de código existente", lovaboost: false, competitor: true },
      { feature: "Multi-linguagem", lovaboost: false, competitor: true },
      { feature: "Ideal para MVPs", lovaboost: true, competitor: false },
      { feature: "Créditos baratos (LovaBoost)", lovaboost: "Até 60% OFF", competitor: "N/A" },
    ],
  },

  // 4. Comparison — Lovable vs Replit
  {
    slug: "lovable/vs/replit",
    template: "comparison",
    intent: "comparacao",
    category: "comparacao",
    title: "Lovable vs Replit: Qual Plataforma de IA Escolher? [2025]",
    h1: "Lovable vs Replit: Comparação Definitiva",
    metaDescription: "Lovable vs Replit: qual plataforma de IA é melhor para criar apps? Veja comparação de preços, recursos e performance.",
    keywords: ["lovable vs replit", "replit ou lovable", "lovable replit comparação"],
    intro: "Replit e Lovable permitem criar software com IA, mas de formas bem diferentes. Enquanto o Replit é um IDE online com agente de IA, o Lovable é uma plataforma visual focada em gerar apps completos a partir de prompts.",
    sections: [
      { heading: "Abordagens diferentes", content: "O Replit Agent é um assistente de código dentro de um IDE completo. O Lovable gera a aplicação inteira visualmente. Para não-devs, o Lovable é mais acessível. Para devs, o Replit oferece mais controle." },
      { heading: "Preços comparados", content: "O Replit cobra assinatura mensal + computação. O Lovable cobra por créditos (mensagens). Com a LovaBoost, os créditos do Lovable saem até 60% mais baratos que o preço oficial." },
      { heading: "Veredicto", content: "Use o Lovable para prototipar rápido e criar MVPs visuais. Use o Replit para projetos que precisam de backend complexo e ambiente de desenvolvimento completo." },
    ],
    faq: [
      { question: "Qual é mais fácil de usar?", answer: "O Lovable é mais fácil — basta descrever o que quer e ele gera o app. O Replit exige mais conhecimento técnico." },
      { question: "Qual tem melhor custo-benefício?", answer: "Com créditos da LovaBoost (até 60% OFF), o Lovable tem excelente custo-benefício para criação de MVPs." },
    ],
    relatedSlugs: ["lovable/vs/cursor", "lovable/vs/v0", "creditos/comprar/lovable-barato"],
    jsonLdType: "Article",
    competitorName: "Replit",
    comparisonRows: [
      { feature: "Gera app do zero", lovaboost: true, competitor: true },
      { feature: "Interface visual (sem código)", lovaboost: true, competitor: false },
      { feature: "Deploy com 1 clique", lovaboost: true, competitor: true },
      { feature: "IDE completo", lovaboost: false, competitor: true },
      { feature: "Backend complexo", lovaboost: "Supabase", competitor: true },
      { feature: "Créditos baratos (LovaBoost)", lovaboost: "Até 60% OFF", competitor: "N/A" },
    ],
  },

  // 5. Comparison — Lovable vs v0
  {
    slug: "lovable/vs/v0",
    template: "comparison",
    intent: "comparacao",
    category: "comparacao",
    title: "Lovable vs v0 (Vercel): Qual Gera Melhores Interfaces? [2025]",
    h1: "Lovable vs v0: Qual Ferramenta de IA é Melhor?",
    metaDescription: "Comparação Lovable vs v0 da Vercel. Descubra qual gera interfaces melhores e como economizar créditos com a LovaBoost.",
    keywords: ["lovable vs v0", "v0 vercel ou lovable", "lovable v0 comparação", "v0 vs lovable"],
    intro: "O v0 da Vercel e o Lovable são duas ferramentas que geram interfaces com IA, mas com escopos muito diferentes. O v0 gera componentes React individuais; o Lovable gera aplicações completas com backend.",
    sections: [
      { heading: "Escopo de cada ferramenta", content: "O v0 gera componentes UI isolados (botões, cards, layouts). O Lovable gera apps inteiros com rotas, banco de dados, autenticação e deploy. São ferramentas complementares." },
      { heading: "Qualidade do código", content: "O v0 gera código shadcn/ui limpo e reutilizável. O Lovable gera projetos React completos com estrutura profissional. Ambos produzem código de qualidade." },
      { heading: "Preço e acesso", content: "O v0 tem um tier gratuito generoso para componentes simples. O Lovable cobra por créditos — e com a LovaBoost, esses créditos saem até 60% mais baratos." },
    ],
    faq: [
      { question: "Posso usar v0 e Lovable juntos?", answer: "Sim! Use o v0 para gerar componentes e cole no Lovable para montar o app completo." },
      { question: "Qual é mais completo?", answer: "O Lovable é mais completo — gera frontend, backend, banco de dados e deploy. O v0 foca apenas em UI." },
    ],
    relatedSlugs: ["lovable/vs/cursor", "lovable/vs/replit", "creditos/comprar/lovable-barato"],
    jsonLdType: "Article",
    competitorName: "v0 (Vercel)",
    comparisonRows: [
      { feature: "App completo (full-stack)", lovaboost: true, competitor: false },
      { feature: "Componentes UI isolados", lovaboost: true, competitor: true },
      { feature: "Backend integrado", lovaboost: true, competitor: false },
      { feature: "Deploy automático", lovaboost: true, competitor: false },
      { feature: "Código shadcn/ui", lovaboost: true, competitor: true },
      { feature: "Créditos baratos (LovaBoost)", lovaboost: "Até 60% OFF", competitor: "N/A" },
    ],
  },

  // 6. Bait — Alternativa barata
  {
    slug: "lovable/alternativa/barata",
    template: "bait",
    intent: "bait",
    category: "comparacao",
    title: "Alternativa Lovable Barata: Use o Lovable por 60% Menos",
    h1: "Lovable Caro Demais? Veja Como Pagar 60% Menos",
    metaDescription: "Lovable está caro? Descubra como usar o Lovable com até 60% de desconto nos créditos. Mesma plataforma, preço muito menor.",
    keywords: ["alternativa lovable barata", "lovable caro", "lovable barato", "desconto lovable"],
    intro: "Você ama o Lovable mas acha o preço dos créditos salgado? Não precisa trocar de ferramenta. A LovaBoost te dá acesso aos mesmos créditos por uma fração do preço.",
    sections: [
      { heading: "Não é uma alternativa — é o mesmo Lovable, mais barato", content: "A LovaBoost não é uma plataforma alternativa. Vendemos créditos oficiais Lovable com desconto de até 60%. Você continua usando o Lovable normalmente, apenas paga menos." },
      { heading: "Por que procurar alternativas?", content: "A maioria das pessoas busca alternativas por causa do preço. Se o problema é custo, a solução não é trocar de ferramenta (e perder produtividade) — é pagar menos pela mesma ferramenta." },
      { heading: "Compare os preços", content: "No site oficial, 1000 créditos custam em média R$ 250. Na LovaBoost, o mesmo pacote sai por R$ 99. Economia real de mais de 60%." },
    ],
    faq: [
      { question: "A LovaBoost é uma alternativa ao Lovable?", answer: "Não. A LovaBoost vende créditos Lovable com desconto. Você continua usando o Lovable normalmente." },
      { question: "É seguro?", answer: "Sim. Mais de 500 transações realizadas, suporte via WhatsApp, pagamento via PIX." },
    ],
    relatedSlugs: ["creditos/comprar/lovable-barato", "lovable/vs/cursor", "creditos/gratis/lovable-2025"],
    jsonLdType: "Article",
    baitHook: "💡 Não troque de ferramenta — pague menos!",
    truthReveal: "A LovaBoost vende créditos oficiais Lovable com até 60% de desconto. Mesma plataforma, preço muito menor.",
  },

  // 7. Bait — Lovable não funciona
  {
    slug: "lovable/nao-funciona",
    template: "bait",
    intent: "bait",
    category: "comparacao",
    title: "Lovable Não Funciona? Veja Como Resolver os Problemas Mais Comuns",
    h1: "Lovable Não Funciona? Calma, Tem Solução",
    metaDescription: "Lovable travando, sem créditos ou com erro? Veja as soluções para os problemas mais comuns e como economizar créditos.",
    keywords: ["lovable não funciona", "problemas com lovable", "lovable travando", "erro lovable"],
    intro: "Se o Lovable está dando erro, travando ou seus créditos acabaram, você não está sozinho. Vamos resolver os problemas mais comuns e te mostrar como aproveitar melhor a plataforma.",
    sections: [
      { heading: "Problemas mais comuns e soluções", content: "1. Créditos acabaram rápido: use prompts mais específicos para gastar menos mensagens. 2. App não carrega: limpe o cache do navegador e tente novamente. 3. Erro no deploy: verifique se há erros de TypeScript no código gerado. 4. Resultado diferente do esperado: refine o prompt com mais detalhes." },
      { heading: "O maior problema: créditos caros", content: "O problema mais reportado não é técnico — é o preço dos créditos. Se você gasta créditos rápido, cada erro de prompt custa caro. A solução? Comprar créditos com desconto na LovaBoost." },
      { heading: "Dicas para gastar menos créditos", content: "Use prompts detalhados e específicos. Descreva exatamente o que quer. Mencione tecnologias (shadcn, Tailwind). Faça iterações menores em vez de pedir tudo de uma vez." },
    ],
    faq: [
      { question: "O Lovable está fora do ar?", answer: "Verifique o status em status.lovable.dev. Se estiver funcionando, limpe seu cache e tente novamente." },
      { question: "Meus créditos acabaram, e agora?", answer: "Recarregue com até 60% de desconto na LovaBoost. Pagamento via PIX, entrega em minutos." },
      { question: "O Lovable é confiável?", answer: "Sim! O Lovable é uma das melhores ferramentas de IA para criar apps. Os problemas geralmente são de uso, não da plataforma." },
    ],
    relatedSlugs: ["creditos/comprar/lovable-barato", "lovable/alternativa/barata", "vibe-coding/como-comecar"],
    jsonLdType: "Article",
    baitHook: "🔧 Seu Lovable deu problema? Vamos resolver!",
    truthReveal: "A maioria dos problemas é fácil de resolver. E o maior problema (preço dos créditos) tem solução: LovaBoost com até 60% OFF.",
  },

  // 8. Guide — Criar app sem código
  {
    slug: "criar-app/sem-codigo",
    template: "guide",
    intent: "educacional",
    category: "educacional",
    title: "Como Criar um App Sem Saber Programar em 2025 | Guia Completo",
    h1: "Como Criar um App Sem Código em 2025",
    metaDescription: "Aprenda a criar um app sem saber programar usando IA. Guia passo a passo com Lovable para criar apps profissionais do zero.",
    keywords: ["criar app sem código", "criar app sem programar", "app sem saber programar", "criar aplicativo com ia"],
    intro: "Em 2025, você não precisa saber programar para criar um app profissional. Com ferramentas como o Lovable, basta descrever o que quer e a IA cria o app completo — frontend, backend e banco de dados.",
    sections: [
      { heading: "Passo 1: Defina sua ideia", content: "Antes de abrir qualquer ferramenta, escreva claramente: O que o app faz? Quem vai usar? Quais são as funcionalidades principais? Quanto mais claro, melhor o resultado." },
      { heading: "Passo 2: Use o Lovable para criar", content: "Acesse lovable.dev, crie uma conta e descreva seu app em um prompt detalhado. O Lovable vai gerar todo o código automaticamente. Exemplo: 'Crie um app de gestão de tarefas com login, dashboard e filtros por prioridade.'" },
      { heading: "Passo 3: Itere e refine", content: "O primeiro resultado raramente é perfeito. Use mensagens adicionais para ajustar layout, corrigir bugs e adicionar funcionalidades. Cada iteração gasta créditos." },
      { heading: "Passo 4: Economize créditos", content: "Cada mensagem no Lovable gasta créditos. Para economizar, compre créditos com desconto na LovaBoost (até 60% OFF) e use prompts detalhados para reduzir iterações." },
      { heading: "Passo 5: Publique", content: "O Lovable oferece deploy com 1 clique. Seu app fica online em segundos com HTTPS e domínio próprio." },
    ],
    faq: [
      { question: "Preciso saber programar para usar o Lovable?", answer: "Não! O Lovable gera todo o código automaticamente. Basta descrever o que quer." },
      { question: "Quanto custa criar um app?", answer: "Depende da complexidade. Um MVP simples pode custar de R$ 30 a R$ 100 em créditos na LovaBoost." },
      { question: "O app criado é profissional?", answer: "Sim. O Lovable gera código React profissional com Tailwind CSS, TypeScript e Supabase." },
    ],
    relatedSlugs: ["vibe-coding/como-comecar", "creditos/comprar/lovable-barato"],
    jsonLdType: "Article",
  },

  // 9. Guide — Vibe Coding como começar
  {
    slug: "vibe-coding/como-comecar",
    template: "guide",
    intent: "educacional",
    category: "educacional",
    title: "Vibe Coding: Como Começar a Programar com IA em 2025",
    h1: "Vibe Coding: O Guia Definitivo para Iniciantes",
    metaDescription: "Aprenda o que é Vibe Coding e como começar a programar com IA. Guia prático com dicas, ferramentas e como economizar créditos.",
    keywords: ["vibe coding", "como começar vibe coding", "vibe coding iniciante", "programar com ia"],
    intro: "Vibe Coding é o futuro da programação: você descreve o que quer construir e a IA escreve o código. Não precisa ser desenvolvedor. Neste guia, explicamos como começar do zero.",
    sections: [
      { heading: "O que é Vibe Coding?", content: "Vibe Coding é um termo cunhado por Andrej Karpathy (co-fundador da OpenAI) para descrever a programação por vibes — você se entrega ao fluxo, descreve o que quer, e a IA escreve o código. O foco é na intenção, não na sintaxe." },
      { heading: "Ferramentas essenciais", content: "As principais ferramentas para Vibe Coding em 2025: Lovable (apps completos), Cursor (editor com IA), v0 (componentes UI), e Replit Agent (IDE + IA). O Lovable é o mais acessível para iniciantes." },
      { heading: "Dicas para prompts eficientes", content: "1. Seja específico: descreva exatamente o que quer. 2. Mencione tecnologias: 'use shadcn e Tailwind'. 3. Dê contexto: 'é um app para gerenciar pedidos de uma pizzaria'. 4. Itere: peça ajustes em vez de refazer tudo." },
      { heading: "Economize no processo", content: "Cada prompt gasta créditos. Compre créditos Lovable com até 60% de desconto na LovaBoost e maximize seu investimento." },
    ],
    faq: [
      { question: "Preciso saber programar para fazer Vibe Coding?", answer: "Não obrigatoriamente, mas ajuda entender conceitos básicos para refinar os resultados." },
      { question: "Qual a melhor ferramenta para Vibe Coding?", answer: "Para iniciantes, o Lovable é a melhor opção. Para devs, Cursor + Lovable é a combinação ideal." },
      { question: "Vibe Coding é o futuro?", answer: "Sim. Em 2025, mais de 60% dos novos projetos usam alguma forma de assistência de IA na programação." },
    ],
    relatedSlugs: ["criar-app/sem-codigo", "lovable/vs/cursor", "creditos/comprar/lovable-barato"],
    jsonLdType: "Article",
  },

  // 10. Product — Revenda
  {
    slug: "creditos/revenda/como-ganhar",
    template: "product",
    intent: "b2b",
    category: "b2b",
    title: "Revender Créditos Lovable: Ganhe Dinheiro com Margem de Até 40%",
    h1: "Ganhe Dinheiro Revendendo Créditos Lovable",
    metaDescription: "Torne-se revendedor de créditos Lovable e ganhe até 40% de margem. Painel exclusivo, suporte VIP e demanda crescente.",
    keywords: ["revender créditos lovable", "ganhar dinheiro com lovable", "revenda créditos lovable", "margem revenda lovable"],
    intro: "O mercado de ferramentas de IA está explodindo e a demanda por créditos Lovable cresce todo mês. Torne-se um revendedor LovaBoost e ganhe até 40% de margem em cada venda.",
    sections: [
      { heading: "Como funciona a revenda?", content: "1. Cadastre-se como revendedor no nosso painel. 2. Compre créditos a preço de custo (com desconto de até 60%). 3. Revenda para seus clientes pelo preço que quiser. 4. A diferença é seu lucro." },
      { heading: "Quanto posso ganhar?", content: "Revendedores ativos ganham entre R$ 1.000 e R$ 5.000/mês. Quanto mais você vende, maior seu desconto de compra e maior sua margem." },
      { heading: "Suporte VIP para revendedores", content: "Revendedores têm acesso ao Grupo VIP no WhatsApp com suporte prioritário, dicas de venda e novidades antecipadas." },
    ],
    faq: [
      { question: "Preciso investir muito para começar?", answer: "Não. Você pode começar com R$ 100 e ir escalando conforme as vendas." },
      { question: "Tenho painel de controle?", answer: "Sim! Revendedores têm acesso a um painel exclusivo para gerenciar vendas e acompanhar lucros." },
      { question: "Qual a margem de lucro?", answer: "De 20% a 40%, dependendo do volume de compra e do preço de revenda." },
    ],
    relatedSlugs: ["creditos/comprar/lovable-barato", "creditos/gratis/lovable-2025"],
    jsonLdType: "Product",
    highlightDiscount: "Margem de até 40%",
    benefits: ["Painel exclusivo de revendedor", "Suporte VIP via WhatsApp", "Desconto progressivo por volume", "Demanda crescente", "Sem estoque — entrega digital"],
  },
];

export function getSeoPageBySlug(slug: string): SeoPageData | undefined {
  return seoPages.find((p) => p.slug === slug);
}

export function getRelatedPages(currentSlug: string, limit = 4): SeoPageData[] {
  const current = getSeoPageBySlug(currentSlug);
  if (!current) return [];
  const related = current.relatedSlugs
    .map((s) => getSeoPageBySlug(s))
    .filter(Boolean) as SeoPageData[];
  if (related.length >= limit) return related.slice(0, limit);
  // Fill with same category
  const extras = seoPages
    .filter((p) => p.category === current.category && p.slug !== currentSlug && !current.relatedSlugs.includes(p.slug))
    .slice(0, limit - related.length);
  return [...related, ...extras].slice(0, limit);
}
