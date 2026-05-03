'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import CommentSection from '@/components/shared/CommentSection';
import { getPage } from '@/lib/db';

const STATIC_CATEGORIES = [
  { id: 'sports',      emoji: '🏃', bg: 'from-orange-400 to-red-500',  titleEn: 'Sports & Physical Activities', titleMl: 'കായിക പ്രവർത്തനങ്ങൾ',     itemsEn: ['Annual Sports Day', 'District Sports Competitions', 'Yoga Classes', 'Indoor Games'], itemsMl: ['വാർഷിക കായിക മേള', 'ജില്ലാ കായിക മത്സരങ്ങൾ', 'യോഗ ക്ലാസ്', 'ഇൻഡോർ ഗെയിംസ്'] },
  { id: 'cultural',    emoji: '🎭', bg: 'from-purple-400 to-pink-500', titleEn: 'Cultural Activities',          titleMl: 'സാംസ്കാരിക പ്രവർത്തനങ്ങൾ', itemsEn: ['Kerala School Kalolsavam', 'Independence Day Celebration', 'Onam Celebration', 'Christmas Celebration'], itemsMl: ['കേരള സ്കൂൾ കലോത്സവം', 'സ്വാതന്ത്ര്യ ദിന ആഘോഷം', 'ഓണം ആഘോഷം', 'ക്രിസ്മസ് ആഘോഷം'] },
  { id: 'academic',    emoji: '🔬', bg: 'from-blue-400 to-cyan-500',   titleEn: 'Academic Activities',          titleMl: 'അക്കാദമിക് പ്രവർത്തനങ്ങൾ',  itemsEn: ['Science Exhibition', 'LSS Coaching', 'Reading Club', 'Math Olympiad'], itemsMl: ['ശാസ്ത്ര മേള', 'LSS കോച്ചിംഗ്', 'വായനാ ക്ലബ്', 'ഗണിത ഒളിമ്പ്യാഡ്'] },
  { id: 'environment', emoji: '🌿', bg: 'from-green-400 to-teal-500',  titleEn: 'Environmental Activities',     titleMl: 'പരിസ്ഥിതി പ്രവർത്തനങ്ങൾ',   itemsEn: ['Green Club', 'Tree Plantation Drive', 'Swachh Bharat Activities', 'Energy Awareness Programme'], itemsMl: ['ഹരിത ക്ലബ്', 'വൃക്ഷ നടീൽ', 'ശുചിത്വ ഭാരതം', 'ഊർജ്ജ ബോധവൽക്കരണം'] },
];
const STATIC_CLUBS = [
  { icon: '📚', en: 'Reading Club', ml: 'വായനാ ക്ലബ്'  },
  { icon: '🌿', en: 'Green Club',   ml: 'ഹരിത ക്ലബ്'    },
  { icon: '🔬', en: 'Science Club', ml: 'ശാസ്ത്ര ക്ലബ്'  },
  { icon: '🎨', en: 'Art Club',     ml: 'ആർട്ട് ക്ലബ്'  },
];

export default function ActivitiesPage() {
  const locale = useLocale() as 'ml' | 'en';
  const ml     = locale === 'ml';

  const [categories, setCategories] = useState(STATIC_CATEGORIES);
  const [clubs,      setClubs]      = useState(STATIC_CLUBS);

  useEffect(() => {
    getPage('activities').then(d => {
      if (!d) return;
      if (d.categories?.length) setCategories(d.categories);
      if (d.clubs?.length)      setClubs(d.clubs);
    }).catch(() => {});
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className={`text-4xl font-bold text-primary-700 mb-2 ${ml ? 'font-malayalam' : ''}`}>
        {ml ? 'പ്രവർത്തനങ്ങൾ' : 'Activities'}
      </h1>
      <div className="h-1 w-20 bg-secondary-400 rounded-full mb-10" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {categories.map(act => (
          <div key={act.id} className="card overflow-hidden">
            <div className={`bg-gradient-to-r ${act.bg} p-6 flex items-center gap-4`}>
              <span className="text-4xl">{act.emoji}</span>
              <h2 className={`text-xl font-bold text-white ${ml ? 'font-malayalam' : ''}`}>
                {ml ? act.titleMl : act.titleEn}
              </h2>
            </div>
            <ul className="p-5 space-y-2">
              {(ml ? act.itemsMl : act.itemsEn).map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0" />
                  <span className={`text-gray-700 ${ml ? 'font-malayalam' : ''}`}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="card p-8 mb-10">
        <h2 className={`text-2xl font-bold text-primary-700 mb-6 ${ml ? 'font-malayalam' : ''}`}>
          {ml ? 'സ്കൂൾ ക്ലബ്ബുകൾ' : 'School Clubs'}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {clubs.map(club => (
            <div key={club.en} className="bg-primary-50 rounded-2xl p-4 text-center">
              <div className="text-3xl mb-2">{club.icon}</div>
              <div className={`font-semibold text-primary-700 text-sm ${ml ? 'font-malayalam' : ''}`}>
                {ml ? club.ml : club.en}
              </div>
            </div>
          ))}
        </div>
      </div>

      <CommentSection itemId="activities" />
    </div>
  );
}
