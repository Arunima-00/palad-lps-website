'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { ArrowRight, BookOpen, Eye, Users } from 'lucide-react';
import { SCHOOL, STAFF } from '@/lib/schoolData';
import { getCol, getSchoolInfo } from '@/lib/db';

export default function AboutPage() {
  const t      = useTranslations();
  const locale = useLocale() as 'ml' | 'en';
  const ml     = locale === 'ml';

  const [school, setSchool] = useState(SCHOOL);
  const [staff,  setStaff]  = useState(STAFF);

  useEffect(() => {
    getSchoolInfo().then(info => {
      if (info) setSchool(prev => ({ ...prev, ...(info as any) }));
    }).catch(() => {});
    getCol('staff').then(data => {
      if ((data as any[]).length) setStaff(data as typeof STAFF);
    }).catch(() => {});
  }, []);

  const subPages = [
    { icon: BookOpen, href: '/about/history',        labelMl: 'ഞങ്ങളുടെ ചരിത്രം',     labelEn: 'Our History',      descMl: '1935-ൽ ആരംഭിച്ച ഞങ്ങളുടെ യാത്ര',    descEn: 'Our journey since 1935' },
    { icon: Eye,      href: '/about/vision-mission', labelMl: 'ദർശനവും ദൗത്യവും',     labelEn: 'Vision & Mission', descMl: 'ഞങ്ങൾ വിശ്വസിക്കുന്നത്',              descEn: 'What we believe in'    },
    { icon: Users,    href: '/about/staff',          labelMl: 'ഞങ്ങളുടെ അദ്ധ്യാപകർ',  labelEn: 'Our Staff',        descMl: 'സ്കൂളിന്റെ നെടുംതൂൺ',                  descEn: 'The backbone of school' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Page header */}
      <div className="mb-10">
        <h1 className={`text-4xl font-bold text-primary-700 mb-2 ${ml ? 'font-malayalam' : ''}`}>
          {t('about.title')}
        </h1>
        <div className="h-1 w-20 bg-secondary-400 rounded-full" />
      </div>

      {/* Principal's message */}
      <div className="card p-8 mb-10 flex flex-col md:flex-row gap-8 items-start">
        <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center text-4xl shrink-0">
          👨‍🏫
        </div>
        <div>
          <h2 className={`text-xl font-bold text-primary-700 mb-1 ${ml ? 'font-malayalam' : ''}`}>
            {t('about.principalMsg')}
          </h2>
          <div className={`text-sm text-gray-500 mb-3 ${ml ? 'font-malayalam' : ''}`}>
            {(school as any).principal ?? school.principal} · {ml ? 'പ്രിൻസിപ്പൽ' : 'Principal'}
          </div>
          <p className={`text-gray-700 leading-relaxed ${ml ? 'font-malayalam' : ''}`}>
            {ml
              ? 'ഞങ്ങളുടെ വിദ്യാർഥികൾക്ക് ഒരു സുരക്ഷിതവും ഊർജ്ജദായകവുമായ പഠന അന്തരീക്ഷം ഒരുക്കുക എന്നതാണ് ഞങ്ങളുടെ ലക്ഷ്യം. ഓരോ കുട്ടിക്കും ഓരോ സ്വപ്‌നം ഉണ്ട് — ആ സ്വപ്‌നം യാഥാർഥ്യമാക്കാൻ ഞങ്ങൾ പ്രതിജ്ഞാബദ്ധരാണ്.'
              : 'Our goal is to provide a safe and energising learning environment for our students. Every child has a dream — we are committed to making that dream a reality through quality education and personal care.'}
          </p>
        </div>
      </div>

      {/* At a glance */}
      <div className="mb-10">
        <h2 className={`text-2xl font-bold text-primary-700 mb-6 ${ml ? 'font-malayalam' : ''}`}>
          {t('about.schoolAtGlance')}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { labelMl: 'UDISE',        labelEn: 'UDISE Code',   value: school.udise },
            { labelMl: 'സ്ഥാപനം',     labelEn: 'Founded',      value: school.founded },
            { labelMl: 'അംഗീകാരം',    labelEn: 'Recognition',  value: school.recognition },
            { labelMl: 'തരം',          labelEn: 'Type',         value: school.type[locale] },
            { labelMl: 'ക്ലാസുകൾ',    labelEn: 'Classes',      value: (school as any).classes ?? school.classes },
            { labelMl: 'മാദ്ധ്യമം',   labelEn: 'Medium',       value: school.medium[locale] },
            { labelMl: 'വിദ്യാർഥികൾ', labelEn: 'Students',     value: `${school.students.total}` },
            { labelMl: 'അദ്ധ്യാപകർ',  labelEn: 'Teachers',     value: `${(school as any).teachers ?? school.teachers}` },
          ].map(item => (
            <div key={item.labelEn} className="bg-primary-50 rounded-xl p-4">
              <div className={`text-xs text-gray-500 ${ml ? 'font-malayalam' : ''}`}>
                {ml ? item.labelMl : item.labelEn}
              </div>
              <div className={`font-bold text-primary-700 mt-1 ${ml ? 'font-malayalam' : ''}`}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sub-page cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {subPages.map(({ icon: Icon, href, labelMl, labelEn, descMl, descEn }) => (
          <Link key={href} href={`/${locale}${href}`}
            className="card p-6 flex flex-col items-center text-center hover:-translate-y-1 transition-transform group">
            <div className="bg-primary-100 group-hover:bg-primary-600 rounded-2xl p-4 mb-4 transition-colors">
              <Icon className="h-8 w-8 text-primary-600 group-hover:text-white transition-colors" />
            </div>
            <h3 className={`font-bold text-gray-800 mb-1 ${ml ? 'font-malayalam' : ''}`}>
              {ml ? labelMl : labelEn}
            </h3>
            <p className={`text-gray-500 text-sm mb-3 ${ml ? 'font-malayalam' : ''}`}>
              {ml ? descMl : descEn}
            </p>
            <span className="text-primary-600 text-sm flex items-center gap-1">
              {t('sections.readMore')} <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        ))}
      </div>

      {/* Staff preview */}
      <h2 className={`text-2xl font-bold text-primary-700 mb-6 ${ml ? 'font-malayalam' : ''}`}>
        {t('about.staff')}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {staff.map(s => (
          <div key={s.id} className="card p-4 text-center">
            <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center text-2xl mx-auto mb-3">
              {s.roleMl === 'പ്രിൻസിപ്പൽ' ? '👨‍🏫' : s.roleMl === 'പ്രീ-പ്രൈമറി അദ്ധ്യാപിക' ? '👩‍🏫' : '🧑‍🏫'}
            </div>
            <div className="font-semibold text-sm text-gray-800">{s.name}</div>
            <div className={`text-xs text-primary-600 mt-0.5 ${ml ? 'font-malayalam' : ''}`}>
              {ml ? s.roleMl : s.roleEn}
            </div>
            <div className={`text-xs text-gray-400 mt-0.5 ${ml ? 'font-malayalam' : ''}`}>
              {ml ? s.subjectMl : s.subjectEn}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
