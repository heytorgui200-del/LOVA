import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Loader2, Plus, Trash2, Edit2, FolderTree, Link as LinkIcon,
  AlertTriangle, Eye, ArrowLeft, X, Check, Search, Globe, Target,
  CircleDot, FileText, Lightbulb, Zap, TrendingUp, ArrowRight,
  CheckCircle2, XCircle, LinkIcon as Link2,
} from "lucide-react";
import { toast } from "sonner";

interface ClusterOptimization {
  cluster_health: "forte" | "medio" | "fraco";
  problems: string[];
  quick_fixes: string[];
  new_pages_to_create: { keyword: string; intent: string; reason: string }[];
  better_internal_links: { from_slug: string; to_slug: string; reason: string }[];
  hub_page_improvements: string[];
  orphan_pages_to_add?: string[];
  summary: string;
}

interface Cluster {
  id: string;
  name: string;
  slug: string;
  keyword: string;
  description: string | null;
  hub_page_id: string | null;
  created_at: string;
}

interface SeoPage {
  id: string;
  slug: string;
  keyword: string;
  title: string;
  cluster_id: string | null;
  intent_type: string | null;
  opportunity_score: number | null;
  status: string;
}

export default function AdminClustersTab() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editCluster, setEditCluster] = useState<Cluster | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailCluster, setDetailCluster] = useState<Cluster | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", keyword: "", description: "", hub_page_id: "" });
  const [searchFilter, setSearchFilter] = useState("");

  const { data: clusters, isLoading } = useQuery({
    queryKey: ["seo-clusters"],
    queryFn: async () => {
      const { data, error } = await supabase.from("seo_clusters").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Cluster[];
    },
  });

  const { data: pages } = useQuery({
    queryKey: ["seo-pages-for-clusters"],
    queryFn: async () => {
      const { data, error } = await supabase.from("seo_pages").select("id, slug, keyword, title, cluster_id, intent_type, opportunity_score, status");
      if (error) throw error;
      return data as SeoPage[];
    },
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["seo-clusters"] });
    queryClient.invalidateQueries({ queryKey: ["seo-pages-for-clusters"] });
  };

  const createMutation = useMutation({
    mutationFn: async (f: typeof form) => {
      const slug = f.slug || f.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const { error } = await supabase.from("seo_clusters").insert({
        name: f.name, slug, keyword: f.keyword, description: f.description || null, hub_page_id: f.hub_page_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Cluster criado"); invalidateAll(); setShowCreate(false); resetForm(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...f }: typeof form & { id: string }) => {
      const { error } = await supabase.from("seo_clusters").update({
        name: f.name, slug: f.slug, keyword: f.keyword, description: f.description || null, hub_page_id: f.hub_page_id || null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Cluster atualizado"); invalidateAll(); setEditCluster(null); resetForm(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Unassign pages first
      await supabase.from("seo_pages").update({ cluster_id: null }).eq("cluster_id", id);
      const { error } = await supabase.from("seo_clusters").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Cluster excluído"); invalidateAll(); setDeleteId(null); },
  });

  const assignMutation = useMutation({
    mutationFn: async ({ pageId, clusterId }: { pageId: string; clusterId: string | null }) => {
      const { error } = await supabase.from("seo_pages").update({ cluster_id: clusterId }).eq("id", pageId);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Página atualizada"); invalidateAll(); },
  });

  const setHubMutation = useMutation({
    mutationFn: async ({ clusterId, pageId }: { clusterId: string; pageId: string | null }) => {
      const { error } = await supabase.from("seo_clusters").update({ hub_page_id: pageId }).eq("id", clusterId);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Hub page definida"); invalidateAll(); },
  });

  const resetForm = () => setForm({ name: "", slug: "", keyword: "", description: "", hub_page_id: "" });

  const openEdit = (c: Cluster) => {
    setEditCluster(c);
    setForm({ name: c.name, slug: c.slug, keyword: c.keyword || "", description: c.description || "", hub_page_id: c.hub_page_id || "" });
  };

  const getPageCount = (clusterId: string) => pages?.filter((p) => p.cluster_id === clusterId).length || 0;
  const unassignedPages = pages?.filter((p) => !p.cluster_id) || [];

  // Suggestions: simple keyword-matching for orphan pages
  const getSuggestions = (cluster: Cluster) => {
    if (!cluster.keyword) return [];
    const words = cluster.keyword.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    return unassignedPages.filter((p) => {
      const kw = p.keyword.toLowerCase();
      return words.some((w) => kw.includes(w));
    });
  };

  // Stats
  const totalPages = pages?.length || 0;
  const orphanCount = unassignedPages.length;
  const noHubCount = clusters?.filter(c => !c.hub_page_id).length || 0;
  const smallClusters = clusters?.filter(c => getPageCount(c.id) < 3).length || 0;

  // If viewing detail
  if (detailCluster) {
    return (
      <ClusterDetail
        cluster={detailCluster}
        pages={pages || []}
        clusters={clusters || []}
        onBack={() => setDetailCluster(null)}
        onAssign={(pageId, clusterId) => assignMutation.mutate({ pageId, clusterId })}
        onSetHub={(pageId) => setHubMutation.mutate({ clusterId: detailCluster.id, pageId })}
        onEdit={() => { openEdit(detailCluster); setDetailCluster(null); }}
        suggestions={getSuggestions(detailCluster)}
      />
    );
  }

  const filteredClusters = clusters?.filter(c =>
    !searchFilter ||
    c.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    c.keyword.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Clusters SEO</h2>
          <p className="text-sm text-muted-foreground">Organize páginas em grupos temáticos para melhorar SEO</p>
        </div>
        <Button onClick={() => { resetForm(); setShowCreate(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Criar Cluster
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Clusters" value={String(clusters?.length || 0)} icon={FolderTree} />
        <StatCard label="Páginas Totais" value={String(totalPages)} icon={FileText} />
        <StatCard label="Páginas Órfãs" value={String(orphanCount)} icon={AlertTriangle} warn={orphanCount > 0} />
        <StatCard label="Sem Hub Page" value={String(noHubCount)} icon={Target} warn={noHubCount > 0} />
      </div>

      {/* Warnings */}
      {(orphanCount > 0 || smallClusters > 0) && (
        <div className="space-y-2">
          {orphanCount > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-4 py-2.5">
              <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">{orphanCount} página(s)</strong> sem cluster. Páginas soltas prejudicam a estrutura SEO.
              </p>
            </div>
          )}
          {smallClusters > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-4 py-2.5">
              <Lightbulb className="h-4 w-4 text-yellow-500 shrink-0" />
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">{smallClusters} cluster(s)</strong> com menos de 3 páginas. Clusters fortes têm pelo menos 3-5 páginas.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Search */}
      {clusters && clusters.length > 3 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} placeholder="Filtrar clusters..." className="pl-9 h-9" />
        </div>
      )}

      {/* Clusters table */}
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : !filteredClusters?.length ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">
          {clusters?.length ? "Nenhum cluster encontrado." : "Nenhum cluster criado ainda. Crie o primeiro!"}
        </CardContent></Card>
      ) : (
        <Card className="border-border/50">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Nome</TableHead>
                  <TableHead className="text-xs">Keyword</TableHead>
                  <TableHead className="text-xs">Hub Page</TableHead>
                  <TableHead className="text-xs text-center">Páginas</TableHead>
                  <TableHead className="text-xs text-center">Status</TableHead>
                  <TableHead className="text-xs text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClusters.map((c) => {
                  const count = getPageCount(c.id);
                  const hubPage = pages?.find((p) => p.id === c.hub_page_id);
                  const isIncomplete = count < 3;
                  const noHub = !c.hub_page_id;
                  return (
                    <TableRow key={c.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setDetailCluster(c)}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FolderTree className="h-4 w-4 text-primary shrink-0" />
                          <div>
                            <p className="font-medium text-sm">{c.name}</p>
                            <p className="text-[10px] text-muted-foreground">/{c.slug}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.keyword || "—"}</TableCell>
                      <TableCell>
                        {hubPage ? (
                          <span className="text-xs text-primary flex items-center gap-1"><LinkIcon className="h-3 w-3" />/s/{hubPage.slug}</span>
                        ) : (
                          <span className="text-xs text-yellow-500 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Sem hub</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={count > 0 ? "secondary" : "outline"}>{count}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {isIncomplete || noHub ? (
                          <Badge variant="outline" className="text-yellow-500 border-yellow-500/30 text-[10px]">Incompleto</Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-500 border-green-500/30 text-[10px]">Completo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDetailCluster(c)}><Eye className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}><Edit2 className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Orphan pages section */}
      {unassignedPages.length > 0 && clusters && clusters.length > 0 && (
        <Card className="border-yellow-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Páginas sem cluster ({unassignedPages.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Keyword</TableHead>
                  <TableHead className="text-xs">Slug</TableHead>
                  <TableHead className="text-xs">Atribuir a Cluster</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unassignedPages.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium text-sm">{p.keyword}</TableCell>
                    <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded">/s/{p.slug}</code></TableCell>
                    <TableCell>
                      <Select onValueChange={(v) => assignMutation.mutate({ pageId: p.id, clusterId: v })}>
                        <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue placeholder="Selecionar cluster..." /></SelectTrigger>
                        <SelectContent>
                          {clusters.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit dialog */}
      <Dialog open={showCreate || !!editCluster} onOpenChange={() => { setShowCreate(false); setEditCluster(null); resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editCluster ? "Editar Cluster" : "Novo Cluster"}</DialogTitle>
            <DialogDescription>
              {editCluster ? "Atualize as informações do cluster." : "Defina o tema e a keyword principal."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome do Cluster *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Créditos Lovable" />
            </div>
            <div>
              <Label>Keyword Principal</Label>
              <Input value={form.keyword} onChange={(e) => setForm({ ...form, keyword: e.target.value })} placeholder="Ex: créditos lovable" />
              <p className="text-[10px] text-muted-foreground mt-1">Palavra-chave que define o tema do cluster</p>
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-gerado se vazio" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Descreva o objetivo do cluster..." />
            </div>
            {pages && pages.length > 0 && (
              <div>
                <Label>Hub Page (página principal)</Label>
                <Select value={form.hub_page_id} onValueChange={(v) => setForm({ ...form, hub_page_id: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {pages.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.keyword} (/s/{p.slug})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); setEditCluster(null); }}>Cancelar</Button>
            <Button
              disabled={!form.name.trim() || createMutation.isPending || updateMutation.isPending}
              onClick={() => editCluster ? updateMutation.mutate({ id: editCluster.id, ...form }) : createMutation.mutate(form)}
            >
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editCluster ? "Salvar" : "Criar Cluster"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Excluir cluster</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">As páginas do cluster serão desvinculadas, mas <strong>não excluídas</strong>.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" disabled={deleteMutation.isPending} onClick={() => deleteId && deleteMutation.mutate(deleteId)}>
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Stat Card ──
function StatCard({ label, value, icon: Icon, warn }: { label: string; value: string; icon: any; warn?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 ${warn ? "border-yellow-500/30 bg-yellow-500/5" : "border-border/50"}`}>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className={`h-3.5 w-3.5 ${warn ? "text-yellow-500" : ""}`} />
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-lg font-bold mt-0.5 ${warn ? "text-yellow-500" : "text-foreground"}`}>{value}</p>
    </div>
  );
}

// ── Cluster Detail View ──
function ClusterDetail({
  cluster, pages, clusters, onBack, onAssign, onSetHub, onEdit, suggestions,
}: {
  cluster: Cluster;
  pages: SeoPage[];
  clusters: Cluster[];
  onBack: () => void;
  onAssign: (pageId: string, clusterId: string | null) => void;
  onSetHub: (pageId: string | null) => void;
  onEdit: () => void;
  suggestions: SeoPage[];
}) {
  const clusterPages = pages.filter((p) => p.cluster_id === cluster.id);
  const hubPage = pages.find((p) => p.id === cluster.hub_page_id);
  const otherPages = pages.filter((p) => p.cluster_id !== cluster.id);
  const [showAssign, setShowAssign] = useState(false);
  const [optimization, setOptimization] = useState<ClusterOptimization | null>(null);
  const [optimizing, setOptimizing] = useState(false);

  const runOptimization = async () => {
    setOptimizing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/optimize-cluster`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ cluster_id: cluster.id }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro na otimização");
      setOptimization(json.optimization);
      toast.success("Análise concluída!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setOptimizing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <FolderTree className="h-5 w-5 text-primary" />
            {cluster.name}
          </h2>
          <p className="text-xs text-muted-foreground">/{cluster.slug} · {cluster.keyword || "sem keyword"}</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={runOptimization} disabled={optimizing}>
          {optimizing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />} Otimizar
        </Button>
        <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={onEdit}><Edit2 className="h-3 w-3" /> Editar</Button>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border border-border/50 p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Keyword</p>
          <p className="text-sm font-medium mt-0.5">{cluster.keyword || "—"}</p>
        </div>
        <div className="rounded-lg border border-border/50 p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Páginas</p>
          <p className="text-lg font-bold text-foreground">{clusterPages.length}</p>
        </div>
        <div className={`rounded-lg border p-3 ${hubPage ? "border-border/50" : "border-yellow-500/30 bg-yellow-500/5"}`}>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Hub Page</p>
          {hubPage ? (
            <p className="text-sm font-medium text-primary mt-0.5 truncate">/s/{hubPage.slug}</p>
          ) : (
            <p className="text-sm font-medium text-yellow-500 mt-0.5">Não definida</p>
          )}
        </div>
        <div className={`rounded-lg border p-3 ${clusterPages.length >= 3 && hubPage ? "border-green-500/30" : "border-yellow-500/30 bg-yellow-500/5"}`}>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</p>
          <p className={`text-sm font-medium mt-0.5 ${clusterPages.length >= 3 && hubPage ? "text-green-500" : "text-yellow-500"}`}>
            {clusterPages.length >= 3 && hubPage ? "Completo" : "Incompleto"}
          </p>
        </div>
      </div>

      {cluster.description && (
        <p className="text-sm text-muted-foreground">{cluster.description}</p>
      )}

      {/* Warnings */}
      {(!hubPage || clusterPages.length < 3) && (
        <div className="space-y-2">
          {!hubPage && (
            <div className="flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-4 py-2.5">
              <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />
              <p className="text-xs text-muted-foreground">Sem hub page. Defina uma página principal para este cluster.</p>
            </div>
          )}
          {clusterPages.length < 3 && (
            <div className="flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-4 py-2.5">
              <Lightbulb className="h-4 w-4 text-yellow-500 shrink-0" />
              <p className="text-xs text-muted-foreground">Cluster com {clusterPages.length} página(s). Recomendado: pelo menos 3-5 páginas.</p>
            </div>
          )}
        </div>
      )}

      {/* Optimization Results */}
      {optimization && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Análise do Cluster
                <Badge
                  variant="outline"
                  className={
                    optimization.cluster_health === "forte"
                      ? "text-green-500 border-green-500/30"
                      : optimization.cluster_health === "medio"
                      ? "text-amber-500 border-amber-500/30"
                      : "text-destructive border-destructive/30"
                  }
                >
                  {optimization.cluster_health === "forte" ? "Forte" : optimization.cluster_health === "medio" ? "Médio" : "Fraco"}
                </Badge>
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setOptimization(null)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {/* Summary */}
            <p className="text-sm text-muted-foreground">{optimization.summary}</p>

            {/* Problems */}
            {optimization.problems.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold text-destructive flex items-center gap-1"><XCircle className="h-3.5 w-3.5" /> Problemas</h4>
                {optimization.problems.map((p, i) => (
                  <p key={i} className="text-xs text-muted-foreground pl-5">• {p}</p>
                ))}
              </div>
            )}

            {/* Quick Fixes */}
            {optimization.quick_fixes.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold text-amber-500 flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Correções Rápidas</h4>
                {optimization.quick_fixes.map((f, i) => (
                  <p key={i} className="text-xs text-muted-foreground pl-5">• {f}</p>
                ))}
              </div>
            )}

            {/* New Pages */}
            {optimization.new_pages_to_create.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold text-primary flex items-center gap-1"><Plus className="h-3.5 w-3.5" /> Páginas a Criar</h4>
                {optimization.new_pages_to_create.map((p, i) => (
                  <div key={i} className="pl-5 space-y-0.5">
                    <p className="text-xs font-medium text-foreground">"{p.keyword}" <Badge variant="outline" className="text-[10px] ml-1">{p.intent}</Badge></p>
                    <p className="text-[10px] text-muted-foreground">{p.reason}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Internal Links */}
            {optimization.better_internal_links.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold text-blue-500 flex items-center gap-1"><Link2 className="h-3.5 w-3.5" /> Links Internos Faltando</h4>
                {optimization.better_internal_links.map((l, i) => (
                  <div key={i} className="pl-5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <code className="bg-muted px-1 rounded text-[10px]">{l.from_slug}</code>
                    <ArrowRight className="h-3 w-3 shrink-0" />
                    <code className="bg-muted px-1 rounded text-[10px]">{l.to_slug}</code>
                    <span className="text-[10px]">— {l.reason}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Hub Page Improvements */}
            {optimization.hub_page_improvements.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold text-foreground flex items-center gap-1"><Target className="h-3.5 w-3.5" /> Melhorias na Hub Page</h4>
                {optimization.hub_page_improvements.map((m, i) => (
                  <p key={i} className="text-xs text-muted-foreground pl-5">• {m}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {optimizing && (
        <div className="flex items-center justify-center gap-2 py-6">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Analisando cluster com IA...</p>
        </div>
      )}

      <Separator />

      {/* Pages in cluster */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Páginas do Cluster ({clusterPages.length})</h3>
          <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => setShowAssign(true)}>
            <Plus className="h-3 w-3" /> Adicionar Página
          </Button>
        </div>

        {clusterPages.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">Nenhuma página neste cluster.</p>
        ) : (
          <div className="space-y-1.5">
            {clusterPages.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border border-border/30 px-3 py-2.5 group">
                <div className="flex items-center gap-3 min-w-0">
                  {p.id === cluster.hub_page_id ? (
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] shrink-0">HUB</Badge>
                  ) : (
                    <CircleDot className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.keyword}</p>
                    <p className="text-[10px] text-muted-foreground">/s/{p.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {p.id !== cluster.hub_page_id && (
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1" onClick={() => onSetHub(p.id)}>
                      <Target className="h-3 w-3" /> Definir Hub
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 text-destructive" onClick={() => onAssign(p.id, null)}>
                    <X className="h-3 w-3" /> Remover
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              Sugestões ({suggestions.length})
            </h3>
            <p className="text-xs text-muted-foreground">Páginas sem cluster que podem pertencer a "{cluster.name}" baseado na keyword.</p>
            <div className="space-y-1.5">
              {suggestions.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.keyword}</p>
                    <p className="text-[10px] text-muted-foreground">/s/{p.slug}</p>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 shrink-0" onClick={() => onAssign(p.id, cluster.id)}>
                    <Check className="h-3 w-3" /> Adicionar
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Assign page dialog */}
      <Dialog open={showAssign} onOpenChange={setShowAssign}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Página ao Cluster</DialogTitle>
            <DialogDescription>Selecione páginas para adicionar a "{cluster.name}"</DialogDescription>
          </DialogHeader>
          <div className="max-h-64 overflow-y-auto space-y-1.5">
            {otherPages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Todas as páginas já estão neste cluster.</p>
            ) : (
              otherPages.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-border/30 px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.keyword}</p>
                    <p className="text-[10px] text-muted-foreground">
                      /s/{p.slug}
                      {p.cluster_id && <> · <span className="text-yellow-500">já em outro cluster</span></>}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 shrink-0"
                    onClick={() => { onAssign(p.id, cluster.id); setShowAssign(false); }}>
                    <Plus className="h-3 w-3" /> Adicionar
                  </Button>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssign(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
