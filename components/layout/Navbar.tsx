'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Menu, X, GraduationCap } from 'lucide-react';
import clsx from 'clsx';
import LanguageToggle from './LanguageToggle';
import { getSiteSettings } from '@/lib/db';

export const NAV_KEYS = [
  { key: 'home',         href: '/',             defaultEn: 'Home',          defaultMl: 'ഹോം' },
  { key: 'about',        href: '/about',        defaultEn: 'About',         defaultMl: 'ഞങ്ങളെ കുറിച്ച്' },
  { key: 'academics',    href: '/academics',    defaultEn: 'Academics',     defaultMl: 'അക്കാദമിക്' },
  { key: 'admissions',   href: '/admissions',   defaultEn: 'Admissions',    defaultMl: 'പ്രവേശനം' },
  { key: 'activities',   href: '/activities',   defaultEn: 'Activities',    defaultMl: 'പ്രവർത്തനങ്ങൾ' },
  { key: 'gallery',      href: '/gallery',      defaultEn: 'Gallery',       defaultMl: 'ഗ്യാലറി' },
  { key: 'news',         href: '/news-events',  defaultEn: 'News & Events', defaultMl: 'വാർത്തകൾ & ഇവന്റുകൾ' },
  { key: 'achievements', href: '/achievements', defaultEn: 'Achievements',  defaultMl: 'നേട്ടങ്ങൾ' },
  { key: 'pta',          href: '/pta',          defaultEn: 'PTA',           defaultMl: 'പി.ടി.എ' },
  { key: 'contact',      href: '/contact',      defaultEn: 'Contact',       defaultMl: 'ബന്ധപ്പെടുക' },
] as const;

interface NavSettings {
  logoUrl?:      string;
  schoolNameEn?: string;
  schoolNameMl?: string;
  locationEn?:   string;
  locationMl?:   string;
  phone?:        string;
  email?:        string;
  nav?:          Record<string, { en: string; ml: string }>;
}

const DEFAULTS: NavSettings = {
  schoolNameEn: 'Palad LPS',
  schoolNameMl: 'പാളാട് എൽ പി എസ്',
  locationEn:   'Mattanur, Kannur',
  locationMl:   'മട്ടന്നൂർ, കണ്ണൂർ',
  phone:        '9746696447',
  email:        'paladlps51@gmail.com',
};

export default function Navbar() {
  const locale   = useLocale();
  const pathname = usePathname();
  const ml       = locale === 'ml';
  const [open,    setOpen]    = useState(false);
  const [ns,      setNs]      = useState<NavSettings>(DEFAULTS);

  useEffect(() => {
    getSiteSettings().then(s => setNs({ ...DEFAULTS, ...s })).catch(() => {});
  }, []);

  const isActive = (href: string) => {
    const full = `/${locale}${href === '/' ? '' : href}`;
    return pathname === full || (href !== '/' && pathname.startsWith(full));
  };

  const navLabel = (key: string, defaultEn: string, defaultMl: string) =>
    ml
      ? (ns.nav?.[key]?.ml || defaultMl)
      : (ns.nav?.[key]?.en || defaultEn);

  return (
    <header className="sticky top-0 z-50 bg-primary-600 shadow-lg">
      {/* Top bar */}
      <div className="bg-primary-700 text-primary-100 text-xs py-1 px-4 flex justify-between items-center">
        <span>📞 {ns.phone} &nbsp;|&nbsp; ✉ {ns.email}</span>
        <LanguageToggle />
      </div>

      {/* Main nav */}
      <nav className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo + school name */}
        <Link href={`/${locale}`} className="flex items-center gap-2 text-white">
          <div className="bg-secondary-400 rounded-full p-1.5 w-10 h-10 flex items-center justify-center overflow-hidden shrink-0">
            {ns.logoUrl
              ? <img src={ns.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              : <GraduationCap className="h-6 w-6 text-primary-700" />}
          </div>
          <div className="leading-tight">
            <div className={clsx('font-bold text-base', ml ? 'font-malayalam' : '')}>
              {ml ? ns.schoolNameMl : ns.schoolNameEn}
            </div>
            <div className={clsx('text-primary-200 text-xs hidden sm:block', ml ? 'font-malayalam' : '')}>
              {ml ? ns.locationMl : ns.locationEn}
            </div>
          </div>
        </Link>

        {/* Desktop links */}
        <ul className="hidden xl:flex items-center gap-1">
          {NAV_KEYS.map(({ key, href, defaultEn, defaultMl }) => (
            <li key={key}>
              <Link
                href={`/${locale}${href === '/' ? '' : href}`}
                className={clsx(
                  'px-3 py-2 rounded text-sm font-medium transition-colors',
                  ml ? 'font-malayalam' : '',
                  isActive(href)
                    ? 'bg-secondary-400 text-primary-800'
                    : 'text-primary-100 hover:bg-primary-500 hover:text-white'
                )}
              >
                {navLabel(key, defaultEn, defaultMl)}
              </Link>
            </li>
          ))}
        </ul>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="xl:hidden text-white p-2 rounded hover:bg-primary-500"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="xl:hidden bg-primary-700 border-t border-primary-500 pb-3">
          {NAV_KEYS.map(({ key, href, defaultEn, defaultMl }) => (
            <Link
              key={key}
              href={`/${locale}${href === '/' ? '' : href}`}
              onClick={() => setOpen(false)}
              className={clsx(
                'block px-6 py-3 text-sm font-medium transition-colors',
                ml ? 'font-malayalam' : '',
                isActive(href)
                  ? 'bg-secondary-400 text-primary-800'
                  : 'text-primary-100 hover:bg-primary-600'
              )}
            >
              {navLabel(key, defaultEn, defaultMl)}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
