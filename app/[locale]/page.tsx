'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { ArrowRight, MapPin, Phone, Mail, BookOpen, Users, Calendar, Trophy } from 'lucide-react';
import { SCHOOL, ANNOUNCEMENTS, EVENTS, ACHIEVEMENTS, GALLERY_ALBUMS, TESTIMONIALS } from '@/lib/schoolData';
import { getCol, getSchoolInfo, getSiteSettings, getPage } from '@/lib/db';

export default function HomePage() {
  const t      = useTranslations();
  const locale = useLocale() as 'ml' | 'en';
  const ml     = locale === 'ml';

  const [announcements, setAnnouncements] = useState(ANNOUNCEMENTS);
  const [events,        setEvents]        = useState(EVENTS);
  const [achievements,  setAchievements]  = useState(ACHIEVEMENTS);
  const [testimonials,  setTestimonials]  = useState(TESTIMONIALS);
  const [galleryAlbums, setGalleryAlbums] = useState(GALLERY_ALBUMS);
  const [school,        setSchool]        = useState(SCHOOL);
  const [heroImageUrl,  setHeroImageUrl]  = useState('');
  const [logoUrl,       setLogoUrl]       = useState('');
  const [aboutDesc,     setAboutDesc]     = useState({ en: '', ml: '' });

  useEffect(() => {
    Promise.all([
      getCol('announcements'),
      getCol('events'),
      getCol('achievements'),
      getCol('testimonials'),
      getCol('gallery_albums'),
      getSchoolInfo(),
      getSiteSettings(),
      getPage('history'),
    ]).then(([anns, evs, achs, tests, albums, info, settings, hist]) => {
      if ((anns as any[]).length)    setAnnouncements((anns as any[]).sort((a, b) => b.date.localeCompare(a.date)) as typeof ANNOUNCEMENTS);
      if ((evs as any[]).length)     setEvents((evs as any[]).sort((a, b) => a.date.localeCompare(b.date)) as typeof EVENTS);
      if ((achs as any[]).length)    setAchievements(achs as typeof ACHIEVEMENTS);
      if ((tests as any[]).length)   setTestimonials(tests as typeof TESTIMONIALS);
      if ((albums as any[]).length)  setGalleryAlbums(albums as typeof GALLERY_ALBUMS);
      if (info)                      setSchool({ ...SCHOOL, ...(info as any) });
      const s = settings as any;
      if (s?.heroImageUrl) setHeroImageUrl(s.heroImageUrl);
      if (s?.logoUrl)      setLogoUrl(s.logoUrl);
      const h = hist as any;
      if (h?.introEn) setAboutDesc({ en: h.introEn, ml: h.introMl ?? '' });
    }).catch(e => console.error('Home Firestore error:', e));
  }, []);

  return (
    <div className="overflow-x-hidden">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 text-white overflow-hidden">
        {/* Hero background image */}
        {heroImageUrl && (
          <img src={heroImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        )}
        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-secondary-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary-900/40 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-28 flex flex-col md:flex-row items-center gap-10">
          {/* Text */}
          <div className="flex-1 text-center md:text-left animate-fade-up">
            <div className="inline-block bg-secondary-400/20 border border-secondary-400/30 text-secondary-300 text-sm px-4 py-1 rounded-full mb-4 font-medium">
              {ml ? 'കണ്ണൂർ ജില്ല, കേരളം' : 'Kannur District, Kerala'}
            </div>
            <h1 className={`text-4xl md:text-6xl font-bold leading-tight mb-3 ${ml ? 'font-malayalam' : ''}`}>
              {school.name[locale]}
            </h1>
            <p className={`text-primary-200 text-lg md:text-xl mb-2 ${ml ? 'font-malayalam' : ''}`}>
              {school.fullName[locale]}
            </p>
            <p className={`text-secondary-300 text-2xl font-semibold italic mb-6 ${ml ? 'font-malayalam' : ''}`}>
              "{t('hero.tagline')}"
            </p>
            <p className={`text-primary-200 mb-8 ${ml ? 'font-malayalam' : ''}`}>
              {t('hero.subTagline')}
            </p>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <Link href={`/${locale}/admissions`} className="btn-primary bg-secondary-400 hover:bg-secondary-500 text-primary-800">
                <span className={ml ? 'font-malayalam' : ''}>{t('hero.admissionsBtn')}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href={`/${locale}/contact`} className="inline-flex items-center gap-2 border-2 border-white text-white px-6 py-3 rounded-full font-medium transition-colors hover:bg-white hover:text-primary-700">
                <span className={ml ? 'font-malayalam' : ''}>{t('hero.contactBtn')}</span>
              </Link>
            </div>
          </div>

          {/* Stats card */}
          <div className="flex-shrink-0 grid grid-cols-2 gap-4 animate-fade-in">
            {[
              { icon: Calendar, value: school.founded,              label: t('stats.founded')  },
              { icon: Users,    value: `${school.students.total}+`, label: t('stats.students') },
              { icon: BookOpen, value: school.teachers,             label: t('stats.teachers') },
              { icon: Trophy,   value: 'LP',                    label: t('stats.classes')  },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-5 text-center min-w-[120px]">
                <Icon className="h-6 w-6 text-secondary-400 mx-auto mb-2" />
                <div className="text-2xl font-bold">{value}</div>
                <div className={`text-primary-200 text-xs mt-1 ${ml ? 'font-malayalam' : ''}`}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ANNOUNCEMENTS ───────────────────────────────────────────────── */}
      <section className="bg-secondary-50 py-14">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className={`section-heading ${ml ? 'font-malayalam' : ''}`}>
                📢 {t('sections.announcements')}
              </h2>
              <div className="h-1 w-16 bg-secondary-400 rounded-full" />
            </div>
            <Link href={`/${locale}/news-events`}
              className={`text-primary-600 hover:text-primary-800 text-sm font-medium flex items-center gap-1 ${ml ? 'font-malayalam' : ''}`}>
              {t('sections.viewAll')} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {announcements.map(a => (
              <div key={a.id} className="card p-6 hover:-translate-y-1 transition-transform">
                <span className="text-xs text-secondary-500 font-medium">
                  {ml ? a.dateMl : a.dateEn}
                </span>
                <h3 className={`font-bold text-primary-700 mt-1 mb-2 ${ml ? 'font-malayalam' : ''}`}>
                  {ml ? a.titleMl : a.titleEn}
                </h3>
                <p className={`text-gray-600 text-sm ${ml ? 'font-malayalam' : ''}`}>
                  {ml ? a.excerptMl : a.excerptEn}
                </p>
                <Link href={`/${locale}/news-events`}
                  className={`inline-flex items-center gap-1 text-primary-600 text-sm mt-3 hover:underline ${ml ? 'font-malayalam' : ''}`}>
                  {t('sections.readMore')} <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── UPCOMING EVENTS ─────────────────────────────────────────────── */}
      <section className="py-14">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className={`section-heading ${ml ? 'font-malayalam' : ''}`}>
                📅 {t('sections.upcomingEvents')}
              </h2>
              <div className="h-1 w-16 bg-primary-400 rounded-full" />
            </div>
            <Link href={`/${locale}/news-events`}
              className={`text-primary-600 hover:text-primary-800 text-sm font-medium flex items-center gap-1 ${ml ? 'font-malayalam' : ''}`}>
              {t('sections.viewAll')} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {(() => {
            const today   = new Date().toISOString().split('T')[0];
            const upcoming = events.filter(ev => ev.date >= today).slice(0, 3);
            return upcoming.length === 0 ? (
              <p className={`text-gray-400 text-sm ${ml ? 'font-malayalam' : ''}`}>
                {ml ? 'ഇപ്പോൾ ഇവന്റുകൾ ഒന്നും ഇല്ല.' : 'No upcoming events at the moment.'}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {upcoming.map(ev => {
                  const d = new Date(ev.date);
                  return (
                    <div key={ev.id} className="card flex overflow-hidden">
                      <div className="bg-primary-600 text-white w-20 flex-shrink-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold">{d.getDate()}</span>
                        <span className="text-xs uppercase">{d.toLocaleString('en', { month: 'short' })}</span>
                        <span className="text-xs opacity-70">{d.getFullYear()}</span>
                      </div>
                      <div className="p-4">
                        <h3 className={`font-bold text-gray-800 mb-1 ${ml ? 'font-malayalam' : ''}`}>
                          {ml ? ev.titleMl : ev.titleEn}
                        </h3>
                        <p className={`text-xs text-gray-500 flex items-center gap-1 ${ml ? 'font-malayalam' : ''}`}>
                          <MapPin className="h-3 w-3" />
                          {ml ? ev.venueMl : ev.venueEn}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

        </div>
      </section>

      {/* ── ABOUT SNAPSHOT ──────────────────────────────────────────────── */}
      <section className="bg-primary-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row gap-10 items-center">
          <div className="flex-1">
            <h2 className={`text-3xl font-bold mb-4 ${ml ? 'font-malayalam' : ''}`}>
              {t('sections.aboutSchool')}
            </h2>
            <div className="h-1 w-16 bg-secondary-400 rounded-full mb-6" />
            <p className={`text-primary-100 text-lg leading-relaxed mb-6 ${ml ? 'font-malayalam' : ''}`}>
              {aboutDesc.en
                ? (ml ? aboutDesc.ml || aboutDesc.en : aboutDesc.en)
                : t('about.historyDesc')}
            </p>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { labelMl: 'UDISE കോഡ്', labelEn: 'UDISE Code', value: school.udise },
                { labelMl: 'സ്ഥാപനം',    labelEn: 'Founded',    value: school.founded },
                { labelMl: 'ക്ലാസുകൾ',   labelEn: 'Classes',    value: school.classes },
                { labelMl: 'മാദ്ധ്യമം',  labelEn: 'Medium',     value: school.medium[locale] },
              ].map(item => (
                <div key={item.labelEn} className="bg-primary-700/50 rounded-xl p-3">
                  <div className={`text-primary-300 text-xs ${ml ? 'font-malayalam' : ''}`}>
                    {ml ? item.labelMl : item.labelEn}
                  </div>
                  <div className={`font-semibold ${ml ? 'font-malayalam' : ''}`}>{item.value}</div>
                </div>
              ))}
            </div>
            <Link href={`/${locale}/about`} className="btn-primary bg-secondary-400 hover:bg-secondary-500 text-primary-800">
              <span className={ml ? 'font-malayalam' : ''}>{t('sections.learnMore')}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {/* Visual block */}
          <div className="flex-shrink-0 grid grid-cols-2 gap-3 w-full md:w-72">
            {['📚', '🏫', '🎭', '🏆'].map((emoji, i) => (
              <div key={i} className="bg-primary-700/60 rounded-2xl h-28 flex items-center justify-center text-4xl">
                {emoji}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GALLERY HIGHLIGHTS ──────────────────────────────────────────── */}
      <section className="py-14 bg-cream">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className={`section-heading ${ml ? 'font-malayalam' : ''}`}>
                🖼️ {t('sections.photoHighlights')}
              </h2>
              <div className="h-1 w-16 bg-secondary-400 rounded-full" />
            </div>
            <Link href={`/${locale}/gallery`}
              className={`text-primary-600 hover:text-primary-800 text-sm font-medium flex items-center gap-1 ${ml ? 'font-malayalam' : ''}`}>
              {t('sections.viewGallery')} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {galleryAlbums.slice(0, 6).map(album => (
              <Link key={album.id} href={`/${locale}/gallery`}
                className={`relative rounded-2xl overflow-hidden h-40 bg-gradient-to-br ${album.thumbBg} flex items-end p-4 group cursor-pointer`}>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                <div className="relative z-10">
                  <div className={`text-white font-semibold text-sm drop-shadow ${ml ? 'font-malayalam' : ''}`}>
                    {ml ? album.titleMl : album.titleEn}
                  </div>
                  <div className="text-white/80 text-xs">{album.count} photos</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── ACHIEVEMENTS ────────────────────────────────────────────────── */}
      <section className="py-14">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className={`section-heading inline-block ${ml ? 'font-malayalam' : ''}`}>
              🏅 {t('sections.achievements')}
            </h2>
            <div className="h-1 w-16 bg-secondary-400 rounded-full mx-auto mt-2" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {achievements.map(a => (
              <div key={a.id} className="card p-8 text-center hover:-translate-y-1 transition-transform">
                <div className={`w-16 h-16 ${a.iconBg} rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4`}>
                  {a.icon}
                </div>
                <div className="text-4xl font-bold text-primary-600 mb-1">{a.count}</div>
                <div className={`text-sm text-gray-500 mb-3 ${ml ? 'font-malayalam' : ''}`}>
                  {ml ? a.labelMl : a.labelEn}
                </div>
                <h3 className={`font-bold text-gray-800 mb-2 ${ml ? 'font-malayalam' : ''}`}>
                  {ml ? a.titleMl : a.titleEn}
                </h3>
                <p className={`text-gray-600 text-sm ${ml ? 'font-malayalam' : ''}`}>
                  {ml ? a.descMl : a.descEn}
                </p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href={`/${locale}/achievements`} className="btn-outline">
              <span className={ml ? 'font-malayalam' : ''}>{t('sections.viewAll')}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────────────── */}
      <section className="bg-primary-50 py-14">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className={`section-heading ${ml ? 'font-malayalam' : ''}`}>
            💬 {ml ? 'രക്ഷിതാക്കൾ പറയുന്നത്' : 'What Parents Say'}
          </h2>
          <div className="h-1 w-16 bg-secondary-400 rounded-full mx-auto mb-10" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map(tm => (
              <div key={tm.id} className="card p-8 text-left">
                <div className="text-4xl text-primary-200 mb-3">"</div>
                <p className={`text-gray-700 italic mb-4 ${ml ? 'font-malayalam' : ''}`}>
                  {ml ? tm.textMl : tm.textEn}
                </p>
                <div className={`font-semibold text-primary-600 text-sm ${ml ? 'font-malayalam' : ''}`}>
                  — {ml ? tm.nameMl : tm.nameEn}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FIND US / MAP ────────────────────────────────────────────────── */}
      <section className="py-14">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className={`section-heading ${ml ? 'font-malayalam' : ''}`}>
              📍 {t('sections.findUs')}
            </h2>
            <div className="h-1 w-16 bg-secondary-400 rounded-full mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="rounded-2xl overflow-hidden shadow-lg h-64 md:h-80">
              <iframe
                src={school.mapEmbedUrl}
                width="100%" height="100%"
                style={{ border: 0 }}
                allowFullScreen loading="lazy"
                title="Palad LPS Location"
              />
            </div>
            <div className="space-y-4">
              {[
                { icon: MapPin, label: ml ? 'വിലാസം' : 'Address',      value: school.address[locale] },
                { icon: Phone,  label: ml ? 'ഫോൺ'    : 'Phone',         value: school.phone },
                { icon: Mail,   label: ml ? 'ഇ-മെയിൽ' : 'Email',        value: school.email },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-4">
                  <div className="bg-primary-100 rounded-xl p-3">
                    <Icon className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <div className={`text-xs text-gray-500 font-medium ${ml ? 'font-malayalam' : ''}`}>{label}</div>
                    <div className={`font-semibold text-gray-800 ${ml ? 'font-malayalam' : ''}`}>{value}</div>
                  </div>
                </div>
              ))}
              <Link href={`/${locale}/contact`} className="btn-primary mt-4 inline-flex">
                <span className={ml ? 'font-malayalam' : ''}>{t('contact.sendMessage')}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
