'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Phone, Mail, MapPin, GraduationCap } from 'lucide-react';
import { SCHOOL } from '@/lib/schoolData';
import { getSchoolInfo, getSiteSettings } from '@/lib/db';

const QUICK_LINKS = [
  { labelEn: 'About',         labelMl: 'ഞങ്ങളെ കുറിച്ച്',           href: '/about'       },
  { labelEn: 'Academics',     labelMl: 'അക്കാദമിക്',                  href: '/academics'   },
  { labelEn: 'Admissions',    labelMl: 'പ്രവേശനം',                    href: '/admissions'  },
  { labelEn: 'Gallery',       labelMl: 'ഗ്യാലറി',                     href: '/gallery'     },
  { labelEn: 'News & Events', labelMl: 'വാർത്തകൾ & ഇവന്റുകൾ',       href: '/news-events' },
  { labelEn: 'Contact',       labelMl: 'ബന്ധപ്പെടുക',                 href: '/contact'     },
];

export default function Footer() {
  const locale = useLocale() as 'ml' | 'en';
  const ml     = locale === 'ml';

  const [school,   setSchool]   = useState(SCHOOL);
  const [logoUrl,  setLogoUrl]  = useState('');
  const [descEn,   setDescEn]   = useState('A premier primary school in Kodolipuram, Mattanur, Kannur, providing quality education since 1935.');
  const [descMl,   setDescMl]   = useState('1935 മുതൽ ഗുണമേന്മയുള്ള വിദ്യാഭ്യാസം നൽകി വരുന്ന കോഡോലിപുരം, മട്ടന്നൂർ, കണ്ണൂർ ജില്ലയിലെ ഒരു പ്രമുഖ പ്രൈമറി സ്കൂൾ.');
  const [navLabels, setNavLabels] = useState<Record<string, { en: string; ml: string }>>({});

  useEffect(() => {
    getSchoolInfo().then(info => {
      if (info) setSchool(prev => ({ ...prev, ...(info as any) }));
    }).catch(() => {});
    getSiteSettings().then((s: any) => {
      if (s.logoUrl)       setLogoUrl(s.logoUrl);
      if (s.footerDescEn)  setDescEn(s.footerDescEn);
      if (s.footerDescMl)  setDescMl(s.footerDescMl);
      if (s.nav)           setNavLabels(s.nav);
    }).catch(() => {});
  }, []);

  const linkLabel = (key: string, defaultEn: string, defaultMl: string) =>
    ml ? (navLabels[key]?.ml || defaultMl) : (navLabels[key]?.en || defaultEn);

  const address = (school.address as any)?.[locale] ?? school.address[locale];

  return (
    <footer className="bg-primary-800 text-primary-100">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Brand */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-secondary-400 rounded-full p-1.5 w-9 h-9 flex items-center justify-center overflow-hidden shrink-0">
              {logoUrl
                ? <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                : <GraduationCap className="h-5 w-5 text-primary-700" />}
            </div>
            <span className={`font-bold text-white text-lg ${ml ? 'font-malayalam' : ''}`}>
              {ml ? (school.name as any)?.ml ?? school.name.ml : (school.name as any)?.en ?? school.name.en}
            </span>
          </div>
          <p className={`text-sm text-primary-300 leading-relaxed ${ml ? 'font-malayalam' : ''}`}>
            {ml ? descMl : descEn}
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className={`font-semibold text-white mb-4 ${ml ? 'font-malayalam' : ''}`}>
            {ml ? 'ദ്രുത ലിങ്കുകൾ' : 'Quick Links'}
          </h3>
          <ul className="space-y-2">
            {QUICK_LINKS.map(({ labelEn, labelMl, href }) => (
              <li key={href}>
                <Link href={`/${locale}${href}`}
                  className={`text-sm text-primary-300 hover:text-secondary-400 transition-colors ${ml ? 'font-malayalam' : ''}`}>
                  → {linkLabel(href.replace('/', '').replace('-', ''), labelEn, labelMl)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className={`font-semibold text-white mb-4 ${ml ? 'font-malayalam' : ''}`}>
            {ml ? 'ബന്ധപ്പെടുക' : 'Contact Us'}
          </h3>
          <ul className="space-y-3 text-sm text-primary-300">
            <li className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 text-secondary-400 shrink-0" />
              <span className={ml ? 'font-malayalam' : ''}>{address}</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-secondary-400 shrink-0" />
              <a href={`tel:${school.phone}`} className="hover:text-secondary-400">{school.phone}</a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-secondary-400 shrink-0" />
              <a href={`mailto:${school.email}`} className="hover:text-secondary-400">{school.email}</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-primary-700 py-4 text-center text-xs text-primary-400">
        © {new Date().getFullYear()} {ml ? school.name.ml : school.name.en}. {ml ? 'എല്ലാ അവകാശങ്ങളും നിക്ഷിപ്തം.' : 'All rights reserved.'}
      </div>
    </footer>
  );
}
