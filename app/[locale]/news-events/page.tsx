'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { Bell, Calendar, FileText, Download, MapPin, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { ANNOUNCEMENTS, EVENTS } from '@/lib/schoolData';
import { getCol } from '@/lib/db';
import CommentSection from '@/components/shared/CommentSection';

type Tab = 'announcements' | 'events' | 'circulars';
type Circular = { id: string; titleEn: string; titleMl: string; date: string; fileUrl: string; fileSize: string };

export default function NewsEventsPage() {
  const locale   = useLocale() as 'ml' | 'en';
  const ml       = locale === 'ml';
  const [tab,       setTab]       = useState<Tab>('announcements');
  const [openId,    setOpenId]    = useState<string | null>(null);
  const [showPast,  setShowPast]  = useState(false);

  const [announcements, setAnnouncements] = useState(ANNOUNCEMENTS);
  const [events,        setEvents]        = useState(EVENTS);
  const [circulars,     setCirculars]     = useState<Circular[]>([]);

  useEffect(() => {
    getCol('announcements').then(data => {
      if ((data as any[]).length)
        setAnnouncements((data as any[]).sort((a, b) => b.date.localeCompare(a.date)) as typeof ANNOUNCEMENTS);
    }).catch(() => {});
    getCol('events').then(data => {
      if ((data as any[]).length)
        setEvents((data as any[]).sort((a, b) => a.date.localeCompare(b.date)) as typeof EVENTS);
    }).catch(() => {});
    getCol<Circular>('circulars').then(data => {
      if (data.length) setCirculars(data.sort((a, b) => b.date.localeCompare(a.date)));
    }).catch(() => {});
  }, []);

  const tabs: { key: Tab; labelMl: string; labelEn: string; icon: typeof Bell }[] = [
    { key: 'announcements', labelMl: 'അറിയിപ്പുകൾ', labelEn: 'Announcements', icon: Bell     },
    { key: 'events',        labelMl: 'ഇവന്റുകൾ',   labelEn: 'Events',        icon: Calendar },
    { key: 'circulars',     labelMl: 'സർക്കുലറുകൾ', labelEn: 'Circulars',     icon: FileText },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className={`text-4xl font-bold text-primary-700 mb-2 ${ml ? 'font-malayalam' : ''}`}>
        {ml ? 'വാർത്തകൾ & ഇവന്റുകൾ' : 'News & Events'}
      </h1>
      <div className="h-1 w-20 bg-secondary-400 rounded-full mb-8" />

      {/* Tabs */}
      <div className="flex gap-2 mb-8 bg-gray-100 p-1 rounded-2xl w-fit">
        {tabs.map(({ key, labelMl, labelEn, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === key ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            } ${ml ? 'font-malayalam' : ''}`}
          >
            <Icon className="h-4 w-4" />
            {ml ? labelMl : labelEn}
          </button>
        ))}
      </div>

      {/* Announcements */}
      {tab === 'announcements' && (
        <div className="space-y-4">
          {announcements.map(a => (
            <div key={a.id} className="card p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Bell className="h-4 w-4 text-secondary-500" />
                    <span className="text-xs text-gray-400">{ml ? a.dateMl : a.dateEn}</span>
                  </div>
                  <h3 className={`font-bold text-primary-700 mb-2 text-lg ${ml ? 'font-malayalam' : ''}`}>
                    {ml ? a.titleMl : a.titleEn}
                  </h3>
                  <p className={`text-gray-600 ${ml ? 'font-malayalam' : ''}`}>
                    {ml ? a.excerptMl : a.excerptEn}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpenId(openId === a.id ? null : a.id)}
                className={`text-sm text-primary-600 hover:underline mt-3 ${ml ? 'font-malayalam' : ''}`}
              >
                {openId === a.id ? (ml ? 'മടക്കുക' : 'Collapse') : (ml ? 'അഭിപ്രായം ചേർക്കുക' : 'Add Comment')}
              </button>
              {openId === a.id && <CommentSection itemId={a.id} />}
            </div>
          ))}
        </div>
      )}

      {/* Events */}
      {tab === 'events' && (() => {
        const today    = new Date().toISOString().split('T')[0];
        const upcoming = events.filter(ev => ev.date >= today);
        const past     = events.filter(ev => ev.date <  today).reverse();

        const EventCard = ({ ev, isPast }: { ev: typeof events[0]; isPast: boolean }) => {
          const d = new Date(ev.date);
          return (
            <div key={ev.id} className={`card flex overflow-hidden ${isPast ? 'opacity-70' : ''}`}>
              <div className={`${isPast ? 'bg-gray-400' : 'bg-primary-600'} text-white w-24 flex-shrink-0 flex flex-col items-center justify-center py-4`}>
                <span className="text-3xl font-bold">{d.getDate()}</span>
                <span className="text-xs uppercase opacity-80">{d.toLocaleString('en', { month: 'short' })}</span>
                <span className="text-xs opacity-60">{d.getFullYear()}</span>
              </div>
              <div className="p-6 flex-1">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className={`font-bold text-primary-700 text-lg ${ml ? 'font-malayalam' : ''}`}>
                    {ml ? ev.titleMl : ev.titleEn}
                  </h3>
                  {isPast && (
                    <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full shrink-0">
                      <CheckCircle className="h-3 w-3" />
                      {ml ? 'പൂർത്തിയായി' : 'Completed'}
                    </span>
                  )}
                </div>
                <div className={`flex items-center gap-1 text-sm text-gray-500 mb-3 ${ml ? 'font-malayalam' : ''}`}>
                  <MapPin className="h-3 w-3" />
                  {ml ? ev.venueMl : ev.venueEn}
                </div>
                {!isPast && (
                  <>
                    <button
                      onClick={() => setOpenId(openId === ev.id ? null : ev.id)}
                      className={`text-sm text-primary-600 hover:underline ${ml ? 'font-malayalam' : ''}`}
                    >
                      {openId === ev.id ? (ml ? 'മടക്കുക' : 'Collapse') : (ml ? 'അഭിപ്രായം' : 'Comment')}
                    </button>
                    {openId === ev.id && <CommentSection itemId={ev.id} />}
                  </>
                )}
              </div>
            </div>
          );
        };

        return (
          <div>
            {/* Upcoming Events */}
            <h2 className={`text-lg font-bold text-primary-700 mb-4 flex items-center gap-2 ${ml ? 'font-malayalam' : ''}`}>
              <Calendar className="h-5 w-5 text-primary-500" />
              {ml ? 'വരാനിരിക്കുന്ന ഇവന്റുകൾ' : 'Upcoming Events'}
            </h2>
            {upcoming.length === 0 ? (
              <p className={`text-gray-400 text-sm mb-8 ${ml ? 'font-malayalam' : ''}`}>
                {ml ? 'ഇപ്പോൾ ഇവന്റുകൾ ഒന്നും ഇല്ല.' : 'No upcoming events at the moment.'}
              </p>
            ) : (
              <div className="space-y-4 mb-8">
                {upcoming.map(ev => <EventCard key={ev.id} ev={ev} isPast={false} />)}
              </div>
            )}

            {/* Past Events */}
            {past.length > 0 && (
              <div>
                <button
                  onClick={() => setShowPast(!showPast)}
                  className={`flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 ${ml ? 'font-malayalam' : ''}`}
                >
                  {showPast ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  <span className="text-sm font-medium">
                    {ml ? `കഴിഞ്ഞ ഇവന്റുകൾ (${past.length})` : `Past Events (${past.length})`}
                  </span>
                </button>
                {showPast && (
                  <div className="space-y-3">
                    {past.map(ev => <EventCard key={ev.id} ev={ev} isPast={true} />)}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* Circulars */}
      {tab === 'circulars' && (
        <div className="space-y-3">
          {circulars.length === 0 ? (
            <div className={`text-center text-gray-400 py-10 text-sm ${ml ? 'font-malayalam' : ''}`}>
              {ml ? 'ഇതുവരെ സർക്കുലറുകൾ ഇല്ല.' : 'No circulars uploaded yet.'}
            </div>
          ) : circulars.map(c => (
            <div key={c.id} className="card p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-red-100 rounded-xl p-3">
                  <FileText className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <div className={`font-semibold text-gray-800 ${ml ? 'font-malayalam' : ''}`}>
                    {ml ? c.titleMl : c.titleEn}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {c.date}{c.fileSize ? ` · ${c.fileSize}` : ''}
                  </div>
                </div>
              </div>
              {c.fileUrl ? (
                <a href={c.fileUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-800 font-medium">
                  <Download className="h-4 w-4" />
                  <span className={ml ? 'font-malayalam' : ''}>{ml ? 'ഡൗൺലോഡ്' : 'Download'}</span>
                </a>
              ) : (
                <span className="text-xs text-gray-400 italic">{ml ? 'ഉടൻ ലഭ്യം' : 'Coming soon'}</span>
              )}
            </div>
          ))}
          <p className={`text-xs text-gray-400 mt-3 ${ml ? 'font-malayalam' : ''}`}>
            {ml ? '* പുതിയ സർക്കുലറുകൾ അദ്ധ്യാപകർ ചേർക്കും.' : '* New circulars will be uploaded by authorities.'}
          </p>
        </div>
      )}
    </div>
  );
}
