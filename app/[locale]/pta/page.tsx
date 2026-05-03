'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { Users, Calendar, Clock, MapPin, ChevronDown, ChevronUp, FileText, Download } from 'lucide-react';
import { getPage, getCol } from '@/lib/db';

const STATIC_ABOUT = {
  en: 'The PTA of Palad LPS is an active organisation where parents and teachers work together for the holistic development of the school and welfare of students. Meetings are held every month to discuss school matters.',
  ml: 'പാളാട് എൽ പി എസ്-ന്റെ PTA, രക്ഷിതാക്കളും അദ്ധ്യാപകരും ഒരുമിച്ച് സ്കൂളിന്റെ സർവ്വതോമുഖ വളർച്ചക്കും കുട്ടികളുടെ ക്ഷേമത്തിനും വേണ്ടി പ്രവർത്തിക്കുന്ന ഒരു സജീവ സംഘടനയാണ്. ഓരോ മാസവും യോഗം ചേർന്ന് സ്കൂൾ വിഷയങ്ങൾ ചർച്ച ചെയ്യുന്നു.',
};
const STATIC_COMMITTEE = [
  { roleEn: 'President',      roleMl: 'അദ്ധ്യക്ഷൻ',        nameEn: 'Rajesh P.K.',  nameMl: 'രാജേഷ് പി.കെ.' },
  { roleEn: 'Vice President', roleMl: 'വൈസ് പ്രസിഡന്റ്',   nameEn: 'Suma T.',      nameMl: 'സുമ ടി.' },
  { roleEn: 'Secretary',      roleMl: 'സെക്രട്ടറി',        nameEn: 'Anil Kumar',   nameMl: 'അനിൽ കുമാർ' },
  { roleEn: 'Treasurer',      roleMl: 'ട്രഷറർ',            nameEn: 'Devaki Nair',  nameMl: 'ദേവകി നായർ' },
];

type Meeting = { id: string; date: string; time: string; venueEn: string; venueMl: string; agendaEn: string; agendaMl: string; fileUrl?: string; fileSize?: string };

export default function PTAPage() {
  const locale = useLocale() as 'ml' | 'en';
  const ml     = locale === 'ml';

  const [about,       setAbout]       = useState(STATIC_ABOUT);
  const [committee,   setCommittee]   = useState(STATIC_COMMITTEE);
  const [meetings,    setMeetings]    = useState<Meeting[]>([]);
  const [showPast,    setShowPast]    = useState(false);

  useEffect(() => {
    getPage('pta').then(d => {
      if (!d) return;
      setAbout({ en: d.aboutEn ?? STATIC_ABOUT.en, ml: d.aboutMl ?? STATIC_ABOUT.ml });
      if (d.committee?.length) setCommittee(d.committee);
    }).catch(() => {});
    getCol<Meeting>('pta_meetings').then(data => {
      if (data.length) setMeetings(data.sort((a, b) => b.date.localeCompare(a.date)));
    }).catch(() => {});
  }, []);

  const today    = new Date().toISOString().split('T')[0];
  const upcoming = meetings.filter(m => m.date >= today).reverse();
  const past     = meetings.filter(m => m.date <  today);

  const fmtDate = (date: string) =>
    new Date(date).toLocaleDateString(ml ? 'ml-IN' : 'en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className={`text-4xl font-bold text-primary-700 mb-2 ${ml ? 'font-malayalam' : ''}`}>
        {ml ? 'പി.ടി.എ' : 'PTA'}
      </h1>
      <p className={`text-gray-500 mb-2 ${ml ? 'font-malayalam' : ''}`}>
        {ml ? 'രക്ഷിതാക്ക-അദ്ധ്യാപക സംഘം' : 'Parent-Teacher Association'}
      </p>
      <div className="h-1 w-20 bg-secondary-400 rounded-full mb-10" />

      {/* About PTA */}
      <div className="card p-8 mb-10 flex gap-6 items-start">
        <div className="bg-primary-100 rounded-2xl p-4 shrink-0">
          <Users className="h-8 w-8 text-primary-600" />
        </div>
        <div>
          <h2 className={`text-xl font-bold text-primary-700 mb-3 ${ml ? 'font-malayalam' : ''}`}>
            {ml ? 'PTA യെ കുറിച്ച്' : 'About PTA'}
          </h2>
          <p className={`text-gray-700 leading-relaxed ${ml ? 'font-malayalam' : ''}`}>
            {ml ? about.ml : about.en}
          </p>
        </div>
      </div>

      {/* Committee */}
      <section className="mb-10">
        <h2 className={`text-2xl font-bold text-primary-700 mb-6 ${ml ? 'font-malayalam' : ''}`}>
          {ml ? 'കമ്മിറ്റി അംഗങ്ങൾ' : 'Committee Members'}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {committee.map((m, i) => (
            <div key={i} className="card p-5 text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-xl mx-auto mb-3">👤</div>
              <div className={`font-bold text-gray-800 text-sm ${ml ? 'font-malayalam' : ''}`}>{ml ? m.nameMl : m.nameEn}</div>
              <div className={`text-xs text-primary-600 mt-1 ${ml ? 'font-malayalam' : ''}`}>{ml ? m.roleMl : m.roleEn}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Meeting Scheduler — Upcoming */}
      <section className="mb-8">
        <h2 className={`text-2xl font-bold text-primary-700 mb-6 flex items-center gap-2 ${ml ? 'font-malayalam' : ''}`}>
          <Calendar className="h-6 w-6 text-primary-500" />
          {ml ? 'വരാനിരിക്കുന്ന യോഗങ്ങൾ' : 'Upcoming Meetings'}
        </h2>

        {upcoming.length === 0 ? (
          <div className={`text-center text-gray-400 py-8 text-sm bg-gray-50 rounded-2xl ${ml ? 'font-malayalam' : ''}`}>
            {ml ? 'ഇപ്പോൾ ഷെഡ്യൂൾ ചെയ്ത യോഗങ്ങൾ ഇല്ല.' : 'No meetings scheduled at the moment.'}
          </div>
        ) : (
          <div className="space-y-4">
            {upcoming.map(m => (
              <div key={m.id} className="card p-6 border-l-4 border-primary-500">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <div className="bg-primary-600 text-white rounded-2xl p-4 text-center min-w-[90px] shrink-0">
                    <div className="text-2xl font-bold">{new Date(m.date).getDate()}</div>
                    <div className="text-xs uppercase opacity-80">{new Date(m.date).toLocaleString('en', { month: 'short' })}</div>
                    <div className="text-xs opacity-70">{new Date(m.date).getFullYear()}</div>
                  </div>
                  <div className="flex-1">
                    <div className={`font-bold text-primary-700 text-lg mb-2 ${ml ? 'font-malayalam' : ''}`}>
                      {ml ? 'PTA യോഗം' : 'PTA Meeting'}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-primary-400" />
                        {m.time}
                      </span>
                      <span className={`flex items-center gap-1 ${ml ? 'font-malayalam' : ''}`}>
                        <MapPin className="h-4 w-4 text-primary-400" />
                        {ml ? m.venueMl : m.venueEn}
                      </span>
                    </div>
                    {(m.agendaEn || m.agendaMl) && (
                      <div className={`text-sm text-gray-600 bg-primary-50 rounded-xl p-3 ${ml ? 'font-malayalam' : ''}`}>
                        <span className="font-semibold text-primary-700">{ml ? 'അജണ്ട: ' : 'Agenda: '}</span>
                        {ml ? m.agendaMl : m.agendaEn}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Past Meetings */}
      {past.length > 0 && (
        <section>
          <button
            onClick={() => setShowPast(!showPast)}
            className={`flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 ${ml ? 'font-malayalam' : ''}`}>
            {showPast ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            <span className="font-medium text-sm">
              {ml ? `കഴിഞ്ഞ യോഗങ്ങൾ (${past.length})` : `Past Meetings (${past.length})`}
            </span>
          </button>
          {showPast && (
            <div className="space-y-3">
              {past.map(m => (
                <div key={m.id} className="card p-4 flex items-center justify-between gap-4 opacity-75">
                  <div className="flex items-center gap-4">
                    <div className="bg-gray-100 rounded-xl p-3 text-center min-w-[56px]">
                      <div className="text-sm font-bold text-gray-600">{new Date(m.date).getDate()}</div>
                      <div className="text-xs text-gray-400">{new Date(m.date).toLocaleString('en', { month: 'short', year: '2-digit' })}</div>
                    </div>
                    <div>
                      <div className={`font-medium text-gray-700 text-sm ${ml ? 'font-malayalam' : ''}`}>
                        {ml ? 'PTA യോഗം' : 'PTA Meeting'} — {ml ? m.venueMl : m.venueEn}
                      </div>
                      <div className="text-xs text-gray-400">{m.time}</div>
                    </div>
                  </div>
                  {m.fileUrl && (
                    <a href={m.fileUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-primary-600 hover:underline shrink-0">
                      <Download className="h-3.5 w-3.5" />
                      {ml ? 'മിനിറ്റ്സ്' : 'Minutes'}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
