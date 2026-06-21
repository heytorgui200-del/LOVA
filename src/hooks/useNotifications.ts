import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Notification {
  id: string;
  title: string;
  message: string;
  created_by: string;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user,
  });

  const { data: readIds = [] } = useQuery({
    queryKey: ["notification-reads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_reads")
        .select("notification_id");
      if (error) throw error;
      return data.map((r) => r.notification_id);
    },
    enabled: !!user,
  });

  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length;

  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user) return;
      const { error } = await supabase
        .from("notification_reads")
        .insert({ notification_id: notificationId, user_id: user.id });
      if (error && !error.message.includes("duplicate")) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notification-reads"] }),
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const unread = notifications.filter((n) => !readIds.includes(n.id));
      if (unread.length === 0) return;
      const rows = unread.map((n) => ({ notification_id: n.id, user_id: user.id }));
      const { error } = await supabase.from("notification_reads").insert(rows);
      if (error && !error.message.includes("duplicate")) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notification-reads"] }),
  });

  return { notifications, unreadCount, readIds, markAsRead, markAllAsRead };
}
