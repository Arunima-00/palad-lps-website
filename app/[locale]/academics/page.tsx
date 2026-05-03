'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { Download, FileText } from 'lucide-react';
import { getPage } from '@/lib/db';

const STATIC_CLASSES = [
  { nameEn: 'Pre-Primary (LKG/UKG)', nameMl: 'പ്രീ-പ്രൈമറി (LKG/UKG)', students: 30, ageEn: '3–5 years', ageMl: '3–5 വർഷം' },
  { nameEn: 'Class 1', nameMl: 'ക്ലാസ് 1', students: 15, ageEn: '5+ years', ageMl: '5+ വർഷം' },
  { nameEn: 'Class 2', nameMl: 'ക്ലാസ് 2', students: 15, ageEn: '6+ years', ageMl: '6+ വർഷം' },
  { nameEn: 'Class 3', nameMl: 'ക്ലാസ് 3', students: 15, ageEn: '7+ years', ageMl: '7+ വർഷം' },
  { nameEn: 'Class 4', nameMl: 'ക്ലാസ് 4', students: 15, ageEn: '8+ years', ageMl: '8+ വർഷം' },
  { nameEn: 'Class 5', nameMl: 'ക്ലാസ് 5', students: 15, ageEn: '9+ years', ageMl: '9+ വർഷം' },
];
const STATIC_SUBJECTS = [
  { icon: '📖', en: 'Malayalam', ml: 'മലയാളം' }, { icon: '🔤', en: 'English', ml: 'ഇംഗ്ലീഷ്' },
  { icon: '🔢', en: 'Mathematics', ml: 'ഗണിതം' }, { icon: '🌿', en: 'EVS / Science', ml: 'പരിസ്ഥിതി' },
  { icon: '🎨', en: 'Art', ml: 'ആർട്ട്' }, { icon: '🎵', en: 'Music', ml: 'സംഗീതം' },
  { icon: '🏃', en: 'Physical Education', ml: 'ശാരീരിക ശിക്ഷണം' }, { icon: '💻', en: 'Computer', ml: 'കമ്പ്യൂട്ടർ' },
];
const STATIC_EXAMS = [
  { en: 'First Term Assessment',  ml: 'ഒന്നാം ടേം വിലയിരുത്തൽ',  periodEn: 'September',        periodMl: 'സെപ്തംബർ'         },
  { en: 'Second Term Assessment', ml: 'രണ്ടാം ടേം വിലയിരുത്തൽ', periodEn: 'December/January', periodMl: 'ഡിസംബർ/ജനുവരി'  },
  { en: 'Annual Examination',     ml: 'വാർഷിക പരീക്ഷ',           periodEn: 'March',            periodMl: 'മാർച്ച്'          },
];

export default function AcademicsPage() {
  const locale = useLocale() as 'ml' | 'en';
  const ml     = locale === 'ml';

  type Resource = { id: string; titleEn: string; titleMl: string; fileUrl: string; fileSize: string };

  const [classes,   setClasses]   = useState(STATIC_CLASSES);
  const [subjects,  setSubjects]  = useState(STATIC_SUBJECTS);
  const [exams,     setExams]     = useState(STATIC_EXAMS);
  const [resources, setResources] = useState<Resource[]>([
    { id: '1', titleEn: 'Class 1–5 Curriculum',  titleMl: 'ക്ലാസ് 1–5 പാഠ്യ പദ്ധതി', fileUrl: '', fileSize: '' },
    { id: '2', titleEn: 'LSS Study Materials',    titleMl: 'LSS പഠന സഹായങ്ങൾ',         fileUrl: '', fileSize: '' },
    { id: '3', titleEn: 'Science Project Guide',  titleMl: 'ശാസ്ത്ര പ്രോജക്ട് ഗൈഡ്',  fileUrl: '', fileSize: '' },
  ]);

  useEffect(() => {
    getPage('academics').then(d => {
      if (!d) return;
      if (d.classes?.length)   setClasses(d.classes);
      if (d.subjects?.length)  setSubjects(d.subjects);
      if (d.exams?.length)     setExams(d.exams);
      if (d.resources?.length) setResources(d.resources);
    }).catch(() => {});
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className={`text-4xl font-bold text-primary-700 mb-2 ${ml ? 'font-malayalam' : ''}`}>
        {ml ? 'അക്കാദമിക്' : 'Academics'}
      </h1>
      <div className="h-1 w-20 bg-secondary-400 rounded-full mb-10" />

      {/* Highlights */}
      <div className="grid grid-cols-3 gap-4 mb-12">
        {[
          { icon: '📚', labelMl: 'കേരള സ്റ്റേറ്റ് സിലബസ്', labelEn: 'Kerala State Syllabus' },
          { icon: '🗣️', labelMl: 'മലയാളം മീഡിയം',          labelEn: 'Malayalam Medium'      },
          { icon: '🏅', labelMl: 'CCE മൂല്യനിർണ്ണയം',      labelEn: 'CCE Evaluation'        },
        ].map(item => (
          <div key={item.labelEn} className="card p-5 text-center">
            <div className="text-3xl mb-2">{item.icon}</div>
            <div className={`font-semibold text-primary-700 text-sm ${ml ? 'font-malayalam' : ''}`}>
              {ml ? item.labelMl : item.labelEn}
            </div>
          </div>
        ))}
      </div>

      {/* Classes table */}
      <section className="mb-12">
        <h2 className={`text-2xl font-bold text-primary-700 mb-6 ${ml ? 'font-malayalam' : ''}`}>
          {ml ? 'ക്ലാസ് ഘടന' : 'Class Structure'}
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-primary-600 text-white">
              <tr>
                {[ml ? 'ക്ലാസ്' : 'Class', ml ? 'വിദ്യാർഥികൾ' : 'Students', ml ? 'പ്രായം' : 'Age'].map(h => (
                  <th key={h} className={`text-left px-6 py-3 font-semibold ${ml ? 'font-malayalam' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {classes.map((c, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-primary-50'}>
                  <td className={`px-6 py-3 font-medium text-primary-700 ${ml ? 'font-malayalam' : ''}`}>{ml ? c.nameMl : c.nameEn}</td>
                  <td className="px-6 py-3 text-gray-700">{c.students}</td>
                  <td className={`px-6 py-3 text-gray-500 ${ml ? 'font-malayalam' : ''}`}>{ml ? c.ageMl : c.ageEn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Subjects */}
      <section className="mb-12">
        <h2 className={`text-2xl font-bold text-primary-700 mb-6 ${ml ? 'font-malayalam' : ''}`}>
          {ml ? 'പഠന വിഷയങ്ങൾ' : 'Subjects Taught'}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {subjects.map(s => (
            <div key={s.en} className="bg-primary-50 rounded-2xl p-4 flex items-center gap-3">
              <span className="text-2xl">{s.icon}</span>
              <span className={`font-medium text-primary-700 text-sm ${ml ? 'font-malayalam' : ''}`}>{ml ? s.ml : s.en}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Exams */}
      <section className="mb-12">
        <h2 className={`text-2xl font-bold text-primary-700 mb-6 ${ml ? 'font-malayalam' : ''}`}>
          {ml ? 'പരീക്ഷ & വിലയിരുത്തൽ' : 'Exam & Evaluation (CCE)'}
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {exams.map((e, i) => (
            <div key={i} className="card p-5 flex items-start gap-4">
              <div className="bg-primary-100 rounded-xl w-10 h-10 flex items-center justify-center font-bold text-primary-600 shrink-0">{i + 1}</div>
              <div>
                <div className={`font-bold text-primary-700 ${ml ? 'font-malayalam' : ''}`}>{ml ? e.ml : e.en}</div>
                <div className={`text-sm text-gray-500 mt-0.5 ${ml ? 'font-malayalam' : ''}`}>{ml ? e.periodMl : e.periodEn}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Resources */}
      <section>
        <h2 className={`text-2xl font-bold text-primary-700 mb-6 ${ml ? 'font-malayalam' : ''}`}>
          {ml ? 'പഠന സഹായങ്ങൾ' : 'Study Resources'}
        </h2>
        <div className="space-y-3">
          {resources.map(r => (
            <div key={r.id} className="card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary-500" />
                <span className={`font-medium text-gray-800 ${ml ? 'font-malayalam' : ''}`}>
                  {ml ? r.titleMl : r.titleEn}
                </span>
                {r.fileUrl && (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">PDF</span>
                )}
                {r.fileSize && (
                  <span className="text-xs text-gray-400">{r.fileSize}</span>
                )}
              </div>
              {r.fileUrl ? (
                <a href={r.fileUrl} target="_blank" rel="noopener noreferrer"
                  className={`flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors ${ml ? 'font-malayalam' : ''}`}>
                  <Download className="h-4 w-4" />
                  {ml ? 'ഡൗൺലോഡ്' : 'Download'}
                </a>
              ) : (
                <span className="text-xs text-gray-400 italic">
                  {ml ? 'ഉടൻ ലഭ്യമാകും' : 'Coming soon'}
                </span>
              )}
            </div>
          ))}
        </div>
        <p className={`text-xs text-gray-400 mt-3 ${ml ? 'font-malayalam' : ''}`}>
          {ml ? '* അദ്ധ്യാപകർ കൂടുതൽ ഉള്ളടക്കം ചേർക്കും' : '* Teachers will upload more content regularly'}
        </p>
      </section>
    </div>
  );
}
