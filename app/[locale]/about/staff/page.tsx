'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { Phone } from 'lucide-react';
import { SCHOOL, STAFF } from '@/lib/schoolData';
import { getCol, getSchoolInfo } from '@/lib/db';

export default function StaffPage() {
  const locale = useLocale() as 'ml' | 'en';
  const ml     = locale === 'ml';

  const [staff,  setStaff]  = useState(STAFF);
  const [school, setSchool] = useState(SCHOOL);

  useEffect(() => {
    getCol('staff').then(data => {
      if ((data as any[]).length) setStaff(data as typeof STAFF);
    }).catch(() => {});
    getSchoolInfo().then(info => {
      if (info) setSchool({ ...SCHOOL, ...(info as any) });
    }).catch(() => {});
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className={`text-4xl font-bold text-primary-700 mb-2 ${ml ? 'font-malayalam' : ''}`}>
        {ml ? 'ഞങ്ങളുടെ അദ്ധ്യാപക സംഘം' : 'Our Teaching Staff'}
      </h1>
      <div className="h-1 w-20 bg-secondary-400 rounded-full mb-10" />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {staff.map(s => (
          <div key={s.id} className="card p-6 text-center hover:-translate-y-1 transition-transform">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
              {s.roleMl === 'പ്രിൻസിപ്പൽ' ? '👨‍🏫' : s.roleMl === 'പ്രീ-പ്രൈമറി അദ്ധ്യാപിക' ? '👩‍🎓' : '🧑‍🏫'}
            </div>
            <h3 className="font-bold text-gray-800 text-lg mb-1">{s.name}</h3>
            <div className={`text-primary-600 font-medium text-sm mb-0.5 ${ml ? 'font-malayalam' : ''}`}>
              {ml ? s.roleMl : s.roleEn}
            </div>
            <div className={`text-gray-500 text-sm mb-4 ${ml ? 'font-malayalam' : ''}`}>
              {ml ? s.subjectMl : s.subjectEn}
            </div>
            {s.id === '1' && (
              <a href={`tel:${school.phone}`}
                className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline">
                <Phone className="h-3 w-3" /> {school.phone}
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
