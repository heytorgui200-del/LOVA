import { supabase } from "@/integrations/supabase/client";

const DEFAULT_PHONE = "5516981968813";
export const FALLBACK_LINK = `https://wa.me/${DEFAULT_PHONE}`;
export { FALLBACK_LINK as SUPPORT_LINK_FALLBACK };

let cache: { link: string; expiresAt: number } | null = null;

export function clearWhatsAppCache() {
  cache = null;
}

function buildLink(value: string): string {
  if (!value) return FALLBACK_LINK;
  if (value.startsWith("http")) return value;
  const digits = value.replace(/\D/g, "");
  if (!digits) return FALLBACK_LINK;
  const phone = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${phone}`;
}

export async function fetchWhatsAppLink(): Promise<string> {
  const now = Date.now();
  if (cache && now < cache.expiresAt) return cache.link;
  try {
    const { data } = await supabase
      .from("api_config")
      .select("key_value")
      .eq("key_name", "whatsapp_number")
      .maybeSingle();
    if (data?.key_value) {
      const link = buildLink(data.key_value);
      cache = { link, expiresAt: now + 60_000 };
      return link;
    }
  } catch {}
  return FALLBACK_LINK;
}

export function getWhatsAppLink(configValue?: string): string {
  if (configValue) return buildLink(configValue);
  return cache?.link ?? FALLBACK_LINK;
}

export function openWhatsApp(link?: string): void {
  const url = link || cache?.link || FALLBACK_LINK;
  window.open(url, "_blank", "noopener,noreferrer");
}

export function getResellerWhatsAppLink(): string {
  const phone = cache?.link
    ? cache.link.replace("https://wa.me/", "").split("?")[0]
    : DEFAULT_PHONE;
  return `https://wa.me/${phone}?text=Ol%C3%A1%2C%20quero%20ser%20um%20revendedor%20e%20entrar%20no%20Grupo%20VIP!`;
}
