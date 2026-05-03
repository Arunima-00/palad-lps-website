'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { Eye, Target, Heart } from 'lucide-react';
import { getPage } from '@/lib/db';

const STATIC = {
  visionEn:  'To build a generation rooted in knowledge and ethics by providing quality education accessible to every child.',
  visionMl:  'ഓരോ കുട്ടിക്കും ഗുണമേന്മയുള്ള വിദ്യാഭ്യാസം ലഭ്യമാക്കി, ജ്ഞാനത്തിലും നൈതികതയിലും ഉറച്ചുനിൽക്കുന്ന ഒരു തലമുറയെ കെട്ടിപ്പടുക്കുക.',
  missionEn: 'To create an environment that fosters the physical, mental, intellectual, and creative growth of every student.',
  missionMl: 'കുട്ടികളുടെ ശാരീരിക, മാനസിക, ബൗദ്ധിക, സൃഷ്ടിപരമായ വളർച്ചക്ക് അനുകൂലമായ അന്തരീക്ഷം സൃഷ്ടിക്കുക.',
  values: [
    { icon: '📖', en: 'Excellence',              ml: 'ഗുണമേന്മ' },
    { icon: '🤝', en: 'Cooperation',             ml: 'സഹകരണം' },
    { icon: '🌱', en: 'Holistic Growth',         ml: 'സമഗ്ര വളർച്ച' },
    { icon: '💡', en: 'Innovation',              ml: 'നൂതനത്വം' },
    { icon: '🫶', en: 'Empathy',                 ml: 'സഹാനുഭൂതി' },
    { icon: '🌍', en: 'Environmental Awareness', ml: 'പരിസ്ഥിതി ബോധം' },
  ],
};

export default function VisionMissionPage() {
  const locale = useLocale() as 'ml' | 'en';
  const ml     = locale === 'ml';

  const [data, setData] = useState(STATIC);

  useEffect(() => {
    getPage('vision_mission').then(d => {
      if (!d) return;
      setData({
        visionEn:  d.visionEn  ?? STATIC.visionEn,
        visionMl:  d.visionMl  ?? STATIC.visionMl,
        missionEn: d.missionEn ?? STATIC.missionEn,
        missionMl: d.missionMl ?? STATIC.missionMl,
        values:    d.values?.length ? d.values : STATIC.values,
      });
    }).catch(() => {});
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className={`text-4xl font-bold text-primary-700 mb-2 ${ml ? 'font-malayalam' : ''}`}>
        {ml ? 'ദർശനവും ദൗത്യവും' : 'Vision & Mission'}
      </h1>
      <div className="h-1 w-20 bg-secondary-400 rounded-full mb-10" />

      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <div className="card p-8 border-t-4 border-primary-600">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-primary-100 rounded-xl p-3"><Eye className="h-6 w-6 text-primary-600" /></div>
            <h2 className={`text-xl font-bold text-primary-700 ${ml ? 'font-malayalam' : ''}`}>
              {ml ? 'ദർശനം' : 'Vision'}
            </h2>
          </div>
          <p className={`text-gray-700 leading-relaxed ${ml ? 'font-malayalam' : ''}`}>
            {ml ? data.visionMl : data.visionEn}
          </p>
        </div>

        <div className="card p-8 border-t-4 border-secondary-400">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-secondary-100 rounded-xl p-3"><Target className="h-6 w-6 text-secondary-500" /></div>
            <h2 className={`text-xl font-bold text-primary-700 ${ml ? 'font-malayalam' : ''}`}>
              {ml ? 'ദൗത്യം' : 'Mission'}
            </h2>
          </div>
          <p className={`text-gray-700 leading-relaxed ${ml ? 'font-malayalam' : ''}`}>
            {ml ? data.missionMl : data.missionEn}
          </p>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-3 mb-6">
          <Heart className="h-5 w-5 text-primary-600" />
          <h2 className={`text-xl font-bold text-primary-700 ${ml ? 'font-malayalam' : ''}`}>
            {ml ? 'ഞങ്ങളുടെ മൂല്യങ്ങൾ' : 'Our Core Values'}
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {data.values.map(v => (
            <div key={v.en} className="bg-primary-50 rounded-2xl p-5 text-center">
              <div className="text-3xl mb-2">{v.icon}</div>
              <div className={`font-semibold text-primary-700 ${ml ? 'font-malayalam' : ''}`}>
                {ml ? v.ml : v.en}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
