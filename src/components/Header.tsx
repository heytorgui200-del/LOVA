import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LogIn, LogOut } from "lucide-react";

import { NotificationBell } from "@/components/NotificationBell";
// X still used for mobile menu close
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, profile, isAdmin, signOut } = useAuth();

  // Role-based nav links
  const guestLinks = [
    { to: "/", label: "Home" },
    { to: "/como-funciona", label: "Como Funciona" },
  ];

  const userLinks = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/history", label: "Meus Pedidos" },
  ];

  const adminLinks = [
    { to: "/painel-x7k9m", label: "Visão Geral" },
  ];

  const navLinks = !user ? guestLinks : isAdmin ? adminLinks : userLinks;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <>
      <header className="fixed left-0 right-0 z-50 top-0 border-b border-border glass transition-all duration-300">
        <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4">
          <Link to="/" className="flex items-center gap-2 group" aria-label="LovaBoost - Painel de Créditos Lovable" onClick={() => window.scrollTo(0, 0)}>
            <span className="text-lg sm:text-xl font-bold text-primary">LovaBoost</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  active
                      ? "text-primary bg-primary/10 shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-primary/5 hover:shadow-sm"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-3">
            {user && <NotificationBell />}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="hidden md:flex items-center gap-2 rounded-lg px-3 py-1.5 hover:bg-muted transition-colors outline-none">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-foreground max-w-[120px] truncate">
                    {displayName}
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleSignOut} className="gap-2 cursor-pointer text-destructive">
                    <LogOut className="h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                to="/login"
                className="hidden md:inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <LogIn className="h-4 w-4" />
                Acessar
              </Link>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-background px-3 py-2 space-y-0.5 animate-fade-in">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors min-h-[44px]"
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <button
                onClick={() => { setMobileOpen(false); handleSignOut(); }}
                className="block w-full text-left px-4 py-3 text-sm font-semibold text-destructive min-h-[44px]"
              >
                <LogOut className="h-4 w-4 inline mr-2" />
                Sair
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 text-sm font-semibold text-primary min-h-[44px]"
              >
                <LogIn className="h-4 w-4 inline mr-2" />
                Acessar
              </Link>
            )}
          </div>
        )}
      </header>
    </>
  );
}
