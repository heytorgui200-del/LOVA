import { useState } from "react";
import {
  BarChart3, Users, Globe, DollarSign, Zap, Settings, Menu, X, Store, RefreshCw,
  FolderTree, Brain, MessageCircle, Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface NavItem {
  value: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: "Principal",
    items: [
      { value: "dashboard", label: "Dashboard", icon: BarChart3 },
      { value: "seo", label: "Autopilot SEO", icon: Brain },
      { value: "clusters", label: "Clusters", icon: FolderTree },
    ],
  },
  {
    title: "Gestão",
    items: [
      { value: "users", label: "Usuários", icon: Users },
      { value: "resellers", label: "Revendedores", icon: Store },
      { value: "pricing", label: "Créditos & Preços", icon: DollarSign },
      { value: "refunds", label: "Reembolsos", icon: RefreshCw },
    ],
  },
  {
    title: "Engajamento",
    items: [
      { value: "comments", label: "Comentários", icon: MessageCircle },
      { value: "intents", label: "Exemplos de uso", icon: Sparkles },
      { value: "automation", label: "Automação", icon: Zap },
    ],
  },
  {
    title: "Sistema",
    items: [
      { value: "settings", label: "Configurações", icon: Settings },
    ],
  },
];

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (value: string) => void;
}

export default function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const handleSelect = (value: string) => {
    onTabChange(value);
    if (isMobile) setOpen(false);
  };

  const sidebarContent = (
    <nav className="flex flex-col h-full py-6">
      <div className="px-5 mb-8">
        <h2 className="text-base font-bold text-foreground tracking-wide">Admin</h2>
        <p className="text-[11px] text-muted-foreground mt-0.5">Painel de controle</p>
      </div>

      <div className="flex-1 space-y-6 px-3">
        {navGroups.map((group) => (
          <div key={group.title}>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold px-3 mb-2">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = activeTab === item.value;
                const isDisabled = !!item.badge;
                return (
                  <button
                    key={item.value}
                    onClick={() => handleSelect(item.value)}
                    disabled={isDisabled}
                    className={cn(
                      "flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                      isActive
                        ? "bg-primary/15 text-primary border-l-2 border-primary pl-[10px] shadow-sm"
                        : isDisabled
                        ? "text-muted-foreground/40 cursor-not-allowed border-l-2 border-transparent pl-[10px]"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60 border-l-2 border-transparent pl-[10px]"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{item.badge}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );

  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="fixed top-20 left-4 z-50 rounded-lg bg-card border border-border p-2.5 shadow-lg"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5 text-foreground" />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-background border-r border-border overflow-y-auto">
              <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
              {sidebarContent}
            </aside>
          </>
        )}
      </>
    );
  }

  return (
    <aside className="sticky top-0 h-screen w-60 shrink-0 bg-background border-r border-border overflow-y-auto">
      {sidebarContent}
    </aside>
  );
}
