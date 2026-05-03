'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { getPage } from '@/lib/db';

const STATIC_INTRO = {
  en: 'Palad Lower Primary School was founded in 1935 by Kannur Nambyar with the vision of providing quality education to children of Kodolipuram village. Nine decades later, that vision still burns bright.',
  ml: 'കൊടോലിപുരം ഗ്രാമത്തിലെ കുട്ടികൾക്ക് ഒരു ഗുണമേന്മയുള്ള വിദ്യാഭ്യാസ സ്ഥാപനം ഒരുക്കണം എന്ന ലക്ഷ്യത്തോടെ കണ്ണൂർ നമ്പ്യാർ 1935-ൽ പാളാട് ലോവർ പ്രൈമറി സ്കൂൾ ആരംഭിച്ചു. ഒൻപത് ദശകങ്ങൾ കഴിഞ്ഞിട്ടും ആ ദർശനം ഇന്നും ജ്വലിക്കുന്നു.',
};
const STATIC_TIMELINE = [
  { year: '1935',  en: 'Palad LPS founded by Kannur Nambyar.',                       ml: 'കണ്ണൂർ നമ്പ്യാർ പാളാട് എൽ പി എസ് സ്ഥാപിച്ചു.' },
  { year: '1937',  en: 'School received government recognition.',                     ml: 'സ്കൂൾ സർക്കാർ അംഗീകാരം ലഭിച്ചു.' },
  { year: '1955',  en: 'Current school building completed.',                          ml: 'ഇന്നത്തെ സ്കൂൾ കെട്ടിടം പൂർത്തിയായി.' },
  { year: '2000s', en: 'Library, digital class, and stage-classroom added.',          ml: 'ലൈബ്രറി, ഡിജിറ്റൽ ക്ലാസ്, സ്റ്റേജ്-ക്ലാസ്‌റൂം സൗകര്യം ചേർത്തു.' },
  { year: '2024',  en: 'Strong digital presence established on SchoolWiki.',          ml: 'SchoolWiki-ൽ ഞങ്ങളുടെ ഡിജിറ്റൽ സാന്നിദ്ധ്യം ശക്തമായി.' },
];

export default function HistoryPage() {
  const locale = useLocale() as 'ml' | 'en';
  const ml     = locale === 'ml';

  const [intro,    setIntro]    = useState(STATIC_INTRO);
  const [timeline, setTimeline] = useState(STATIC_TIMELINE);

  useEffect(() => {
    getPage('history').then(d => {
      if (!d) return;
      setIntro({ en: d.introEn, ml: d.introMl });
      if (d.timeline?.length) setTimeline(d.timeline);
    }).catch(() => {});
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className={`text-4xl font-bold text-primary-700 mb-2 ${ml ? 'font-malayalam' : ''}`}>
        {ml ? 'ഞങ്ങളുടെ ചരിത്രം' : 'Our History'}
      </h1>
      <div className="h-1 w-20 bg-secondary-400 rounded-full mb-10" />

      <p className={`text-gray-700 text-lg leading-relaxed mb-10 ${ml ? 'font-malayalam' : ''}`}>
        {ml ? intro.ml : intro.en}
      </p>

      <div className="relative border-l-4 border-primary-200 pl-8 space-y-10">
        {timeline.map(item => (
          <div key={item.year} className="relative">
            <div className="absolute -left-11 bg-primary-600 text-white text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center">
              {item.year.slice(-2)}
            </div>
            <div className="font-bold text-primary-600 text-lg mb-1">{item.year}</div>
            <p className={`text-gray-700 ${ml ? 'font-malayalam' : ''}`}>{ml ? item.ml : item.en}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
