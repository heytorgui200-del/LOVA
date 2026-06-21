import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  wallet_balance: number;
  is_banned: boolean;
}

interface ResellerInfo {
  status: string;
  margin_pct: number;
  store_name: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  isReseller: boolean;
  resellerInfo: ResellerInfo | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  isAdmin: false,
  isReseller: false,
  resellerInfo: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isReseller, setIsReseller] = useState(false);
  const [resellerInfo, setResellerInfo] = useState<ResellerInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, wallet_balance, is_banned")
      .eq("id", userId)
      .single();
    if (data?.is_banned) {
      console.warn("Conta banida detectada — forçando logout");
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      setIsAdmin(false);
      setIsReseller(false);
      setResellerInfo(null);
      setLoading(false);
      window.location.href = "/banned";
      return;
    }
    setProfile(data ? { ...data, wallet_balance: Number(data.wallet_balance) || 0, is_banned: !!data.is_banned } : null);
  };

  const fetchReseller = async (userId: string) => {
    const { data } = await supabase
      .from("resellers")
      .select("status, margin_pct, store_name")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();
    setIsReseller(!!data);
    setResellerInfo(data ? { status: data.status, margin_pct: data.margin_pct ?? 12, store_name: data.store_name ?? null } : null);
  };

  const checkAdmin = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    setIsAdmin(!!data);
  };

  useEffect(() => {
    let cancelled = false;

    const loadUser = async (userId: string) => {
      await Promise.all([
        fetchProfile(userId),
        checkAdmin(userId),
        fetchReseller(userId),
      ]);
      if (!cancelled) setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadUser(session.user.id);
        } else {
          setProfile(null);
          setIsAdmin(false);
          setIsReseller(false);
          setResellerInfo(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: { user: validUser }, error } = await supabase.auth.getUser();
        if (error || !validUser) {
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setProfile(null);
          setIsAdmin(false);
          setLoading(false);
          return;
        }
        setSession(session);
        setUser(validUser);
        await loadUser(validUser.id);
      } else {
        setSession(null);
        setUser(null);
        setLoading(false);
      }
    });

    return () => { cancelled = true; subscription.unsubscribe(); };
  }, []);

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAdmin(false);
    setIsReseller(false);
    setResellerInfo(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, isAdmin, isReseller, resellerInfo, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
