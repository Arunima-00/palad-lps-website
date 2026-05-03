import { db } from './firebase';
import {
  collection, doc, getDocs, getDoc, setDoc,
  deleteDoc as fsDelete, addDoc, writeBatch, query, where,
  getDocsFromServer, getDocFromServer,
} from 'firebase/firestore';
import {
  ANNOUNCEMENTS, EVENTS, STAFF, ACHIEVEMENTS,
  TESTIMONIALS, SCHOOL, GALLERY_ALBUMS,
} from './schoolData';

// Seed Firestore with static data the first time
export async function seedIfNeeded() {
  const seeds = [
    { col: 'announcements',  items: ANNOUNCEMENTS  },
    { col: 'events',         items: EVENTS         },
    { col: 'staff',          items: STAFF          },
    { col: 'achievements',   items: ACHIEVEMENTS   },
    { col: 'testimonials',   items: TESTIMONIALS   },
    { col: 'gallery_albums', items: GALLERY_ALBUMS },
    { col: 'lss_winners', items: [
      { id: 'l1', year: '2025', nameEn: 'Ananya Krishnan', nameMl: 'അനന്യ കൃഷ്ണൻ' },
      { id: 'l2', year: '2024', nameEn: 'Arjun Dev',       nameMl: 'അർജുൻ ദേവ്'   },
      { id: 'l3', year: '2023', nameEn: 'Deva Priya',      nameMl: 'ദേവ പ്രിയ'    },
      { id: 'l4', year: '2022', nameEn: 'Nikhil M.',       nameMl: 'നിഖിൽ എം.'   },
      { id: 'l5', year: '2021', nameEn: 'Adarsh R.',       nameMl: 'ആദർശ് ആർ.'  },
    ]},
    { col: 'pta_meetings', items: [
      { id: 'm1', date: '2026-07-10', time: '10:00', venueEn: 'School Hall', venueMl: 'സ്കൂൾ ഹാൾ', agendaEn: 'Academic progress review and fee discussion', agendaMl: 'അക്കാദമിക് പുരോഗതി അവലോകനം, ഫീസ് ചർച്ച', fileUrl: '', fileSize: '' },
    ]},
    { col: 'circulars', items: [
      { id: 'c1', titleEn: 'LSS Exam 2026 – Notice',                titleMl: 'LSS പരീക്ഷ 2026 – അറിയിപ്പ്',        date: '2026-02-01', fileUrl: '', fileSize: '' },
      { id: 'c2', titleEn: 'Annual Sports Day – Arrangement Order', titleMl: 'വാർഷിക കായിക മേള – ക്രമീകരണ ഉത്തരവ്', date: '2026-01-15', fileUrl: '', fileSize: '' },
      { id: 'c3', titleEn: 'PTA Meeting – January 2026',            titleMl: 'PTA യോഗ – ജനുവരി 2026',              date: '2026-01-05', fileUrl: '', fileSize: '' },
    ]},
  ];

  await Promise.all(seeds.map(async ({ col, items }) => {
    const snap = await getDocs(collection(db, col));
    if (snap.empty) {
      const batch = writeBatch(db);
      items.forEach(item => batch.set(doc(db, col, item.id), item));
      await batch.commit();
    }
  }));

  const infoRef = doc(db, 'school_info', 'main');
  const infoSnap = await getDoc(infoRef);
  if (!infoSnap.exists()) await setDoc(infoRef, SCHOOL);

  // Seed page content
  const pageSeeds = [
    { id: 'history', data: {
      introEn: 'Palad Lower Primary School was founded in 1935 by Kannur Nambyar with the vision of providing quality education to children of Kodolipuram village. Nine decades later, that vision still burns bright.',
      introMl: 'കൊടോലിപുരം ഗ്രാമത്തിലെ കുട്ടികൾക്ക് ഒരു ഗുണമേന്മയുള്ള വിദ്യാഭ്യാസ സ്ഥാപനം ഒരുക്കണം എന്ന ലക്ഷ്യത്തോടെ കണ്ണൂർ നമ്പ്യാർ 1935-ൽ പാളാട് ലോവർ പ്രൈമറി സ്കൂൾ ആരംഭിച്ചു. ഒൻപത് ദശകങ്ങൾ കഴിഞ്ഞിട്ടും ആ ദർശനം ഇന്നും ജ്വലിക്കുന്നു.',
      timeline: [
        { year: '1935', en: 'Palad LPS founded by Kannur Nambyar.',                         ml: 'കണ്ണൂർ നമ്പ്യാർ പാളാട് എൽ പി എസ് സ്ഥാപിച്ചു.' },
        { year: '1937', en: 'School received government recognition.',                       ml: 'സ്കൂൾ സർക്കാർ അംഗീകാരം ലഭിച്ചു.' },
        { year: '1955', en: 'Current school building completed.',                            ml: 'ഇന്നത്തെ സ്കൂൾ കെട്ടിടം പൂർത്തിയായി.' },
        { year: '2000s', en: 'Library, digital class, and stage-classroom added.',           ml: 'ലൈബ്രറി, ഡിജിറ്റൽ ക്ലാസ്, സ്റ്റേജ്-ക്ലാസ്‌റൂം സൗകര്യം ചേർത്തു.' },
        { year: '2024', en: 'Strong digital presence established on SchoolWiki.',            ml: 'SchoolWiki-ൽ ഞങ്ങളുടെ ഡിജിറ്റൽ സാന്നിദ്ധ്യം ശക്തമായി.' },
      ],
    }},
    { id: 'vision_mission', data: {
      visionEn: 'To build a generation rooted in knowledge and ethics by providing quality education accessible to every child.',
      visionMl: 'ഓരോ കുട്ടിക്കും ഗുണമേന്മയുള്ള വിദ്യാഭ്യാസം ലഭ്യമാക്കി, ജ്ഞാനത്തിലും നൈതികതയിലും ഉറച്ചുനിൽക്കുന്ന ഒരു തലമുറയെ കെട്ടിപ്പടുക്കുക.',
      missionEn: 'To create an environment that fosters the physical, mental, intellectual, and creative growth of every student.',
      missionMl: 'കുട്ടികളുടെ ശാരീരിക, മാനസിക, ബൗദ്ധിക, സൃഷ്ടിപരമായ വളർച്ചക്ക് അനുകൂലമായ അന്തരീക്ഷം സൃഷ്ടിക്കുക.',
      values: [
        { icon: '📖', en: 'Excellence',            ml: 'ഗുണമേന്മ' },
        { icon: '🤝', en: 'Cooperation',           ml: 'സഹകരണം' },
        { icon: '🌱', en: 'Holistic Growth',       ml: 'സമഗ്ര വളർച്ച' },
        { icon: '💡', en: 'Innovation',            ml: 'നൂതനത്വം' },
        { icon: '🫶', en: 'Empathy',               ml: 'സഹാനുഭൂതി' },
        { icon: '🌍', en: 'Environmental Awareness', ml: 'പരിസ്ഥിതി ബോധം' },
      ],
    }},
    { id: 'academics', data: {
      classes: [
        { nameEn: 'Pre-Primary (LKG/UKG)', nameMl: 'പ്രീ-പ്രൈമറി (LKG/UKG)', students: 30, ageEn: '3–5 years', ageMl: '3–5 വർഷം' },
        { nameEn: 'Class 1', nameMl: 'ക്ലാസ് 1', students: 15, ageEn: '5+ years', ageMl: '5+ വർഷം' },
        { nameEn: 'Class 2', nameMl: 'ക്ലാസ് 2', students: 15, ageEn: '6+ years', ageMl: '6+ വർഷം' },
        { nameEn: 'Class 3', nameMl: 'ക്ലാസ് 3', students: 15, ageEn: '7+ years', ageMl: '7+ വർഷം' },
        { nameEn: 'Class 4', nameMl: 'ക്ലാസ് 4', students: 15, ageEn: '8+ years', ageMl: '8+ വർഷം' },
        { nameEn: 'Class 5', nameMl: 'ക്ലാസ് 5', students: 15, ageEn: '9+ years', ageMl: '9+ വർഷം' },
      ],
      subjects: [
        { icon: '📖', en: 'Malayalam',          ml: 'മലയാളം'           },
        { icon: '🔤', en: 'English',            ml: 'ഇംഗ്ലീഷ്'         },
        { icon: '🔢', en: 'Mathematics',        ml: 'ഗണിതം'            },
        { icon: '🌿', en: 'EVS / Science',      ml: 'പരിസ്ഥിതി'        },
        { icon: '🎨', en: 'Art',                ml: 'ആർട്ട്'            },
        { icon: '🎵', en: 'Music',              ml: 'സംഗീതം'           },
        { icon: '🏃', en: 'Physical Education', ml: 'ശാരീരിക ശിക്ഷണം'  },
        { icon: '💻', en: 'Computer',           ml: 'കമ്പ്യൂട്ടർ'       },
      ],
      exams: [
        { en: 'First Term Assessment',  ml: 'ഒന്നാം ടേം വിലയിരുത്തൽ',  periodEn: 'September',        periodMl: 'സെപ്തംബർ'         },
        { en: 'Second Term Assessment', ml: 'രണ്ടാം ടേം വിലയിരുത്തൽ', periodEn: 'December/January', periodMl: 'ഡിസംബർ/ജനുവരി'  },
        { en: 'Annual Examination',     ml: 'വാർഷിക പരീക്ഷ',           periodEn: 'March',            periodMl: 'മാർച്ച്'          },
      ],
      resources: [
        { id: '1', titleEn: 'Class 1–5 Curriculum',  titleMl: 'ക്ലാസ് 1–5 പാഠ്യ പദ്ധതി', fileUrl: '', fileSize: '' },
        { id: '2', titleEn: 'LSS Study Materials',    titleMl: 'LSS പഠന സഹായങ്ങൾ',         fileUrl: '', fileSize: '' },
        { id: '3', titleEn: 'Science Project Guide',  titleMl: 'ശാസ്ത്ര പ്രോജക്ട് ഗൈഡ്',  fileUrl: '', fileSize: '' },
      ],
    }},
    { id: 'activities', data: {
      categories: [
        { id: 'sports',      emoji: '🏃', bg: 'from-orange-400 to-red-500',   titleEn: 'Sports & Physical Activities', titleMl: 'കായിക പ്രവർത്തനങ്ങൾ',     itemsEn: ['Annual Sports Day', 'District Sports Competitions', 'Yoga Classes', 'Indoor Games'], itemsMl: ['വാർഷിക കായിക മേള', 'ജില്ലാ കായിക മത്സരങ്ങൾ', 'യോഗ ക്ലാസ്', 'ഇൻഡോർ ഗെയിംസ്'] },
        { id: 'cultural',    emoji: '🎭', bg: 'from-purple-400 to-pink-500',  titleEn: 'Cultural Activities',          titleMl: 'സാംസ്കാരിക പ്രവർത്തനങ്ങൾ', itemsEn: ['Kerala School Kalolsavam', 'Independence Day Celebration', 'Onam Celebration', 'Christmas Celebration'], itemsMl: ['കേരള സ്കൂൾ കലോത്സവം', 'സ്വാതന്ത്ര്യ ദിന ആഘോഷം', 'ഓണം ആഘോഷം', 'ക്രിസ്മസ് ആഘോഷം'] },
        { id: 'academic',    emoji: '🔬', bg: 'from-blue-400 to-cyan-500',    titleEn: 'Academic Activities',          titleMl: 'അക്കാദമിക് പ്രവർത്തനങ്ങൾ',  itemsEn: ['Science Exhibition', 'LSS Coaching', 'Reading Club', 'Math Olympiad'], itemsMl: ['ശാസ്ത്ര മേള', 'LSS കോച്ചിംഗ്', 'വായനാ ക്ലബ്', 'ഗണിത ഒളിമ്പ്യാഡ്'] },
        { id: 'environment', emoji: '🌿', bg: 'from-green-400 to-teal-500',   titleEn: 'Environmental Activities',     titleMl: 'പരിസ്ഥിതി പ്രവർത്തനങ്ങൾ',   itemsEn: ['Green Club', 'Tree Plantation Drive', 'Swachh Bharat Activities', 'Energy Awareness Programme'], itemsMl: ['ഹരിത ക്ലബ്', 'വൃക്ഷ നടീൽ', 'ശുചിത്വ ഭാരതം', 'ഊർജ്ജ ബോധവൽക്കരണം'] },
      ],
      clubs: [
        { icon: '📚', en: 'Reading Club', ml: 'വായനാ ക്ലബ്'  },
        { icon: '🌿', en: 'Green Club',   ml: 'ഹരിത ക്ലബ്'    },
        { icon: '🔬', en: 'Science Club', ml: 'ശാസ്ത്ര ക്ലബ്'  },
        { icon: '🎨', en: 'Art Club',     ml: 'ആർട്ട് ക്ലബ്'  },
      ],
    }},
    { id: 'admissions', data: {
      periodEn:       'April – June',
      periodMl:       'ഏപ്രിൽ – ജൂൺ',
      entranceExamEn: 'None',
      entranceExamMl: 'ഇല്ല',
      stepsEn: [
        'Visit the school office (April – June)',
        'Collect the admission form',
        'Submit form with required documents',
        'Receive admission confirmation',
      ],
      stepsMl: [
        'സ്കൂൾ ഓഫീസ് സന്ദർശിക്കുക (ഏപ്രിൽ – ജൂൺ)',
        'അഡ്മിഷൻ ഫോം ശേഖരിക്കുക',
        'ആവശ്യമായ രേഖകൾ സഹിതം ഫോം സമർപ്പിക്കുക',
        'പ്രവേശനം സ്ഥിരീകരിക്കുക',
      ],
      class1AgeEn:       '5 years and above as of June 1',
      class1AgeMl:       'ജൂൺ 1 വരെ 5 വയസ്സ് തികഞ്ഞവർ',
      prePrimaryAgeEn:   '3 years and above',
      prePrimaryAgeMl:   '3 വയസ്സ് തികഞ്ഞവർ',
      documentsEn: [
        "Child's Birth Certificate",
        "Aadhaar Card of child and parent/guardian",
        'Residence proof (Ration Card or government document)',
        'Caste Certificate (if applicable)',
        'Transfer Certificate (if coming from another school)',
        'Passport-size photographs (2–4)',
      ],
      documentsMl: [
        'കുട്ടിയുടെ ജനന സർട്ടിഫിക്കറ്റ്',
        'കുട്ടിയുടെയും രക്ഷിതാവിന്റെയും ആധാർ കാർഡ്',
        'താമസ തെളിവ് (റേഷൻ കാർഡ് / ഗവ. രേഖ)',
        'ജാതി സർട്ടിഫിക്കറ്റ് (ബാധകമെങ്കിൽ)',
        'ട്രാൻസ്ഫർ സർട്ടിഫിക്കറ്റ് (മറ്റൊരു സ്കൂളിൽ നിന്ന് വരുന്ന കുട്ടിക്ക്)',
        'പാസ്പോർട്ട് സൈസ് ഫോട്ടോ (2-4)',
      ],
    }},
    { id: 'pta', data: {
      aboutEn: 'The PTA of Palad LPS is an active organisation where parents and teachers work together for the holistic development of the school and welfare of students. Meetings are held every month to discuss school matters.',
      aboutMl: 'പാളാട് എൽ പി എസ്-ന്റെ PTA, രക്ഷിതാക്കളും അദ്ധ്യാപകരും ഒരുമിച്ച് സ്കൂളിന്റെ സർവ്വതോമുഖ വളർച്ചക്കും കുട്ടികളുടെ ക്ഷേമത്തിനും വേണ്ടി പ്രവർത്തിക്കുന്ന ഒരു സജീവ സംഘടനയാണ്. ഓരോ മാസവും യോഗം ചേർന്ന് സ്കൂൾ വിഷയങ്ങൾ ചർച്ച ചെയ്യുന്നു.',
      committee: [
        { roleEn: 'President',      roleMl: 'അദ്ധ്യക്ഷൻ',        nameEn: 'Rajesh P.K.',  nameMl: 'രാജേഷ് പി.കെ.' },
        { roleEn: 'Vice President', roleMl: 'വൈസ് പ്രസിഡന്റ്',   nameEn: 'Suma T.',      nameMl: 'സുമ ടി.' },
        { roleEn: 'Secretary',      roleMl: 'സെക്രട്ടറി',        nameEn: 'Anil Kumar',   nameMl: 'അനിൽ കുമാർ' },
        { roleEn: 'Treasurer',      roleMl: 'ട്രഷറർ',            nameEn: 'Devaki Nair',  nameMl: 'ദേവകി നായർ' },
      ],
    }},
  ];
  for (const { id, data } of pageSeeds) {
    const ref  = doc(db, 'pages', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) await setDoc(ref, data);
  }
}

export async function getCol<T>(colName: string): Promise<T[]> {
  const snap = await getDocsFromServer(collection(db, colName));
  return snap.docs.map(d => ({ ...d.data(), id: d.id } as T));
}

export async function saveDoc(colName: string, id: string, data: object) {
  // JSON round-trip strips undefined values which Firestore rejects
  const clean = JSON.parse(JSON.stringify(data));
  await setDoc(doc(db, colName, id), clean);
}

export async function removeDoc(colName: string, id: string) {
  await fsDelete(doc(db, colName, id));
}

export async function addToCol(colName: string, data: object): Promise<string> {
  const ref = await addDoc(collection(db, colName), data);
  return ref.id;
}

export async function getSchoolInfo(): Promise<typeof SCHOOL> {
  const snap = await getDocFromServer(doc(db, 'school_info', 'main'));
  return (snap.exists() ? snap.data() : SCHOOL) as typeof SCHOOL;
}

export async function saveSchoolInfo(data: object) {
  await setDoc(doc(db, 'school_info', 'main'), data, { merge: true });
}

// ── Gallery photos ─────────────────────────────────────────────────────────
export async function saveGalleryPhoto(albumId: string, url: string): Promise<void> {
  await addDoc(collection(db, 'gallery_photos'), { albumId, url, uploadedAt: Date.now() });
  const albumRef  = doc(db, 'gallery_albums', albumId);
  const albumSnap = await getDoc(albumRef);
  if (albumSnap.exists()) {
    const d = albumSnap.data();
    await setDoc(albumRef, {
      count: (d.count ?? 0) + 1,
      ...(d.coverUrl ? {} : { coverUrl: url }),
    }, { merge: true });
  }
}

export async function getAllPhotoCounts(): Promise<Record<string, number>> {
  const snap = await getDocsFromServer(collection(db, 'gallery_photos'));
  const counts: Record<string, number> = {};
  snap.docs.forEach(d => {
    const id = d.data().albumId as string;
    counts[id] = (counts[id] ?? 0) + 1;
  });
  return counts;
}

export async function getAlbumPhotos(albumId: string): Promise<Array<{ id: string; url: string }>> {
  const q    = query(collection(db, 'gallery_photos'), where('albumId', '==', albumId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, url: d.data().url as string }));
}

export async function deleteGalleryPhoto(photoId: string, albumId: string): Promise<void> {
  await fsDelete(doc(db, 'gallery_photos', photoId));
  const albumRef  = doc(db, 'gallery_albums', albumId);
  const albumSnap = await getDoc(albumRef);
  if (albumSnap.exists()) {
    await setDoc(albumRef, { count: Math.max(0, (albumSnap.data().count ?? 1) - 1) }, { merge: true });
  }
}

// ── Site settings (hero image, logo, etc.) ─────────────────────────────────
export async function getSiteSettings(): Promise<{ heroImageUrl?: string; logoUrl?: string }> {
  const snap = await getDocFromServer(doc(db, 'site_settings', 'main'));
  return (snap.exists() ? snap.data() : {}) as any;
}

export async function saveContactMessage(data: { name: string; phone: string; message: string }): Promise<void> {
  await addDoc(collection(db, 'contact_messages'), {
    ...data,
    sentAt: new Date().toISOString(),
    read: false,
  });
}

export async function markMessageRead(id: string): Promise<void> {
  await setDoc(doc(db, 'contact_messages', id), { read: true }, { merge: true });
}

export async function saveSiteSettings(data: object): Promise<void> {
  await setDoc(doc(db, 'site_settings', 'main'), data, { merge: true });
}

export async function getPage(id: string): Promise<any> {
  const snap = await getDocFromServer(doc(db, 'pages', id));
  return snap.exists() ? snap.data() : null;
}

export async function savePage(id: string, data: object): Promise<void> {
  await setDoc(doc(db, 'pages', id), data);
}

export async function uploadFile(file: File, folder: string): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset    = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', preset!);
  formData.append('folder', `palad-lps/${folder}`);
  formData.append('resource_type', 'raw');  // raw = any file type, publicly served by default

  const res  = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`, {
    method: 'POST',
    body:   formData,
  });
  const data = await res.json();
  if (!data.secure_url) throw new Error(data.error?.message ?? 'Upload failed');
  return data.secure_url as string;
}

export async function uploadPhoto(file: File, folder: string): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset    = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', preset!);
  formData.append('folder', `palad-lps/${folder}`);

  const res  = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body:   formData,
  });
  const data = await res.json();
  if (!data.secure_url) throw new Error(data.error?.message ?? 'Upload failed');
  return data.secure_url as string;
}
