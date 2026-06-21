import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Loader2, Trash2, ExternalLink, Sparkles, Zap, Globe } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const callGenerateSeo = async (body: Record<string, any>) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Não autenticado");
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const res = await fetch(`https://${projectId}.supabase.co/functions/v1/generate-seo-page`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Erro");
  return json;
};

export default function AdminSeoTab() {
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: pages, isLoading } = useQuery({
    queryKey: ["admin-seo-pages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("seo_pages").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const generateMutation = useMutation({
    mutationFn: (kw: string) => callGenerateSeo({ keyword: kw }),
    onSuccess: (data) => {
      toast.success(data.page?.status === "draft" ? "Página criada como rascunho" : "Página publicada!");
      setKeyword("");
      queryClient.invalidateQueries({ queryKey: ["admin-seo-pages"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase.from("seo_pages").update({ is_published: published }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-seo-pages"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("seo_pages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-seo-pages"] });
      toast.success("Página excluída");
    },
  });

  const publishedCount = pages?.filter((p: any) => p.is_published)?.length || 0;
  const draftCount = pages?.filter((p: any) => !p.is_published)?.length || 0;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="flex gap-6">
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">{pages?.length || 0}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-500">{publishedCount}</p>
          <p className="text-xs text-muted-foreground">Publicadas</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-amber-500">{draftCount}</p>
          <p className="text-xs text-muted-foreground">Rascunhos</p>
        </div>
      </div>

      {/* Generator */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4 pb-4">
          <div className="flex gap-3 items-center">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <Input
              placeholder="Digite uma keyword para gerar página com IA..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && keyword.trim()) generateMutation.mutate(keyword.trim()); }}
              disabled={generateMutation.isPending}
              className="flex-1"
            />
            <Button onClick={() => generateMutation.mutate(keyword.trim())} disabled={!keyword.trim() || generateMutation.isPending}>
              {generateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Gerar
            </Button>
          </div>
          {generateMutation.isPending && (
            <p className="text-xs text-muted-foreground mt-2 ml-8">A IA está criando conteúdo único. Pode levar até 30s...</p>
          )}
        </CardContent>
      </Card>

      {/* Pages list */}
      <Card>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : !pages?.length ? (
            <div className="text-center py-12">
              <Globe className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma página criada ainda.</p>
              <p className="text-xs text-muted-foreground mt-1">Digite uma keyword acima para gerar a primeira página.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Keyword</TableHead>
                    <TableHead className="text-xs">Slug</TableHead>
                    <TableHead className="text-xs">Score</TableHead>
                    <TableHead className="text-xs">Publicado</TableHead>
                    <TableHead className="text-xs text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pages.map((page: any) => (
                    <TableRow key={page.id}>
                      <TableCell className="text-xs font-medium">
                        {page.keyword}
                        {page.status === "draft" && <Badge variant="outline" className="ml-1.5 text-[10px] bg-amber-500/10 text-amber-600">Rascunho</Badge>}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">/s/{page.slug}</TableCell>
                      <TableCell>
                        <span className={`text-xs font-bold ${(page.opportunity_score || 50) >= 70 ? "text-green-500" : (page.opportunity_score || 50) >= 40 ? "text-amber-500" : "text-red-500"}`}>
                          {page.opportunity_score || 50}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Switch checked={page.is_published} onCheckedChange={(checked) => toggleMutation.mutate({ id: page.id, published: checked })} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-0.5">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(`/s/${page.slug}`, "_blank")}>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(page.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir página SEO</DialogTitle>
            <DialogDescription>A página será removida permanentemente.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
