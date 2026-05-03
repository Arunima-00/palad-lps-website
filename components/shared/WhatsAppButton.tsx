'use client';

import { useLocale } from 'next-intl';
import { SCHOOL } from '@/lib/schoolData';

export default function WhatsAppButton() {
  const locale = useLocale();
  const label  = locale === 'ml' ? 'WhatsApp-ൽ ചോദിക്കൂ' : 'Chat on WhatsApp';

  return (
    <a
      href={`https://wa.me/${SCHOOL.whatsappNumber}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
    >
      {/* WhatsApp SVG icon */}
      <svg viewBox="0 0 32 32" className="h-6 w-6 fill-white" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 .5C7.44.5.5 7.44.5 16c0 2.77.72 5.43 2.1 7.78L.5 31.5l7.93-2.08A15.45 15.45 0 0016 31.5C24.56 31.5 31.5 24.56 31.5 16S24.56.5 16 .5zm0 28.3a13.2 13.2 0 01-6.74-1.85l-.48-.29-4.7 1.23 1.26-4.6-.31-.5A13.27 13.27 0 1116 28.8zm7.28-9.93c-.4-.2-2.36-1.16-2.73-1.3-.37-.13-.63-.2-.9.2-.26.4-1.03 1.3-1.26 1.56-.23.27-.47.3-.87.1-.4-.2-1.68-.62-3.2-1.98-1.18-1.05-1.98-2.35-2.21-2.75-.23-.4-.02-.61.17-.81.18-.18.4-.47.6-.7.2-.23.26-.4.4-.66.13-.27.07-.5-.03-.7-.1-.2-.9-2.17-1.23-2.97-.32-.78-.65-.67-.9-.68l-.76-.01c-.27 0-.7.1-1.06.5-.37.4-1.4 1.37-1.4 3.33s1.43 3.87 1.63 4.13c.2.27 2.82 4.3 6.83 6.03.95.41 1.7.66 2.28.84.96.3 1.83.26 2.52.16.77-.11 2.36-.96 2.7-1.9.33-.93.33-1.73.23-1.9-.1-.17-.37-.27-.77-.47z"/>
      </svg>
      <span className={`text-sm font-medium hidden sm:inline ${locale === 'ml' ? 'font-malayalam' : ''}`}>
        {label}
      </span>
    </a>
  );
}
