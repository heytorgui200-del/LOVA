const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!

// --- Utility functions ---

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
  return dp[m][n]
}

function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return 1
  return 1 - levenshtein(a.toLowerCase(), b.toLowerCase()) / maxLen
}

function detectIntent(keyword: string): string {
  const kw = keyword.toLowerCase()
  if (/comprar|buy|adquirir|preço|barato|desconto|cupom|oferta|recarregar/.test(kw)) return 'transactional'
  if (/vs|versus|comparar|melhor|diferença|alternativa/.test(kw)) return 'comparison'
  if (/como|o que|tutorial|guia|aprender|funciona/.test(kw)) return 'educational'
  return 'transactional'
}

// --- Safety Engine ---

interface SafetyReport {
  action: string
  reason: string
  is_safe_to_publish: boolean
  risk_level: 'low' | 'medium' | 'high'
  content_strategy: string
  cluster_action: string
  notes: string[]
  qualification: {
    has_real_intent: boolean
    is_differentiated: boolean
    has_cluster: boolean
    no_cannibalization: boolean
    under_daily_limit: boolean
    cluster_not_saturated: boolean
  }
  daily_count: number
  daily_limit: number
}

function calculateRiskLevel(
  cannibalizationRisk: boolean,
  clusterPageCount: number,
  dailyCount: number,
  hasCluster: boolean,
  intentOverlapCount: number
): 'low' | 'medium' | 'high' {
  let riskPoints = 0
  if (cannibalizationRisk) riskPoints += 3
  if (clusterPageCount > 8) riskPoints += 2
  else if (clusterPageCount > 5) riskPoints += 1
  if (dailyCount >= 2) riskPoints += 2
  if (!hasCluster) riskPoints += 1
  if (intentOverlapCount > 1) riskPoints += 2

  if (riskPoints >= 4) return 'high'
  if (riskPoints >= 2) return 'medium'
  return 'low'
}

function buildSafetyReport(params: {
  intent: string
  cannibalizationRisk: boolean
  similarPages: { slug: string; keyword: string }[]
  hasCluster: boolean
  clusterName: string | null
  clusterPageCount: number
  dailyCount: number
  intentOverlapCount: number
}): SafetyReport {
  const { intent, cannibalizationRisk, similarPages, hasCluster, clusterName, clusterPageCount, dailyCount, intentOverlapCount } = params
  const DAILY_LIMIT = 3

  const riskLevel = calculateRiskLevel(cannibalizationRisk, clusterPageCount, dailyCount, hasCluster, intentOverlapCount)

  const qualification = {
    has_real_intent: intent !== 'unknown',
    is_differentiated: !cannibalizationRisk && intentOverlapCount <= 1,
    has_cluster: hasCluster,
    no_cannibalization: !cannibalizationRisk,
    under_daily_limit: dailyCount < DAILY_LIMIT,
    cluster_not_saturated: clusterPageCount <= 8,
  }

  const isSafe = riskLevel === 'low' && hasCluster && !cannibalizationRisk && dailyCount < DAILY_LIMIT

  const notes: string[] = []
  if (cannibalizationRisk) notes.push(`Páginas similares encontradas: ${similarPages.map(p => p.slug).join(', ')}`)
  if (!hasCluster) notes.push('Nenhum cluster correspondente encontrado')
  if (clusterPageCount > 8) notes.push(`Cluster saturado com ${clusterPageCount} páginas`)
  if (dailyCount >= DAILY_LIMIT) notes.push(`Limite diário atingido (${dailyCount}/${DAILY_LIMIT})`)
  if (intentOverlapCount > 1) notes.push(`${intentOverlapCount} páginas com mesma intenção no cluster`)

  let action: string
  let reason: string
  let contentStrategy: string
  let clusterAction: string

  if (dailyCount >= DAILY_LIMIT) {
    action = 'Aguardar'
    reason = 'Limite diário de criação atingido para crescimento natural'
    contentStrategy = 'Aguarde amanhã para continuar'
    clusterAction = 'Nenhuma'
  } else if (cannibalizationRisk) {
    action = 'Melhorar página existente'
    reason = 'Existe conteúdo similar que pode ser canibalizado'
    contentStrategy = 'Otimizar página existente ao invés de criar nova'
    clusterAction = 'Revisar páginas similares'
  } else if (!hasCluster) {
    action = 'Criar como rascunho'
    reason = 'Sem cluster definido — página precisa de organização'
    contentStrategy = 'Criar cluster antes de publicar'
    clusterAction = 'Criar novo cluster ou atribuir a existente'
  } else if (riskLevel === 'high') {
    action = 'Criar como rascunho'
    reason = 'Risco alto — revisar antes de publicar'
    contentStrategy = 'Verificar diferenciação do conteúdo'
    clusterAction = clusterPageCount > 8 ? 'Cluster saturado — considerar novo cluster' : 'Revisar cobertura'
  } else if (riskLevel === 'medium') {
    action = 'Criar como rascunho'
    reason = 'Risco médio — recomenda-se revisão'
    contentStrategy = 'Garantir ângulo único antes de publicar'
    clusterAction = 'Verificar posição no cluster'
  } else {
    action = 'Criar e publicar'
    reason = 'Keyword qualificada e segura para publicação'
    contentStrategy = 'Criar com foco em diferenciação'
    clusterAction = clusterName ? `Adicionar ao cluster "${clusterName}"` : 'Atribuir cluster'
  }

  return {
    action,
    reason,
    is_safe_to_publish: isSafe,
    risk_level: riskLevel,
    content_strategy: contentStrategy,
    cluster_action: clusterAction,
    notes,
    qualification,
    daily_count: dailyCount,
    daily_limit: DAILY_LIMIT,
  }
}

// --- Main handler ---

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const supabaseUser = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    })
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: isAdmin } = await supabaseAdmin.rpc('has_role', { _user_id: user.id, _role: 'admin' })
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Input validation
    const body = await req.json()
    const { keyword, analyze_only } = body
    if (!keyword || typeof keyword !== 'string' || keyword.trim().length < 2 || keyword.trim().length > 200) {
      return new Response(JSON.stringify({ error: 'Keyword inválida (2-200 caracteres)' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const trimmedKeyword = keyword.trim()
    const intent = detectIntent(trimmedKeyword)

    // Fetch existing data
    const [pagesRes, clustersRes] = await Promise.all([
      supabaseAdmin.from('seo_pages').select('id, slug, keyword, cluster_id, title, intent_type, created_at, status'),
      supabaseAdmin.from('seo_clusters').select('id, name, slug, keyword'),
    ])
    const allPages = pagesRes.data || []
    const clusters = clustersRes.data || []

    // Anti-duplication
    const similarPages = allPages.filter(p => {
      const kwSim = similarity(p.keyword, trimmedKeyword)
      const slugSim = similarity(p.slug, trimmedKeyword.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
      return kwSim > 0.6 || slugSim > 0.6
    }).map(p => ({ slug: p.slug, keyword: p.keyword }))

    const cannibalizationRisk = similarPages.length > 0

    // Match cluster
    let clusterSuggestion: string | null = null
    let matchedClusterId: string | null = null
    const kwWords = trimmedKeyword.toLowerCase().split(/\s+/)

    for (const c of clusters) {
      const cWords = [...c.name.toLowerCase().split(/\s+/), ...(c.keyword || '').toLowerCase().split(/\s+/)].filter(Boolean)
      const overlap = kwWords.filter(w => w.length > 3 && cWords.some((cw: string) => w.includes(cw) || cw.includes(w))).length
      if (overlap >= 1) {
        clusterSuggestion = c.name
        matchedClusterId = c.id
        break
      }
    }

    const clusterPageCount = matchedClusterId ? allPages.filter(p => p.cluster_id === matchedClusterId).length : 0

    // Intent overlap: count pages in same cluster with same intent
    const intentOverlapCount = matchedClusterId
      ? allPages.filter(p => p.cluster_id === matchedClusterId && p.intent_type === intent).length
      : 0

    // Daily rate limit
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dailyCount = allPages.filter(p => new Date(p.created_at) >= today).length

    // Build safety report
    const safetyReport = buildSafetyReport({
      intent,
      cannibalizationRisk,
      similarPages,
      hasCluster: !!matchedClusterId,
      clusterName: clusterSuggestion,
      clusterPageCount,
      dailyCount,
      intentOverlapCount,
    })

    // Opportunity score
    let opportunityScore = 50
    if (intent === 'transactional') opportunityScore += 20
    else if (intent === 'comparison') opportunityScore += 15
    else if (intent === 'educational') opportunityScore += 5
    if (clusterPageCount === 0) opportunityScore += 15
    else if (clusterPageCount < 5) opportunityScore += 10
    if (cannibalizationRisk) opportunityScore -= 25
    opportunityScore = Math.max(0, Math.min(100, opportunityScore))

    const suggestedAction = cannibalizationRisk
      ? 'Melhorar página existente'
      : opportunityScore >= 60
        ? 'Criar nova página'
        : 'Avaliar antes de criar'

    // --- ANALYZE ONLY ---
    if (analyze_only) {
      return new Response(JSON.stringify({
        analysis: {
          opportunity_score: opportunityScore,
          intent_type: intent,
          cluster_suggestion: clusterSuggestion,
          cannibalization_risk: cannibalizationRisk,
          similar_pages: similarPages.slice(0, 5),
          suggested_action: suggestedAction,
        },
        safety_report: safetyReport,
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // --- SAFETY GATES for generation ---

    // Gate 1: Daily limit
    if (dailyCount >= 3) {
      return new Response(JSON.stringify({
        error: 'Limite diário atingido (3/3). Aguarde amanhã para crescimento natural.',
        safety_report: safetyReport,
      }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Determine publish status based on safety
    const shouldPublish = safetyReport.is_safe_to_publish
    const finalStatus = shouldPublish ? 'published' : 'draft'

    // Build context for prompt
    const clusterName = clusterSuggestion || 'geral'
    const relatedPages = matchedClusterId
      ? allPages.filter(p => p.cluster_id === matchedClusterId).slice(0, 8).map(p => ({ slug: `/s/${p.slug}`, keyword: p.keyword }))
      : []
    const hubSlug = matchedClusterId
      ? clusters.find(c => c.id === matchedClusterId)?.slug || ''
      : ''

    const relatedPagesStr = relatedPages.length > 0
      ? relatedPages.map(p => `- ${p.keyword} (${p.slug})`).join('\n')
      : '- Nenhuma página relacionada ainda'

    // Determine target audience based on intent and keyword
    let targetAudience = 'desenvolvedores brasileiros que usam Lovable'
    let audienceLevel = 'intermediário'
    const kwLower = trimmedKeyword.toLowerCase()
    if (/revend|atacado|distribui/.test(kwLower)) { targetAudience = 'revendedores de créditos'; audienceLevel = 'avançado' }
    else if (/inici|começ|primeiro|básic/.test(kwLower)) { targetAudience = 'iniciantes que nunca usaram Lovable'; audienceLevel = 'iniciante' }
    else if (/urgente|rápid|agora|hoje/.test(kwLower)) { targetAudience = 'usuários com urgência que precisam de créditos imediatamente'; audienceLevel = 'urgente' }
    else if (/empres|equip|team|agência/.test(kwLower)) { targetAudience = 'empresas e agências de desenvolvimento'; audienceLevel = 'avançado' }

    // Determine tone based on intent + audience
    let tone = 'direto'
    if (intent === 'educational') tone = 'explicativo'
    else if (intent === 'comparison') tone = 'analítico'
    else if (audienceLevel === 'urgente') tone = 'persuasivo'
    else if (audienceLevel === 'avançado') tone = 'técnico'

    // Format rotation — detect recently used formats and pick a different one
    const FORMAT_TYPES = ['landing-page', 'guia-passo-a-passo', 'comparacao', 'pergunta-resposta', 'analise-critica', 'checklist', 'erro-comum']
    const recentPagesData = allPages
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map(p => {
        try {
          const cj = typeof p.content_json === 'string' ? JSON.parse(p.content_json) : p.content_json
          return {
            format_type: (cj as any)?.format_type || '',
            intro: ((cj as any)?.intro || '').slice(0, 80),
            cta_label: (cj as any)?.cta?.label || '',
            h1: p.h1 || '',
          }
        } catch { return { format_type: '', intro: '', cta_label: '', h1: '' } }
      })

    const recentFormats = recentPagesData.map(p => p.format_type).filter(Boolean)
    const recentIntros = recentPagesData.map(p => p.intro).filter(Boolean)
    const recentCtas = recentPagesData.map(p => p.cta_label).filter(Boolean)
    const recentH1s = recentPagesData.map(p => p.h1).filter(Boolean)

    const availableFormats = FORMAT_TYPES.filter(f => !recentFormats.includes(f))
    const suggestedFormat = availableFormats.length > 0
      ? availableFormats[Math.floor(Math.random() * availableFormats.length)]
      : FORMAT_TYPES[Math.floor(Math.random() * FORMAT_TYPES.length)]

    const antiRepetitionBlock = `
ANTI-REPETIÇÃO (NÃO copiar nenhum desses elementos das últimas páginas):
- Formatos já usados: ${recentFormats.join(', ') || 'nenhum'}
- Aberturas já usadas: ${recentIntros.map(i => `"${i}..."`).join(' | ') || 'nenhuma'}
- CTAs já usados: ${recentCtas.map(c => `"${c}"`).join(' | ') || 'nenhum'}
- H1s já usados: ${recentH1s.map(h => `"${h}"`).join(' | ') || 'nenhum'}
Crie algo COMPLETAMENTE diferente em abertura, estrutura, CTA e H1.`

    const prompt = `Você é um redator SEO que NUNCA repete estrutura ou estilo. Cada página é ÚNICA em formato, tom e abordagem.

SITE: LovaBoost — créditos Lovable com até 60% OFF, PIX, entrega em minutos.

IDENTIDADE DESTA PÁGINA:
- keyword: "${trimmedKeyword}"
- cluster: "${clusterName}"
- público: "${audienceLevel}" (${targetAudience})
- intenção: "${intent}"
- tom: "${tone}"
- formato escolhido: "${suggestedFormat}"
- hub_page: "${hubSlug ? `/s/${hubSlug}` : ''}"
- páginas relacionadas:
${relatedPagesStr}
${antiRepetitionBlock}

FORMATO "${suggestedFormat}" — SIGA A ESTRUTURA CORRESPONDENTE:
- landing-page: promessa → benefício → prova → CTA
- guia-passo-a-passo: contexto → passos numerados → resultado → CTA
- comparacao: cenário do problema → comparação real → vantagem prática → conclusão + CTA
- pergunta-resposta: dúvida principal → resposta direta → aprofundamento → CTA
- analise-critica: situação atual → análise honesta → recomendação → CTA
- checklist: intro → itens práticos → resumo → CTA
- erro-comum: erro que as pessoas cometem → consequência → solução correta → CTA

BLOQUEIO ANTI-GENÉRICO (PROIBIDO):
- "hoje em dia", "é importante", "vamos entender", "neste artigo", "sem dúvida"
- parágrafos longos sem informação concreta
- frases vazias de preenchimento
- repetição mecânica da keyword
- urgência fake ("últimas vagas", "só hoje", "oferta imperdível", "não perca")
- promessas exageradas ("melhor do mercado", "solução definitiva", "revolucionário")
- parecer golpe ou spam
- exclamações excessivas (!!!)
- superlativos sem prova ("o mais rápido", "o mais barato")

FRAMEWORK DE CONVERSÃO (SEGUIR SEMPRE):
1. PROBLEMA REAL — mostrar a dor concreta do usuário. Ex: "Seus créditos acabaram no meio do deploy. O projeto parou."
2. SOLUÇÃO — explicar como créditos LovaBoost resolvem. Ex: "Compra via PIX, créditos na conta em minutos, sem esperar aprovação."
3. PROVA — número concreto ou cenário realista. Ex: "Até 60% mais barato que comprar direto. 500+ devs já usam."
4. CTA — simples, direto, sem exagero. Ex: "Comprar créditos agora" (não "APROVEITE ESTA OPORTUNIDADE ÚNICA!!!")

ESTILO DE ESCRITA:
- Curto. Claro. Sem enrolação.
- Focado em ação, não em descrição
- Linguagem natural, como conversa real
- Cada frase deve ter informação útil ou ser cortada
- Depoimentos devem soar como pessoa real falando, não como copy de marketing

DIFERENCIAÇÃO OBRIGATÓRIA:
- 1 insight ÚNICO que nenhuma outra página tem
- 1 ângulo DIFERENTE sobre o tema
- 1 explicação ESPECÍFICA com exemplo ou cenário real

LINKS E FAQ:
- FAQ com perguntas que o público realmente faria
- Internal links conectando com páginas do cluster listadas acima
- Se não houver páginas relacionadas, linke para / e /comprar-creditos
- Mencione PIX, desconto, entrega rápida de forma natural (sem forçar)

EXEMPLOS DE TOM:
ERRADO: "Melhor sistema do mercado com os melhores preços!!!"
CERTO: "Se você não tem créditos suficientes, você para. Simples assim."
ERRADO: "Aproveite esta oportunidade incrível e imperdível!"
CERTO: "PIX aprovado, créditos na conta. Sem burocracia."

Retorne SOMENTE JSON válido (sem markdown, sem backticks):

{
  "format_type": "${suggestedFormat}",
  "audience": "${audienceLevel}",
  "tone": "${tone}",
  "title": "Título SEO até 60 chars com keyword",
  "slug": "slug-sem-acentos-lowercase",
  "meta_title": "Meta title até 60 chars",
  "meta_description": "Meta description persuasiva até 155 chars",
  "h1": "H1 com keyword + benefício direto",
  "heroSubheadline": "Frase curta e impactante abaixo do H1",
  "intro": "Introdução 2-3 frases capturando a intenção",
  "problem": "Dor ESPECÍFICA do público em 2-3 frases curtas",
  "desire": "O que esse público quer alcançar em 2-3 frases",
  "solution": "Como créditos LovaBoost resolvem para esse público em 3-4 frases",
  "offer": "Oferta com urgência real (não fake) em 2-3 frases",
  "sections": [
    {"heading": "H2 relevante ao formato", "content": "3-4 frases com informação específica"},
    {"heading": "H2 com value layer", "content": "Dica prática, insight ou caso de uso real"},
    {"heading": "H2 focado em ação", "content": "Conteúdo que leva à conversão"}
  ],
  "benefits": ["Benefício específico 1", "Benefício 2", "Benefício 3", "Benefício 4", "Benefício 5"],
  "comparison": [
    {"feature": "Aspecto", "us": "LovaBoost", "them": "Alternativa"}
  ],
  "testimonials": [
    {"name": "Nome real", "role": "Cargo relevante", "text": "Depoimento curto e natural"}
  ],
  "faq": [
    {"question": "Pergunta real do público", "answer": "Resposta direta 2-3 frases"}
  ],
  "cta": {
    "label": "Texto do botão",
    "message": "Mensagem WhatsApp contextualizada"
  },
  "internal_links": [
    {"label": "Texto do link", "url": "/s/slug"}
  ],
  "keywords": ["keyword principal", "variação 1", "variação 2"],
  "unique_angle": "Descreva em 1 frase o que torna esta página diferente das demais"
}`

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
      }),
    })

    if (!aiResponse.ok) {
      const status = aiResponse.status
      if (status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit excedido. Aguarde e tente novamente.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: 'Créditos de IA esgotados. Adicione fundos no workspace.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      const errText = await aiResponse.text()
      console.error('AI API error:', errText)
      return new Response(JSON.stringify({ error: 'Erro ao gerar conteúdo com IA' }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const aiData = await aiResponse.json()
    const rawContent = aiData.choices?.[0]?.message?.content || ''

    let jsonStr = rawContent
    const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) jsonStr = jsonMatch[1]
    jsonStr = jsonStr.trim()

    let generated: any
    try {
      generated = JSON.parse(jsonStr)
    } catch {
      console.error('Failed to parse AI response:', rawContent)
      return new Response(JSON.stringify({ error: 'IA retornou formato inválido. Tente novamente.' }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const required = ['slug', 'title', 'h1', 'intro', 'sections', 'faq']
    for (const field of required) {
      if (!generated[field]) {
        return new Response(JSON.stringify({ error: `Campo obrigatório ausente: ${field}` }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    const slug = generated.slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    const { data: existing } = await supabaseAdmin
      .from('seo_pages')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (existing) {
      return new Response(JSON.stringify({ error: `Já existe uma página com o slug "${slug}". Use outra keyword.` }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Build internal links
    const internalLinks = generated.internal_links && Array.isArray(generated.internal_links)
      ? generated.internal_links
      : relatedPages.slice(0, 5).map((p: any) => ({ label: p.keyword, url: p.slug }))

    const { data: page, error: insertError } = await supabaseAdmin
      .from('seo_pages')
      .insert({
        slug,
        keyword: trimmedKeyword,
        title: generated.meta_title || generated.title,
        meta_description: generated.meta_description || generated.metaDescription || '',
        h1: generated.h1,
        content_json: {
          format_type: generated.format_type || suggestedFormat,
          audience: generated.audience || audienceLevel,
          tone: generated.tone || tone,
          unique_angle: generated.unique_angle || '',
          intro: generated.intro,
          heroSubheadline: generated.heroSubheadline || '',
          problem: generated.problem || '',
          desire: generated.desire || '',
          solution: generated.solution || '',
          offer: generated.offer || '',
          sections: generated.sections,
          benefits: generated.benefits || [],
          comparison: generated.comparison || [],
          testimonials: generated.testimonials || [],
          faq: generated.faq,
          cta: generated.cta || null,
          keywords: generated.keywords || [],
        },
        is_published: shouldPublish,
        cluster_id: matchedClusterId,
        intent_type: intent,
        opportunity_score: opportunityScore,
        internal_links_json: internalLinks,
        status: finalStatus,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return new Response(JSON.stringify({ error: 'Erro ao salvar página' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Update internal links of other pages in the cluster
    if (matchedClusterId && page) {
      const clusterPages = allPages.filter(p => p.cluster_id === matchedClusterId)
      for (const cp of clusterPages) {
        const { data: cpData } = await supabaseAdmin.from('seo_pages').select('internal_links_json').eq('id', cp.id).single()
        const existingLinks = Array.isArray(cpData?.internal_links_json) ? cpData.internal_links_json : []
        const newLink = { label: trimmedKeyword, url: `/s/${slug}` }
        if (!existingLinks.some((l: any) => l.url === newLink.url || l.slug === slug)) {
          await supabaseAdmin.from('seo_pages').update({
            internal_links_json: [...existingLinks, newLink].slice(0, 8)
          }).eq('id', cp.id)
        }
      }
    }

    return new Response(JSON.stringify({ page, safety_report: safetyReport }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Unhandled error:', err)
    return new Response(JSON.stringify({ error: 'Erro interno' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
