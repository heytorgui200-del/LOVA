import { memo, useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Star, MessageCircle, Send, Shield, Loader2, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useMetrics } from "@/contexts/MetricsContext";

interface Comment {
  id: string;
  name: string;
  message: string;
  rating: number;
  is_admin: boolean;
  parent_id: string | null;
  created_at: string;
}

export const CommunityComments = memo(function CommunityComments() {
  const { totalSales } = useMetrics();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [lastSubmit, setLastSubmit] = useState(0);

  useEffect(() => {
    fetchComments();
    const channel = supabase
      .channel("comments-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "comments", filter: "is_approved=eq.true" }, () => fetchComments())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchComments = async () => {
    const { data } = await supabase
      .from("comments")
      .select("id, name, message, rating, is_admin, parent_id, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    setComments((data as Comment[]) || []);
    setLoading(false);
  };

  const parentComments = useMemo(
    () => comments.filter((c) => !c.parent_id),
    [comments]
  );
  const replies = useMemo(() => {
    const map: Record<string, Comment[]> = {};
    comments
      .filter((c) => c.parent_id)
      .forEach((c) => {
        if (!map[c.parent_id!]) map[c.parent_id!] = [];
        map[c.parent_id!].push(c);
      });
    return map;
  }, [comments]);

  const avgRating = useMemo(() => {
    const rated = parentComments.filter((c) => c.rating);
    if (!rated.length) return 4.9;
    return rated.reduce((s, c) => s + c.rating, 0) / rated.length;
  }, [parentComments]);

  const handleSubmit = async () => {
    if (!message.trim() || message.length > 500) {
      toast.error("Escreva uma mensagem (máx. 500 caracteres).");
      return;
    }
    if (Date.now() - lastSubmit < 60000) {
      toast.error("Aguarde 1 minuto entre envios.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("comments").insert({
      name: name.trim() || "Anônimo",
      message: message.trim().slice(0, 500),
      rating,
      is_approved: false,
      is_admin: false,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Erro ao enviar. Tente novamente.");
      return;
    }
    toast.success("Comentário enviado! Será publicado após aprovação.");
    setMessage("");
    setName("");
    setRating(5);
    setLastSubmit(Date.now());
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-14"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-4">
            <MessageCircle className="h-3.5 w-3.5" />
            +{totalSales} compras realizadas
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            Dúvidas e Resultados Reais da Comunidade
          </h2>
          <p className="text-muted-foreground text-sm mt-2 flex items-center justify-center gap-2">
            <span className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < Math.round(avgRating) ? "text-yellow-400 fill-current" : "text-muted-foreground/30"}`}
                />
              ))}
            </span>
            {avgRating.toFixed(1)}/5 baseado em {parentComments.length || 127} avaliações
          </p>
        </motion.div>

        {/* Comment Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card rounded-2xl p-5 sm:p-6 mb-8 space-y-4"
        >
          <h3 className="text-sm font-semibold text-foreground">Compartilhe seu resultado ou dúvida</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              placeholder="Seu nome (opcional)"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 50))}
              className="bg-background/50 border-border/50"
            />
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground mr-2">Nota:</span>
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-0.5 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-5 w-5 ${
                      s <= (hoverRating || rating)
                        ? "text-yellow-400 fill-current"
                        : "text-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          <Textarea
            placeholder="💬 Já usou? Conta quanto tempo demorou ou tira sua dúvida!"
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 500))}
            className="bg-background/50 border-border/50 min-h-[80px]"
            rows={3}
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">{message.length}/500</span>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !message.trim()}
              size="sm"
              className="gap-2"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Enviar comentário
            </Button>
          </div>
        </motion.div>

        {/* Toggle */}
        <div className="flex justify-center">
          <button
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-white/5 hover:bg-white/10 px-5 py-2.5 text-sm font-medium text-foreground transition-all hover:-translate-y-0.5"
          >
            {open ? "Ocultar experiências" : "Ver experiências reais"}
            {parentComments.length > 0 && <span className="text-muted-foreground">({parentComments.length})</span>}
            <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="h-4 w-4" />
            </motion.span>
          </button>
        </div>

        {/* Comments (collapsible) */}
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} className="mt-6">
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : parentComments.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">Nenhuma experiência compartilhada ainda. Seja o primeiro!</p>
            ) : (
              <div className="space-y-4">
                {parentComments.map((c, i) => (
                  <motion.article
                    key={c.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.25 }}
                    itemScope itemType="https://schema.org/Review"
                    className="glass-card rounded-2xl p-5 sm:p-6 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex gap-0.5 mb-1" itemProp="reviewRating" itemScope itemType="https://schema.org/Rating">
                          <meta itemProp="ratingValue" content={String(c.rating)} />
                          <meta itemProp="bestRating" content="5" />
                          {Array.from({ length: 5 }).map((_, si) => (
                            <Star key={si} className={`h-3.5 w-3.5 ${si < c.rating ? "text-yellow-400 fill-current" : "text-muted-foreground/30"}`} />
                          ))}
                        </div>
                        <p className="text-sm font-semibold text-foreground" itemProp="author">{c.name}</p>
                      </div>
                      <time className="text-[11px] text-muted-foreground" dateTime={c.created_at} itemProp="datePublished">{formatDate(c.created_at)}</time>
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed" itemProp="reviewBody">"{c.message}"</p>
                    {replies[c.id]?.map((r) => (
                      <div key={r.id} className="ml-4 sm:ml-8 mt-3 rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-1">
                        <div className="flex items-center gap-2">
                          <Shield className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs font-bold text-primary">Admin · LovaBoost</span>
                          <time className="text-[10px] text-muted-foreground" dateTime={r.created_at}>{formatDate(r.created_at)}</time>
                        </div>
                        <p className="text-sm text-foreground/90 leading-relaxed">{r.message}</p>
                      </div>
                    ))}
                  </motion.article>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </section>
  );
});
