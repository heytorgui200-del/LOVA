import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, X } from "lucide-react";
import { Link } from "react-router-dom";
import logoImg from "@/assets/icone-coracao-lovaboost.png";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/contexts/AuthContext";

const FOOTER_LINKS = {
  Páginas: [
    { to: "/", label: "Início" },
    { to: "/como-funciona", label: "Como funciona" },
    { to: "/comprar-creditos-lovable", label: "Comprar créditos" },
    { to: "/como-recarregar-lovable", label: "Recarregar Lovable" },
  ],
  Comparações: [
    { to: "/lovable-vs-bolt", label: "Lovable vs Bolt" },
    { to: "/lovable/vs/cursor", label: "Lovable vs Cursor" },
    { to: "/lovable/vs/replit", label: "Lovable vs Replit" },
    { to: "/lovable/vs/v0", label: "Lovable vs V0" },
  ],
  Guias: [
    { to: "/vibe-coding", label: "Vibe Coding" },
    { to: "/criar-app-com-ia", label: "Criar app com IA" },
    { to: "/revenda-creditos-lovable", label: "Revenda de créditos" },
    { to: "/creditos-lovable-ilimitados", label: "Créditos ilimitados" },
  ],
};

export function Footer() {
  const { user } = useAuth();
  const { notifications, readIds, markAsRead } = useNotifications();

  const latestUnread = user
    ? notifications.find((n) => !readIds.includes(n.id))
    : null;

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: false, amount: 0.3 }}
      transition={{ duration: 0.4 }}
      className="relative z-10 border-t border-border pb-20 sm:pb-8"
    >
      {/* Notification banner */}
      <AnimatePresence>
        {latestUnread && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-red-600 w-full px-4 py-3"
          >
            <div className="container mx-auto max-w-3xl flex items-start gap-3">
              <Megaphone className="h-5 w-5 text-white shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{latestUnread.title}</p>
                <p className="text-xs text-white/80 mt-0.5">{latestUnread.message}</p>
              </div>
              <button
                onClick={() => markAsRead.mutate(latestUnread.id)}
                className="shrink-0 rounded-lg p-1 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Fechar aviso"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="py-10 sm:py-14">
        <div className="container mx-auto max-w-5xl px-4">
          {/* Link columns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 mb-10">
            {Object.entries(FOOTER_LINKS).map(([title, links]) => (
              <div key={title} className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">{title}</h4>
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Logo + copyright */}
          <div className="flex flex-col items-center justify-center gap-2 pt-6 border-t border-border">
            <img src={logoImg} alt="LovaBoost" className="h-6 w-auto" />
            <span className="text-xs text-muted-foreground">© {new Date().getFullYear()} LovaBoost</span>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
