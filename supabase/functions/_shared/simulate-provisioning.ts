// Shared simulation helpers for local provisioning (no external API dependency)

const EMAIL_DOMAIN = "seudominio.com";

export function generateRandomEmail(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const arr = new Uint8Array(8);
  crypto.getRandomValues(arr);
  let random = "";
  for (let i = 0; i < 8; i++) {
    random += chars[arr[i] % chars.length];
  }
  return `lovable-${random}@${EMAIL_DOMAIN}`;
}

export function generateFakeOrderId(): number {
  return Math.floor(100000 + Math.random() * 900000);
}

export function simulateCreateOrder(credits: number): {
  ok: true;
  order_id: number;
  master_email: string;
} {
  return {
    ok: true,
    order_id: generateFakeOrderId(),
    master_email: generateRandomEmail(),
  };
}

// Timing constants (in milliseconds)
const PHASE_PERMISSION_MS = 15_000; // 15s → permission detected
const PHASE_CREDITS_MS = 20_000; // 20s → credits deposited
const PHASE_COMPLETED_MS = 25_000; // 25s → completed

export function simulateCheckStatus(
  orderId: string,
  createdAt: string,
  masterEmail: string | null,
  credits: number,
): {
  status: string;
  credits_requested: number;
  credits_delivered: number;
  master_email: string | null;
} {
  const elapsed = Date.now() - new Date(createdAt).getTime();

  if (elapsed >= PHASE_COMPLETED_MS) {
    return {
      status: "completed",
      credits_requested: credits,
      credits_delivered: credits,
      master_email: masterEmail,
    };
  }

  if (elapsed >= PHASE_CREDITS_MS) {
    return {
      status: "provisioning",
      credits_requested: credits,
      credits_delivered: credits,
      master_email: masterEmail,
    };
  }

  return {
    status: "provisioning",
    credits_requested: credits,
    credits_delivered: 0,
    master_email: masterEmail,
  };
}

export function simulateGetEvents(
  _orderId: string,
  masterEmail: string | null,
  createdAt: string,
  credits: number,
): { events: Array<{ event: string; message: string; created_at: string }> } {
  const elapsed = Date.now() - new Date(createdAt).getTime();
  const events: Array<{ event: string; message: string; created_at: string }> = [];
  const baseTime = new Date(createdAt).getTime();

  // Order created event (always present)
  events.push({
    event: "action",
    message: `Ordem criada${masterEmail ? ` para ${masterEmail}` : ""}`,
    created_at: new Date(baseTime).toISOString(),
  });

  if (elapsed >= PHASE_PERMISSION_MS) {
    // Permission detected event
    events.push({
      event: "action",
      message: "Permissão detectada",
      created_at: new Date(baseTime + PHASE_PERMISSION_MS).toISOString(),
    });
  }

  if (elapsed >= PHASE_CREDITS_MS) {
    // Credit events (10 credits each)
    const creditCount = Math.floor(credits / 10);
    for (let i = 0; i < creditCount; i++) {
      events.push({
        event: "credit",
        message: `+10 créditos`,
        created_at: new Date(baseTime + PHASE_CREDITS_MS + i * 100).toISOString(),
      });
    }
  }

  return { events };
}
