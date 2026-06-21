import React, { createContext, useContext, useEffect, useState, useCallback, useRef, memo } from "react";
import { supabase } from "@/integrations/supabase/client";

const SALES_BASE = 127;

interface MetricsState {
  onlineCount: number;
  totalSales: number;
  salesLoading: boolean;
}

const MetricsContext = createContext<MetricsState>({
  onlineCount: 0,
  totalSales: SALES_BASE,
  salesLoading: true,
});

export const useMetrics = () => useContext(MetricsContext);

export const MetricsProvider = memo(function MetricsProvider({ children }: { children: React.ReactNode }) {
  const [onlineCount, setOnlineCount] = useState(0);
  const [totalSales, setTotalSales] = useState(SALES_BASE);
  const [salesLoading, setSalesLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch completed orders count
  const fetchSales = useCallback(async () => {
    try {
      const { data } = await supabase.rpc("get_completed_orders_count");
      if (typeof data === "number") {
        setTotalSales(SALES_BASE + data);
      }
    } catch {
      // silent
    } finally {
      setSalesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSales();

    // Poll for new completed orders every 30 seconds
    const interval = setInterval(fetchSales, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchSales]);

  // Supabase Presence for online users (base of 30 + real presence)
  useEffect(() => {
    const ONLINE_BASE = 30;
    const uniqueKey = `anon-${crypto.randomUUID()}`;

    const channel = supabase.channel("room:public", {
      config: { presence: { key: uniqueKey } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const count = Object.keys(state).length;
        setOnlineCount(ONLINE_BASE + count);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, []);

  return (
    <MetricsContext.Provider value={{ onlineCount, totalSales, salesLoading }}>
      {children}
    </MetricsContext.Provider>
  );
});
