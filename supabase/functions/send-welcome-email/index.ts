import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function respond(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // ═══ AUTHENTICATION: only service_role or admin ═══
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

    // Allow service_role key directly
    if (token !== serviceRoleKey) {
      // Not service_role — must be authenticated admin
      if (!token) return respond({ error: "Unauthorized" }, 401);

      const { data: { user } } = await adminClient.auth.getUser(token);
      if (!user) return respond({ error: "Unauthorized" }, 401);

      const { data: isAdmin } = await adminClient.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      if (!isAdmin) return respond({ error: "Forbidden" }, 403);
    }

    const { user_id, email, name } = await req.json();
    if (!user_id || !email) {
      return respond({ error: "user_id and email required" }, 400);
    }

    const { data: tmpl } = await adminClient
      .from("email_templates").select("*").eq("template_key", "welcome").single();

    if (!tmpl) {
      return respond({ message: "No welcome template found" });
    }

    console.log(`Welcome email prepared for ${email} with subject: ${tmpl.subject}`);

    return respond({ success: true, email, subject: tmpl.subject });
  } catch (e) {
    return respond({ error: e.message }, 500);
  }
});
