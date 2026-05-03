'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';

export default function LanguageToggle() {
  const locale   = useLocale();
  const router   = useRouter();
  const pathname = usePathname();

  const switchTo = (newLocale: string) => {
    // Replace /ml/... or /en/... prefix with the new locale
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };

  return (
    <div className="flex items-center gap-1 bg-primary-600 rounded-full px-1 py-0.5">
      <button
        onClick={() => switchTo('ml')}
        className={`px-3 py-0.5 rounded-full text-xs font-medium font-malayalam transition-colors ${
          locale === 'ml'
            ? 'bg-secondary-400 text-primary-800 font-bold'
            : 'text-primary-200 hover:text-white'
        }`}
      >
        മലയാളം
      </button>
      <button
        onClick={() => switchTo('en')}
        className={`px-3 py-0.5 rounded-full text-xs font-medium transition-colors ${
          locale === 'en'
            ? 'bg-secondary-400 text-primary-800 font-bold'
            : 'text-primary-200 hover:text-white'
        }`}
      >
        English
      </button>
    </div>
  );
}
