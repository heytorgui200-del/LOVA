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

    const { template_key, user_ids } = await req.json();
    if (!template_key) {
      return new Response(JSON.stringify({ error: "template_key is required" }), { status: 400, headers: corsHeaders });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: tmpl, error: tmplErr } = await adminClient
      .from("email_templates").select("*").eq("template_key", template_key).single();
    if (tmplErr || !tmpl) {
      return new Response(JSON.stringify({ error: "Template not found" }), { status: 404, headers: corsHeaders });
    }

    const { data: { users }, error: usersErr } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    if (usersErr) throw usersErr;

    let targets = users;
    if (user_ids && user_ids.length > 0) {
      targets = users.filter((u: any) => user_ids.includes(u.id));
    }

    const { data: profiles } = await adminClient.from("profiles").select("*");
    const profilesMap: Record<string, any> = {};
    (profiles || []).forEach((p: any) => { profilesMap[p.id] = p; });

    let sent = 0;
    let failed = 0;

    for (const u of targets) {
      try {
        const name = profilesMap[u.id]?.full_name || "Usuário";
        const bodyHtml = tmpl.body_html
          .replace(/\{\{name\}\}/g, name)
          .replace(/\{\{email\}\}/g, u.email || "");
        sent++;
      } catch {
        failed++;
      }
    }

    return new Response(JSON.stringify({ sent, failed, total: targets.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
