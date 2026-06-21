import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller is admin using user's token
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    // Check admin role using service role client (has_role RPC is not callable by authenticated users)
    const adminClientForRoleCheck = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleData } = await adminClientForRoleCheck
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    // Use service role to list auth users
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: { users }, error } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    if (error) throw error;

    // Get roles & profiles
    const { data: roles } = await adminClient.from("user_roles").select("*");
    const rolesMap: Record<string, string> = {};
    (roles || []).forEach((r: any) => {
      // Prioritize admin over user
      if (!rolesMap[r.user_id] || r.role === "admin") {
        rolesMap[r.user_id] = r.role;
      }
    });

    const { data: profiles } = await adminClient.from("profiles").select("*");
    const profilesMap: Record<string, any> = {};
    (profiles || []).forEach((p: any) => { profilesMap[p.id] = p; });

    const result = users.map((u: any) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      banned: !!u.banned_until,
      role: rolesMap[u.id] || "user",
      full_name: profilesMap[u.id]?.full_name || null,
      wallet_balance: Number(profilesMap[u.id]?.wallet_balance) || 0,
    }));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
