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

    // Verify caller
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    // Check admin
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    const { user_id, action, payload } = await req.json();
    if (!user_id || !action) {
      return new Response(JSON.stringify({ error: "user_id and action required" }), { status: 400, headers: corsHeaders });
    }

    // ═══ SELF-ACTION GUARD ═══
    if (user_id === user.id && ["delete", "ban", "set_role"].includes(action)) {
      return new Response(JSON.stringify({ error: "Você não pode executar esta ação em si mesmo." }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let result: any = { success: true };

    switch (action) {
      case "ban": {
        const { error } = await adminClient.auth.admin.updateUserById(user_id, {
          ban_duration: "876600h",
        });
        if (error) throw error;
        // Sync is_banned flag in profiles
        await adminClient.from("profiles").update({ is_banned: true }).eq("id", user_id);
        break;
      }
      case "unban": {
        const { error } = await adminClient.auth.admin.updateUserById(user_id, {
          ban_duration: "none",
        });
        if (error) throw error;
        // Sync is_banned flag in profiles
        await adminClient.from("profiles").update({ is_banned: false }).eq("id", user_id);
        break;
      }
      case "set_role": {
        return new Response(JSON.stringify({ error: "Ação desabilitada permanentemente." }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      case "add_credits": {
        const amount = Number(payload?.amount);
        if (!amount || amount <= 0) {
          return new Response(JSON.stringify({ error: "Invalid amount" }), { status: 400, headers: corsHeaders });
        }
        const { data, error } = await adminClient.rpc("credit_wallet", {
          _user_id: user_id,
          _amount: amount,
          _description: `Crédito manual pelo admin (${user.email})`,
        });
        if (error) throw error;
        if (!data) throw new Error("Failed to credit wallet");
        break;
      }
      case "remove_credits": {
        const amount = Number(payload?.amount);
        if (!amount || amount <= 0) {
          return new Response(JSON.stringify({ error: "Invalid amount" }), { status: 400, headers: corsHeaders });
        }
        const { data, error } = await adminClient.rpc("debit_wallet", {
          _user_id: user_id,
          _amount: amount,
          _description: `Débito manual pelo admin (${user.email})`,
        });
        if (error) throw error;
        if (!data) throw new Error("Saldo insuficiente");
        break;
      }
      case "set_password": {
        const password = payload?.password;
        if (!password || password.length < 6) {
          return new Response(JSON.stringify({ error: "Password must be at least 6 characters" }), { status: 400, headers: corsHeaders });
        }
        const { error } = await adminClient.auth.admin.updateUserById(user_id, { password });
        if (error) throw error;
        break;
      }
      case "delete": {
        const { error } = await adminClient.auth.admin.deleteUser(user_id);
        if (error) throw error;
        break;
      }
      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: corsHeaders });
    }

    // ═══ AUDIT LOG ═══
    try {
      await adminClient.from("admin_audit_log").insert({
        admin_id: user.id,
        action,
        target_user_id: user_id,
        payload: payload || {},
      });
    } catch (auditErr) {
      console.error("Failed to write audit log:", auditErr);
      // Don't fail the action if audit logging fails
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
