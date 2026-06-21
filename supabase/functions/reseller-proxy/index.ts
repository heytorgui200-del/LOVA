import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { simulateCheckStatus, simulateGetEvents } from "../_shared/simulate-provisioning.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function respond(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

const ALLOWED_ACTIONS = new Set([
  'check_status',
  'get_events',
  'list_orders',
  'get_prices',
  'list_products',
  'get_pricing',
]);

// Actions that require admin role
const ADMIN_ONLY_ACTIONS = new Set(['list_orders', 'list_products', 'get_prices', 'get_pricing']);

// Actions that require ownership verification
const OWNER_ACTIONS = new Set(['check_status', 'get_events']);

// Whitelist of allowed fields per action
const ALLOWED_FIELDS: Record<string, string[]> = {
  check_status: ['action', 'order_id'],
  get_events: ['action', 'order_id'],
  list_orders: ['action', 'limit', 'offset', 'status'],
  get_prices: ['action'],
  list_products: ['action'],
  get_pricing: ['action'],
};

function sanitizeBody(body: Record<string, unknown>, action: string): Record<string, unknown> {
  const allowed = ALLOWED_FIELDS[action];
  if (!allowed) return { action };
  const sanitized: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) sanitized[key] = body[key];
  }
  return sanitized;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // ═══ AUTHENTICATION REQUIRED ═══
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (!token) {
      return respond({ error: 'Unauthorized' }, 401);
    }

    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return respond({ error: 'Unauthorized' }, 401);
    }

    const body = await req.json();
    const { action } = body ?? {};

    if (!action || !ALLOWED_ACTIONS.has(action)) {
      return respond({ error: 'Invalid action' }, 400);
    }

    // ═══ AUTHORIZATION CHECKS ═══

    // Admin-only actions
    if (ADMIN_ONLY_ACTIONS.has(action)) {
      const { data: isAdmin } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin',
      });
      if (!isAdmin) {
        return respond({ error: 'Forbidden' }, 403);
      }
    }

    // Owner actions: verify user owns the order
    let targetOrder: Record<string, unknown> | null = null;
    if (OWNER_ACTIONS.has(action)) {
      const orderId = body.order_id;
      if (!orderId) {
        return respond({ error: 'Missing order_id' }, 400);
      }

      // Check if user is admin (admins can access any order)
      const { data: isAdmin } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin',
      });

      if (!isAdmin) {
        // Verify ownership via order_id_lovable
        const { data: order } = await supabase
          .from('orders')
          .select('user_id, id, created_at, master_email, credits')
          .eq('order_id_lovable', String(orderId))
          .maybeSingle();

        if (!order || order.user_id !== user.id) {
          return respond({ error: 'Not found' }, 404);
        }
        targetOrder = order;
      } else {
        const { data: order } = await supabase
          .from('orders')
          .select('id, created_at, master_email, credits')
          .eq('order_id_lovable', String(orderId))
          .maybeSingle();
        targetOrder = order;
      }
    }

    // ═══ SIMULATED RESPONSES (no external API) ═══
    if (action === 'check_status' && targetOrder) {
      const statusResult = simulateCheckStatus(
        String(targetOrder.id),
        String(targetOrder.created_at),
        targetOrder.master_email as string | null,
        targetOrder.credits as number,
      );
      return respond(statusResult);
    }

    if (action === 'get_events' && targetOrder) {
      const eventsResult = simulateGetEvents(
        String(targetOrder.id),
        targetOrder.master_email as string | null,
        String(targetOrder.created_at),
        targetOrder.credits as number,
      );
      return respond(eventsResult);
    }

    // Admin-only actions: return empty/mock data
    if (action === 'list_orders') {
      return respond({ orders: [], total: 0 });
    }
    if (action === 'get_prices' || action === 'get_pricing') {
      return respond({ prices: {} });
    }
    if (action === 'list_products') {
      return respond({ products: [] });
    }

    return respond({ error: 'Unknown action' }, 400);
  } catch (err) {
    console.error('reseller-proxy error:', err);
    return respond({ error: 'Internal server error' }, 500);
  }
});
