import { useEffect, useState } from "react";
import { fetchWhatsAppLink, SUPPORT_LINK_FALLBACK } from "@/lib/whatsapp";

export function useWhatsAppLink() {
  const [link, setLink] = useState(SUPPORT_LINK_FALLBACK);
  useEffect(() => { fetchWhatsAppLink().then(setLink); }, []);
  return link;
}
