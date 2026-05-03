'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { MessageSquare, Send } from 'lucide-react';

interface Comment {
  id:      string;
  name:    string;
  text:    string;
  date:    string;
}

interface Props {
  itemId:   string;
  comments?: Comment[];
}

export default function CommentSection({ itemId, comments = [] }: Props) {
  const t      = useTranslations('comments');
  const locale = useLocale();
  const ml     = locale === 'ml';

  const [name,      setName]      = useState('');
  const [text,      setText]      = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [list,      setList]      = useState<Comment[]>(comments);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;

    // Optimistic local add (marked as pending)
    setList(prev => [
      ...prev,
      { id: Date.now().toString(), name, text: `[${t('pending')}] ${text}`, date: new Date().toLocaleDateString() },
    ]);
    setSubmitted(true);
    setName('');
    setText('');

    // TODO: persist to Firestore
    // await addDoc(collection(db, 'comments'), {
    //   itemId, name, text, approved: false, createdAt: serverTimestamp()
    // });
  };

  return (
    <section className="mt-10 border-t pt-8">
      <h3 className={`flex items-center gap-2 text-xl font-bold text-primary-700 mb-6 ${ml ? 'font-malayalam' : ''}`}>
        <MessageSquare className="h-5 w-5" />
        {t('title')} {list.length > 0 && <span className="text-base font-normal text-gray-500">({list.length})</span>}
      </h3>

      {/* Comment list */}
      {list.length === 0 ? (
        <p className={`text-gray-400 italic mb-6 ${ml ? 'font-malayalam' : ''}`}>{t('noComments')}</p>
      ) : (
        <ul className="space-y-4 mb-8">
          {list.map(c => (
            <li key={c.id} className="bg-gray-50 rounded-xl p-4">
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-primary-700">{c.name}</span>
                <span className="text-xs text-gray-400">{c.date}</span>
              </div>
              <p className={`text-gray-700 text-sm ${ml ? 'font-malayalam' : ''}`}>{c.text}</p>
            </li>
          ))}
        </ul>
      )}

      {/* Comment form */}
      {!submitted ? (
        <form onSubmit={handleSubmit} className="bg-cream rounded-2xl p-6 space-y-4 border">
          <div>
            <label className={`block text-sm font-medium text-gray-700 mb-1 ${ml ? 'font-malayalam' : ''}`}>
              {t('yourName')} *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>
          <div>
            <label className={`block text-sm font-medium text-gray-700 mb-1 ${ml ? 'font-malayalam' : ''}`}>
              {t('placeholder').split('...')[0]}... *
            </label>
            <textarea
              rows={3}
              value={text}
              onChange={e => setText(e.target.value)}
              required
              placeholder={t('placeholder')}
              className={`w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none ${ml ? 'font-malayalam' : ''}`}
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Send className="h-4 w-4" />
            <span className={ml ? 'font-malayalam' : ''}>{t('submit')}</span>
          </button>
        </form>
      ) : (
        <div className={`bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 text-sm ${ml ? 'font-malayalam' : ''}`}>
          ✓ {t('pending')}
        </div>
      )}
    </section>
  );
}
