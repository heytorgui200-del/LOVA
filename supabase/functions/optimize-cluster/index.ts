import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
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

    const { cluster_id } = await req.json()
    if (!cluster_id) {
      return new Response(JSON.stringify({ error: 'cluster_id obrigatório' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Fetch cluster + pages
    const [clusterRes, pagesRes, allPagesRes] = await Promise.all([
      supabaseAdmin.from('seo_clusters').select('*').eq('id', cluster_id).single(),
      supabaseAdmin.from('seo_pages').select('id, slug, keyword, title, cluster_id, intent_type, opportunity_score, status, internal_links_json, is_published').eq('cluster_id', cluster_id),
      supabaseAdmin.from('seo_pages').select('id, slug, keyword, cluster_id, internal_links_json'),
    ])

    if (clusterRes.error || !clusterRes.data) {
      return new Response(JSON.stringify({ error: 'Cluster não encontrado' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const cluster = clusterRes.data
    const clusterPages = pagesRes.data || []
    const allPages = allPagesRes.data || []
    const hubPage = clusterPages.find((p: any) => p.id === cluster.hub_page_id)

    // Build context for AI
    const supportingPages = clusterPages.map((p: any) => ({
      slug: p.slug,
      keyword: p.keyword,
      intent: p.intent_type,
      score: p.opportunity_score,
      is_hub: p.id === cluster.hub_page_id,
      is_published: p.is_published,
      internal_links: Array.isArray(p.internal_links_json) ? p.internal_links_json.length : 0,
    }))

    const orphanPages = allPages.filter((p: any) => !p.cluster_id).map((p: any) => ({
      slug: p.slug, keyword: p.keyword,
    }))

    const prompt = `Você é um consultor SEO especializado em clusters de conteúdo para o LovaBoost, um site que vende créditos Lovable com desconto de até 60%, pagamento via PIX e entrega em minutos.

ENTRADA:
- cluster_name: "${cluster.name}"
- primary_keyword: "${cluster.keyword}"
- hub_page: ${hubPage ? `"/s/${hubPage.slug}" (keyword: "${hubPage.keyword}")` : "NÃO DEFINIDA"}
- supporting_pages (${clusterPages.length}):
${supportingPages.map((p: any) => `  - ${p.keyword} (/s/${p.slug}) [intent: ${p.intent}, score: ${p.score}, hub: ${p.is_hub}, links: ${p.internal_links}]`).join('\n') || '  Nenhuma'}
- orphan_pages_available (${orphanPages.length}):
${orphanPages.slice(0, 15).map((p: any) => `  - ${p.keyword} (/s/${p.slug})`).join('\n') || '  Nenhuma'}

Retorne SOMENTE JSON válido (sem markdown, sem backticks):

{
  "cluster_health": "forte|medio|fraco",
  "problems": ["problema específico 1", "problema 2"],
  "quick_fixes": ["ação rápida 1 que pode ser feita agora", "ação 2"],
  "new_pages_to_create": [
    {"keyword": "keyword sugerida", "intent": "transactional|comparison|educational", "reason": "por que criar"}
  ],
  "better_internal_links": [
    {"from_slug": "slug-origem", "to_slug": "slug-destino", "reason": "por que linkar"}
  ],
  "hub_page_improvements": ["melhoria 1 para a hub page", "melhoria 2"],
  "orphan_pages_to_add": ["slug de página órfã que pertence a este cluster"],
  "summary": "Resumo em 2-3 frases do estado do cluster e prioridades"
}

REGRAS:
- cluster_health: "forte" (5+ páginas, hub definida, links internos bons), "medio" (3-4 páginas ou sem hub), "fraco" (<3 páginas)
- Identificar páginas faltando no contexto de créditos Lovable
- Identificar links internos faltando entre páginas do cluster
- Sugerir melhorias práticas e específicas (não genéricas)
- Foco em ranking e conversão
- Considerar que vendemos créditos Lovable com desconto via PIX
- new_pages_to_create: keywords que complementam o cluster (max 5)
- better_internal_links: links faltando entre páginas existentes
- orphan_pages_to_add: apenas slugs de orphan_pages_available que realmente pertencem ao cluster
- hub_page_improvements: melhorias para a hub page (título, conteúdo, links)
- Se não houver hub page, sugerir qual página deveria ser ou que uma deve ser criada`

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
      }),
    })

    if (!aiResponse.ok) {
      const status = aiResponse.status
      if (status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit. Aguarde e tente novamente.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      return new Response(JSON.stringify({ error: 'Erro ao consultar IA' }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const aiData = await aiResponse.json()
    const rawContent = aiData.choices?.[0]?.message?.content || ''

    let jsonStr = rawContent
    const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) jsonStr = jsonMatch[1]
    jsonStr = jsonStr.trim()

    let result: any
    try {
      result = JSON.parse(jsonStr)
    } catch {
      console.error('Failed to parse AI response:', rawContent)
      return new Response(JSON.stringify({ error: 'IA retornou formato inválido. Tente novamente.' }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ optimization: result }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Unhandled error:', err)
    return new Response(JSON.stringify({ error: 'Erro interno' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
