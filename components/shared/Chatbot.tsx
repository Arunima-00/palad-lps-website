'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { MessageCircle, X, Send, Bot, Loader2 } from 'lucide-react';
import { getSchoolInfo, getCol, getPage } from '@/lib/db';
import { SCHOOL } from '@/lib/schoolData';

type Message = { role: 'bot' | 'user'; text: string; time: string };

const getTime = () =>
  new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });

export default function Chatbot() {
  const locale = useLocale() as 'ml' | 'en';
  const ml     = locale === 'ml';

  const [open,      setOpen]      = useState(false);
  const [messages,  setMessages]  = useState<Message[]>([]);
  const [input,     setInput]     = useState('');
  const [typing,    setTyping]    = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // School data loaded from Firestore
  const schoolRef    = useRef<any>(SCHOOL);
  const eventsRef    = useRef<any[]>([]);
  const announcRef   = useRef<any[]>([]);
  const admissRef    = useRef<any>(null);
  const staffRef     = useRef<any[]>([]);

  useEffect(() => {
    getSchoolInfo().then(d => { schoolRef.current = { ...SCHOOL, ...d }; }).catch(() => {});
    getCol('events').then(d => { eventsRef.current = d as any[]; }).catch(() => {});
    getCol('announcements').then(d => { announcRef.current = d as any[]; }).catch(() => {});
    getPage('admissions').then(d => { admissRef.current = d; }).catch(() => {});
    getCol('staff').then(d => { staffRef.current = d as any[]; }).catch(() => {});
  }, []);

  // Greeting on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: 'bot',
        text: ml
          ? 'നമസ്കാരം! 👋 ഞാൻ പാളാട് LPS-ന്റെ AI അസിസ്റ്റന്റാണ്.\nഅഡ്മിഷൻ, ഫോൺ, ഇവന്റ്, ടൈമിംഗ് തുടങ്ങിയ കാര്യങ്ങൾ ചോദിക്കൂ!'
          : 'Hello! 👋 I\'m the Palad LPS assistant.\nAsk me about admissions, contact, events, timings, staff and more!',
        time: getTime(),
      }]);
    }
  }, [open, ml, messages.length]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const generateResponse = useCallback((q: string): string => {
    const s  = q.toLowerCase();
    const sc = schoolRef.current;

    // ── Greetings ──────────────────────────────────────────────────────────
    if (/\b(hi|hello|hey|good|morning|evening|നമസ്|ഹലോ|ഗുഡ്)\b/i.test(s))
      return ml
        ? 'നമസ്കാരം! 😊 ഞാൻ നിങ്ങളെ എങ്ങനെ സഹായിക്കാം?'
        : 'Hello! 😊 How can I help you today?';

    // ── Admissions ─────────────────────────────────────────────────────────
    if (/admission|apply|enroll|join|register|fee|registration|പ്രവേശ|അഡ്മിഷ/i.test(s)) {
      const period = admissRef.current?.periodEn ?? 'April – June';
      const exam   = admissRef.current?.entranceExamEn ?? 'None';
      return ml
        ? `📋 **പ്രവേശന വിവരങ്ങൾ**\n• കാലഘട്ടം: ${admissRef.current?.periodMl ?? 'ഏപ്രിൽ – ജൂൺ'}\n• പ്രവേശന പരീക്ഷ: ${admissRef.current?.entranceExamMl ?? 'ഇല്ല'}\n• ഫോൺ: ${sc.phone}\n\nകൂടുതൽ വിവരങ്ങൾ /admissions-ൽ കാണാം.`
        : `📋 **Admission Info**\n• Period: ${period}\n• Entrance Exam: ${exam}\n• Phone: ${sc.phone}\n\nSee /admissions for full details.`;
    }

    // ── Contact / Phone ────────────────────────────────────────────────────
    if (/phone|contact|call|number|reach|email|mail|ഫോൺ|ബന്ധ|ഇ-മെയ്|നമ്പ/i.test(s))
      return ml
        ? `📞 **ബന്ധപ്പെടാൻ**\n• ഫോൺ: ${sc.phone}\n• ഇ-മെയിൽ: ${sc.email}\n• WhatsApp: ${sc.whatsappNumber}`
        : `📞 **Contact Us**\n• Phone: ${sc.phone}\n• Email: ${sc.email}\n• WhatsApp: ${sc.whatsappNumber}`;

    // ── Address / Location ─────────────────────────────────────────────────
    if (/address|location|where|map|direction|place|വിലാസ|എവിടെ|സ്ഥലം/i.test(s))
      return ml
        ? `📍 **വിലാസം**\n${(sc.address as any)?.ml ?? sc.address.ml}`
        : `📍 **Address**\n${(sc.address as any)?.en ?? sc.address.en}`;

    // ── Timings / Hours ────────────────────────────────────────────────────
    if (/time|hour|timing|open|close|when|schedule|സമയ|തുറ|അടയ്/i.test(s))
      return ml
        ? `🕘 **സ്കൂൾ സമയം**\n• ${sc.schoolHours ?? '9:00 AM – 3:45 PM'}\n• ${sc.workingDays ?? 'Monday – Friday'}`
        : `🕘 **School Timings**\n• ${sc.schoolHours ?? '9:00 AM – 3:45 PM'}\n• ${sc.workingDays ?? 'Monday – Friday'}`;

    // ── Principal ──────────────────────────────────────────────────────────
    if (/principal|head|headmaster|hm|പ്രിൻ|ഹെഡ്/i.test(s))
      return ml
        ? `👨‍🏫 **പ്രിൻസിപ്പൽ**: ${sc.principal}\n📞 ${sc.phone}`
        : `👨‍🏫 **Principal**: ${sc.principal}\n📞 ${sc.phone}`;

    // ── Staff / Teachers ───────────────────────────────────────────────────
    if (/staff|teacher|faculty|tutor|അദ്ധ്യ|ടീച്ചർ|സ്റ്റാഫ്/i.test(s)) {
      const count = staffRef.current.length || sc.teachers || 5;
      const names = staffRef.current.slice(0, 3).map((s: any) => `• ${s.name} (${s.roleEn})`).join('\n');
      return ml
        ? `👩‍🏫 **ഞങ്ങളുടെ ടീം**\nആകെ ${count} അദ്ധ്യാപകർ.\n\nകൂടുതൽ: /about/staff`
        : `👩‍🏫 **Our Staff**\nTotal ${count} teachers.\n${names}\n\nMore at: /about/staff`;
    }

    // ── Upcoming Events ────────────────────────────────────────────────────
    if (/event|upcoming|festival|celebration|programme|ഇവന്റ്|ആഘോഷ|പ്രോഗ്രാം/i.test(s)) {
      const today    = new Date().toISOString().split('T')[0];
      const upcoming = eventsRef.current.filter((e: any) => e.date >= today).slice(0, 3);
      if (!upcoming.length)
        return ml ? '📅 ഇപ്പോൾ ഷെഡ്യൂൾ ചെയ്ത ഇവന്റുകൾ ഇല്ല.' : '📅 No upcoming events scheduled right now.';
      const list = upcoming.map((e: any) => `• ${ml ? e.titleMl : e.titleEn} — ${e.date}`).join('\n');
      return (ml ? '📅 **വരാനിരിക്കുന്ന ഇവന്റുകൾ:**\n' : '📅 **Upcoming Events:**\n') + list;
    }

    // ── Announcements ──────────────────────────────────────────────────────
    if (/announcement|notice|news|update|circular|അറിയിപ്പ്|നോട്ടീസ്|സർക്കുലർ/i.test(s)) {
      const recent = announcRef.current.slice(0, 3);
      if (!recent.length)
        return ml ? '📢 ഇപ്പോൾ അറിയിപ്പുകൾ ഇല്ല.' : '📢 No announcements at the moment.';
      const list = recent.map((a: any) => `• ${ml ? a.titleMl : a.titleEn}`).join('\n');
      return (ml ? '📢 **ഏറ്റവും പുതിയ അറിയിപ്പുകൾ:**\n' : '📢 **Latest Announcements:**\n') + list;
    }

    // ── Classes / Students ─────────────────────────────────────────────────
    if (/class|grade|standard|lkg|ukg|student|pupil|ക്ലാസ്|വിദ്യാർഥ/i.test(s))
      return ml
        ? `🏫 Pre-Primary (LKG/UKG) മുതൽ Class 5 വരെ.\n• ആകെ വിദ്യാർഥികൾ: ${sc.students?.total ?? 75}+\n• മീഡിയം: മലയാളം`
        : `🏫 Classes from Pre-Primary (LKG/UKG) to Class 5.\n• Total students: ${sc.students?.total ?? 75}+\n• Medium: Malayalam`;

    // ── Documents ──────────────────────────────────────────────────────────
    if (/document|certificate|aadhaar|birth|required|proof|rேඛ|ആധാർ|ജനന/i.test(s))
      return ml
        ? '📄 **ആവശ്യമായ രേഖകൾ:**\n• ജനന സർട്ടിഫിക്കറ്റ്\n• ആധാർ കാർഡ് (കുട്ടി + രക്ഷിതാവ്)\n• താമസ തെളിവ്\n• ജാതി സർട്ടിഫിക്കറ്റ് (ബാധകമെങ്കിൽ)\n• ഫോട്ടോ (2–4)'
        : '📄 **Required Documents:**\n• Birth certificate\n• Aadhaar card (child + parent)\n• Residence proof\n• Caste certificate (if applicable)\n• Passport photos (2–4)';

    // ── About / History ────────────────────────────────────────────────────
    if (/about|founded|history|established|year|1935|udise|ചരിത്ര|സ്ഥാപ/i.test(s))
      return ml
        ? `🏫 **പാളാട് LPS**\n• സ്ഥാപിതം: 1935\n• UDISE: ${sc.udise}\n• തരം: ${sc.type?.ml ?? 'Aided Government LP School'}\n• ${(sc.address as any)?.ml ?? sc.address.ml}`
        : `🏫 **Palad LPS**\n• Founded: 1935\n• UDISE: ${sc.udise}\n• Type: ${sc.type?.en ?? 'Aided Government LP School'}\n• ${(sc.address as any)?.en ?? sc.address.en}`;

    // ── Subjects ───────────────────────────────────────────────────────────
    if (/subject|syllabus|curriculum|course|വിഷയ|സ്ലബ്/i.test(s))
      return ml
        ? '📚 **വിഷയങ്ങൾ:**\nമലയാളം, ഇംഗ്ലീഷ്, ഗണിതം, EVS/ശാസ്ത്രം, ആർട്ട്, സംഗീതം, ശാരീരിക ശിക്ഷണം, കമ്പ്യൂട്ടർ'
        : '📚 **Subjects Taught:**\nMalayalam, English, Mathematics, EVS/Science, Art, Music, Physical Education, Computer';

    // ── Gallery ────────────────────────────────────────────────────────────
    if (/photo|gallery|image|picture|ഫോട്ടോ|ഗ്യാലറ/i.test(s))
      return ml
        ? '🖼️ ഞങ്ങളുടെ ഫോട്ടോ ഗ്യാലറി /gallery-ൽ കാണാം.'
        : '🖼️ View our photo gallery at /gallery.';

    // ── PTA ────────────────────────────────────────────────────────────────
    if (/pta|parent|association|meeting|യോഗ|രക്ഷ/i.test(s))
      return ml
        ? '👥 PTA മാസം ഒരിക്കൽ യോഗം ചേരുന്നു. കൂടുതൽ: /pta'
        : '👥 PTA meets monthly. More info at /pta page.';

    // ── Thanks / Bye ───────────────────────────────────────────────────────
    if (/thank|bye|goodbye|ok|okay|great|perfect|നന്ദി|ശരി|ഓക്കേ/i.test(s))
      return ml
        ? 'നന്ദി! 😊 മറ്റ് ചോദ്യങ്ങൾ ഉണ്ടെങ്കിൽ ചോദിക്കൂ.'
        : 'Thank you! 😊 Feel free to ask anything else.';

    // ── Default ────────────────────────────────────────────────────────────
    return ml
      ? 'ക്ഷമിക്കണം, ആ ചോദ്യം മനസ്സിലായില്ല. ഇവ ചോദിക്കാം:\n• അഡ്മിഷൻ • ഫോൺ • ടൈമിംഗ് • ഇവന്റ് • അദ്ധ്യാപകർ • ക്ലാസ്'
      : 'Sorry, I didn\'t understand that. Try asking about:\n• Admissions • Contact • Timings • Events • Staff • Classes';
  }, [ml]);

  const sendMessage = useCallback((text: string) => {
    const userMsg = text.trim();
    if (!userMsg) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg, time: getTime() }]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages(prev => [...prev, { role: 'bot', text: generateResponse(userMsg), time: getTime() }]);
    }, 700);
  }, [generateResponse]);

  const quickReplies = ml
    ? ['അഡ്മിഷൻ', 'ഫോൺ നമ്പർ', 'ടൈമിംഗ്', 'ഇവന്റുകൾ', 'ഫീസ്']
    : ['Admissions', 'Contact', 'Timings', 'Events', 'Documents'];

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 bg-primary-600 hover:bg-primary-700 active:scale-95 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-xl transition-all duration-200"
        aria-label="Open chat"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!open && messages.length === 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-secondary-400 rounded-full animate-ping" />
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[340px] md:w-[380px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          style={{ height: '500px' }}>

          {/* Header */}
          <div className="bg-primary-600 text-white px-4 py-3 flex items-center gap-3 shrink-0">
            <div className="bg-white/20 rounded-full p-2 shrink-0">
              <Bot className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className={`font-bold text-sm truncate ${ml ? 'font-malayalam' : ''}`}>
                {ml ? 'പാളാട് LPS അസിസ്റ്റന്റ്' : 'Palad LPS Assistant'}
              </div>
              <div className="text-xs text-primary-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
                {ml ? 'ഓൺലൈൻ' : 'Online'}
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="hover:bg-white/20 p-1 rounded-full shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[85%]">
                  <div className={`rounded-2xl px-3 py-2 text-sm whitespace-pre-line leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary-600 text-white rounded-br-sm'
                      : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100'
                  } ${ml ? 'font-malayalam' : ''}`}>
                    {msg.text}
                  </div>
                  <div className={`text-xs text-gray-400 mt-0.5 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.time}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {typing && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100 flex gap-1 items-center">
                  {[0,1,2].map(i => (
                    <span key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick replies — shown initially */}
          {messages.length <= 1 && !typing && (
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 shrink-0">
              <p className={`text-xs text-gray-400 mb-1.5 ${ml ? 'font-malayalam' : ''}`}>
                {ml ? 'ദ്രുത ചോദ്യങ്ങൾ:' : 'Quick questions:'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {quickReplies.map(r => (
                  <button key={r} onClick={() => sendMessage(r)}
                    className={`text-xs bg-white border border-primary-200 text-primary-700 px-3 py-1 rounded-full hover:bg-primary-50 transition-colors ${ml ? 'font-malayalam' : ''}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-200 flex gap-2 shrink-0">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              className={`flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 ${ml ? 'font-malayalam' : ''}`}
              placeholder={ml ? 'ചോദ്യം ടൈപ്പ് ചെയ്യൂ...' : 'Ask a question...'}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || typing}
              className="bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white rounded-xl px-3 transition-colors shrink-0"
            >
              {typing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
