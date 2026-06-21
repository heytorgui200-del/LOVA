import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { fetchWhatsAppLink, FALLBACK_LINK, openWhatsApp } from '@/lib/whatsapp';

export const WhatsAppButton = () => {
  const [link, setLink] = useState(FALLBACK_LINK);

  useEffect(() => {
    fetchWhatsAppLink().then(setLink);
  }, []);

  return (
    <button
      onClick={() => openWhatsApp(link)}
      className="fixed bottom-6 right-6 z-[9999] bg-[#25D366] hover:bg-[#1DA851] text-white p-4 rounded-full shadow-[0_0_20px_rgba(37,211,102,0.4)] transition-all transform hover:scale-110 flex items-center justify-center cursor-pointer"
      aria-label="Suporte via WhatsApp"
    >
      <MessageCircle size={28} />
    </button>
  );
};
