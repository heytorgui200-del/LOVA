import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Notification {
  id: string;
  title: string;
  message: string;
}

export function PublicAnnouncementBanner() {
  const [notification, setNotification] = useState<Notification | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    supabase
      .from("notifications")
      .select("id, title, message")
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data?.[0]) {
          const n = data[0] as Notification;
          const key = `announcement_dismissed_${n.id}`;
          if (!localStorage.getItem(key)) {
            setNotification(n);
          }
        }
      });
  }, []);

  const handleDismiss = () => {
    if (notification) {
      localStorage.setItem(`announcement_dismissed_${notification.id}`, "1");
    }
    setDismissed(true);
  };

  const visible = notification && !dismissed;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-2xl mx-auto mb-6"
        >
          <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 backdrop-blur-sm px-4 py-3">
            <Megaphone className="h-4 w-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold text-foreground">{notification!.title}</span>
              <span className="text-sm text-muted-foreground ml-1.5">{notification!.message}</span>
            </div>
            <button
              onClick={handleDismiss}
              className="shrink-0 p-1 rounded-md hover:bg-primary/10 transition-colors"
              aria-label="Fechar"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
