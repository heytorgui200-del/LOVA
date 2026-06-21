import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Star, Check, X, MessageCircle, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Comment {
  id: string;
  name: string;
  message: string;
  rating: number;
  is_admin: boolean;
  is_approved: boolean;
  parent_id: string | null;
  created_at: string;
}

const fadeIn = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } };

export default function AdminCommentsTab() {
  const qc = useQueryClient();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["admin-comments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data as Comment[]) || [];
    },
  });

  const parentComments = comments.filter((c) => !c.parent_id);
  const replies: Record<string, Comment[]> = {};
  comments
    .filter((c) => c.parent_id)
    .forEach((c) => {
      if (!replies[c.parent_id!]) replies[c.parent_id!] = [];
      replies[c.parent_id!].push(c);
    });

  const filtered = parentComments.filter((c) => {
    if (filter === "pending") return !c.is_approved;
    if (filter === "approved") return c.is_approved;
    return true;
  });

  const pendingCount = parentComments.filter((c) => !c.is_approved).length;

  const approve = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("comments")
        .update({ is_approved: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Comentário aprovado!");
      qc.invalidateQueries({ queryKey: ["admin-comments"] });
    },
  });

  const reject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("comments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Comentário removido.");
      qc.invalidateQueries({ queryKey: ["admin-comments"] });
    },
  });

  const reply = useMutation({
    mutationFn: async ({ parentId, msg }: { parentId: string; msg: string }) => {
      const { error } = await supabase.from("comments").insert({
        name: "Admin",
        message: msg,
        rating: 5,
        is_admin: true,
        is_approved: true,
        parent_id: parentId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Resposta publicada!");
      setReplyingTo(null);
      setReplyText("");
      qc.invalidateQueries({ queryKey: ["admin-comments"] });
    },
  });

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div {...fadeIn} className="space-y-6">
      <div className="flex items-center gap-4">
        <Badge variant={filter === "all" ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilter("all")}>
          Todos ({parentComments.length})
        </Badge>
        <Badge variant={filter === "pending" ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilter("pending")}>
          Pendentes ({pendingCount})
        </Badge>
        <Badge variant={filter === "approved" ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilter("approved")}>
          Aprovados ({parentComments.length - pendingCount})
        </Badge>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="py-12 text-center text-muted-foreground">
            <MessageCircle className="h-8 w-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Nenhum comentário encontrado.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <Card key={c.id} className={`border-border/50 ${!c.is_approved ? "border-l-2 border-l-yellow-500" : ""}`}>
              <CardContent className="py-4 px-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-foreground">{c.name}</span>
                      {!c.is_approved && (
                        <Badge variant="outline" className="text-[10px] text-yellow-500 border-yellow-500/30">
                          Pendente
                        </Badge>
                      )}
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${i < c.rating ? "text-yellow-400 fill-current" : "text-muted-foreground/20"}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-foreground/80">{c.message}</p>
                    <span className="text-[10px] text-muted-foreground">{formatDate(c.created_at)}</span>
                  </div>
                  <div className="flex gap-1.5 shrink-0 ml-4">
                    {!c.is_approved && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => approve.mutate(c.id)}
                        disabled={approve.isPending}
                        className="h-8 gap-1 text-green-500 border-green-500/30 hover:bg-green-500/10"
                      >
                        <Check className="h-3.5 w-3.5" /> Aprovar
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
                      className="h-8 gap-1"
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> Responder
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => reject.mutate(c.id)}
                      disabled={reject.isPending}
                      className="h-8 gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {replies[c.id]?.map((r) => (
                  <div key={r.id} className="ml-6 rounded-lg border border-primary/20 bg-primary/5 p-3 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Shield className="h-3 w-3 text-primary" />
                        <span className="text-xs font-bold text-primary">Admin</span>
                        <span className="text-[10px] text-muted-foreground">{formatDate(r.created_at)}</span>
                      </div>
                      <p className="text-sm text-foreground/80">{r.message}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => reject.mutate(r.id)}
                      className="h-7 w-7 p-0 text-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}

                {replyingTo === c.id && (
                  <div className="ml-6 space-y-2">
                    <Textarea
                      placeholder="Escreva sua resposta..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value.slice(0, 500))}
                      className="min-h-[60px] text-sm"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => reply.mutate({ parentId: c.id, msg: replyText })}
                        disabled={reply.isPending || !replyText.trim()}
                        className="gap-1"
                      >
                        {reply.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Shield className="h-3.5 w-3.5" />}
                        Publicar resposta
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setReplyingTo(null); setReplyText(""); }}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
}
