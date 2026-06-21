import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { formatCurrency } from "@/lib/pricing";

export function WalletHistory() {
  const { user } = useAuth();
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["wallet-transactions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!transactions?.length) return <p className="text-center py-10 text-muted-foreground text-sm">Nenhuma movimentação ainda.</p>;

  return (
    <div className="space-y-2">
      {transactions.map((tx) => {
        const isCredit = tx.type === "credit";
        return (
          <div key={tx.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${isCredit ? "bg-green-500/10" : "bg-red-500/10"}`}>
              {isCredit ? <ArrowDownCircle className="h-4 w-4 text-green-500" /> : <ArrowUpCircle className="h-4 w-4 text-red-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{tx.description}</p>
              <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</p>
            </div>
            <span className={`text-sm font-bold tabular-nums ${isCredit ? "text-green-600" : "text-red-500"}`}>
              {isCredit ? "+" : "-"} {formatCurrency(Number(tx.amount))}
            </span>
          </div>
        );
      })}
    </div>
  );
}
