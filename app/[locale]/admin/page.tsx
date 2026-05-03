'use client';

import { useState, useRef, useCallback } from 'react';
import { useLocale } from 'next-intl';
import {
  LayoutDashboard, Bell, Calendar, Images, Users, MessageSquare,
  LogOut, Plus, Trash2, Edit3, Lock, Trophy, Save, X, School, FileText,
} from 'lucide-react';
import {
  seedIfNeeded, getCol, saveDoc, removeDoc,
  getSchoolInfo, saveSchoolInfo, uploadPhoto,
  getPage, savePage,
  saveGalleryPhoto, getAlbumPhotos, deleteGalleryPhoto,
  getSiteSettings, saveSiteSettings,
  uploadFile, markMessageRead,
} from '@/lib/db';
import { SCHOOL, ANNOUNCEMENTS, EVENTS, STAFF, ACHIEVEMENTS, TESTIMONIALS } from '@/lib/schoolData';

type Section =
  | 'dashboard' | 'announcements' | 'events' | 'staff'
  | 'achievements' | 'testimonials' | 'gallery' | 'schoolinfo' | 'comments'
  | 'history' | 'vision' | 'pta' | 'lss' | 'ptameetings'
  | 'admissions' | 'academics' | 'activities'
  | 'circulars' | 'appearance' | 'navigation' | 'messages';

type GalleryAlbum = { id: string; titleMl: string; titleEn: string; thumbBg: string; count: number; coverUrl?: string };
type GalleryPhoto = { id: string; url: string };

type TimelineItem = { year: string; en: string; ml: string };
type Value        = { icon: string; en: string; ml: string };
type Committee    = { roleEn: string; roleMl: string; nameEn: string; nameMl: string };

type Ann = {
  id: string; type: string;
  titleEn: string; titleMl: string;
  date: string; dateEn: string; dateMl: string;
  excerptEn: string; excerptMl: string;
};
type Ev = {
  id: string;
  titleEn: string; titleMl: string;
  date: string; dateEn: string; dateMl: string;
  venueEn: string; venueMl: string;
};
type StaffMember = {
  id: string; name: string;
  roleEn: string; roleMl: string;
  subjectEn: string; subjectMl: string;
};
type Ach = {
  id: string; icon: string; iconBg: string;
  titleEn: string; titleMl: string;
  count: string; labelEn: string; labelMl: string;
  descEn: string; descMl: string;
};
type Testimonial = {
  id: string;
  nameEn: string; nameMl: string;
  textEn: string; textMl: string;
};

function fmtDate(dateStr: string) {
  if (!dateStr) return { en: '', ml: '' };
  const d = new Date(dateStr);
  return {
    en: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
    ml: d.toLocaleDateString('ml-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
  };
}

const emptyAnn: Omit<Ann, 'id'> = {
  type: 'announcement', titleEn: '', titleMl: '',
  date: '', dateEn: '', dateMl: '', excerptEn: '', excerptMl: '',
};
const emptyEv: Omit<Ev, 'id'> = {
  titleEn: '', titleMl: '', date: '', dateEn: '', dateMl: '', venueEn: '', venueMl: '',
};
const emptyStaff: Omit<StaffMember, 'id'> = {
  name: '', roleEn: '', roleMl: '', subjectEn: '', subjectMl: '',
};
const emptyAch: Omit<Ach, 'id'> = {
  icon: '🏆', iconBg: 'bg-yellow-100',
  titleEn: '', titleMl: '', count: '', labelEn: '', labelMl: '', descEn: '', descMl: '',
};
const emptyTest: Omit<Testimonial, 'id'> = {
  nameEn: '', nameMl: '', textEn: '', textMl: '',
};

const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400';
const lbl = 'block text-xs font-medium text-gray-600 mb-1';

// Auto-translate via free MyMemory API (no key needed, 10 000 chars/day)
async function xlate(text: string, from: string, to: string): Promise<string> {
  if (!text.trim()) return '';
  try {
    const r = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`,
    );
    const d = await r.json();
    return d.responseData?.translatedText ?? '';
  } catch {
    return '';
  }
}

// Fire a Firestore operation in the background — never blocks the UI
function bgFirestore(op: () => Promise<unknown>) {
  op().catch(() => { /* Firebase not configured — local state already updated */ });
}

export default function AdminPage() {
  const locale = useLocale() as 'ml' | 'en';
  const ml = locale === 'ml';

  const [loggedIn,  setLoggedIn]  = useState(false);
  const [password,  setPassword]  = useState('');
  const [authErr,   setAuthErr]   = useState('');
  const [savedMsg,  setSavedMsg]  = useState('');
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [section, setSection]   = useState<Section>('dashboard');

  // Data
  const [announcements, setAnnouncements] = useState<Ann[]>([]);
  const [events,        setEvents]        = useState<Ev[]>([]);
  const [staff,         setStaff]         = useState<StaffMember[]>([]);
  const [achievements,  setAchievements]  = useState<Ach[]>([]);
  const [testimonials,  setTestimonials]  = useState<Testimonial[]>([]);

  // Forms
  const [annForm, setAnnForm]   = useState<Omit<Ann, 'id'>>(emptyAnn);
  const [editAnn, setEditAnn]   = useState<string | null>(null);

  const [evForm,  setEvForm]    = useState<Omit<Ev, 'id'>>(emptyEv);
  const [editEv,  setEditEv]    = useState<string | null>(null);

  const [staffForm,  setStaffForm]  = useState<Omit<StaffMember, 'id'>>(emptyStaff);
  const [editStaff,  setEditStaff]  = useState<string | null>(null);

  const [achForm,  setAchForm]  = useState<Omit<Ach, 'id'>>(emptyAch);
  const [editAch,  setEditAch]  = useState<string | null>(null);

  const [testForm, setTestForm] = useState<Omit<Testimonial, 'id'>>(emptyTest);
  const [editTest, setEditTest] = useState<string | null>(null);

  const [infoForm, setInfoForm] = useState({
    principal:       SCHOOL.principal,
    phone:           SCHOOL.phone,
    email:           SCHOOL.email,
    whatsappNumber:  SCHOOL.whatsappNumber,
    schoolHours:     SCHOOL.schoolHours,
    workingDays:     SCHOOL.workingDays,
    classes:         SCHOOL.classes,
    teachers:        String(SCHOOL.teachers),
    addressEn:       SCHOOL.address.en,
    addressMl:       SCHOOL.address.ml,
    mapEmbedUrl:     SCHOOL.mapEmbedUrl,
  });

  const [uploading,      setUploading]      = useState(false);
  const [firebaseNotice, setFirebaseNotice] = useState(false);

  // ── Pages state ───────────────────────────────────────────────────────────
  const [historyIntro,  setHistoryIntro]  = useState({ en: '', ml: '' });
  const [timeline,      setTimeline]      = useState<TimelineItem[]>([]);
  const [tlForm,        setTlForm]        = useState<TimelineItem>({ year: '', en: '', ml: '' });
  const [editTlIdx,     setEditTlIdx]     = useState<number | null>(null);

  const [vision,        setVision]        = useState({ en: '', ml: '' });
  const [mission,       setMission]       = useState({ en: '', ml: '' });
  const [values,        setValues]        = useState<Value[]>([]);
  const [valForm,       setValForm]       = useState<Value>({ icon: '', en: '', ml: '' });
  const [editValIdx,    setEditValIdx]    = useState<number | null>(null);

  // ── Admissions state ─────────────────────────────────────────────────────
  const [admData, setAdmData] = useState({
    periodEn: 'April – June', periodMl: 'ഏപ്രിൽ – ജൂൺ',
    entranceExamEn: 'None',   entranceExamMl: 'ഇല്ല',
    stepsEn: ['Visit the school office (April – June)', 'Collect the admission form', 'Submit form with required documents', 'Receive admission confirmation'],
    stepsMl: ['സ്കൂൾ ഓഫീസ് സന്ദർശിക്കുക', 'അഡ്മിഷൻ ഫോം ശേഖരിക്കുക', 'ആവശ്യമായ രേഖകൾ സഹിതം ഫോം സമർപ്പിക്കുക', 'പ്രവേശനം സ്ഥിരീകരിക്കുക'],
    class1AgeEn: '5 years and above as of June 1', class1AgeMl: 'ജൂൺ 1 വരെ 5 വയസ്സ് തികഞ്ഞവർ',
    prePrimaryAgeEn: '3 years and above',           prePrimaryAgeMl: '3 വയസ്സ് തികഞ്ഞവർ',
    documentsEn: [] as string[], documentsMl: [] as string[],
  });
  const [newStepEn, setNewStepEn] = useState('');
  const [newDocEn,  setNewDocEn]  = useState('');

  // ── Academics state ───────────────────────────────────────────────────────
  type AcadClass    = { nameEn: string; nameMl: string; students: number; ageEn: string; ageMl: string };
  type AcadSubject  = { icon: string; en: string; ml: string };
  type AcadExam     = { en: string; ml: string; periodEn: string; periodMl: string };
  type AcadResource = { id: string; titleEn: string; titleMl: string; fileUrl: string; fileSize: string };
  const [acadClasses,   setAcadClasses]   = useState<AcadClass[]>([]);
  const [acadSubjects,  setAcadSubjects]  = useState<AcadSubject[]>([]);
  const [acadExams,     setAcadExams]     = useState<AcadExam[]>([]);
  const [acadResources, setAcadResources] = useState<AcadResource[]>([]);
  const [newSubject,    setNewSubject]    = useState<AcadSubject>({ icon: '', en: '', ml: '' });
  const [newResource,   setNewResource]   = useState<Omit<AcadResource,'id'>>({ titleEn: '', titleMl: '', fileUrl: '', fileSize: '' });
  const [resUploading,  setResUploading]  = useState(false);
  const resFileRef = useRef<HTMLInputElement>(null);

  // ── Activities state ──────────────────────────────────────────────────────
  type ActivityCat = { id: string; emoji: string; bg: string; titleEn: string; titleMl: string; itemsEn: string[]; itemsMl: string[] };
  type Club        = { icon: string; en: string; ml: string };
  const [actCategories, setActCategories] = useState<ActivityCat[]>([]);
  const [actClubs,      setActClubs]      = useState<Club[]>([]);
  const [expandedCat,   setExpandedCat]   = useState<string | null>(null);
  const [newItem,       setNewItem]       = useState('');
  const [newClub,       setNewClub]       = useState<Club>({ icon: '', en: '', ml: '' });
  const [showNewCat,    setShowNewCat]    = useState(false);
  const [newCat,        setNewCat]        = useState({ emoji: '⭐', titleEn: '', titleMl: '', bg: 'from-blue-400 to-indigo-500' });
  const BG_OPTIONS = [
    { label: 'Orange→Red',    value: 'from-orange-400 to-red-500'    },
    { label: 'Purple→Pink',   value: 'from-purple-400 to-pink-500'   },
    { label: 'Blue→Cyan',     value: 'from-blue-400 to-cyan-500'     },
    { label: 'Green→Teal',    value: 'from-green-400 to-teal-500'    },
    { label: 'Yellow→Orange', value: 'from-yellow-400 to-orange-500' },
    { label: 'Pink→Rose',     value: 'from-pink-400 to-rose-500'     },
    { label: 'Indigo→Purple', value: 'from-indigo-400 to-purple-500' },
    { label: 'Teal→Blue',     value: 'from-teal-400 to-blue-500'     },
  ];

  const [ptaAbout,      setPtaAbout]      = useState({ en: '', ml: '' });
  const [committee,     setCommittee]     = useState<Committee[]>([]);
  const [comForm,       setComForm]       = useState<Committee>({ roleEn: '', roleMl: '', nameEn: '', nameMl: '' });
  const [editComIdx,    setEditComIdx]    = useState<number | null>(null);

  // ── Gallery state ─────────────────────────────────────────────────────────
  const [galAlbums,     setGalAlbums]     = useState<GalleryAlbum[]>([]);
  const [galSelected,   setGalSelected]   = useState<GalleryAlbum | null>(null);
  const [galPhotos,     setGalPhotos]     = useState<GalleryPhoto[]>([]);
  const [galLoading,    setGalLoading]    = useState(false);
  const [newAlbumForm,  setNewAlbumForm]  = useState({ titleEn: '', titleMl: '', thumbBg: 'from-green-400 to-green-600' });
  const galFileRef = useRef<HTMLInputElement>(null);

  // ── LSS Winners state ─────────────────────────────────────────────────────
  type LSSWinner = { id: string; year: string; nameEn: string; nameMl: string };
  const [lssWinners,  setLssWinners]  = useState<LSSWinner[]>([]);
  const [lssForm,     setLssForm]     = useState<Omit<LSSWinner,'id'>>({ year: '', nameEn: '', nameMl: '' });
  const [editLss,     setEditLss]     = useState<string | null>(null);

  // ── PTA Meetings state ────────────────────────────────────────────────────
  type PTAMeeting = { id: string; date: string; time: string; venueEn: string; venueMl: string; agendaEn: string; agendaMl: string; fileUrl: string; fileSize: string };
  const [ptaMeetings,   setPtaMeetings]   = useState<PTAMeeting[]>([]);
  const [ptaMeetForm,   setPtaMeetForm]   = useState<Omit<PTAMeeting,'id'>>({ date: '', time: '10:00', venueEn: '', venueMl: '', agendaEn: '', agendaMl: '', fileUrl: '', fileSize: '' });
  const [editPtaMeet,   setEditPtaMeet]   = useState<string | null>(null);
  const [ptaFileRef2]   = [useRef<HTMLInputElement>(null)];
  const [ptaUploading,  setPtaUploading]  = useState(false);

  // ── Circulars state ───────────────────────────────────────────────────────
  type Circular = { id: string; titleEn: string; titleMl: string; date: string; fileUrl: string; fileSize: string };
  const [circulars,    setCirculars]    = useState<Circular[]>([]);
  const [circForm,     setCircForm]     = useState<Omit<Circular,'id'>>({ titleEn: '', titleMl: '', date: '', fileUrl: '', fileSize: '' });
  const [editCirc,     setEditCirc]     = useState<string | null>(null);
  const [circUploading,setCircUploading]= useState(false);
  const circFileRef = useRef<HTMLInputElement>(null);

  // ── Messages state ────────────────────────────────────────────────────────
  type ContactMsg = { id: string; name: string; phone: string; message: string; sentAt: string; read: boolean };
  const [messages,    setMessages]    = useState<ContactMsg[]>([]);
  const [msgLoading,  setMsgLoading]  = useState(false);

  // ── Appearance state ──────────────────────────────────────────────────────
  const [heroImageUrl,  setHeroImageUrl]  = useState('');
  const [logoUrl,       setLogoUrl]       = useState('');
  const heroFileRef = useRef<HTMLInputElement>(null);
  const logoFileRef = useRef<HTMLInputElement>(null);

  // ── Navigation state ──────────────────────────────────────────────────────
  const [navForm, setNavForm] = useState({
    schoolNameEn: 'Palad LPS',
    schoolNameMl: 'പാളാട് എൽ പി എസ്',
    locationEn:   'Mattanur, Kannur',
    locationMl:   'മട്ടന്നൂർ, കണ്ണൂർ',
    phone:        '9746696447',
    email:        'paladlps51@gmail.com',
    nav: {
      home:         { en: 'Home',          ml: 'ഹോം' },
      about:        { en: 'About',         ml: 'ഞങ്ങളെ കുറിച്ച്' },
      academics:    { en: 'Academics',     ml: 'അക്കാദമിക്' },
      admissions:   { en: 'Admissions',    ml: 'പ്രവേശനം' },
      activities:   { en: 'Activities',    ml: 'പ്രവർത്തനങ്ങൾ' },
      gallery:      { en: 'Gallery',       ml: 'ഗ്യാലറി' },
      news:         { en: 'News & Events', ml: 'വാർത്തകൾ & ഇവന്റുകൾ' },
      achievements: { en: 'Achievements',  ml: 'നേട്ടങ്ങൾ' },
      pta:          { en: 'PTA',           ml: 'പി.ടി.എ' },
      contact:      { en: 'Contact',       ml: 'ബന്ധപ്പെടുക' },
    } as Record<string, { en: string; ml: string }>,
  });

  // ── Load all data from Firestore ──────────────────────────────────────────
  const loadAll = async () => {
    // Show static data immediately — panel is usable right away
    setAnnouncements(ANNOUNCEMENTS as unknown as Ann[]);
    setEvents(EVENTS as unknown as Ev[]);
    setStaff(STAFF as unknown as StaffMember[]);
    setAchievements(ACHIEVEMENTS as unknown as Ach[]);
    setTestimonials(TESTIMONIALS as unknown as Testimonial[]);
    setLoading(false);

    // Try Firestore — no artificial timeout, show warning only on real error
    try {
      const [anns, evs, stf, achs, tests, info] = await Promise.all([
        getCol<Ann>('announcements'),
        getCol<Ev>('events'),
        getCol<StaffMember>('staff'),
        getCol<Ach>('achievements'),
        getCol<Testimonial>('testimonials'),
        getSchoolInfo(),
      ]);
      setFirebaseNotice(false);
      // Use Firestore data if available, otherwise keep static fallback
      if (anns.length)  setAnnouncements(anns.sort((a, b) => b.date.localeCompare(a.date)));
      if (evs.length)   setEvents(evs.sort((a, b) => a.date.localeCompare(b.date)));
      if (stf.length)   setStaff(stf);
      if (achs.length)  setAchievements(achs);
      if (tests.length) setTestimonials(tests);
      const i = info as any;
      setInfoForm({
        principal:      i.principal      ?? SCHOOL.principal,
        phone:          i.phone          ?? SCHOOL.phone,
        email:          i.email          ?? SCHOOL.email,
        whatsappNumber: i.whatsappNumber ?? SCHOOL.whatsappNumber,
        schoolHours:    i.schoolHours    ?? SCHOOL.schoolHours,
        workingDays:    i.workingDays    ?? SCHOOL.workingDays,
        classes:        i.classes        ?? SCHOOL.classes,
        teachers:       String(i.teachers ?? SCHOOL.teachers),
        addressEn:      i.address?.en    ?? SCHOOL.address.en,
        addressMl:      i.address?.ml    ?? SCHOOL.address.ml,
        mapEmbedUrl:    i.mapEmbedUrl    ?? SCHOOL.mapEmbedUrl,
      });
      // Load gallery albums and site settings
      const [albums, settings] = await Promise.all([
        getCol<GalleryAlbum>('gallery_albums'),
        getSiteSettings(),
      ]);
      setGalAlbums(albums);
      const s = settings as any;
      if (s.heroImageUrl) setHeroImageUrl(s.heroImageUrl);
      if (s.logoUrl)      setLogoUrl(s.logoUrl);
      setNavForm(prev => ({
        schoolNameEn: s.schoolNameEn ?? prev.schoolNameEn,
        schoolNameMl: s.schoolNameMl ?? prev.schoolNameMl,
        locationEn:   s.locationEn   ?? prev.locationEn,
        locationMl:   s.locationMl   ?? prev.locationMl,
        phone:        s.phone        ?? prev.phone,
        email:        s.email        ?? prev.email,
        nav:          s.nav          ?? prev.nav,
      }));

      // Load page content
      const [hist, vis, pta] = await Promise.all([
        getPage('history'), getPage('vision_mission'), getPage('pta'),
      ]);
      if (hist) { setHistoryIntro({ en: hist.introEn, ml: hist.introMl }); setTimeline(hist.timeline ?? []); }
      if (vis)  { setVision({ en: vis.visionEn, ml: vis.visionMl }); setMission({ en: vis.missionEn, ml: vis.missionMl }); setValues(vis.values ?? []); }
      if (pta)  { setPtaAbout({ en: pta.aboutEn, ml: pta.aboutMl }); setCommittee(pta.committee ?? []); }
      const lss   = await getCol<LSSWinner>('lss_winners');
      if (lss.length) setLssWinners(lss.sort((a, b) => b.year.localeCompare(a.year)));
      const ptam  = await getCol<PTAMeeting>('pta_meetings');
      if (ptam.length) setPtaMeetings(ptam.sort((a, b) => b.date.localeCompare(a.date)));
      const circs = await getCol<Circular>('circulars');
      if (circs.length) setCirculars(circs.sort((a, b) => b.date.localeCompare(a.date)));
      const adm = await getPage('admissions');
      if (adm)  setAdmData(prev => ({ ...prev, ...adm }));
      const acad = await getPage('academics');
      if (acad) { setAcadClasses(acad.classes ?? []); setAcadSubjects(acad.subjects ?? []); setAcadExams(acad.exams ?? []); setAcadResources(acad.resources ?? []); }
      const acts = await getPage('activities');
      if (acts) { setActCategories(acts.categories ?? []); setActClubs(acts.clubs ?? []); }

      // Seed collections that are still empty in background
      bgFirestore(() => seedIfNeeded());
    } catch (e: any) {
      console.error('Firebase error:', e?.code ?? e?.message ?? e);
      setFirebaseNotice(true);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      setLoggedIn(true);
      setAuthErr('');
      await loadAll();
    } else {
      setAuthErr(ml ? 'തെറ്റായ പാസ്‌വേഡ്' : 'Incorrect password');
    }
  };

  // ── LSS Winners CRUD ─────────────────────────────────────────────────────
  const saveLss = async () => {
    if (!lssForm.nameEn.trim() || !lssForm.year.trim()) return;
    setSaving(true);
    const id   = editLss ?? Date.now().toString();
    const item: LSSWinner = { ...lssForm, id };
    const updated = editLss ? lssWinners.map(l => l.id === id ? item : l) : [item, ...lssWinners];
    setLssWinners(updated.sort((a, b) => b.year.localeCompare(a.year)));
    try { await saveDoc('lss_winners', id, item); flash('Saved ✓'); } catch { flash('Save failed ✗'); }
    setLssForm({ year: '', nameEn: '', nameMl: '' }); setEditLss(null); setSaving(false);
  };
  const delLss = async (id: string) => {
    setLssWinners(p => p.filter(l => l.id !== id));
    bgFirestore(() => removeDoc('lss_winners', id));
  };

  // ── PTA Meetings CRUD ─────────────────────────────────────────────────────
  const savePtaMeet = async () => {
    if (!ptaMeetForm.date.trim()) return;
    setSaving(true);
    const id   = editPtaMeet ?? Date.now().toString();
    const item: PTAMeeting = { ...ptaMeetForm, id };
    const updated = editPtaMeet ? ptaMeetings.map(m => m.id === id ? item : m) : [item, ...ptaMeetings];
    setPtaMeetings(updated.sort((a, b) => b.date.localeCompare(a.date)));
    try { await saveDoc('pta_meetings', id, item); flash('Saved ✓'); } catch { flash('Save failed ✗'); }
    setPtaMeetForm({ date: '', time: '10:00', venueEn: '', venueMl: '', agendaEn: '', agendaMl: '', fileUrl: '', fileSize: '' });
    setEditPtaMeet(null); setSaving(false);
  };
  const delPtaMeet = async (id: string) => {
    setPtaMeetings(p => p.filter(m => m.id !== id));
    bgFirestore(() => removeDoc('pta_meetings', id));
  };
  const handlePtaMinutesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPtaUploading(true);
    try {
      const url  = await uploadFile(file, 'pta-minutes');
      const size = file.size > 1024*1024 ? `${(file.size/1024/1024).toFixed(1)} MB` : `${Math.round(file.size/1024)} KB`;
      setPtaMeetForm(p => ({ ...p, fileUrl: url, fileSize: size }));
      flash('Minutes uploaded ✓');
    } catch { flash('Upload failed ✗'); }
    setPtaUploading(false); e.target.value = '';
  };

  // ── Circulars CRUD ────────────────────────────────────────────────────────
  const saveCirc = async () => {
    if (!circForm.titleEn.trim()) return;
    setSaving(true);
    const id   = editCirc ?? Date.now().toString();
    const item: Circular = { ...circForm, id };
    const updated = editCirc
      ? circulars.map(c => c.id === id ? item : c)
      : [item, ...circulars];
    setCirculars(updated.sort((a, b) => b.date.localeCompare(a.date)));
    try { await saveDoc('circulars', id, item); flash('Saved ✓'); } catch { flash('Save failed ✗'); }
    setCircForm({ titleEn: '', titleMl: '', date: '', fileUrl: '', fileSize: '' });
    setEditCirc(null); setSaving(false);
  };
  const delCirc = async (id: string) => {
    setCirculars(p => p.filter(c => c.id !== id));
    bgFirestore(() => removeDoc('circulars', id));
  };
  const handleCircUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCircUploading(true);
    try {
      const url  = await uploadFile(file, 'circulars');
      const size = file.size > 1024 * 1024 ? `${(file.size/1024/1024).toFixed(1)} MB` : `${Math.round(file.size/1024)} KB`;
      setCircForm(p => ({ ...p, fileUrl: url, fileSize: size }));
      flash('File uploaded ✓');
    } catch { flash('Upload failed ✗'); }
    setCircUploading(false); e.target.value = '';
  };

  // ── Add new activity category ─────────────────────────────────────────────
  const addCategory = async () => {
    if (!newCat.titleEn.trim()) return;
    setSaving(true);
    const item = { id: Date.now().toString(), emoji: newCat.emoji, bg: newCat.bg, titleEn: newCat.titleEn, titleMl: newCat.titleMl || newCat.titleEn, itemsEn: [], itemsMl: [] };
    const updated = [...actCategories, item];
    setActCategories(updated);
    try { await savePage('activities', { categories: updated, clubs: actClubs }); flash('Category added ✓'); }
    catch { flash('Save failed ✗'); }
    setNewCat({ emoji: '⭐', titleEn: '', titleMl: '', bg: 'from-blue-400 to-indigo-500' });
    setShowNewCat(false); setSaving(false);
  };

  const deleteCategory = async (id: string) => {
    const updated = actCategories.filter(c => c.id !== id);
    setActCategories(updated);
    bgFirestore(() => savePage('activities', { categories: updated, clubs: actClubs }));
  };

  // ── Admissions save ───────────────────────────────────────────────────────
  const saveAdmissions = async () => {
    setSaving(true);
    try { await savePage('admissions', admData); flash('Saved ✓'); }
    catch { flash('Save failed ✗'); }
    setSaving(false);
  };

  // ── Academics save ────────────────────────────────────────────────────────
  const saveAcademics = async () => {
    setSaving(true);
    try { await savePage('academics', { classes: acadClasses, subjects: acadSubjects, exams: acadExams, resources: acadResources }); flash('Saved ✓'); }
    catch { flash('Save failed ✗'); }
    setSaving(false);
  };

  const fmtSize = (bytes: number) =>
    bytes >= 1024 * 1024 * 1024
      ? `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`
      : bytes >= 1024 * 1024
        ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
        : `${Math.round(bytes / 1024)} KB`;

  // Upload multiple files at once — each becomes its own resource entry
  const handleResUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setResUploading(true);
    const newItems: AcadResource[] = [];
    for (const file of files) {
      try {
        const url   = await uploadFile(file, 'resources');
        const title = file.name.replace(/\.[^/.]+$/, ''); // strip extension
        newItems.push({ id: Date.now().toString() + Math.random(), titleEn: title, titleMl: '', fileUrl: url, fileSize: fmtSize(file.size) });
      } catch { flash(`Failed: ${file.name}`); }
    }
    if (newItems.length) {
      const updated = [...acadResources, ...newItems];
      setAcadResources(updated);
      await savePage('academics', { classes: acadClasses, subjects: acadSubjects, exams: acadExams, resources: updated });
      flash(`${newItems.length} file(s) added ✓`);
    }
    setResUploading(false);
    e.target.value = '';
  };

  // Manually add a resource with a pre-uploaded file
  const addResource = async () => {
    if (!newResource.titleEn.trim()) return;
    const item: AcadResource = { ...newResource, id: Date.now().toString() };
    const updated = [...acadResources, item];
    setAcadResources(updated);
    await savePage('academics', { classes: acadClasses, subjects: acadSubjects, exams: acadExams, resources: updated });
    setNewResource({ titleEn: '', titleMl: '', fileUrl: '', fileSize: '' });
    flash('Resource added ✓');
  };

  const deleteResource = async (id: string) => {
    const updated = acadResources.filter(r => r.id !== id);
    setAcadResources(updated);
    await savePage('academics', { classes: acadClasses, subjects: acadSubjects, exams: acadExams, resources: updated });
  };

  const updateResourceUrl = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResUploading(true);
    try {
      const url     = await uploadFile(file, 'resources');
      const updated = acadResources.map(r => r.id === id ? { ...r, fileUrl: url, fileSize: fmtSize(file.size) } : r);
      setAcadResources(updated);
      await savePage('academics', { classes: acadClasses, subjects: acadSubjects, exams: acadExams, resources: updated });
      flash('File updated ✓');
    } catch { flash('Upload failed ✗'); }
    setResUploading(false);
    e.target.value = '';
  };

  // ── Activities save ───────────────────────────────────────────────────────
  const saveActivities = async () => {
    setSaving(true);
    try { await savePage('activities', { categories: actCategories, clubs: actClubs }); flash('Saved ✓'); }
    catch { flash('Save failed ✗'); }
    setSaving(false);
  };

  // ── History page CRUD ────────────────────────────────────────────────────
  const saveHistory = async () => {
    setSaving(true);
    try {
      await savePage('history', { introEn: historyIntro.en, introMl: historyIntro.ml, timeline });
      flash('Saved ✓');
    } catch { flash('Save failed ✗'); }
    setSaving(false);
  };
  const saveTl = () => {
    if (!tlForm.year.trim() || !tlForm.en.trim()) return;
    const updated = editTlIdx !== null
      ? timeline.map((t, i) => i === editTlIdx ? tlForm : t)
      : [...timeline, tlForm];
    setTimeline(updated);
    setTlForm({ year: '', en: '', ml: '' }); setEditTlIdx(null);
  };
  const delTl  = (i: number) => setTimeline(p => p.filter((_, idx) => idx !== i));

  // ── Vision/Mission page CRUD ──────────────────────────────────────────────
  const saveVision = async () => {
    setSaving(true);
    try {
      await savePage('vision_mission', { visionEn: vision.en, visionMl: vision.ml, missionEn: mission.en, missionMl: mission.ml, values });
      flash('Saved ✓');
    } catch { flash('Save failed ✗'); }
    setSaving(false);
  };
  const saveVal = () => {
    if (!valForm.en.trim()) return;
    const updated = editValIdx !== null
      ? values.map((v, i) => i === editValIdx ? valForm : v)
      : [...values, valForm];
    setValues(updated);
    setValForm({ icon: '', en: '', ml: '' }); setEditValIdx(null);
  };
  const delVal = (i: number) => setValues(p => p.filter((_, idx) => idx !== i));

  // ── PTA page CRUD ─────────────────────────────────────────────────────────
  const savePTA = async () => {
    setSaving(true);
    try {
      await savePage('pta', { aboutEn: ptaAbout.en, aboutMl: ptaAbout.ml, committee });
      flash('Saved ✓');
    } catch { flash('Save failed ✗'); }
    setSaving(false);
  };
  const saveCom = () => {
    if (!comForm.nameEn.trim() || !comForm.roleEn.trim()) return;
    const updated = editComIdx !== null
      ? committee.map((c, i) => i === editComIdx ? comForm : c)
      : [...committee, comForm];
    setCommittee(updated);
    setComForm({ roleEn: '', roleMl: '', nameEn: '', nameMl: '' }); setEditComIdx(null);
  };
  const delCom = (i: number) => setCommittee(p => p.filter((_, idx) => idx !== i));

  // ── Gallery handlers ──────────────────────────────────────────────────────
  const selectAlbum = async (album: GalleryAlbum) => {
    setGalSelected(album);
    setGalLoading(true);
    try {
      const photos = await getAlbumPhotos(album.id);
      setGalPhotos(photos);
    } catch { setGalPhotos([]); }
    setGalLoading(false);
  };

  const createAlbum = async () => {
    if (!newAlbumForm.titleEn.trim()) return;
    setSaving(true);
    const id   = Date.now().toString();
    const item: GalleryAlbum = { ...newAlbumForm, id, count: 0 };
    await saveDoc('gallery_albums', id, item);
    setGalAlbums(p => [...p, item]);
    setNewAlbumForm({ titleEn: '', titleMl: '', thumbBg: 'from-green-400 to-green-600' });
    flash('Album created ✓');
    setSaving(false);
  };

  const handleGalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!galSelected || !e.target.files?.length) return;
    setUploading(true);
    const files = Array.from(e.target.files);
    try {
      for (const file of files) {
        const url = await uploadPhoto(file, galSelected.id);
        await saveGalleryPhoto(galSelected.id, url);
        setGalPhotos(p => [...p, { id: Date.now().toString(), url }]);
        setGalAlbums(p => p.map(a => a.id === galSelected.id
          ? { ...a, count: a.count + 1, coverUrl: a.coverUrl ?? url }
          : a));
      }
      flash(`${files.length} photo(s) uploaded ✓`);
    } catch { flash('Upload failed ✗'); }
    setUploading(false);
    e.target.value = '';
  };

  const deletePhoto = async (photo: GalleryPhoto) => {
    if (!galSelected) return;
    await deleteGalleryPhoto(photo.id, galSelected.id);
    setGalPhotos(p => p.filter(ph => ph.id !== photo.id));
    setGalAlbums(p => p.map(a => a.id === galSelected.id ? { ...a, count: Math.max(0, a.count - 1) } : a));
  };

  // ── Navigation save ───────────────────────────────────────────────────────
  const saveNavigation = async () => {
    setSaving(true);
    try {
      await saveSiteSettings(navForm);
      flash('Saved ✓');
    } catch { flash('Save failed ✗'); }
    setSaving(false);
  };

  // ── Appearance handlers ───────────────────────────────────────────────────
  const uploadAppearanceImage = async (
    file: File, folder: string,
    setter: (url: string) => void,
    settingsKey: string,
  ) => {
    setUploading(true);
    try {
      const url = await uploadPhoto(file, folder);
      setter(url);
      await saveSiteSettings({ [settingsKey]: url });
      flash('Image saved ✓');
    } catch { flash('Upload failed ✗'); }
    setUploading(false);
  };

  // ── Auto-translate helper ─────────────────────────────────────────────────
  // Always translate on blur — setters in new-item forms use `v`
  // (won't overwrite manually typed content); page-content setters update directly.
  const autoXlate = useCallback(async (
    src: string, from: string, to: string,
    setter: (v: string) => void,
  ) => {
    if (!src.trim()) return;
    const result = await xlate(src, from, to);
    if (result) setter(result);
  }, []);

  // ── Announcement CRUD ─────────────────────────────────────────────────────
  const saveAnn = async () => {
    if (!annForm.titleEn.trim()) return;
    setSaving(true);
    const { en, ml: mlD } = fmtDate(annForm.date);
    const id   = editAnn ?? Date.now().toString();
    const item: Ann = { ...annForm, id, dateEn: en, dateMl: mlD };
    setAnnouncements(p => [...p.filter(a => a.id !== id), item].sort((a, b) => b.date.localeCompare(a.date)));
    setAnnForm(emptyAnn); setEditAnn(null); setSaving(false);
    try { await saveDoc('announcements', id, item); flash('Saved ✓'); } catch { flash('Save failed ✗'); }
  };
  const delAnn = (id: string) => {
    setAnnouncements(p => p.filter(a => a.id !== id));
    bgFirestore(() => removeDoc('announcements', id));
  };
  const startEditAnn = (a: Ann) => {
    setEditAnn(a.id);
    setAnnForm({ type: a.type ?? 'announcement', titleEn: a.titleEn ?? '', titleMl: a.titleMl ?? '', date: a.date ?? '', dateEn: a.dateEn ?? '', dateMl: a.dateMl ?? '', excerptEn: a.excerptEn ?? '', excerptMl: a.excerptMl ?? '' });
  };

  // ── Event CRUD ────────────────────────────────────────────────────────────
  const saveEv = async () => {
    if (!evForm.titleEn.trim()) return;
    setSaving(true);
    const { en, ml: mlD } = fmtDate(evForm.date);
    const id   = editEv ?? Date.now().toString();
    const item: Ev = { ...evForm, id, dateEn: en, dateMl: mlD };
    setEvents(p => [...p.filter(e => e.id !== id), item].sort((a, b) => a.date.localeCompare(b.date)));
    setEvForm(emptyEv); setEditEv(null); setSaving(false);
    try { await saveDoc('events', id, item); flash('Saved ✓'); } catch { flash('Save failed ✗'); }
  };
  const delEv = (id: string) => {
    setEvents(p => p.filter(e => e.id !== id));
    bgFirestore(() => removeDoc('events', id));
  };
  const startEditEv = (ev: Ev) => {
    setEditEv(ev.id);
    setEvForm({ titleEn: ev.titleEn ?? '', titleMl: ev.titleMl ?? '', date: ev.date ?? '', dateEn: ev.dateEn ?? '', dateMl: ev.dateMl ?? '', venueEn: ev.venueEn ?? '', venueMl: ev.venueMl ?? '' });
  };

  // ── Staff CRUD ────────────────────────────────────────────────────────────
  const saveStaffMember = async () => {
    if (!staffForm.name.trim()) return;
    setSaving(true);
    const id   = editStaff ?? Date.now().toString();
    const item: StaffMember = { ...staffForm, id };
    setStaff(p => [...p.filter(s => s.id !== id), item]);
    setStaffForm(emptyStaff); setEditStaff(null); setSaving(false);
    try { await saveDoc('staff', id, item); flash('Saved ✓'); } catch { flash('Save failed ✗'); }
  };
  const delStaff = (id: string) => {
    setStaff(p => p.filter(s => s.id !== id));
    bgFirestore(() => removeDoc('staff', id));
  };
  const startEditStaff = (s: StaffMember) => {
    setEditStaff(s.id);
    setStaffForm({ name: s.name ?? '', roleEn: s.roleEn ?? '', roleMl: s.roleMl ?? '', subjectEn: s.subjectEn ?? '', subjectMl: s.subjectMl ?? '' });
  };

  // ── Achievement CRUD ──────────────────────────────────────────────────────
  const saveAchievement = async () => {
    if (!achForm.titleEn.trim()) return;
    setSaving(true);
    const id   = editAch ?? Date.now().toString();
    const item: Ach = { ...achForm, id };
    setAchievements(p => [...p.filter(a => a.id !== id), item]);
    setAchForm(emptyAch); setEditAch(null); setSaving(false);
    try { await saveDoc('achievements', id, item); flash('Saved ✓'); } catch { flash('Save failed ✗'); }
  };
  const delAch = (id: string) => {
    setAchievements(p => p.filter(a => a.id !== id));
    bgFirestore(() => removeDoc('achievements', id));
  };
  const startEditAch = (a: Ach) => {
    setEditAch(a.id);
    setAchForm({ icon: a.icon ?? '🏆', iconBg: a.iconBg ?? 'bg-yellow-100', titleEn: a.titleEn ?? '', titleMl: a.titleMl ?? '', count: a.count ?? '', labelEn: a.labelEn ?? '', labelMl: a.labelMl ?? '', descEn: a.descEn ?? '', descMl: a.descMl ?? '' });
  };

  // ── Testimonial CRUD ──────────────────────────────────────────────────────
  const saveTestimonial = async () => {
    if (!testForm.nameEn.trim()) return;
    setSaving(true);
    const id   = editTest ?? Date.now().toString();
    const item: Testimonial = { ...testForm, id };
    setTestimonials(p => [...p.filter(t => t.id !== id), item]);
    setTestForm(emptyTest); setEditTest(null); setSaving(false);
    try { await saveDoc('testimonials', id, item); flash('Saved ✓'); } catch { flash('Save failed ✗'); }
  };
  const delTest = (id: string) => {
    setTestimonials(p => p.filter(t => t.id !== id));
    bgFirestore(() => removeDoc('testimonials', id));
  };
  const startEditTest = (t: Testimonial) => {
    setEditTest(t.id);
    setTestForm({ nameEn: t.nameEn ?? '', nameMl: t.nameMl ?? '', textEn: t.textEn ?? '', textMl: t.textMl ?? '' });
  };

  const flash = (msg: string) => {
    setSavedMsg(msg);
    setTimeout(() => setSavedMsg(''), 2500);
  };

  // ── School Info save ──────────────────────────────────────────────────────
  const saveInfo = async () => {
    setSaving(true);
    try {
      await saveSchoolInfo({
        principal:      infoForm.principal,
        phone:          infoForm.phone,
        email:          infoForm.email,
        whatsappNumber: infoForm.whatsappNumber,
        schoolHours:    infoForm.schoolHours,
        workingDays:    infoForm.workingDays,
        classes:        infoForm.classes,
        teachers:       Number(infoForm.teachers),
        address:        { en: infoForm.addressEn, ml: infoForm.addressMl },
        mapEmbedUrl:    infoForm.mapEmbedUrl,
      });
      flash(ml ? 'സൂക്ഷിച്ചു ✓' : 'Saved ✓');
    } catch {
      flash(ml ? 'പരാജയപ്പെട്ടു ✗' : 'Save failed ✗');
    }
    setSaving(false);
  };

  // Convert Google Drive share links to direct download links
  const toDirectUrl = (url: string): string => {
    const gdMatch = url.match(/\/file\/d\/([^/]+)/);
    if (gdMatch) return `https://drive.google.com/uc?export=download&id=${gdMatch[1]}`;
    return url;
  };

  const navItems: { key: Section; icon: React.ElementType; labelMl: string; labelEn: string }[] = [
    { key: 'dashboard',     icon: LayoutDashboard, labelMl: 'ഡാഷ്ബോർഡ്',        labelEn: 'Dashboard'     },
    { key: 'announcements', icon: Bell,            labelMl: 'അറിയിപ്പുകൾ',        labelEn: 'Announcements' },
    { key: 'events',        icon: Calendar,        labelMl: 'ഇവന്റുകൾ',           labelEn: 'Events'        },
    { key: 'staff',         icon: Users,           labelMl: 'സ്റ്റാഫ്',             labelEn: 'Staff'         },
    { key: 'achievements',  icon: Trophy,          labelMl: 'നേട്ടങ്ങൾ',           labelEn: 'Achievements'  },
    { key: 'testimonials',  icon: MessageSquare,   labelMl: 'സാക്ഷ്യങ്ങൾ',         labelEn: 'Testimonials'  },
    { key: 'gallery',       icon: Images,          labelMl: 'ഗ്യാലറി',             labelEn: 'Gallery'       },
    { key: 'appearance',    icon: Images,          labelMl: 'ദൃശ്യരൂപം',           labelEn: 'Appearance'    },
    { key: 'navigation',    icon: LayoutDashboard, labelMl: 'നാവിഗേഷൻ',            labelEn: 'Navigation'    },
    { key: 'schoolinfo',    icon: School,          labelMl: 'സ്കൂൾ വിവരങ്ങൾ',     labelEn: 'School Info'   },
    { key: 'admissions',    icon: Bell,            labelMl: 'പ്രവേശനം',             labelEn: 'Admissions'    },
    { key: 'circulars',     icon: FileText,        labelMl: 'സർക്കുലറുകൾ',          labelEn: 'Circulars'     },
    { key: 'academics',     icon: Bell,            labelMl: 'അക്കാദമിക്',            labelEn: 'Academics'     },
    { key: 'activities',    icon: Bell,            labelMl: 'പ്രവർത്തനങ്ങൾ',         labelEn: 'Activities'    },
    { key: 'history',       icon: Bell,            labelMl: 'ചരിത്രം',              labelEn: 'History'       },
    { key: 'vision',        icon: Trophy,          labelMl: 'ദർശനം & ദൗത്യം',     labelEn: 'Vision/Mission' },
    { key: 'pta',           icon: Users,           labelMl: 'PTA',                  labelEn: 'PTA'           },
    { key: 'ptameetings',   icon: Calendar,        labelMl: 'PTA യോഗങ്ങൾ',          labelEn: 'PTA Meetings'  },
    { key: 'lss',           icon: Trophy,          labelMl: 'LSS ഹാൾ ഓഫ് ഫെയിം',   labelEn: 'LSS Hall of Fame' },
    { key: 'messages',      icon: MessageSquare,   labelMl: 'സന്ദേശങ്ങൾ',          labelEn: 'Messages'      },
    { key: 'comments',      icon: MessageSquare,   labelMl: 'കമന്റ്സ്',             labelEn: 'Comments'      },
  ];

  /* ── LOGIN ─────────────────────────────────────────────────────────────── */
  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center px-4">
        <div className="card p-10 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-primary-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-primary-600" />
            </div>
            <h1 className={`text-2xl font-bold text-primary-700 ${ml ? 'font-malayalam' : ''}`}>
              {ml ? 'അഡ്മിൻ ലോഗിൻ' : 'Admin Login'}
            </h1>
            <p className={`text-sm text-gray-400 mt-1 ${ml ? 'font-malayalam' : ''}`}>
              {ml ? 'അദ്ധ്യാപകർ / അദ്ധ്യക്ഷർ മാത്രം' : 'School authorities only'}
            </p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-1.5 ${ml ? 'font-malayalam' : ''}`}>
                {ml ? 'പാസ്‌വേഡ്' : 'Password'}
              </label>
              <input
                type="password" required value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                placeholder="••••••••"
              />
            </div>
            {authErr && <p className={`text-red-500 text-sm ${ml ? 'font-malayalam' : ''}`}>{authErr}</p>}
            <button type="submit" className="w-full btn-primary justify-center py-3">
              <span className={ml ? 'font-malayalam' : ''}>{ml ? 'ലോഗിൻ' : 'Login'}</span>
            </button>
          </form>
          <p className="text-xs text-center text-gray-400 mt-6">Demo password: admin123</p>
        </div>
      </div>
    );
  }

  /* ── ADMIN LAYOUT ──────────────────────────────────────────────────────── */
  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* Sidebar */}
      <aside className="w-56 bg-primary-800 text-white flex flex-col shrink-0">
        <div className="p-5 border-b border-primary-700">
          <div className={`font-bold text-sm ${ml ? 'font-malayalam' : ''}`}>
            {ml ? 'അഡ്മിൻ പാനൽ' : 'Admin Panel'}
          </div>
          <div className={`text-primary-300 text-xs mt-0.5 ${ml ? 'font-malayalam' : ''}`}>
            {ml ? 'പാളാട് എൽ പി എസ്' : 'Palad LPS'}
          </div>
        </div>
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {navItems.map(({ key, icon: Icon, labelMl, labelEn }) => (
            <button key={key} onClick={() => setSection(key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                section === key ? 'bg-primary-600 text-white' : 'text-primary-200 hover:bg-primary-700'
              } ${ml ? 'font-malayalam' : ''}`}>
              <Icon className="h-4 w-4 shrink-0" />
              {ml ? labelMl : labelEn}
            </button>
          ))}
        </nav>
        <div className="p-2 border-t border-primary-700">
          <button onClick={() => setLoggedIn(false)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-primary-300 hover:bg-primary-700">
            <LogOut className="h-4 w-4" />
            <span className={ml ? 'font-malayalam' : ''}>{ml ? 'ലോഗൗട്ട്' : 'Logout'}</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-gray-400">
            {ml ? 'ലോഡ് ചെയ്യുന്നു...' : 'Loading data...'}
          </div>
        ) : (
          <>
            {firebaseNotice && (
              <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-sm text-amber-800">
                <strong>Firebase not connected</strong> — data is currently local (static). To enable live saving, add your Firebase credentials to <code className="bg-amber-100 px-1 rounded">.env.local</code>.
                {' '}<button onClick={() => setFirebaseNotice(false)} className="underline ml-1">Dismiss</button>
              </div>
            )}

            {/* ── DASHBOARD ── */}
            {section === 'dashboard' && (
              <div>
                <h2 className={`text-2xl font-bold text-primary-700 mb-6 ${ml ? 'font-malayalam' : ''}`}>
                  {ml ? 'ഡാഷ്ബോർഡ്' : 'Dashboard'}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { icon: Bell,     value: announcements.length, labelMl: 'അറിയിപ്പുകൾ',  labelEn: 'Announcements', color: 'bg-blue-100 text-blue-600'    },
                    { icon: Calendar, value: events.length,        labelMl: 'ഇവന്റുകൾ',      labelEn: 'Events',        color: 'bg-green-100 text-green-600'  },
                    { icon: Users,    value: staff.length,         labelMl: 'സ്റ്റാഫ്',        labelEn: 'Staff',         color: 'bg-purple-100 text-purple-600'},
                    { icon: Trophy,   value: achievements.length,  labelMl: 'നേട്ടങ്ങൾ',      labelEn: 'Achievements',  color: 'bg-yellow-100 text-yellow-600'},
                  ].map(({ icon: Icon, value, labelMl, labelEn, color }) => (
                    <div key={labelEn} className="card p-5">
                      <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-3`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="text-2xl font-bold text-gray-800">{value}</div>
                      <div className={`text-sm text-gray-500 mt-0.5 ${ml ? 'font-malayalam' : ''}`}>
                        {ml ? labelMl : labelEn}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="card p-5">
                  <h3 className={`font-bold text-gray-700 mb-3 ${ml ? 'font-malayalam' : ''}`}>
                    {ml ? 'ദ്രുത പ്രവർത്തനങ്ങൾ' : 'Quick Actions'}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {([
                      ['announcements', '+ Announcement', '+ അറിയിപ്പ്'],
                      ['events',        '+ Event',        '+ ഇവന്റ്'],
                      ['staff',         '+ Staff',        '+ സ്റ്റാഫ്'],
                      ['gallery',       'Upload Photo',   'ഫോട്ടോ'],
                    ] as [Section, string, string][]).map(([s, en, mlLabel]) => (
                      <button key={s} onClick={() => setSection(s)}
                        className={`btn-outline text-sm py-1.5 ${ml ? 'font-malayalam' : ''}`}>
                        {ml ? mlLabel : en}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── ANNOUNCEMENTS ── */}
            {section === 'announcements' && (
              <div>
                <h2 className={`text-2xl font-bold text-primary-700 mb-5 ${ml ? 'font-malayalam' : ''}`}>
                  {ml ? 'അറിയിപ്പുകൾ' : 'Announcements'}
                </h2>
                <div className="card p-5 mb-5">
                  <h3 className="font-semibold text-gray-700 mb-4 text-sm">
                    {editAnn ? (ml ? 'എഡിറ്റ് ചെയ്യുക' : 'Edit') : (ml ? 'പുതിയത് ചേർക്കുക' : 'Add New')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={lbl}>{ml ? 'തരം' : 'Type'}</label>
                      <select value={annForm.type} onChange={e => setAnnForm({ ...annForm, type: e.target.value })} className={inp}>
                        <option value="announcement">{ml ? 'അറിയിപ്പ്' : 'Announcement'}</option>
                        <option value="event">{ml ? 'ഇവന്റ്' : 'Event'}</option>
                        <option value="circular">{ml ? 'സർക്കുലർ' : 'Circular'}</option>
                      </select>
                    </div>
                    <div>
                      <label className={lbl}>{ml ? 'തീയതി' : 'Date'}</label>
                      <input type="date" value={annForm.date} onChange={e => setAnnForm({ ...annForm, date: e.target.value })} className={inp} />
                    </div>
                    <div>
                      <label className={lbl}>Title (English)</label>
                      <input value={annForm.titleEn}
                        onChange={e => setAnnForm(p => ({ ...p, titleEn: e.target.value }))}
                        onBlur={e => autoXlate(e.target.value, 'en', 'ml', v => setAnnForm(p => ({ ...p, titleMl: v })))}
                        className={inp} placeholder="Title in English" />
                    </div>
                    <div>
                      <label className={`${lbl} font-malayalam`}>ശീർഷകം (മലയാളം)</label>
                      <input value={annForm.titleMl}
                        onChange={e => setAnnForm(p => ({ ...p, titleMl: e.target.value }))}
                        onBlur={e => autoXlate(e.target.value, 'ml', 'en', v => setAnnForm(p => ({ ...p, titleEn: v })))}
                        className={`${inp} font-malayalam`} placeholder="മലയാളം ശീർഷകം" />
                    </div>
                    <div>
                      <label className={lbl}>Excerpt (English)</label>
                      <textarea rows={2} value={annForm.excerptEn}
                        onChange={e => setAnnForm(p => ({ ...p, excerptEn: e.target.value }))}
                        onBlur={e => autoXlate(e.target.value, 'en', 'ml', v => setAnnForm(p => ({ ...p, excerptMl: v })))}
                        className={`${inp} resize-none`} placeholder="Short description" />
                    </div>
                    <div>
                      <label className={`${lbl} font-malayalam`}>ചുരുക്കം (മലയാളം)</label>
                      <textarea rows={2} value={annForm.excerptMl}
                        onChange={e => setAnnForm(p => ({ ...p, excerptMl: e.target.value }))}
                        onBlur={e => autoXlate(e.target.value, 'ml', 'en', v => setAnnForm(p => ({ ...p, excerptEn: v })))}
                        className={`${inp} resize-none font-malayalam`} placeholder="ചുരുക്ക വിവരണം" />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button onClick={saveAnn} disabled={saving} className="btn-primary py-2 text-sm">
                      <Save className="h-4 w-4" />
                      <span className={ml ? 'font-malayalam' : ''}>{saving ? '...' : editAnn ? (ml ? 'അപ്‌ഡേറ്റ്' : 'Update') : (ml ? 'ചേർക്കുക' : 'Save')}</span>
                    </button>
                    {editAnn && (
                      <button onClick={() => { setAnnForm(emptyAnn); setEditAnn(null); }} className="btn-outline py-2 text-sm">
                        <X className="h-4 w-4" /><span>{ml ? 'റദ്ദാക്കുക' : 'Cancel'}</span>
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  {announcements.map(a => (
                    <div key={a.id} className="card p-4 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full mr-2">{a.type}</span>
                        <span className="font-medium text-gray-800">{a.titleEn}</span>
                        <span className="text-xs text-gray-400 ml-2">{a.date}</span>
                        {a.titleMl && <div className="text-xs text-gray-500 font-malayalam mt-0.5">{a.titleMl}</div>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => startEditAnn(a)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><Edit3 className="h-4 w-4" /></button>
                        <button onClick={() => delAnn(a.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-400"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── EVENTS ── */}
            {section === 'events' && (
              <div>
                <h2 className={`text-2xl font-bold text-primary-700 mb-5 ${ml ? 'font-malayalam' : ''}`}>
                  {ml ? 'ഇവന്റുകൾ' : 'Events'}
                </h2>
                <div className="card p-5 mb-5">
                  <h3 className="font-semibold text-gray-700 mb-4 text-sm">
                    {editEv ? 'Edit Event' : 'Add New Event'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={lbl}>Title (English)</label>
                      <input value={evForm.titleEn}
                        onChange={e => setEvForm(p => ({ ...p, titleEn: e.target.value }))}
                        onBlur={e => autoXlate(e.target.value, 'en', 'ml', v => setEvForm(p => ({ ...p, titleMl: v })))}
                        className={inp} placeholder="Event title" />
                    </div>
                    <div>
                      <label className={`${lbl} font-malayalam`}>ശീർഷകം (മലയാളം)</label>
                      <input value={evForm.titleMl}
                        onChange={e => setEvForm(p => ({ ...p, titleMl: e.target.value }))}
                        onBlur={e => autoXlate(e.target.value, 'ml', 'en', v => setEvForm(p => ({ ...p, titleEn: v })))}
                        className={`${inp} font-malayalam`} placeholder="ഇവന്റ് ശീർഷകം" />
                    </div>
                    <div>
                      <label className={lbl}>Date</label>
                      <input type="date" value={evForm.date} onChange={e => setEvForm(p => ({ ...p, date: e.target.value }))} className={inp} />
                    </div>
                    <div />
                    <div>
                      <label className={lbl}>Venue (English)</label>
                      <input value={evForm.venueEn}
                        onChange={e => setEvForm(p => ({ ...p, venueEn: e.target.value }))}
                        onBlur={e => autoXlate(e.target.value, 'en', 'ml', v => setEvForm(p => ({ ...p, venueMl: v })))}
                        className={inp} placeholder="e.g. School Hall" />
                    </div>
                    <div>
                      <label className={`${lbl} font-malayalam`}>വേദി (മലയാളം)</label>
                      <input value={evForm.venueMl}
                        onChange={e => setEvForm(p => ({ ...p, venueMl: e.target.value }))}
                        onBlur={e => autoXlate(e.target.value, 'ml', 'en', v => setEvForm(p => ({ ...p, venueEn: v })))}
                        className={`${inp} font-malayalam`} placeholder="e.g. സ്കൂൾ ഹാൾ" />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button onClick={saveEv} disabled={saving} className="btn-primary py-2 text-sm">
                      <Save className="h-4 w-4" /><span>{saving ? '...' : editEv ? 'Update' : 'Save'}</span>
                    </button>
                    {editEv && (
                      <button onClick={() => { setEvForm(emptyEv); setEditEv(null); }} className="btn-outline py-2 text-sm">
                        <X className="h-4 w-4" /><span>Cancel</span>
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  {events.map(ev => (
                    <div key={ev.id} className="card p-4 flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <span className="font-medium text-gray-800">{ev.titleEn}</span>
                        <span className="text-xs text-gray-400 ml-2">{ev.date}</span>
                        <span className="text-xs text-gray-500 ml-2">@ {ev.venueEn}</span>
                        {ev.titleMl && <div className="text-xs text-gray-500 font-malayalam mt-0.5">{ev.titleMl}</div>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => startEditEv(ev)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><Edit3 className="h-4 w-4" /></button>
                        <button onClick={() => delEv(ev.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-400"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── STAFF ── */}
            {section === 'staff' && (
              <div>
                <h2 className={`text-2xl font-bold text-primary-700 mb-5 ${ml ? 'font-malayalam' : ''}`}>
                  {ml ? 'സ്റ്റാഫ്' : 'Staff'}
                </h2>
                <div className="card p-5 mb-5">
                  <h3 className="font-semibold text-gray-700 mb-4 text-sm">
                    {editStaff ? 'Edit Member' : 'Add Staff Member'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="md:col-span-2">
                      <label className={lbl}>Full Name</label>
                      <input value={staffForm.name} onChange={e => setStaffForm({ ...staffForm, name: e.target.value })} className={inp} placeholder="Full name" />
                    </div>
                    <div>
                      <label className={lbl}>Role (English)</label>
                      <input value={staffForm.roleEn}
                        onChange={e => setStaffForm(p => ({ ...p, roleEn: e.target.value }))}
                        onBlur={e => autoXlate(e.target.value, 'en', 'ml', v => setStaffForm(p => ({ ...p, roleMl: v })))}
                        className={inp} placeholder="e.g. Principal" />
                    </div>
                    <div>
                      <label className={`${lbl} font-malayalam`}>സ്ഥാനം (മലയാളം)</label>
                      <input value={staffForm.roleMl}
                        onChange={e => setStaffForm(p => ({ ...p, roleMl: e.target.value }))}
                        onBlur={e => autoXlate(e.target.value, 'ml', 'en', v => setStaffForm(p => ({ ...p, roleEn: v })))}
                        className={`${inp} font-malayalam`} placeholder="e.g. പ്രിൻസിപ്പൽ" />
                    </div>
                    <div>
                      <label className={lbl}>Subject (English)</label>
                      <input value={staffForm.subjectEn}
                        onChange={e => setStaffForm(p => ({ ...p, subjectEn: e.target.value }))}
                        onBlur={e => autoXlate(e.target.value, 'en', 'ml', v => setStaffForm(p => ({ ...p, subjectMl: v })))}
                        className={inp} placeholder="e.g. Mathematics" />
                    </div>
                    <div>
                      <label className={`${lbl} font-malayalam`}>വിഷയം (മലയാളം)</label>
                      <input value={staffForm.subjectMl}
                        onChange={e => setStaffForm(p => ({ ...p, subjectMl: e.target.value }))}
                        onBlur={e => autoXlate(e.target.value, 'ml', 'en', v => setStaffForm(p => ({ ...p, subjectEn: v })))}
                        className={`${inp} font-malayalam`} placeholder="e.g. ഗണിതം" />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button onClick={saveStaffMember} disabled={saving} className="btn-primary py-2 text-sm">
                      <Save className="h-4 w-4" /><span>{saving ? '...' : editStaff ? 'Update' : 'Add'}</span>
                    </button>
                    {editStaff && (
                      <button onClick={() => { setStaffForm(emptyStaff); setEditStaff(null); }} className="btn-outline py-2 text-sm">
                        <X className="h-4 w-4" /><span>Cancel</span>
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  {staff.map(s => (
                    <div key={s.id} className="card p-4 flex items-center justify-between gap-4">
                      <div>
                        <span className="font-medium text-gray-800">{s.name}</span>
                        <span className="text-xs text-primary-600 ml-2">{s.roleEn}</span>
                        <span className="text-xs text-gray-500 ml-1">· {s.subjectEn}</span>
                        {s.roleMl && <div className="text-xs text-gray-500 font-malayalam mt-0.5">{s.roleMl} · {s.subjectMl}</div>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => startEditStaff(s)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><Edit3 className="h-4 w-4" /></button>
                        <button onClick={() => delStaff(s.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-400"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── ACHIEVEMENTS ── */}
            {section === 'achievements' && (
              <div>
                <h2 className={`text-2xl font-bold text-primary-700 mb-5 ${ml ? 'font-malayalam' : ''}`}>
                  {ml ? 'നേട്ടങ്ങൾ' : 'Achievements'}
                </h2>
                <div className="card p-5 mb-5">
                  <h3 className="font-semibold text-gray-700 mb-4 text-sm">
                    {editAch ? 'Edit Achievement' : 'Add Achievement'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={lbl}>Icon (emoji)</label>
                      <input value={achForm.icon} onChange={e => setAchForm({ ...achForm, icon: e.target.value })} className={inp} placeholder="🏆" />
                    </div>
                    <div>
                      <label className={lbl}>Count (e.g. 25+)</label>
                      <input value={achForm.count} onChange={e => setAchForm({ ...achForm, count: e.target.value })} className={inp} placeholder="25+" />
                    </div>
                    <div>
                      <label className={lbl}>Title (English)</label>
                      <input value={achForm.titleEn}
                        onChange={e => setAchForm(p => ({ ...p, titleEn: e.target.value }))}
                        onBlur={e => autoXlate(e.target.value, 'en', 'ml', v => setAchForm(p => ({ ...p, titleMl: v })))}
                        className={inp} />
                    </div>
                    <div>
                      <label className={`${lbl} font-malayalam`}>ശീർഷകം (മലയാളം)</label>
                      <input value={achForm.titleMl}
                        onChange={e => setAchForm(p => ({ ...p, titleMl: e.target.value }))}
                        onBlur={e => autoXlate(e.target.value, 'ml', 'en', v => setAchForm(p => ({ ...p, titleEn: v })))}
                        className={`${inp} font-malayalam`} />
                    </div>
                    <div>
                      <label className={lbl}>Label (English)</label>
                      <input value={achForm.labelEn}
                        onChange={e => setAchForm(p => ({ ...p, labelEn: e.target.value }))}
                        onBlur={e => autoXlate(e.target.value, 'en', 'ml', v => setAchForm(p => ({ ...p, labelMl: v })))}
                        className={inp} placeholder="e.g. Winners" />
                    </div>
                    <div>
                      <label className={`${lbl} font-malayalam`}>ലേബൽ (മലയാളം)</label>
                      <input value={achForm.labelMl}
                        onChange={e => setAchForm(p => ({ ...p, labelMl: e.target.value }))}
                        onBlur={e => autoXlate(e.target.value, 'ml', 'en', v => setAchForm(p => ({ ...p, labelEn: v })))}
                        className={`${inp} font-malayalam`} />
                    </div>
                    <div>
                      <label className={lbl}>Description (English)</label>
                      <textarea rows={2} value={achForm.descEn}
                        onChange={e => setAchForm(p => ({ ...p, descEn: e.target.value }))}
                        onBlur={e => autoXlate(e.target.value, 'en', 'ml', v => setAchForm(p => ({ ...p, descMl: v })))}
                        className={`${inp} resize-none`} />
                    </div>
                    <div>
                      <label className={`${lbl} font-malayalam`}>വിവരണം (മലയാളം)</label>
                      <textarea rows={2} value={achForm.descMl}
                        onChange={e => setAchForm(p => ({ ...p, descMl: e.target.value }))}
                        onBlur={e => autoXlate(e.target.value, 'ml', 'en', v => setAchForm(p => ({ ...p, descEn: v })))}
                        className={`${inp} resize-none font-malayalam`} />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button onClick={saveAchievement} disabled={saving} className="btn-primary py-2 text-sm">
                      <Save className="h-4 w-4" /><span>{saving ? '...' : editAch ? 'Update' : 'Save'}</span>
                    </button>
                    {editAch && (
                      <button onClick={() => { setAchForm(emptyAch); setEditAch(null); }} className="btn-outline py-2 text-sm">
                        <X className="h-4 w-4" /><span>Cancel</span>
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  {achievements.map(a => (
                    <div key={a.id} className="card p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{a.icon}</span>
                        <div>
                          <span className="font-medium text-gray-800">{a.titleEn}</span>
                          <span className="text-xs font-bold text-primary-600 ml-2">{a.count}</span>
                          {a.titleMl && <div className="text-xs text-gray-500 font-malayalam">{a.titleMl}</div>}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => startEditAch(a)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><Edit3 className="h-4 w-4" /></button>
                        <button onClick={() => delAch(a.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-400"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── TESTIMONIALS ── */}
            {section === 'testimonials' && (
              <div>
                <h2 className={`text-2xl font-bold text-primary-700 mb-5 ${ml ? 'font-malayalam' : ''}`}>
                  {ml ? 'സാക്ഷ്യങ്ങൾ' : 'Testimonials'}
                </h2>
                <div className="card p-5 mb-5">
                  <h3 className="font-semibold text-gray-700 mb-4 text-sm">
                    {editTest ? 'Edit Testimonial' : 'Add Testimonial'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={lbl}>Name (English)</label>
                      <input value={testForm.nameEn}
                        onChange={e => setTestForm(p => ({ ...p, nameEn: e.target.value }))}
                        onBlur={e => autoXlate(e.target.value, 'en', 'ml', v => setTestForm(p => ({ ...p, nameMl: v })))}
                        className={inp} placeholder="e.g. Priya Menon (Parent)" />
                    </div>
                    <div>
                      <label className={`${lbl} font-malayalam`}>പേര് (മലയാളം)</label>
                      <input value={testForm.nameMl}
                        onChange={e => setTestForm(p => ({ ...p, nameMl: e.target.value }))}
                        onBlur={e => autoXlate(e.target.value, 'ml', 'en', v => setTestForm(p => ({ ...p, nameEn: v })))}
                        className={`${inp} font-malayalam`} placeholder="e.g. പ്രിയ മേനോൻ (രക്ഷിതാവ്)" />
                    </div>
                    <div>
                      <label className={lbl}>Quote (English)</label>
                      <textarea rows={3} value={testForm.textEn}
                        onChange={e => setTestForm(p => ({ ...p, textEn: e.target.value }))}
                        onBlur={e => autoXlate(e.target.value, 'en', 'ml', v => setTestForm(p => ({ ...p, textMl: v })))}
                        className={`${inp} resize-none`} />
                    </div>
                    <div>
                      <label className={`${lbl} font-malayalam`}>ഉദ്ധരണം (മലയാളം)</label>
                      <textarea rows={3} value={testForm.textMl}
                        onChange={e => setTestForm(p => ({ ...p, textMl: e.target.value }))}
                        onBlur={e => autoXlate(e.target.value, 'ml', 'en', v => setTestForm(p => ({ ...p, textEn: v })))}
                        className={`${inp} resize-none font-malayalam`} />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button onClick={saveTestimonial} disabled={saving} className="btn-primary py-2 text-sm">
                      <Save className="h-4 w-4" /><span>{saving ? '...' : editTest ? 'Update' : 'Save'}</span>
                    </button>
                    {editTest && (
                      <button onClick={() => { setTestForm(emptyTest); setEditTest(null); }} className="btn-outline py-2 text-sm">
                        <X className="h-4 w-4" /><span>Cancel</span>
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  {testimonials.map(t => (
                    <div key={t.id} className="card p-4 flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">{t.nameEn}</div>
                        <div className="text-sm text-gray-600 italic mt-1">"{t.textEn}"</div>
                        {t.nameMl && <div className="text-xs text-gray-500 font-malayalam mt-1">{t.nameMl}</div>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => startEditTest(t)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><Edit3 className="h-4 w-4" /></button>
                        <button onClick={() => delTest(t.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-400"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── GALLERY ── */}
            {section === 'gallery' && (
              <div>
                <h2 className={`text-2xl font-bold text-primary-700 mb-5 ${ml ? 'font-malayalam' : ''}`}>
                  {ml ? 'ഗ്യാലറി' : 'Gallery'}
                </h2>

                {/* Create album */}
                <div className="card p-5 mb-5">
                  <h3 className="font-semibold text-gray-700 text-sm mb-3">Create New Album</h3>
                  <div className="flex gap-3">
                    <input value={newAlbumForm.titleEn}
                      onChange={e => setNewAlbumForm(p => ({ ...p, titleEn: e.target.value }))}
                      onBlur={e => autoXlate(e.target.value, 'en', 'ml', v => setNewAlbumForm(p => ({ ...p, titleMl: v })))}
                      placeholder="Album name (English)" className={`${inp} flex-1`} />
                    <input value={newAlbumForm.titleMl}
                      onChange={e => setNewAlbumForm(p => ({ ...p, titleMl: e.target.value }))}
                      placeholder="ആൽബം പേര്" className={`${inp} flex-1 font-malayalam`} />
                    <button onClick={createAlbum} disabled={saving} className="btn-primary shrink-0">
                      <Plus className="h-4 w-4" /><span>Create</span>
                    </button>
                  </div>
                </div>

                {/* Album list */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
                  {galAlbums.map(album => (
                    <div key={album.id}
                      onClick={() => selectAlbum(album)}
                      className={`card overflow-hidden cursor-pointer border-2 transition-all ${galSelected?.id === album.id ? 'border-primary-500' : 'border-transparent'}`}>
                      <div className={`h-28 bg-gradient-to-br ${album.thumbBg} relative`}>
                        {album.coverUrl
                          ? <img src={album.coverUrl} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><Images className="h-10 w-10 text-white/50" /></div>}
                        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                          {album.count} photos
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="font-medium text-sm text-gray-800 truncate">{album.titleEn}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Selected album: upload + photos */}
                {galSelected && (
                  <div className="card p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-700">
                        📁 {galSelected.titleEn}
                      </h3>
                      <div className="flex items-center gap-3">
                        {savedMsg && <span className={`text-sm font-medium ${savedMsg.includes('✓') ? 'text-green-600' : 'text-red-500'}`}>{savedMsg}</span>}
                        <input ref={galFileRef} type="file" multiple accept="image/*" className="hidden" onChange={handleGalUpload} />
                        <button onClick={() => galFileRef.current?.click()} disabled={uploading} className="btn-primary py-2 text-sm">
                          <Plus className="h-4 w-4" />
                          <span>{uploading ? 'Uploading...' : 'Upload Photos'}</span>
                        </button>
                      </div>
                    </div>

                    {galLoading ? (
                      <div className="text-center text-gray-400 py-8">Loading photos...</div>
                    ) : galPhotos.length === 0 ? (
                      <div className="text-center text-gray-400 py-8 text-sm">
                        No photos yet. Click "Upload Photos" to add some.
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                        {galPhotos.map(photo => (
                          <div key={photo.id} className="relative group">
                            <img src={photo.url} alt="" className="w-full h-20 object-cover rounded-lg" />
                            <button
                              onClick={() => deletePhoto(photo)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── APPEARANCE ── */}
            {section === 'appearance' && (
              <div>
                <h2 className={`text-2xl font-bold text-primary-700 mb-5 ${ml ? 'font-malayalam' : ''}`}>
                  {ml ? 'ദൃശ്യരൂപം' : 'Appearance'}
                </h2>

                {/* Hero background image */}
                <div className="card p-6 mb-5">
                  <h3 className="font-semibold text-gray-700 mb-1">Hero Background Image</h3>
                  <p className="text-xs text-gray-400 mb-4">Replaces the green gradient on the home page hero section. Use a wide school photo (landscape).</p>
                  {heroImageUrl && (
                    <img src={heroImageUrl} alt="Hero" className="w-full h-40 object-cover rounded-xl mb-4" />
                  )}
                  <div className="flex gap-3">
                    <input ref={heroFileRef} type="file" accept="image/*" className="hidden"
                      onChange={e => e.target.files?.[0] && uploadAppearanceImage(e.target.files[0], 'hero', setHeroImageUrl, 'heroImageUrl')} />
                    <button onClick={() => heroFileRef.current?.click()} disabled={uploading} className="btn-primary py-2 text-sm">
                      <Plus className="h-4 w-4" /><span>{uploading ? 'Uploading...' : heroImageUrl ? 'Change Image' : 'Upload Image'}</span>
                    </button>
                    {heroImageUrl && (
                      <button onClick={async () => { await saveSiteSettings({ heroImageUrl: '' }); setHeroImageUrl(''); flash('Removed ✓'); }}
                        className="btn-outline py-2 text-sm text-red-500 border-red-200 hover:bg-red-50">
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                {/* Logo image */}
                <div className="card p-6 mb-5">
                  <h3 className="font-semibold text-gray-700 mb-1">School Logo</h3>
                  <p className="text-xs text-gray-400 mb-4">Replaces the default icon in the navbar. Use a square image (PNG with transparent background works best).</p>
                  {logoUrl && (
                    <img src={logoUrl} alt="Logo" className="w-20 h-20 object-contain rounded-xl mb-4 bg-gray-100 p-2" />
                  )}
                  <div className="flex gap-3">
                    <input ref={logoFileRef} type="file" accept="image/*" className="hidden"
                      onChange={e => e.target.files?.[0] && uploadAppearanceImage(e.target.files[0], 'logo', setLogoUrl, 'logoUrl')} />
                    <button onClick={() => logoFileRef.current?.click()} disabled={uploading} className="btn-primary py-2 text-sm">
                      <Plus className="h-4 w-4" /><span>{uploading ? 'Uploading...' : logoUrl ? 'Change Logo' : 'Upload Logo'}</span>
                    </button>
                    {logoUrl && (
                      <button onClick={async () => { await saveSiteSettings({ logoUrl: '' }); setLogoUrl(''); flash('Removed ✓'); }}
                        className="btn-outline py-2 text-sm text-red-500 border-red-200 hover:bg-red-50">
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                {/* Footer description */}
                <div className="card p-6 mb-5">
                  <h3 className="font-semibold text-gray-700 mb-1">Footer Description</h3>
                  <p className="text-xs text-gray-400 mb-4">Tagline shown under the school name in the footer. Auto-saves on blur.</p>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className={lbl}>English</label>
                      <textarea rows={3} className={`${inp} resize-none`}
                        defaultValue="A premier primary school in Kodolipuram, Mattanur, Kannur, providing quality education since 1935."
                        onBlur={async e => { await saveSiteSettings({ footerDescEn: e.target.value }); flash('Saved ✓'); }} />
                    </div>
                    <div>
                      <label className={`${lbl} font-malayalam`}>മലയാളം</label>
                      <textarea rows={3} className={`${inp} resize-none font-malayalam`}
                        defaultValue="1935 മുതൽ ഗുണമേന്മയുള്ള വിദ്യാഭ്യാസം നൽകി വരുന്ന കോഡോലിപുരം, മട്ടന്നൂർ, കണ്ണൂർ ജില്ലയിലെ ഒരു പ്രമുഖ പ്രൈമറി സ്കൂൾ."
                        onBlur={async e => { await saveSiteSettings({ footerDescMl: e.target.value }); flash('Saved ✓'); }} />
                    </div>
                  </div>
                </div>

                {savedMsg && <p className={`text-sm font-medium ${savedMsg.includes('✓') ? 'text-green-600' : 'text-red-500'}`}>{savedMsg}</p>}
              </div>
            )}

            {/* ── SCHOOL INFO ── */}
            {section === 'schoolinfo' && (
              <div>
                <h2 className={`text-2xl font-bold text-primary-700 mb-5 ${ml ? 'font-malayalam' : ''}`}>
                  {ml ? 'സ്കൂൾ വിവരങ്ങൾ' : 'School Information'}
                </h2>
                <div className="card p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {([
                      ['principal',      ml ? 'പ്രിൻസിപ്പൽ'           : 'Principal'         ],
                      ['phone',          ml ? 'ഫോൺ നമ്പർ'              : 'Phone Number'      ],
                      ['email',          'Email'                                              ],
                      ['whatsappNumber', 'WhatsApp Number'                                    ],
                      ['schoolHours',    ml ? 'സ്കൂൾ സമയം'             : 'School Hours'      ],
                      ['workingDays',    ml ? 'പ്രവൃത്തി ദിവസങ്ങൾ'     : 'Working Days'      ],
                      ['classes',        ml ? 'ക്ലാസുകൾ'                : 'Classes'           ],
                      ['teachers',       ml ? 'അദ്ധ്യാപകരുടെ എണ്ണം'    : 'No. of Teachers'   ],
                    ] as [string, string][]).map(([key, label]) => (
                      <div key={key}>
                        <label className={`${lbl} ${ml ? 'font-malayalam' : ''}`}>{label}</label>
                        <input
                          value={(infoForm as Record<string, string>)[key]}
                          onChange={e => setInfoForm({ ...infoForm, [key]: e.target.value })}
                          className={inp}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="md:col-span-2">
                    <label className={lbl}>Google Maps Embed URL</label>
                    <input value={infoForm.mapEmbedUrl}
                      onChange={e => setInfoForm({ ...infoForm, mapEmbedUrl: e.target.value })}
                      className={inp} placeholder="https://www.google.com/maps/embed?pb=..." />
                    <p className="text-xs text-gray-400 mt-1">Get this from Google Maps → Share → Embed a map → Copy the src URL</p>
                  </div>
                  <div>
                    <label className={lbl}>Address (English)</label>
                    <textarea rows={2} value={infoForm.addressEn}
                      onChange={e => setInfoForm(p => ({ ...p, addressEn: e.target.value }))}
                      onBlur={e => autoXlate(e.target.value, 'en', 'ml', v => setInfoForm(p => ({ ...p, addressMl: v })))}
                      className={`${inp} resize-none`} />
                  </div>
                  <div>
                    <label className={`${lbl} font-malayalam`}>വിലാസം (മലയാളം)</label>
                    <textarea rows={2} value={infoForm.addressMl}
                      onChange={e => setInfoForm(p => ({ ...p, addressMl: e.target.value }))}
                      onBlur={e => autoXlate(e.target.value, 'ml', 'en', v => setInfoForm(p => ({ ...p, addressEn: v })))}
                      className={`${inp} resize-none font-malayalam`} />
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={saveInfo} disabled={saving} className="btn-primary py-2">
                      <Save className="h-4 w-4" />
                      <span className={ml ? 'font-malayalam' : ''}>{saving ? (ml ? 'സൂക്ഷിക്കുന്നു...' : 'Saving...') : (ml ? 'സൂക്ഷിക്കുക' : 'Save Changes')}</span>
                    </button>
                    {savedMsg && (
                      <span className={`text-sm font-medium ${savedMsg.includes('✓') ? 'text-green-600' : 'text-red-500'}`}>
                        {savedMsg}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── CIRCULARS ── */}
            {section === 'circulars' && (
              <div>
                <h2 className={`text-2xl font-bold text-primary-700 mb-5 ${ml ? 'font-malayalam' : ''}`}>
                  {ml ? 'സർക്കുലറുകൾ' : 'Circulars'}
                </h2>

                {/* Add / Edit form */}
                <div className="card p-5 mb-5">
                  <h3 className="font-semibold text-gray-700 text-sm mb-4">
                    {editCirc ? 'Edit Circular' : 'Add New Circular'}
                  </h3>
                  <div className="grid md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className={lbl}>Title (English)</label>
                      <input value={circForm.titleEn}
                        onChange={e => setCircForm(p => ({ ...p, titleEn: e.target.value }))}
                        onBlur={e => autoXlate(e.target.value, 'en', 'ml', v => setCircForm(p => ({ ...p, titleMl: v })))}
                        className={inp} placeholder="e.g. LSS Exam 2026 – Notice" />
                    </div>
                    <div>
                      <label className={`${lbl} font-malayalam`}>ശീർഷകം (മലയാളം)</label>
                      <input value={circForm.titleMl}
                        onChange={e => setCircForm(p => ({ ...p, titleMl: e.target.value }))}
                        className={`${inp} font-malayalam`} />
                    </div>
                    <div>
                      <label className={lbl}>Date</label>
                      <input type="date" value={circForm.date}
                        onChange={e => setCircForm(p => ({ ...p, date: e.target.value }))}
                        className={inp} />
                    </div>
                  </div>

                  {/* File or URL */}
                  <div className="mb-3">
                    <label className={lbl}>Paste Google Drive / OneDrive link (recommended)</label>
                    <input value={circForm.fileUrl}
                      onChange={e => setCircForm(p => ({ ...p, fileUrl: toDirectUrl(e.target.value) }))}
                      className={inp} placeholder="https://drive.google.com/file/d/.../view" />
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 border-t border-gray-200" /><span className="text-xs text-gray-400">or upload directly</span><div className="flex-1 border-t border-gray-200" />
                  </div>
                  <div className="flex gap-2">
                    <input ref={circFileRef} type="file" className="hidden" onChange={handleCircUpload} />
                    <button onClick={() => circFileRef.current?.click()} disabled={circUploading}
                      className="btn-outline py-2 text-sm flex-1 text-gray-500">
                      {circUploading ? 'Uploading...' : circForm.fileUrl && !circForm.fileUrl.startsWith('http') ? '...' : circForm.fileSize ? `✓ ${circForm.fileSize}` : '📎 Upload File'}
                    </button>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button onClick={saveCirc} disabled={saving} className="btn-primary py-2 text-sm">
                      <Save className="h-4 w-4" /><span>{saving ? 'Saving...' : editCirc ? 'Update' : 'Add Circular'}</span>
                    </button>
                    {editCirc && (
                      <button onClick={() => { setCircForm({ titleEn:'',titleMl:'',date:'',fileUrl:'',fileSize:'' }); setEditCirc(null); }}
                        className="btn-outline py-2 text-sm"><X className="h-4 w-4" /><span>Cancel</span></button>
                    )}
                    {savedMsg && <span className={`text-sm font-medium self-center ${savedMsg.includes('✓') ? 'text-green-600' : 'text-red-500'}`}>{savedMsg}</span>}
                  </div>
                </div>

                {/* List */}
                <div className="space-y-2">
                  {circulars.map(c => (
                    <div key={c.id} className="card p-4 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-800 truncate">{c.titleEn}</div>
                        {c.titleMl && <div className="text-xs text-gray-500 font-malayalam truncate">{c.titleMl}</div>}
                        <div className="text-xs text-gray-400 mt-0.5">
                          {c.date}{c.fileSize ? ` · ${c.fileSize}` : ''}
                          {c.fileUrl && <span className="ml-2 text-primary-600">✓ File attached</span>}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => { setEditCirc(c.id); setCircForm({ titleEn: c.titleEn, titleMl: c.titleMl, date: c.date, fileUrl: c.fileUrl, fileSize: c.fileSize }); }}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><Edit3 className="h-4 w-4" /></button>
                        <button onClick={() => delCirc(c.id)}
                          className="p-2 hover:bg-red-50 rounded-lg text-red-400"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                  {circulars.length === 0 && (
                    <p className="text-center text-gray-400 text-sm py-6">No circulars yet. Add one above.</p>
                  )}
                </div>
              </div>
            )}

            {/* ── ADMISSIONS ── */}
            {section === 'admissions' && (
              <div>
                <h2 className={`text-2xl font-bold text-primary-700 mb-5 ${ml ? 'font-malayalam' : ''}`}>
                  {ml ? 'പ്രവേശനം' : 'Admissions Page'}
                </h2>

                {/* Highlights */}
                <div className="card p-5 mb-5">
                  <h3 className="font-semibold text-gray-700 text-sm mb-4">Highlights</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className={lbl}>Admission Period (English)</label>
                      <input value={admData.periodEn}
                        onChange={e => setAdmData(p => ({ ...p, periodEn: e.target.value }))}
                        onBlur={e => autoXlate(e.target.value, 'en', 'ml', v => setAdmData(p => ({ ...p, periodMl: v })))}
                        className={inp} placeholder="e.g. April – June" />
                    </div>
                    <div>
                      <label className={`${lbl} font-malayalam`}>പ്രവേശന കാലം (മലയാളം)</label>
                      <input value={admData.periodMl}
                        onChange={e => setAdmData(p => ({ ...p, periodMl: e.target.value }))}
                        className={`${inp} font-malayalam`} />
                    </div>
                    <div>
                      <label className={lbl}>Entrance Exam (English)</label>
                      <input value={admData.entranceExamEn}
                        onChange={e => setAdmData(p => ({ ...p, entranceExamEn: e.target.value }))}
                        onBlur={e => autoXlate(e.target.value, 'en', 'ml', v => setAdmData(p => ({ ...p, entranceExamMl: v })))}
                        className={inp} placeholder="e.g. None" />
                    </div>
                    <div>
                      <label className={`${lbl} font-malayalam`}>പ്രവേശന പരീക്ഷ (മലയാളം)</label>
                      <input value={admData.entranceExamMl}
                        onChange={e => setAdmData(p => ({ ...p, entranceExamMl: e.target.value }))}
                        className={`${inp} font-malayalam`} />
                    </div>
                    <div>
                      <label className={lbl}>Class 1 Age (English)</label>
                      <input value={admData.class1AgeEn}
                        onChange={e => setAdmData(p => ({ ...p, class1AgeEn: e.target.value }))}
                        onBlur={e => autoXlate(e.target.value, 'en', 'ml', v => setAdmData(p => ({ ...p, class1AgeMl: v })))}
                        className={inp} />
                    </div>
                    <div>
                      <label className={`${lbl} font-malayalam`}>ക്ലാസ് 1 പ്രായം (മലയാളം)</label>
                      <input value={admData.class1AgeMl}
                        onChange={e => setAdmData(p => ({ ...p, class1AgeMl: e.target.value }))}
                        className={`${inp} font-malayalam`} />
                    </div>
                    <div>
                      <label className={lbl}>Pre-Primary Age (English)</label>
                      <input value={admData.prePrimaryAgeEn}
                        onChange={e => setAdmData(p => ({ ...p, prePrimaryAgeEn: e.target.value }))}
                        onBlur={e => autoXlate(e.target.value, 'en', 'ml', v => setAdmData(p => ({ ...p, prePrimaryAgeMl: v })))}
                        className={inp} />
                    </div>
                    <div>
                      <label className={`${lbl} font-malayalam`}>പ്രീ-പ്രൈമറി പ്രായം (മലയാളം)</label>
                      <input value={admData.prePrimaryAgeMl}
                        onChange={e => setAdmData(p => ({ ...p, prePrimaryAgeMl: e.target.value }))}
                        className={`${inp} font-malayalam`} />
                    </div>
                  </div>
                </div>

                {/* Steps */}
                <div className="card p-5 mb-5">
                  <h3 className="font-semibold text-gray-700 text-sm mb-3">Admission Steps</h3>
                  <div className="space-y-2 mb-3">
                    {admData.stepsEn.map((step, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="bg-primary-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0">{i + 1}</span>
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <input value={step}
                            onChange={e => setAdmData(p => ({ ...p, stepsEn: p.stepsEn.map((s, idx) => idx === i ? e.target.value : s) }))}
                            className={inp} placeholder="Step (English)" />
                          <input value={admData.stepsMl[i] ?? ''}
                            onChange={e => setAdmData(p => ({ ...p, stepsMl: p.stepsMl.map((s, idx) => idx === i ? e.target.value : s) }))}
                            className={`${inp} font-malayalam`} placeholder="ഘട്ടം (മലയാളം)" />
                        </div>
                        <button onClick={() => setAdmData(p => ({ ...p, stepsEn: p.stepsEn.filter((_, idx) => idx !== i), stepsMl: p.stepsMl.filter((_, idx) => idx !== i) }))}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 shrink-0"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input value={newStepEn} onChange={e => setNewStepEn(e.target.value)}
                      className={`${inp} flex-1`} placeholder="Add step (English)..." />
                    <button onClick={() => { if (!newStepEn.trim()) return; setAdmData(p => ({ ...p, stepsEn: [...p.stepsEn, newStepEn], stepsMl: [...p.stepsMl, ''] })); setNewStepEn(''); }}
                      className="btn-primary py-2 text-sm shrink-0"><Plus className="h-4 w-4" /></button>
                  </div>
                </div>

                {/* Documents */}
                <div className="card p-5 mb-5">
                  <h3 className="font-semibold text-gray-700 text-sm mb-3">Required Documents</h3>
                  <div className="space-y-2 mb-3">
                    {admData.documentsEn.map((doc, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <input value={doc}
                            onChange={e => setAdmData(p => ({ ...p, documentsEn: p.documentsEn.map((d, idx) => idx === i ? e.target.value : d) }))}
                            className={inp} />
                          <input value={admData.documentsMl[i] ?? ''}
                            onChange={e => setAdmData(p => ({ ...p, documentsMl: p.documentsMl.map((d, idx) => idx === i ? e.target.value : d) }))}
                            className={`${inp} font-malayalam`} />
                        </div>
                        <button onClick={() => setAdmData(p => ({ ...p, documentsEn: p.documentsEn.filter((_, idx) => idx !== i), documentsMl: p.documentsMl.filter((_, idx) => idx !== i) }))}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 shrink-0"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input value={newDocEn} onChange={e => setNewDocEn(e.target.value)}
                      className={`${inp} flex-1`} placeholder="Add document (English)..." />
                    <button onClick={() => { if (!newDocEn.trim()) return; setAdmData(p => ({ ...p, documentsEn: [...p.documentsEn, newDocEn], documentsMl: [...p.documentsMl, ''] })); setNewDocEn(''); }}
                      className="btn-primary py-2 text-sm shrink-0"><Plus className="h-4 w-4" /></button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button onClick={saveAdmissions} disabled={saving} className="btn-primary py-2">
                    <Save className="h-4 w-4" /><span>{saving ? 'Saving...' : 'Save Page'}</span>
                  </button>
                  {savedMsg && <span className={`text-sm font-medium ${savedMsg.includes('✓') ? 'text-green-600' : 'text-red-500'}`}>{savedMsg}</span>}
                </div>
              </div>
            )}

            {/* ── ACADEMICS ── */}
            {section === 'academics' && (
              <div>
                <h2 className={`text-2xl font-bold text-primary-700 mb-5 ${ml ? 'font-malayalam' : ''}`}>
                  {ml ? 'അക്കാദമിക്' : 'Academics Page'}
                </h2>

                {/* Classes table */}
                <div className="card p-5 mb-5">
                  <h3 className="font-semibold text-gray-700 text-sm mb-3">Class Structure</h3>
                  <div className="space-y-2">
                    {acadClasses.map((c, i) => (
                      <div key={i} className="grid grid-cols-4 gap-2 items-center">
                        <input value={c.nameEn} onChange={e => setAcadClasses(p => p.map((x, idx) => idx === i ? { ...x, nameEn: e.target.value } : x))} className={`${inp} text-xs`} placeholder="Class (English)" />
                        <input value={c.nameMl} onChange={e => setAcadClasses(p => p.map((x, idx) => idx === i ? { ...x, nameMl: e.target.value } : x))} className={`${inp} text-xs font-malayalam`} placeholder="ക്ലാസ് (Malayalam)" />
                        <input type="number" value={c.students} onChange={e => setAcadClasses(p => p.map((x, idx) => idx === i ? { ...x, students: Number(e.target.value) } : x))} className={`${inp} text-xs`} placeholder="Students" />
                        <input value={c.ageEn} onChange={e => setAcadClasses(p => p.map((x, idx) => idx === i ? { ...x, ageEn: e.target.value } : x))} className={`${inp} text-xs`} placeholder="Age" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subjects */}
                <div className="card p-5 mb-5">
                  <h3 className="font-semibold text-gray-700 text-sm mb-3">Subjects</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                    {acadSubjects.map((s, i) => (
                      <div key={i} className="bg-primary-50 rounded-lg p-2 flex items-center gap-2 justify-between">
                        <span className="text-lg">{s.icon}</span>
                        <span className="text-xs font-medium text-gray-700 flex-1 truncate">{s.en}</span>
                        <button onClick={() => setAcadSubjects(p => p.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600"><X className="h-3 w-3" /></button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input value={newSubject.icon} onChange={e => setNewSubject(p => ({ ...p, icon: e.target.value }))} className={`${inp} w-16`} placeholder="📖" />
                    <input value={newSubject.en}   onChange={e => setNewSubject(p => ({ ...p, en: e.target.value }))}
                      onBlur={e => autoXlate(e.target.value, 'en', 'ml', v => setNewSubject(p => ({ ...p, ml: v })))}
                      className={inp} placeholder="Subject (English)" />
                    <input value={newSubject.ml}   onChange={e => setNewSubject(p => ({ ...p, ml: e.target.value }))} className={`${inp} font-malayalam`} placeholder="വിഷയം" />
                    <button onClick={() => { if (!newSubject.en.trim()) return; setAcadSubjects(p => [...p, newSubject]); setNewSubject({ icon: '', en: '', ml: '' }); }} className="btn-primary py-2 shrink-0"><Plus className="h-4 w-4" /></button>
                  </div>
                </div>

                {/* Exams */}
                <div className="card p-5 mb-5">
                  <h3 className="font-semibold text-gray-700 text-sm mb-3">Exam Schedule</h3>
                  <div className="space-y-2">
                    {acadExams.map((e, i) => (
                      <div key={i} className="grid grid-cols-4 gap-2 items-center">
                        <input value={e.en}       onChange={ev => setAcadExams(p => p.map((x, idx) => idx === i ? { ...x, en: ev.target.value } : x))} className={`${inp} text-xs`} placeholder="Exam (English)" />
                        <input value={e.ml}       onChange={ev => setAcadExams(p => p.map((x, idx) => idx === i ? { ...x, ml: ev.target.value } : x))} className={`${inp} text-xs font-malayalam`} placeholder="പരീക്ഷ" />
                        <input value={e.periodEn} onChange={ev => setAcadExams(p => p.map((x, idx) => idx === i ? { ...x, periodEn: ev.target.value } : x))} className={`${inp} text-xs`} placeholder="Period (English)" />
                        <input value={e.periodMl} onChange={ev => setAcadExams(p => p.map((x, idx) => idx === i ? { ...x, periodMl: ev.target.value } : x))} className={`${inp} text-xs font-malayalam`} placeholder="കാലം" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Study Resources */}
                <div className="card p-5 mb-5">
                  <h3 className="font-semibold text-gray-700 text-sm mb-4">Study Resources</h3>

                  {/* Existing resources */}
                  <div className="space-y-3 mb-4">
                    {acadResources.map(r => {
                      const fileInputId = `res-file-${r.id}`;
                      return (
                        <div key={r.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-800 truncate">{r.titleEn}</div>
                            {r.titleMl && <div className="text-xs text-gray-500 font-malayalam truncate">{r.titleMl}</div>}
                            {r.fileUrl
                              ? <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 hover:underline">
                                  📎 {r.fileSize || 'View file'}
                                </a>
                              : <span className="text-xs text-gray-400">No file uploaded</span>}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <input
                              className="text-xs border border-gray-200 rounded-lg px-2 py-1 w-52 focus:outline-none focus:ring-1 focus:ring-primary-400"
                              placeholder="Paste Google Drive link..."
                              defaultValue={r.fileUrl}
                              onBlur={async e => {
                                const url = toDirectUrl(e.target.value);
                                if (url === r.fileUrl) return;
                                const updated = acadResources.map(x => x.id === r.id ? { ...x, fileUrl: url } : x);
                                setAcadResources(updated);
                                await savePage('academics', { classes: acadClasses, subjects: acadSubjects, exams: acadExams, resources: updated });
                                flash('Link saved ✓');
                              }}
                            />
                            <button onClick={() => deleteResource(r.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add new resource */}
                  <div className="border-t pt-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">Add New Resource</p>
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-3 text-xs text-blue-700">
                      <strong>Recommended:</strong> Upload to Google Drive → right-click → Share → "Anyone with link" → Copy link → paste below.
                      This avoids download errors.
                    </div>
                    <div className="grid md:grid-cols-2 gap-2 mb-2">
                      <input value={newResource.titleEn}
                        onChange={e => setNewResource(p => ({ ...p, titleEn: e.target.value }))}
                        onBlur={e => autoXlate(e.target.value, 'en', 'ml', v => setNewResource(p => ({ ...p, titleMl: v })))}
                        className={inp} placeholder="Resource title (English)" />
                      <input value={newResource.titleMl}
                        onChange={e => setNewResource(p => ({ ...p, titleMl: e.target.value }))}
                        className={`${inp} font-malayalam`} placeholder="ശീർഷകം (Malayalam)" />
                    </div>
                    {/* Option 1: paste URL */}
                    <div className="mb-2">
                      <label className={lbl}>Paste Google Drive / OneDrive / Dropbox link</label>
                      <input value={newResource.fileUrl}
                        onChange={e => setNewResource(p => ({ ...p, fileUrl: toDirectUrl(e.target.value), fileSize: '' }))}
                        className={inp} placeholder="https://drive.google.com/file/d/.../view" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 border-t border-gray-200" />
                      <span className="text-xs text-gray-400">or</span>
                      <div className="flex-1 border-t border-gray-200" />
                    </div>
                    <div className="flex gap-2">
                      <input ref={resFileRef} type="file" multiple className="hidden" onChange={handleResUpload} />
                      <button onClick={() => resFileRef.current?.click()} disabled={resUploading}
                        className="btn-outline py-2 text-sm flex-1 text-gray-500">
                        {resUploading ? 'Uploading...' : '📎 Upload directly (may have download issues)'}
                      </button>
                      <button onClick={addResource} disabled={!newResource.titleEn.trim()} className="btn-primary py-2 text-sm shrink-0">
                        <Plus className="h-4 w-4" /><span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button onClick={saveAcademics} disabled={saving} className="btn-primary py-2"><Save className="h-4 w-4" /><span>{saving ? 'Saving...' : 'Save Page'}</span></button>
                  {savedMsg && <span className={`text-sm font-medium ${savedMsg.includes('✓') ? 'text-green-600' : 'text-red-500'}`}>{savedMsg}</span>}
                </div>
              </div>
            )}

            {/* ── ACTIVITIES ── */}
            {section === 'activities' && (
              <div>
                <h2 className={`text-2xl font-bold text-primary-700 mb-5 ${ml ? 'font-malayalam' : ''}`}>
                  {ml ? 'പ്രവർത്തനങ്ങൾ' : 'Activities Page'}
                </h2>

                {/* Add New Category */}
                <div className="mb-5">
                  {!showNewCat ? (
                    <button onClick={() => setShowNewCat(true)} className="btn-outline py-2 text-sm w-full border-dashed">
                      <Plus className="h-4 w-4" />
                      <span className={ml ? 'font-malayalam' : ''}>{ml ? 'പുതിയ ഫോൾഡർ / വിഭാഗം ചേർക്കുക' : '+ Add New Category / Folder'}</span>
                    </button>
                  ) : (
                    <div className="card p-5 border-2 border-primary-200">
                      <h3 className="font-semibold text-gray-700 text-sm mb-4">New Activity Category</h3>
                      {/* Live preview */}
                      <div className={`bg-gradient-to-r ${newCat.bg} p-4 rounded-xl flex items-center gap-3 mb-4`}>
                        <span className="text-2xl">{newCat.emoji || '⭐'}</span>
                        <span className="text-white font-semibold text-lg">{newCat.titleEn || 'Category Name'}</span>
                      </div>
                      <div className="grid md:grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className={lbl}>Emoji / Icon</label>
                          <input value={newCat.emoji}
                            onChange={e => setNewCat(p => ({ ...p, emoji: e.target.value }))}
                            className={`${inp} text-2xl`} placeholder="⭐" />
                        </div>
                        <div />
                        <div>
                          <label className={lbl}>Title (English)</label>
                          <input value={newCat.titleEn}
                            onChange={e => setNewCat(p => ({ ...p, titleEn: e.target.value }))}
                            onBlur={e => autoXlate(e.target.value, 'en', 'ml', v => setNewCat(p => ({ ...p, titleMl: v })))}
                            className={inp} placeholder="e.g. Music Activities" />
                        </div>
                        <div>
                          <label className={`${lbl} font-malayalam`}>ശീർഷകം (Malayalam)</label>
                          <input value={newCat.titleMl}
                            onChange={e => setNewCat(p => ({ ...p, titleMl: e.target.value }))}
                            className={`${inp} font-malayalam`} placeholder="e.g. സംഗീത പ്രവർത്തനങ്ങൾ" />
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className={lbl}>Background Color</label>
                        <div className="grid grid-cols-4 gap-2 mt-1">
                          {BG_OPTIONS.map(opt => (
                            <button key={opt.value}
                              onClick={() => setNewCat(p => ({ ...p, bg: opt.value }))}
                              className={`h-10 rounded-lg bg-gradient-to-r ${opt.value} border-2 transition-all ${newCat.bg === opt.value ? 'border-gray-800 scale-110 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'}`}
                              title={opt.label} />
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={addCategory} disabled={saving || !newCat.titleEn.trim()} className="btn-primary py-2 text-sm">
                          <Plus className="h-4 w-4" />
                          <span className={ml ? 'font-malayalam' : ''}>{saving ? '...' : ml ? 'ചേർക്കുക' : 'Add Category'}</span>
                        </button>
                        <button onClick={() => { setShowNewCat(false); setNewCat({ emoji: '⭐', titleEn: '', titleMl: '', bg: 'from-blue-400 to-indigo-500' }); }}
                          className="btn-outline py-2 text-sm">
                          <X className="h-4 w-4" /><span>Cancel</span>
                        </button>
                        {savedMsg && <span className={`text-sm font-medium self-center ${savedMsg.includes('✓') ? 'text-green-600' : 'text-red-500'}`}>{savedMsg}</span>}
                      </div>
                    </div>
                  )}
                </div>

                {/* Categories */}
                <div className="space-y-3 mb-5">
                  {actCategories.map((cat, ci) => (
                    <div key={cat.id} className="card overflow-hidden">
                      <div className={`bg-gradient-to-r ${cat.bg} p-4 flex items-center justify-between`}>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{cat.emoji}</span>
                          <span className="text-white font-semibold">{cat.titleEn}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
                            className="text-white text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors">
                            {expandedCat === cat.id ? 'Close' : 'Edit'}
                          </button>
                          <button onClick={() => deleteCategory(cat.id)}
                            className="text-white/80 hover:text-white bg-black/20 hover:bg-red-500/60 p-1.5 rounded-full transition-colors"
                            title="Delete category">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      {expandedCat === cat.id && (
                        <div className="p-4 space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className={lbl}>Title (English)</label>
                              <input value={cat.titleEn} onChange={e => setActCategories(p => p.map((x, idx) => idx === ci ? { ...x, titleEn: e.target.value } : x))}
                                onBlur={e => autoXlate(e.target.value, 'en', 'ml', v => setActCategories(p => p.map((x, idx) => idx === ci ? { ...x, titleMl: v } : x)))}
                                className={inp} />
                            </div>
                            <div>
                              <label className={`${lbl} font-malayalam`}>ശീർഷകം (മലയാളം)</label>
                              <input value={cat.titleMl} onChange={e => setActCategories(p => p.map((x, idx) => idx === ci ? { ...x, titleMl: e.target.value } : x))} className={`${inp} font-malayalam`} />
                            </div>
                          </div>
                          <div>
                            <label className={lbl}>Items (one per line — English | Malayalam)</label>
                            <div className="space-y-1">
                              {cat.itemsEn.map((item, ii) => (
                                <div key={ii} className="flex gap-2 items-center">
                                  <input value={item} onChange={e => setActCategories(p => p.map((x, idx) => idx === ci ? { ...x, itemsEn: x.itemsEn.map((it, iii) => iii === ii ? e.target.value : it) } : x))}
                                    className={`${inp} text-sm flex-1`} placeholder="English" />
                                  <input value={cat.itemsMl[ii] ?? ''} onChange={e => setActCategories(p => p.map((x, idx) => idx === ci ? { ...x, itemsMl: x.itemsMl.map((it, iii) => iii === ii ? e.target.value : it) } : x))}
                                    className={`${inp} text-sm flex-1 font-malayalam`} placeholder="Malayalam" />
                                  <button onClick={() => setActCategories(p => p.map((x, idx) => idx === ci ? { ...x, itemsEn: x.itemsEn.filter((_, iii) => iii !== ii), itemsMl: x.itemsMl.filter((_, iii) => iii !== ii) } : x))}
                                    className="text-red-400 shrink-0"><Trash2 className="h-4 w-4" /></button>
                                </div>
                              ))}
                              <div className="flex gap-2">
                                <input value={newItem} onChange={e => setNewItem(e.target.value)} className={`${inp} text-sm flex-1`} placeholder="Add item (English)..." />
                                <button onClick={() => { if (!newItem.trim()) return; setActCategories(p => p.map((x, idx) => idx === ci ? { ...x, itemsEn: [...x.itemsEn, newItem], itemsMl: [...x.itemsMl, ''] } : x)); setNewItem(''); }}
                                  className="btn-primary py-1.5 text-sm shrink-0"><Plus className="h-4 w-4" /></button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Clubs */}
                <div className="card p-5 mb-5">
                  <h3 className="font-semibold text-gray-700 text-sm mb-3">School Clubs</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                    {actClubs.map((c, i) => (
                      <div key={i} className="bg-primary-50 rounded-lg p-2 flex items-center gap-2 justify-between">
                        <span className="text-lg">{c.icon}</span>
                        <span className="text-xs font-medium text-gray-700 flex-1 truncate">{c.en}</span>
                        <button onClick={() => setActClubs(p => p.filter((_, idx) => idx !== i))} className="text-red-400"><X className="h-3 w-3" /></button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input value={newClub.icon} onChange={e => setNewClub(p => ({ ...p, icon: e.target.value }))} className={`${inp} w-16`} placeholder="📚" />
                    <input value={newClub.en}   onChange={e => setNewClub(p => ({ ...p, en: e.target.value }))}
                      onBlur={e => autoXlate(e.target.value, 'en', 'ml', v => setNewClub(p => ({ ...p, ml: v })))}
                      className={inp} placeholder="Club name (English)" />
                    <input value={newClub.ml}   onChange={e => setNewClub(p => ({ ...p, ml: e.target.value }))} className={`${inp} font-malayalam`} placeholder="ക്ലബ്" />
                    <button onClick={() => { if (!newClub.en.trim()) return; setActClubs(p => [...p, newClub]); setNewClub({ icon: '', en: '', ml: '' }); }} className="btn-primary py-2 shrink-0"><Plus className="h-4 w-4" /></button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button onClick={saveActivities} disabled={saving} className="btn-primary py-2"><Save className="h-4 w-4" /><span>{saving ? 'Saving...' : 'Save Page'}</span></button>
                  {savedMsg && <span className={`text-sm font-medium ${savedMsg.includes('✓') ? 'text-green-600' : 'text-red-500'}`}>{savedMsg}</span>}
                </div>
              </div>
            )}

            {/* ── LSS HALL OF FAME ── */}
            {section === 'lss' && (
              <div>
                <h2 className={`text-2xl font-bold text-primary-700 mb-5 ${ml ? 'font-malayalam' : ''}`}>LSS Hall of Fame</h2>
                <div className="card p-5 mb-5">
                  <h3 className="font-semibold text-gray-700 text-sm mb-4">{editLss ? 'Edit Winner' : 'Add Winner'}</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className={lbl}>Year</label>
                      <input value={lssForm.year} onChange={e => setLssForm(p => ({ ...p, year: e.target.value }))} className={inp} placeholder="2026" />
                    </div>
                    <div>
                      <label className={lbl}>Name (English)</label>
                      <input value={lssForm.nameEn}
                        onChange={e => setLssForm(p => ({ ...p, nameEn: e.target.value }))}
                        onBlur={e => autoXlate(e.target.value, 'en', 'ml', v => setLssForm(p => ({ ...p, nameMl: v })))}
                        className={inp} placeholder="Student name" />
                    </div>
                    <div>
                      <label className={`${lbl} font-malayalam`}>പേര് (മലയാളം)</label>
                      <input value={lssForm.nameMl} onChange={e => setLssForm(p => ({ ...p, nameMl: e.target.value }))} className={`${inp} font-malayalam`} />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button onClick={saveLss} disabled={saving} className="btn-primary py-2 text-sm">
                      <Save className="h-4 w-4" /><span>{saving ? 'Saving...' : editLss ? 'Update' : 'Add'}</span>
                    </button>
                    {editLss && <button onClick={() => { setLssForm({ year:'',nameEn:'',nameMl:'' }); setEditLss(null); }} className="btn-outline py-2 text-sm"><X className="h-4 w-4" /></button>}
                    {savedMsg && <span className={`text-sm font-medium self-center ${savedMsg.includes('✓') ? 'text-green-600' : 'text-red-500'}`}>{savedMsg}</span>}
                  </div>
                </div>
                <div className="overflow-x-auto rounded-2xl border border-gray-100">
                  <table className="w-full text-sm">
                    <thead className="bg-primary-50">
                      <tr>
                        {['Year','Name (EN)','Name (ML)',''].map(h => <th key={h} className="text-left px-5 py-3 text-primary-700 font-semibold">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {lssWinners.map(w => (
                        <tr key={w.id} className="border-t border-gray-50 hover:bg-gray-50">
                          <td className="px-5 py-3 font-bold text-primary-600">{w.year}</td>
                          <td className="px-5 py-3">{w.nameEn}</td>
                          <td className="px-5 py-3 font-malayalam text-gray-600">{w.nameMl}</td>
                          <td className="px-5 py-3">
                            <div className="flex gap-1">
                              <button onClick={() => { setEditLss(w.id); setLssForm({ year: w.year, nameEn: w.nameEn, nameMl: w.nameMl }); }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"><Edit3 className="h-3.5 w-3.5" /></button>
                              <button onClick={() => delLss(w.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── PTA MEETINGS ── */}
            {section === 'ptameetings' && (
              <div>
                <h2 className={`text-2xl font-bold text-primary-700 mb-5 ${ml ? 'font-malayalam' : ''}`}>
                  {ml ? 'PTA യോഗ ഷെഡ്യൂളർ' : 'PTA Meeting Scheduler'}
                </h2>
                <div className="card p-5 mb-5">
                  <h3 className="font-semibold text-gray-700 text-sm mb-4">{editPtaMeet ? 'Edit Meeting' : 'Schedule New Meeting'}</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className={lbl}>Date</label>
                      <input type="date" value={ptaMeetForm.date} onChange={e => setPtaMeetForm(p => ({ ...p, date: e.target.value }))} className={inp} />
                    </div>
                    <div>
                      <label className={lbl}>Time</label>
                      <input type="time" value={ptaMeetForm.time} onChange={e => setPtaMeetForm(p => ({ ...p, time: e.target.value }))} className={inp} />
                    </div>
                    <div>
                      <label className={lbl}>Venue (English)</label>
                      <input value={ptaMeetForm.venueEn}
                        onChange={e => setPtaMeetForm(p => ({ ...p, venueEn: e.target.value }))}
                        onBlur={e => autoXlate(e.target.value, 'en', 'ml', v => setPtaMeetForm(p => ({ ...p, venueMl: v })))}
                        className={inp} placeholder="e.g. School Hall" />
                    </div>
                    <div>
                      <label className={`${lbl} font-malayalam`}>വേദി (Malayalam)</label>
                      <input value={ptaMeetForm.venueMl} onChange={e => setPtaMeetForm(p => ({ ...p, venueMl: e.target.value }))} className={`${inp} font-malayalam`} />
                    </div>
                    <div>
                      <label className={lbl}>Agenda (English)</label>
                      <textarea rows={2} value={ptaMeetForm.agendaEn}
                        onChange={e => setPtaMeetForm(p => ({ ...p, agendaEn: e.target.value }))}
                        onBlur={e => autoXlate(e.target.value, 'en', 'ml', v => setPtaMeetForm(p => ({ ...p, agendaMl: v })))}
                        className={`${inp} resize-none`} placeholder="Topics to be discussed" />
                    </div>
                    <div>
                      <label className={`${lbl} font-malayalam`}>അജണ്ട (Malayalam)</label>
                      <textarea rows={2} value={ptaMeetForm.agendaMl} onChange={e => setPtaMeetForm(p => ({ ...p, agendaMl: e.target.value }))} className={`${inp} resize-none font-malayalam`} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className={lbl}>Meeting Minutes PDF (for past meetings — paste Google Drive link)</label>
                    <div className="flex gap-2">
                      <input value={ptaMeetForm.fileUrl}
                        onChange={e => setPtaMeetForm(p => ({ ...p, fileUrl: toDirectUrl(e.target.value) }))}
                        className={`${inp} flex-1`} placeholder="https://drive.google.com/file/d/.../view" />
                      <input ref={ptaFileRef2} type="file" className="hidden" onChange={handlePtaMinutesUpload} />
                      <button onClick={() => ptaFileRef2?.current?.click()} disabled={ptaUploading} className="btn-outline py-2 text-sm shrink-0">
                        {ptaUploading ? '...' : ptaMeetForm.fileSize ? `✓ ${ptaMeetForm.fileSize}` : '📎 Upload'}
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button onClick={savePtaMeet} disabled={saving} className="btn-primary py-2 text-sm">
                      <Save className="h-4 w-4" /><span>{saving ? 'Saving...' : editPtaMeet ? 'Update' : 'Schedule Meeting'}</span>
                    </button>
                    {editPtaMeet && <button onClick={() => { setPtaMeetForm({ date:'',time:'10:00',venueEn:'',venueMl:'',agendaEn:'',agendaMl:'',fileUrl:'',fileSize:'' }); setEditPtaMeet(null); }} className="btn-outline py-2 text-sm"><X className="h-4 w-4" /></button>}
                    {savedMsg && <span className={`text-sm font-medium self-center ${savedMsg.includes('✓') ? 'text-green-600' : 'text-red-500'}`}>{savedMsg}</span>}
                  </div>
                </div>

                <div className="space-y-2">
                  {ptaMeetings.map(m => {
                    const today = new Date().toISOString().split('T')[0];
                    const isPast = m.date < today;
                    return (
                      <div key={m.id} className={`card p-4 flex items-center justify-between gap-4 ${isPast ? 'opacity-60' : ''}`}>
                        <div className="flex items-center gap-3">
                          <div className={`${isPast ? 'bg-gray-100' : 'bg-primary-100'} rounded-xl p-2 text-center min-w-[50px]`}>
                            <div className={`text-sm font-bold ${isPast ? 'text-gray-500' : 'text-primary-600'}`}>{new Date(m.date).getDate()}</div>
                            <div className="text-xs text-gray-400">{new Date(m.date).toLocaleString('en',{month:'short',year:'2-digit'})}</div>
                          </div>
                          <div>
                            <div className="font-medium text-sm text-gray-800">{m.date} at {m.time} — {m.venueEn}</div>
                            {m.agendaEn && <div className="text-xs text-gray-500 truncate max-w-xs">{m.agendaEn}</div>}
                            <div className="flex items-center gap-2 mt-0.5">
                              {isPast ? <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Past</span>
                                       : <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Upcoming</span>}
                              {m.fileUrl && <span className="text-xs text-primary-600">📎 Minutes attached</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => { setEditPtaMeet(m.id); setPtaMeetForm({ date: m.date, time: m.time, venueEn: m.venueEn, venueMl: m.venueMl, agendaEn: m.agendaEn, agendaMl: m.agendaMl, fileUrl: m.fileUrl ?? '', fileSize: m.fileSize ?? '' }); }} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><Edit3 className="h-4 w-4" /></button>
                          <button onClick={() => delPtaMeet(m.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-400"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    );
                  })}
                  {ptaMeetings.length === 0 && <p className="text-center text-gray-400 text-sm py-6">No meetings scheduled yet.</p>}
                </div>
              </div>
            )}

            {/* ── HISTORY ── */}
            {section === 'history' && (
              <div>
                <h2 className={`text-2xl font-bold text-primary-700 mb-5 ${ml ? 'font-malayalam' : ''}`}>{ml ? 'ചരിത്രം' : 'History Page'}</h2>
                <div className="card p-5 mb-5 space-y-3">
                  <h3 className="font-semibold text-gray-700 text-sm">Intro Paragraph</h3>
                  <div>
                    <label className={lbl}>English</label>
                    <textarea rows={3} value={historyIntro.en}
                      onChange={e => setHistoryIntro(p => ({ ...p, en: e.target.value }))}
                      onBlur={e => autoXlate(e.target.value, 'en', 'ml', v => setHistoryIntro(p => ({ ...p, ml: v })))}
                      className={`${inp} resize-none`} />
                  </div>
                  <div>
                    <label className={`${lbl} font-malayalam`}>മലയാളം</label>
                    <textarea rows={3} value={historyIntro.ml}
                      onChange={e => setHistoryIntro(p => ({ ...p, ml: e.target.value }))}
                      onBlur={e => autoXlate(e.target.value, 'ml', 'en', v => setHistoryIntro(p => ({ ...p, en: v })))}
                      className={`${inp} resize-none font-malayalam`} />
                  </div>
                </div>

                <div className="card p-5 mb-5">
                  <h3 className="font-semibold text-gray-700 text-sm mb-3">{editTlIdx !== null ? 'Edit Timeline Entry' : 'Add Timeline Entry'}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className={lbl}>Year</label>
                      <input value={tlForm.year} onChange={e => setTlForm(p => ({ ...p, year: e.target.value }))} className={inp} placeholder="e.g. 1935" />
                    </div>
                    <div>
                      <label className={lbl}>Description (English)</label>
                      <input value={tlForm.en}
                        onChange={e => setTlForm(p => ({ ...p, en: e.target.value }))}
                        onBlur={e => autoXlate(e.target.value, 'en', 'ml', v => setTlForm(p => ({ ...p, ml: v })))}
                        className={inp} />
                    </div>
                    <div>
                      <label className={`${lbl} font-malayalam`}>വിവരണം (മലയാളം)</label>
                      <input value={tlForm.ml}
                        onChange={e => setTlForm(p => ({ ...p, ml: e.target.value }))}
                        onBlur={e => autoXlate(e.target.value, 'ml', 'en', v => setTlForm(p => ({ ...p, en: v })))}
                        className={`${inp} font-malayalam`} />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={saveTl} className="btn-primary py-2 text-sm"><Plus className="h-4 w-4" /><span>{editTlIdx !== null ? 'Update' : 'Add'}</span></button>
                    {editTlIdx !== null && <button onClick={() => { setTlForm({ year:'',en:'',ml:'' }); setEditTlIdx(null); }} className="btn-outline py-2 text-sm"><X className="h-4 w-4" /></button>}
                  </div>
                </div>

                <div className="space-y-2 mb-5">
                  {timeline.map((t, i) => (
                    <div key={i} className="card p-4 flex items-center justify-between gap-4">
                      <div><span className="font-bold text-primary-600 mr-3">{t.year}</span><span className="text-gray-800">{t.en}</span></div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => { setEditTlIdx(i); setTlForm(t); }} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><Edit3 className="h-4 w-4" /></button>
                        <button onClick={() => delTl(i)} className="p-2 hover:bg-red-50 rounded-lg text-red-400"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <button onClick={saveHistory} disabled={saving} className="btn-primary py-2"><Save className="h-4 w-4" /><span>{saving ? 'Saving...' : 'Save Page'}</span></button>
                  {savedMsg && <span className={`text-sm font-medium ${savedMsg.includes('✓') ? 'text-green-600' : 'text-red-500'}`}>{savedMsg}</span>}
                </div>
              </div>
            )}

            {/* ── VISION & MISSION ── */}
            {section === 'vision' && (
              <div>
                <h2 className={`text-2xl font-bold text-primary-700 mb-5 ${ml ? 'font-malayalam' : ''}`}>{ml ? 'ദർശനം & ദൗത്യം' : 'Vision & Mission'}</h2>
                <div className="card p-5 mb-5 space-y-3">
                  <h3 className="font-semibold text-gray-700 text-sm">Vision</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className={lbl}>English</label>
                      <textarea rows={3} value={vision.en}
                        onChange={e => setVision(p => ({ ...p, en: e.target.value }))}
                        onBlur={e => autoXlate(e.target.value, 'en', 'ml', v => setVision(p => ({ ...p, ml: v })))}
                        className={`${inp} resize-none`} />
                    </div>
                    <div>
                      <label className={`${lbl} font-malayalam`}>മലയാളം</label>
                      <textarea rows={3} value={vision.ml}
                        onChange={e => setVision(p => ({ ...p, ml: e.target.value }))}
                        onBlur={e => autoXlate(e.target.value, 'ml', 'en', v => setVision(p => ({ ...p, en: v })))}
                        className={`${inp} resize-none font-malayalam`} />
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-700 text-sm pt-2">Mission</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className={lbl}>English</label>
                      <textarea rows={3} value={mission.en}
                        onChange={e => setMission(p => ({ ...p, en: e.target.value }))}
                        onBlur={e => autoXlate(e.target.value, 'en', 'ml', v => setMission(p => ({ ...p, ml: v })))}
                        className={`${inp} resize-none`} />
                    </div>
                    <div>
                      <label className={`${lbl} font-malayalam`}>മലയാളം</label>
                      <textarea rows={3} value={mission.ml}
                        onChange={e => setMission(p => ({ ...p, ml: e.target.value }))}
                        onBlur={e => autoXlate(e.target.value, 'ml', 'en', v => setMission(p => ({ ...p, en: v })))}
                        className={`${inp} resize-none font-malayalam`} />
                    </div>
                  </div>
                </div>

                <div className="card p-5 mb-5">
                  <h3 className="font-semibold text-gray-700 text-sm mb-3">{editValIdx !== null ? 'Edit Value' : 'Add Core Value'}</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className={lbl}>Icon (emoji)</label>
                      <input value={valForm.icon} onChange={e => setValForm(p => ({ ...p, icon: e.target.value }))} className={inp} placeholder="📖" />
                    </div>
                    <div>
                      <label className={lbl}>English</label>
                      <input value={valForm.en}
                        onChange={e => setValForm(p => ({ ...p, en: e.target.value }))}
                        onBlur={e => autoXlate(e.target.value, 'en', 'ml', v => setValForm(p => ({ ...p, ml: v })))}
                        className={inp} />
                    </div>
                    <div>
                      <label className={`${lbl} font-malayalam`}>മലയാളം</label>
                      <input value={valForm.ml}
                        onChange={e => setValForm(p => ({ ...p, ml: e.target.value }))}
                        onBlur={e => autoXlate(e.target.value, 'ml', 'en', v => setValForm(p => ({ ...p, en: v })))}
                        className={`${inp} font-malayalam`} />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={saveVal} className="btn-primary py-2 text-sm"><Plus className="h-4 w-4" /><span>{editValIdx !== null ? 'Update' : 'Add'}</span></button>
                    {editValIdx !== null && <button onClick={() => { setValForm({ icon:'',en:'',ml:'' }); setEditValIdx(null); }} className="btn-outline py-2 text-sm"><X className="h-4 w-4" /></button>}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
                  {values.map((v, i) => (
                    <div key={i} className="card p-4 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2"><span className="text-xl">{v.icon}</span><span className="font-medium text-gray-800 text-sm">{v.en}</span></div>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditValIdx(i); setValForm(v); }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"><Edit3 className="h-3.5 w-3.5" /></button>
                        <button onClick={() => delVal(i)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <button onClick={saveVision} disabled={saving} className="btn-primary py-2"><Save className="h-4 w-4" /><span>{saving ? 'Saving...' : 'Save Page'}</span></button>
                  {savedMsg && <span className={`text-sm font-medium ${savedMsg.includes('✓') ? 'text-green-600' : 'text-red-500'}`}>{savedMsg}</span>}
                </div>
              </div>
            )}

            {/* ── PTA ── */}
            {section === 'pta' && (
              <div>
                <h2 className={`text-2xl font-bold text-primary-700 mb-5 ${ml ? 'font-malayalam' : ''}`}>PTA</h2>
                <div className="card p-5 mb-5 space-y-3">
                  <h3 className="font-semibold text-gray-700 text-sm">About PTA</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className={lbl}>English</label>
                      <textarea rows={4} value={ptaAbout.en}
                        onChange={e => setPtaAbout(p => ({ ...p, en: e.target.value }))}
                        onBlur={e => autoXlate(e.target.value, 'en', 'ml', v => setPtaAbout(p => ({ ...p, ml: v })))}
                        className={`${inp} resize-none`} />
                    </div>
                    <div>
                      <label className={`${lbl} font-malayalam`}>മലയാളം</label>
                      <textarea rows={4} value={ptaAbout.ml}
                        onChange={e => setPtaAbout(p => ({ ...p, ml: e.target.value }))}
                        onBlur={e => autoXlate(e.target.value, 'ml', 'en', v => setPtaAbout(p => ({ ...p, en: v })))}
                        className={`${inp} resize-none font-malayalam`} />
                    </div>
                  </div>
                </div>

                <div className="card p-5 mb-5">
                  <h3 className="font-semibold text-gray-700 text-sm mb-3">{editComIdx !== null ? 'Edit Member' : 'Add Committee Member'}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className={lbl}>Role (English)</label>
                      <input value={comForm.roleEn}
                        onChange={e => setComForm(p => ({ ...p, roleEn: e.target.value }))}
                        onBlur={e => autoXlate(e.target.value, 'en', 'ml', v => setComForm(p => ({ ...p, roleMl: v })))}
                        className={inp} placeholder="e.g. President" />
                    </div>
                    <div>
                      <label className={`${lbl} font-malayalam`}>സ്ഥാനം (മലയാളം)</label>
                      <input value={comForm.roleMl}
                        onChange={e => setComForm(p => ({ ...p, roleMl: e.target.value }))}
                        className={`${inp} font-malayalam`} placeholder="e.g. അദ്ധ്യക്ഷൻ" />
                    </div>
                    <div>
                      <label className={lbl}>Name (English)</label>
                      <input value={comForm.nameEn}
                        onChange={e => setComForm(p => ({ ...p, nameEn: e.target.value }))}
                        onBlur={e => autoXlate(e.target.value, 'en', 'ml', v => setComForm(p => ({ ...p, nameMl: v })))}
                        className={inp} placeholder="Full name" />
                    </div>
                    <div>
                      <label className={`${lbl} font-malayalam`}>പേര് (മലയാളം)</label>
                      <input value={comForm.nameMl}
                        onChange={e => setComForm(p => ({ ...p, nameMl: e.target.value }))}
                        className={`${inp} font-malayalam`} placeholder="പൂർണ്ണ നാമം" />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={saveCom} className="btn-primary py-2 text-sm"><Plus className="h-4 w-4" /><span>{editComIdx !== null ? 'Update' : 'Add'}</span></button>
                    {editComIdx !== null && <button onClick={() => { setComForm({ roleEn:'',roleMl:'',nameEn:'',nameMl:'' }); setEditComIdx(null); }} className="btn-outline py-2 text-sm"><X className="h-4 w-4" /></button>}
                  </div>
                </div>

                <div className="space-y-2 mb-5">
                  {committee.map((c, i) => (
                    <div key={i} className="card p-4 flex items-center justify-between gap-4">
                      <div>
                        <span className="font-medium text-gray-800">{c.nameEn}</span>
                        <span className="text-xs text-primary-600 ml-2">{c.roleEn}</span>
                        {c.nameMl && <div className="text-xs text-gray-500 font-malayalam">{c.nameMl} · {c.roleMl}</div>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => { setEditComIdx(i); setComForm(c); }} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><Edit3 className="h-4 w-4" /></button>
                        <button onClick={() => delCom(i)} className="p-2 hover:bg-red-50 rounded-lg text-red-400"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <button onClick={savePTA} disabled={saving} className="btn-primary py-2"><Save className="h-4 w-4" /><span>{saving ? 'Saving...' : 'Save Page'}</span></button>
                  {savedMsg && <span className={`text-sm font-medium ${savedMsg.includes('✓') ? 'text-green-600' : 'text-red-500'}`}>{savedMsg}</span>}
                </div>
              </div>
            )}

            {/* ── NAVIGATION ── */}
            {section === 'navigation' && (
              <div>
                <h2 className={`text-2xl font-bold text-primary-700 mb-2 ${ml ? 'font-malayalam' : ''}`}>
                  {ml ? 'നാവിഗേഷൻ' : 'Navigation'}
                </h2>
                <p className="text-xs text-gray-400 mb-5">Changes apply to the navbar across the entire website.</p>

                {/* School name & location */}
                <div className="card p-5 mb-5">
                  <h3 className="font-semibold text-gray-700 text-sm mb-4">School Name & Location</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={lbl}>School Name (English)</label>
                      <input value={navForm.schoolNameEn}
                        onChange={e => setNavForm(p => ({ ...p, schoolNameEn: e.target.value }))}
                        onBlur={e => autoXlate(e.target.value, 'en', 'ml', v => setNavForm(p => ({ ...p, schoolNameMl: v })))}
                        className={inp} />
                    </div>
                    <div>
                      <label className={`${lbl} font-malayalam`}>സ്കൂൾ പേര് (മലയാളം)</label>
                      <input value={navForm.schoolNameMl}
                        onChange={e => setNavForm(p => ({ ...p, schoolNameMl: e.target.value }))}
                        className={`${inp} font-malayalam`} />
                    </div>
                    <div>
                      <label className={lbl}>Location / Subtitle (English)</label>
                      <input value={navForm.locationEn}
                        onChange={e => setNavForm(p => ({ ...p, locationEn: e.target.value }))}
                        onBlur={e => autoXlate(e.target.value, 'en', 'ml', v => setNavForm(p => ({ ...p, locationMl: v })))}
                        className={inp} placeholder="e.g. Mattanur, Kannur" />
                    </div>
                    <div>
                      <label className={`${lbl} font-malayalam`}>സ്ഥലം (മലയാളം)</label>
                      <input value={navForm.locationMl}
                        onChange={e => setNavForm(p => ({ ...p, locationMl: e.target.value }))}
                        className={`${inp} font-malayalam`} placeholder="e.g. മട്ടന്നൂർ, കണ്ണൂർ" />
                    </div>
                    <div>
                      <label className={lbl}>Phone (top bar)</label>
                      <input value={navForm.phone}
                        onChange={e => setNavForm(p => ({ ...p, phone: e.target.value }))}
                        className={inp} />
                    </div>
                    <div>
                      <label className={lbl}>Email (top bar)</label>
                      <input value={navForm.email}
                        onChange={e => setNavForm(p => ({ ...p, email: e.target.value }))}
                        className={inp} />
                    </div>
                  </div>
                </div>

                {/* Nav link labels */}
                <div className="card p-5 mb-5">
                  <h3 className="font-semibold text-gray-700 text-sm mb-4">Navigation Link Labels</h3>
                  <div className="space-y-3">
                    {([
                      ['home',         'Home'],
                      ['about',        'About'],
                      ['academics',    'Academics'],
                      ['admissions',   'Admissions'],
                      ['activities',   'Activities'],
                      ['gallery',      'Gallery'],
                      ['news',         'News & Events'],
                      ['achievements', 'Achievements'],
                      ['pta',          'PTA'],
                      ['contact',      'Contact'],
                    ] as [string, string][]).map(([key, placeholder]) => (
                      <div key={key} className="grid grid-cols-3 gap-3 items-center">
                        <span className="text-xs font-medium text-gray-500 capitalize">{placeholder}</span>
                        <div>
                          <input
                            value={navForm.nav[key]?.en ?? ''}
                            onChange={e => setNavForm(p => ({ ...p, nav: { ...p.nav, [key]: { ...p.nav[key], en: e.target.value } } }))}
                            onBlur={e => autoXlate(e.target.value, 'en', 'ml', v => setNavForm(p => ({ ...p, nav: { ...p.nav, [key]: { ...p.nav[key], ml: v } } })))}
                            className={inp} placeholder={`${placeholder} (English)`} />
                        </div>
                        <div>
                          <input
                            value={navForm.nav[key]?.ml ?? ''}
                            onChange={e => setNavForm(p => ({ ...p, nav: { ...p.nav, [key]: { ...p.nav[key], ml: e.target.value } } }))}
                            className={`${inp} font-malayalam`} placeholder="മലയാളം" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button onClick={saveNavigation} disabled={saving} className="btn-primary py-2">
                    <Save className="h-4 w-4" />
                    <span>{saving ? 'Saving...' : 'Save Navigation'}</span>
                  </button>
                  {savedMsg && <span className={`text-sm font-medium ${savedMsg.includes('✓') ? 'text-green-600' : 'text-red-500'}`}>{savedMsg}</span>}
                </div>
              </div>
            )}

            {/* ── MESSAGES ── */}
            {section === 'messages' && (() => {
              if (!msgLoading && messages.length === 0) {
                // Load on first open
                setMsgLoading(true);
                getCol<ContactMsg>('contact_messages')
                  .then(data => setMessages(data.sort((a, b) => b.sentAt.localeCompare(a.sentAt))))
                  .catch(() => {})
                  .finally(() => setMsgLoading(false));
              }
              const unread = messages.filter(m => !m.read).length;
              return (
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className={`text-2xl font-bold text-primary-700 ${ml ? 'font-malayalam' : ''}`}>
                      {ml ? 'ബന്ധപ്പെടൽ സന്ദേശങ്ങൾ' : 'Contact Messages'}
                    </h2>
                    {unread > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                        {unread} {ml ? 'പുതിയത്' : 'new'}
                      </span>
                    )}
                  </div>

                  {msgLoading ? (
                    <div className="text-center text-gray-400 py-12">Loading...</div>
                  ) : messages.length === 0 ? (
                    <div className={`text-center text-gray-400 py-12 ${ml ? 'font-malayalam' : ''}`}>
                      {ml ? 'ഇതുവരെ സന്ദേശങ്ങൾ ഇല്ല.' : 'No messages yet.'}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map(msg => (
                        <div key={msg.id}
                          className={`card p-5 border-l-4 ${msg.read ? 'border-gray-200' : 'border-primary-500 bg-primary-50/30'}`}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-gray-800">{msg.name}</span>
                                {!msg.read && (
                                  <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">
                                    {ml ? 'പുതിയത്' : 'New'}
                                  </span>
                                )}
                                {msg.phone && (
                                  <a href={`tel:${msg.phone}`} className="text-xs text-primary-600 hover:underline">
                                    📞 {msg.phone}
                                  </a>
                                )}
                              </div>
                              <p className="text-gray-700 text-sm leading-relaxed">{msg.message}</p>
                              <p className="text-xs text-gray-400 mt-2">
                                {new Date(msg.sentAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                              </p>
                            </div>
                            {!msg.read && (
                              <button
                                onClick={async () => {
                                  await markMessageRead(msg.id);
                                  setMessages(p => p.map(m => m.id === msg.id ? { ...m, read: true } : m));
                                }}
                                className="shrink-0 text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50">
                                {ml ? 'വായിച്ചു' : 'Mark read'}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── COMMENTS ── */}
            {section === 'comments' && (
              <div>
                <h2 className={`text-2xl font-bold text-primary-700 mb-5 ${ml ? 'font-malayalam' : ''}`}>
                  {ml ? 'കമന്റ്സ്' : 'Comments'}
                </h2>
                <p className={`text-gray-500 text-sm ${ml ? 'font-malayalam' : ''}`}>
                  {ml
                    ? 'Firestore-ൽ കമന്റ്സ് ഇൻ്റഗ്രേഷൻ ഉടൻ ലഭ്യമാകും.'
                    : 'Comment moderation via Firestore is coming soon.'}
                </p>
              </div>
            )}

          </>
        )}
      </main>
    </div>
  );
}
