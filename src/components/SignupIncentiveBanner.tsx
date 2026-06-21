import { Sparkles, MessageCircle, BarChart3, Users, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const PERKS = [
  { icon: MessageCircle, text: "Recarga rápida via Bot WhatsApp" },
  { icon: BarChart3, text: "Painel pessoal com histórico completo" },
  { icon: Users, text: "Modo Revendedor com margem maior + API" },
];

interface SignupIncentiveBannerProps {
  variant?: "inline" | "card";
}

export function SignupIncentiveBanner({ variant = "card" }: SignupIncentiveBannerProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user) return null;

  if (variant === "inline") {
    return (
      <div className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-6 my-8">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-display font-bold text-foreground">
                Crie sua conta e ganhe benefícios exclusivos
              </h3>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              {PERKS.map((perk) => (
                <span key={perk.text} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <perk.icon className="h-3.5 w-3.5 text-primary" />
                  {perk.text}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={() => navigate("/register")}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-bold text-sm text-primary-foreground hover:bg-primary/90 transition-all whitespace-nowrap"
          >
            Criar Conta Grátis
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card-surface p-6 border border-primary/20">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="font-display font-bold text-foreground">
          Faça login ou cadastre-se e ganhe:
        </h3>
      </div>
      <ul className="space-y-3 mb-5">
        {PERKS.map((perk) => (
          <li key={perk.text} className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
              <perk.icon className="h-4 w-4" />
            </div>
            {perk.text}
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <button
          onClick={() => navigate("/register")}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-bold text-sm text-primary-foreground hover:bg-primary/90 transition-all"
        >
          Criar Conta Grátis
        </button>
        <button
          onClick={() => navigate("/login")}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 font-bold text-sm text-foreground hover:bg-muted transition-all"
        >
          Já tenho conta
        </button>
      </div>
    </div>
  );
}
