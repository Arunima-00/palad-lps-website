'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { ACHIEVEMENTS } from '@/lib/schoolData';
import StarRating from '@/components/shared/StarRating';
import { getCol } from '@/lib/db';

type LSSWinner = { id: string; year: string; nameEn: string; nameMl: string };

export default function AchievementsPage() {
  const locale = useLocale() as 'ml' | 'en';
  const ml     = locale === 'ml';

  const [achievements, setAchievements] = useState(ACHIEVEMENTS);
  const [lssWinners,   setLssWinners]   = useState<LSSWinner[]>([]);
  const [lssLoading,   setLssLoading]   = useState(true);

  useEffect(() => {
    getCol('achievements').then(data => {
      if ((data as any[]).length) setAchievements(data as typeof ACHIEVEMENTS);
    }).catch(() => {});

    // Fetch LSS winners from Firestore only — no hardcoded fallback
    getCol<LSSWinner>('lss_winners')
      .then(data => {
        setLssWinners(data.sort((a, b) => b.year.localeCompare(a.year)));
      })
      .catch(() => {})
      .finally(() => setLssLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className={`text-4xl font-bold text-primary-700 mb-2 ${ml ? 'font-malayalam' : ''}`}>
        {ml ? 'ഞങ്ങളുടെ നേട്ടങ്ങൾ' : 'Our Achievements'}
      </h1>
      <div className="h-1 w-20 bg-secondary-400 rounded-full mb-10" />

      {/* Achievement cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
        {achievements.map(a => (
          <div key={a.id} className="card p-8 text-center hover:-translate-y-1 transition-transform">
            <div className={`w-16 h-16 ${a.iconBg} rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4`}>
              {a.icon}
            </div>
            <div className="text-5xl font-bold text-primary-600 mb-1">{a.count}</div>
            <div className={`text-sm text-gray-400 mb-3 ${ml ? 'font-malayalam' : ''}`}>
              {ml ? a.labelMl : a.labelEn}
            </div>
            <h3 className={`font-bold text-gray-800 mb-2 text-lg ${ml ? 'font-malayalam' : ''}`}>
              {ml ? a.titleMl : a.titleEn}
            </h3>
            <p className={`text-gray-600 text-sm leading-relaxed mb-4 ${ml ? 'font-malayalam' : ''}`}>
              {ml ? a.descMl : a.descEn}
            </p>
            <StarRating itemId={a.id} initialRating={4.8} totalRatings={12} />
          </div>
        ))}
      </div>

      {/* LSS Hall of Fame */}
      <section className="card p-8">
        <h2 className={`text-2xl font-bold text-primary-700 mb-2 ${ml ? 'font-malayalam' : ''}`}>
          🏅 {ml ? 'LSS ഹാൾ ഓഫ് ഫെയിം' : 'LSS Hall of Fame'}
        </h2>
        <p className={`text-gray-500 text-sm mb-6 ${ml ? 'font-malayalam' : ''}`}>
          {ml
            ? 'ലോവർ സെക്കൻഡറി സ്കോളർഷിപ്പ് (LSS) നേടിയ ഞങ്ങളുടെ ശ്രദ്ധേയരായ വിദ്യാർഥികൾ'
            : 'Our distinguished students who qualified for the Lower Secondary Scholarship (LSS)'}
        </p>
        {lssLoading ? (
          <div className="space-y-2">
            {[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : lssWinners.length === 0 ? (
          <p className={`text-gray-400 text-sm text-center py-6 ${ml ? 'font-malayalam' : ''}`}>
            {ml ? 'ഇതുവരെ ഡേറ്റ ഇല്ല.' : 'No data yet. Add winners from Admin → LSS Hall of Fame.'}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-sm">
              <thead className="bg-primary-50">
                <tr>
                  {[ml ? 'വർഷം' : 'Year', ml ? 'പേര്' : 'Name', ml ? 'നേട്ടം' : 'Award'].map(h => (
                    <th key={h} className={`text-left px-5 py-3 text-primary-700 font-semibold ${ml ? 'font-malayalam' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lssWinners.map((w, i) => (
                  <tr key={w.id ?? i} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-bold text-primary-600">{w.year}</td>
                    <td className={`px-5 py-3 font-medium text-gray-800 ${ml ? 'font-malayalam' : ''}`}>
                      {ml ? w.nameMl : w.nameEn}
                    </td>
                    <td className="px-5 py-3">
                      <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full">
                        {ml ? 'LSS സ്കോളർ' : 'LSS Scholar'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className={`text-xs text-gray-400 mt-3 ${ml ? 'font-malayalam' : ''}`}>
          {ml ? '* കൂടുതൽ പേർ ഉൾപ്പെടുത്തും. ഏകദേശം 25+ LSS ജേതാക്കൾ.' : '* More names to be added. Approx. 25+ LSS winners total.'}
        </p>
      </section>
    </div>
  );
}
