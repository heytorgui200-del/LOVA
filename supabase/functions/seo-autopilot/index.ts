const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

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

function tokenSimilarity(a: string, b: string): number {
  const tokA = new Set(a.toLowerCase().replace(/[^a-záéíóúâêôãõç\s]/g, '').split(/\s+/).filter(Boolean))
  const tokB = new Set(b.toLowerCase().replace(/[^a-záéíóúâêôãõç\s]/g, '').split(/\s+/).filter(Boolean))
  if (tokA.size === 0 || tokB.size === 0) return 0
  let intersection = 0
  for (const t of tokA) if (tokB.has(t)) intersection++
  return intersection / Math.max(tokA.size, tokB.size)
}

function slugify(text: string): string {
  return text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-').replace(/-+/g, '-')
    .slice(0, 60)
}

// ─── Auth helper ───
async function authenticateAdmin(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) throw new Error('Unauthorized')
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const supabaseUser = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } }
  })
  const { data: { user }, error } = await supabaseUser.auth.getUser()
  if (error || !user) throw new Error('Unauthorized')
  const { data: isAdmin } = await supabaseAdmin.rpc('has_role', { _user_id: user.id, _role: 'admin' })
  if (!isAdmin) throw new Error('Forbidden')
  return supabaseAdmin
}

function jsonRes(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseAdmin = await authenticateAdmin(req).catch(e => {
      if (e.message === 'Forbidden') throw { status: 403, message: 'Forbidden' }
      throw { status: 401, message: 'Unauthorized' }
    })

    const body = await req.json()
    const { action } = body

    // ─── SCAN ───
    if (action === 'scan') {
      return await handleScan(supabaseAdmin)
    }

    // ─── MONITOR ───
    if (action === 'monitor') {
      return await handleMonitor(supabaseAdmin)
    }

    // ─── SUGGEST OPTIMIZATIONS ───
    if (action === 'suggest_optimizations') {
      return await handleSuggestOptimizations(supabaseAdmin)
    }

    // ─── UPDATE OPPORTUNITY STATUS ───
    if (action === 'update_opportunity') {
      const { id, status } = body
      if (!id || !status) return jsonRes({ error: 'id and status required' }, 400)
      const { error } = await supabaseAdmin.from('seo_opportunities').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
      if (error) return jsonRes({ error: error.message }, 500)
      return jsonRes({ ok: true })
    }

    // ─── UPDATE OPTIMIZATION STATUS ───
    if (action === 'update_optimization') {
      const { id, status } = body
      if (!id || !status) return jsonRes({ error: 'id and status required' }, 400)
      const update: any = { status }
      if (status === 'applied') update.applied_at = new Date().toISOString()
      const { error } = await supabaseAdmin.from('seo_optimizations').update(update).eq('id', id)
      if (error) return jsonRes({ error: error.message }, 500)
      return jsonRes({ ok: true })
    }

    // ─── AUTO ORGANIZE CLUSTERS ───
    if (action === 'auto_organize') {
      return await handleAutoOrganize(supabaseAdmin, body.force_reorganize === true)
    }

    // ─── CLUSTER DETAIL ───
    if (action === 'cluster_detail') {
      return await handleClusterDetail(supabaseAdmin, body.cluster_id)
    }

    return jsonRes({ error: 'Unknown action' }, 400)

  } catch (err: any) {
    const status = err?.status || 500
    const message = err?.message || 'Erro interno'
    console.error('Error:', message)
    return jsonRes({ error: message }, status)
  }
})

// ═══════════════════════════════════════
// SCAN
// ═══════════════════════════════════════
async function handleScan(sb: any) {
  const [pagesRes, clustersRes, oppsRes] = await Promise.all([
    sb.from('seo_pages').select('*'),
    sb.from('seo_clusters').select('*'),
    sb.from('seo_opportunities').select('keyword, status').eq('status', 'pending'),
  ])
  const pages = pagesRes.data || []
  const clusters = clustersRes.data || []
  const existingOpps = oppsRes.data || []
  const existingOppKeywords = new Set(existingOpps.map((o: any) => o.keyword.toLowerCase()))

  const opportunities: any[] = []

  // Orphan pages
  const orphanPages = pages.filter((p: any) => !p.cluster_id)
  for (const p of orphanPages) {
    if (existingOppKeywords.has(p.keyword.toLowerCase())) continue
    opportunities.push({
      keyword: p.keyword, intent_type: p.intent_type || 'transactional',
      action: 'assign_cluster', opportunity_score: 60, risk_score: 30,
      reason: `Página "${p.slug}" está sem cluster — precisa ser organizada`, similar_pages: [],
    })
  }

  // Cluster gaps
  for (const cluster of clusters) {
    const clusterPages = pages.filter((p: any) => p.cluster_id === cluster.id)
    if (clusterPages.length < 3) {
      const gapKeyword = `${cluster.keyword} guia completo`
      if (existingOppKeywords.has(gapKeyword.toLowerCase())) continue
      if (pages.some((p: any) => similarity(p.keyword, gapKeyword) > 0.6)) continue
      opportunities.push({
        keyword: gapKeyword, intent_type: 'educational', cluster_id: cluster.id,
        cluster_suggestion: cluster.name, action: 'create', opportunity_score: 70, risk_score: 10,
        reason: `Cluster "${cluster.name}" tem apenas ${clusterPages.length} página(s)`, similar_pages: [],
      })
    }
    if (!cluster.hub_page_id) {
      const hubKeyword = cluster.keyword || cluster.name
      if (existingOppKeywords.has(hubKeyword.toLowerCase())) continue
      opportunities.push({
        keyword: hubKeyword, intent_type: 'transactional', cluster_id: cluster.id,
        cluster_suggestion: cluster.name, action: 'create_hub', opportunity_score: 80, risk_score: 10,
        reason: `Cluster "${cluster.name}" não tem hub page`, similar_pages: [],
      })
    }
  }

  // Weak pages
  for (const p of pages.filter((p: any) => (p.opportunity_score || 50) < 40 || p.status === 'draft')) {
    if (existingOppKeywords.has(p.keyword.toLowerCase())) continue
    opportunities.push({
      keyword: p.keyword, intent_type: p.intent_type || 'transactional', cluster_id: p.cluster_id,
      action: 'optimize', opportunity_score: 55, risk_score: 20,
      reason: p.status === 'draft' ? `Página "${p.slug}" em rascunho` : `Página "${p.slug}" score baixo (${p.opportunity_score})`,
      similar_pages: [],
    })
  }

  // Cannibalization
  for (let i = 0; i < pages.length; i++) {
    for (let j = i + 1; j < pages.length; j++) {
      const sim = similarity(pages[i].keyword, pages[j].keyword)
      if (sim > 0.7 && pages[i].intent_type === pages[j].intent_type) {
        const mergeKey = `merge:${pages[i].keyword}+${pages[j].keyword}`
        if (existingOppKeywords.has(mergeKey.toLowerCase())) continue
        opportunities.push({
          keyword: mergeKey, intent_type: pages[i].intent_type || 'transactional',
          action: 'merge', opportunity_score: 65, risk_score: 40,
          reason: `Possível canibalização entre "${pages[i].slug}" e "${pages[j].slug}" (${Math.round(sim * 100)}%)`,
          similar_pages: [{ slug: pages[i].slug, keyword: pages[i].keyword }, { slug: pages[j].slug, keyword: pages[j].keyword }],
        })
      }
    }
  }

  if (opportunities.length > 0) {
    await sb.from('seo_opportunities').insert(opportunities.slice(0, 20))
  }

  return jsonRes({
    scanned: true, new_opportunities: opportunities.length,
    total_pages: pages.length, total_clusters: clusters.length, orphan_pages: orphanPages.length,
  })
}

// ═══════════════════════════════════════
// MONITOR
// ═══════════════════════════════════════
async function handleMonitor(sb: any) {
  const { data: pages } = await sb.from('seo_pages')
    .select('id, slug, keyword, created_at, opportunity_score, status, is_published')
    .eq('is_published', true)

  if (!pages?.length) return jsonRes({ monitored: 0 })

  const now = Date.now()
  const snapshots: any[] = []

  for (const page of pages) {
    const daysSinceCreation = Math.floor((now - new Date(page.created_at).getTime()) / 86400000)
    for (const day of [7, 14, 28]) {
      if (daysSinceCreation >= day - 1 && daysSinceCreation <= day + 1) {
        const { data: existing } = await sb.from('seo_page_metrics').select('id').eq('page_id', page.id).eq('snapshot_day', day).maybeSingle()
        if (!existing) {
          const score = page.opportunity_score || 50
          const classification = score >= 70 ? 'winner' : score >= 40 ? 'promising' : 'weak'
          snapshots.push({
            page_id: page.id, snapshot_day: day, impressions: 0, clicks: 0, ctr: 0, avg_position: 0,
            classification, notes: `Snapshot automático dia ${day}. Score interno: ${score}.`,
          })
        }
      }
    }
  }

  if (snapshots.length > 0) {
    await sb.from('seo_page_metrics').insert(snapshots)
  }

  return jsonRes({ monitored: snapshots.length })
}

// ═══════════════════════════════════════
// SUGGEST OPTIMIZATIONS
// ═══════════════════════════════════════
async function handleSuggestOptimizations(sb: any) {
  const { data: pages } = await sb.from('seo_pages')
    .select('id, slug, keyword, title, meta_description, h1, content_json, opportunity_score, status, cluster_id, internal_links_json')
    .eq('is_published', true)

  if (!pages?.length) return jsonRes({ suggestions: 0 })

  const suggestions: any[] = []

  for (const page of pages) {
    if (page.title && page.title.length > 65) {
      suggestions.push({ page_id: page.id, optimization_type: 'title', current_value: page.title, suggested_value: page.title.slice(0, 57) + '...', reason: `Title com ${page.title.length} chars — ideal até 60` })
    }
    if (page.meta_description && page.meta_description.length > 160) {
      suggestions.push({ page_id: page.id, optimization_type: 'meta_description', current_value: page.meta_description, suggested_value: page.meta_description.slice(0, 152) + '...', reason: `Meta description com ${page.meta_description.length} chars — ideal até 155` })
    }
    const links = Array.isArray(page.internal_links_json) ? page.internal_links_json : []
    if (links.length < 2 && page.cluster_id) {
      suggestions.push({ page_id: page.id, optimization_type: 'links', current_value: `${links.length} links internos`, suggested_value: 'Adicionar mais links internos do cluster', reason: 'Poucos links internos' })
    }
    const contentJson = typeof page.content_json === 'string' ? JSON.parse(page.content_json) : page.content_json
    const faq = (contentJson as any)?.faq
    if (!faq || !Array.isArray(faq) || faq.length < 3) {
      suggestions.push({ page_id: page.id, optimization_type: 'faq', current_value: `${faq?.length || 0} FAQs`, suggested_value: 'Adicionar pelo menos 5 FAQs relevantes', reason: 'FAQ fraco ou ausente' })
    }
  }

  const { data: existingOpts } = await sb.from('seo_optimizations').select('page_id, optimization_type').eq('status', 'pending')
  const existingSet = new Set((existingOpts || []).map((o: any) => `${o.page_id}:${o.optimization_type}`))
  const newSuggestions = suggestions.filter(s => !existingSet.has(`${s.page_id}:${s.optimization_type}`))

  if (newSuggestions.length > 0) {
    await sb.from('seo_optimizations').insert(newSuggestions.slice(0, 30))
  }

  return jsonRes({ suggestions: newSuggestions.length })
}

// ═══════════════════════════════════════
// AUTO ORGANIZE CLUSTERS
// ═══════════════════════════════════════
async function handleAutoOrganize(sb: any, forceReorganize: boolean) {
  const [pagesRes, clustersRes] = await Promise.all([
    sb.from('seo_pages').select('id, keyword, slug, intent_type, cluster_id, opportunity_score, is_published, h1'),
    sb.from('seo_clusters').select('*'),
  ])

  const pages = pagesRes.data || []
  const existingClusters = clustersRes.data || []

  if (!pages.length) return jsonRes({ organized: false, reason: 'Nenhuma página encontrada' })

  // If force reorganize, clear all cluster assignments
  if (forceReorganize) {
    await sb.from('seo_pages').update({ cluster_id: null }).neq('id', '00000000-0000-0000-0000-000000000000')
    // Reset hub_page_id on all clusters
    await sb.from('seo_clusters').update({ hub_page_id: null }).neq('id', '00000000-0000-0000-0000-000000000000')
    for (const p of pages) p.cluster_id = null
  }

  // Group pages by theme using token similarity
  const SIMILARITY_THRESHOLD = 0.35
  const groups: { keyword: string; pages: any[] }[] = []

  for (const page of pages) {
    let bestGroup: typeof groups[0] | null = null
    let bestScore = 0

    for (const group of groups) {
      // Compare against all pages in group, take average
      let totalSim = 0
      for (const gp of group.pages) {
        const ts = tokenSimilarity(page.keyword, gp.keyword)
        const ls = similarity(page.keyword, gp.keyword)
        totalSim += Math.max(ts, ls)
      }
      const avgSim = totalSim / group.pages.length
      if (avgSim > bestScore && avgSim >= SIMILARITY_THRESHOLD) {
        bestScore = avgSim
        bestGroup = group
      }
    }

    if (bestGroup) {
      bestGroup.pages.push(page)
    } else {
      groups.push({ keyword: page.keyword, pages: [page] })
    }
  }

  // Now map groups to clusters
  const stats = { clusters_created: 0, clusters_updated: 0, pages_assigned: 0, hub_pages_set: 0 }

  for (const group of groups) {
    // Find the best representative keyword (shortest common one)
    const representativeKw = group.pages
      .sort((a: any, b: any) => a.keyword.length - b.keyword.length)[0].keyword

    // Try to match to existing cluster
    let matchedCluster: any = null
    for (const ec of existingClusters) {
      const sim = Math.max(
        tokenSimilarity(representativeKw, ec.keyword || ec.name),
        similarity(representativeKw, ec.keyword || ec.name)
      )
      if (sim >= SIMILARITY_THRESHOLD) {
        matchedCluster = ec
        break
      }
    }

    // Create cluster if no match
    if (!matchedCluster) {
      const clusterName = representativeKw.split(' ').slice(0, 4).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      const clusterSlug = slugify(representativeKw)

      // Check if slug already exists
      const { data: existing } = await sb.from('seo_clusters').select('id').eq('slug', clusterSlug).maybeSingle()
      if (existing) {
        matchedCluster = existing
      } else {
        const { data: newCluster, error } = await sb.from('seo_clusters').insert({
          name: clusterName,
          slug: clusterSlug,
          keyword: representativeKw,
          description: `Cluster automático para "${representativeKw}" com ${group.pages.length} página(s)`,
        }).select().single()

        if (error) { console.error('Cluster creation error:', error); continue }
        matchedCluster = newCluster
        existingClusters.push(newCluster)
        stats.clusters_created++
      }
    }

    // Assign all pages in group to cluster
    const pageIds = group.pages.map((p: any) => p.id)
    const { error: assignErr } = await sb.from('seo_pages').update({ cluster_id: matchedCluster.id }).in('id', pageIds)
    if (!assignErr) stats.pages_assigned += pageIds.length

    // Pick hub page: highest opportunity_score, prefer published
    const hubPage = group.pages
      .filter((p: any) => p.is_published)
      .sort((a: any, b: any) => (b.opportunity_score || 50) - (a.opportunity_score || 50))[0]
      || group.pages[0]

    if (hubPage && matchedCluster.hub_page_id !== hubPage.id) {
      const { error: hubErr } = await sb.from('seo_clusters').update({ hub_page_id: hubPage.id }).eq('id', matchedCluster.id)
      if (!hubErr) stats.hub_pages_set++
    }

    stats.clusters_updated++
  }

  // Detect orphans after organization (pages with only 1 in their group are still valid)
  const { data: finalClusters } = await sb.from('seo_clusters').select('id, name, hub_page_id, keyword')
  const { data: finalPages } = await sb.from('seo_pages').select('id, cluster_id')
  const orphanCount = (finalPages || []).filter((p: any) => !p.cluster_id).length
  const noHubCount = (finalClusters || []).filter((c: any) => !c.hub_page_id).length
  const clusterPageCounts = (finalClusters || []).map((c: any) => ({
    id: c.id, name: c.name, pages: (finalPages || []).filter((p: any) => p.cluster_id === c.id).length,
  }))
  const incompleteCount = clusterPageCounts.filter((c: any) => c.pages < 3).length

  return jsonRes({
    organized: true,
    ...stats,
    total_clusters: finalClusters?.length || 0,
    orphan_pages: orphanCount,
    clusters_without_hub: noHubCount,
    incomplete_clusters: incompleteCount,
  })
}

// ═══════════════════════════════════════
// CLUSTER DETAIL
// ═══════════════════════════════════════
async function handleClusterDetail(sb: any, clusterId: string) {
  if (!clusterId) return jsonRes({ error: 'cluster_id required' }, 400)

  const [clusterRes, pagesRes, allPagesRes] = await Promise.all([
    sb.from('seo_clusters').select('*').eq('id', clusterId).single(),
    sb.from('seo_pages').select('id, keyword, slug, intent_type, opportunity_score, is_published, internal_links_json, h1').eq('cluster_id', clusterId),
    sb.from('seo_pages').select('id, keyword, slug, cluster_id').is('cluster_id', null),
  ])

  const cluster = clusterRes.data
  if (!cluster) return jsonRes({ error: 'Cluster not found' }, 404)

  const clusterPages = pagesRes.data || []
  const orphanPages = allPagesRes.data || []

  // Suggest pages that could fit this cluster
  const suggestedPages: any[] = []
  for (const op of orphanPages) {
    const sim = Math.max(
      tokenSimilarity(op.keyword, cluster.keyword || cluster.name),
      similarity(op.keyword, cluster.keyword || cluster.name)
    )
    if (sim >= 0.3) {
      suggestedPages.push({ ...op, similarity: Math.round(sim * 100) })
    }
  }

  // Suggest internal links between cluster pages
  const suggestedLinks: any[] = []
  for (let i = 0; i < clusterPages.length; i++) {
    const existingLinks = Array.isArray(clusterPages[i].internal_links_json) ? clusterPages[i].internal_links_json : []
    const linkedSlugs = new Set(existingLinks.map((l: any) => l.slug || l))
    for (let j = 0; j < clusterPages.length; j++) {
      if (i === j) continue
      if (!linkedSlugs.has(clusterPages[j].slug)) {
        suggestedLinks.push({
          from_slug: clusterPages[i].slug,
          from_keyword: clusterPages[i].keyword,
          to_slug: clusterPages[j].slug,
          to_keyword: clusterPages[j].keyword,
        })
      }
    }
  }

  const coverage = clusterPages.length >= 5 ? 'alta' : clusterPages.length >= 3 ? 'média' : 'baixa'

  return jsonRes({
    cluster,
    pages: clusterPages,
    hub_page: clusterPages.find((p: any) => p.id === cluster.hub_page_id) || null,
    suggested_pages: suggestedPages.slice(0, 5),
    suggested_links: suggestedLinks.slice(0, 10),
    coverage,
    total_pages: clusterPages.length,
  })
}
