'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle } from 'lucide-react';
import { SCHOOL } from '@/lib/schoolData';
import { getSchoolInfo, saveContactMessage } from '@/lib/db';

export default function ContactPage() {
  const locale = useLocale() as 'ml' | 'en';
  const ml     = locale === 'ml';

  const [school,    setSchool]    = useState(SCHOOL);
  const [form,      setForm]      = useState({ name: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);

  useEffect(() => {
    getSchoolInfo().then(info => {
      if (info) setSchool(prev => ({ ...prev, ...(info as any) }));
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await saveContactMessage({ name: form.name, phone: form.phone, message: form.message });
    } catch { /* still show success even if offline */ }
    setSubmitted(true);
    setLoading(false);
  };

  const contactItems = [
    {
      icon: Phone, bg: 'bg-green-100', color: 'text-green-600',
      labelMl: 'ഫോൺ', labelEn: 'Phone',
      valueMl: school.phone, valueEn: school.phone,
      href: `tel:${school.phone}`,
    },
    {
      icon: Mail, bg: 'bg-blue-100', color: 'text-blue-600',
      labelMl: 'ഇ-മെയിൽ', labelEn: 'Email',
      valueMl: school.email, valueEn: school.email,
      href: `mailto:${school.email}`,
    },
    {
      icon: MapPin, bg: 'bg-red-100', color: 'text-red-500',
      labelMl: 'വിലാസം', labelEn: 'Address',
      valueMl: (school.address as any)?.ml ?? school.address.ml,
      valueEn: (school.address as any)?.en ?? school.address.en,
      href: `https://maps.google.com/?q=Palad+LPS+Mattanur+Kannur`,
    },
    {
      icon: Clock, bg: 'bg-orange-100', color: 'text-orange-600',
      labelMl: 'ഓഫീസ് സമയം', labelEn: 'Office Hours',
      valueMl: `${(school as any).workingDays ?? school.workingDays}: ${school.schoolHours}`,
      valueEn: `${(school as any).workingDays ?? school.workingDays}: ${school.schoolHours}`,
      href: null,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className={`text-4xl font-bold text-primary-700 mb-2 ${ml ? 'font-malayalam' : ''}`}>
        {ml ? 'ബന്ധപ്പെടുക' : 'Contact Us'}
      </h1>
      <div className="h-1 w-20 bg-secondary-400 rounded-full mb-10" />

      <div className="grid md:grid-cols-2 gap-10">

        {/* Left — contact info + map */}
        <div className="space-y-5">
          {contactItems.map(({ icon: Icon, bg, color, labelMl, labelEn, valueMl, valueEn, href }) => (
            <div key={labelEn} className="card p-5 flex items-start gap-4">
              <div className={`${bg} rounded-xl p-3 shrink-0`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <div className={`text-xs text-gray-500 font-medium ${ml ? 'font-malayalam' : ''}`}>
                  {ml ? labelMl : labelEn}
                </div>
                {href ? (
                  <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
                    className={`font-semibold text-primary-600 hover:underline mt-0.5 block ${ml ? 'font-malayalam' : ''}`}>
                    {ml ? valueMl : valueEn}
                  </a>
                ) : (
                  <div className={`font-semibold text-gray-800 mt-0.5 ${ml ? 'font-malayalam' : ''}`}>
                    {ml ? valueMl : valueEn}
                  </div>
                )}
              </div>
            </div>
          ))}

          

          {/* Map */}
          <div className="rounded-2xl overflow-hidden h-56 shadow-sm border border-gray-100">
            <iframe
              src={school.mapEmbedUrl}
              width="100%" height="100%"
              style={{ border: 0 }} allowFullScreen loading="lazy"
              title="Palad LPS Map"
            />
          </div>
        </div>

        
      </div>
    </div>
  );
}
