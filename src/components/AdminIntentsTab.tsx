import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Pencil, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Intent {
  id: string;
  label: string;
  emoji: string | null;
  suggested_credits: number;
  description: string | null;
  sort_order: number;
  is_active: boolean;
}

const fadeIn = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } };

export default function AdminIntentsTab() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Intent> | null>(null);

  const { data: intents, isLoading } = useQuery({
    queryKey: ["admin-simulator-intents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("simulator_intents")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Intent[];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (intent: Partial<Intent>) => {
      const payload = {
        label: intent.label!,
        emoji: intent.emoji || "✨",
        suggested_credits: Number(intent.suggested_credits) || 100,
        description: intent.description || null,
        sort_order: Number(intent.sort_order) || 0,
        is_active: intent.is_active ?? true,
      };
      if (intent.id) {
        const { error } = await supabase.from("simulator_intents").update(payload).eq("id", intent.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("simulator_intents").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Intenção salva!");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin-simulator-intents"] });
      qc.invalidateQueries({ queryKey: ["simulator-intents"] });
    },
    onError: (e: any) => toast.error(e.message || "Erro ao salvar"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("simulator_intents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Removido");
      qc.invalidateQueries({ queryKey: ["admin-simulator-intents"] });
      qc.invalidateQueries({ queryKey: ["simulator-intents"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const { error } = await supabase.from("simulator_intents").update({ is_active: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-simulator-intents"] });
      qc.invalidateQueries({ queryKey: ["simulator-intents"] });
    },
  });

  return (
    <motion.div {...fadeIn} className="space-y-6">
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm">Exemplos de uso</CardTitle>
            <CardDescription className="text-xs">
              Exemplos do que o cliente pode construir, mostrados nos cards do simulador da home.
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setEditing({ is_active: true, suggested_credits: 200, sort_order: (intents?.length || 0) + 1 })}>
            <Plus className="h-4 w-4 mr-1" /> Nova
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Emoji</TableHead>
                    <TableHead>Rótulo</TableHead>
                    <TableHead>Créditos</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="w-20">Ativo</TableHead>
                    <TableHead className="w-24 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {intents?.map((intent) => (
                    <TableRow key={intent.id}>
                      <TableCell className="text-muted-foreground text-xs">{intent.sort_order}</TableCell>
                      <TableCell className="text-2xl">{intent.emoji || "✨"}</TableCell>
                      <TableCell className="font-medium">{intent.label}</TableCell>
                      <TableCell className="font-mono text-sm">{intent.suggested_credits}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{intent.description}</TableCell>
                      <TableCell>
                        <Switch
                          checked={intent.is_active}
                          onCheckedChange={(v) => toggleActive.mutate({ id: intent.id, value: v })}
                        />
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button size="icon" variant="ghost" onClick={() => setEditing(intent)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            if (confirm(`Remover "${intent.label}"?`)) deleteMutation.mutate(intent.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {editing && (
        <Card className="border-primary/40">
          <CardHeader>
            <CardTitle className="text-sm flex items-center justify-between">
              {editing.id ? "Editar intenção" : "Nova intenção"}
              <Button size="icon" variant="ghost" onClick={() => setEditing(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Emoji</Label>
                <Input value={editing.emoji || ""} onChange={(e) => setEditing({ ...editing, emoji: e.target.value })} placeholder="🚀" />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs">Rótulo</Label>
                <Input value={editing.label || ""} onChange={(e) => setEditing({ ...editing, label: e.target.value })} placeholder="App SaaS" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Créditos sugeridos</Label>
                <Input type="number" min={10} value={editing.suggested_credits || ""} onChange={(e) => setEditing({ ...editing, suggested_credits: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="text-xs">Ordem</Label>
                <Input type="number" min={0} value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Descrição (opcional)</Label>
              <Textarea rows={2} value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="MVP funcional com auth" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={editing.is_active ?? true} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
              <Label className="text-xs">Ativo</Label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button size="sm" onClick={() => upsertMutation.mutate(editing)} disabled={!editing.label || upsertMutation.isPending}>
                {upsertMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-1" /> Salvar</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
