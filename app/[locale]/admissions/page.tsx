'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { CheckCircle, Phone, Calendar, FileText } from 'lucide-react';
import { SCHOOL, DOCUMENTS_REQUIRED } from '@/lib/schoolData';
import { getPage, getSchoolInfo } from '@/lib/db';

const STATIC = {
  periodEn: 'April – June', periodMl: 'ഏപ്രിൽ – ജൂൺ',
  entranceExamEn: 'None',   entranceExamMl: 'ഇല്ല',
  stepsEn: ['Visit the school office (April – June)', 'Collect the admission form', 'Submit form with required documents', 'Receive admission confirmation'],
  stepsMl: ['സ്കൂൾ ഓഫീസ് സന്ദർശിക്കുക (ഏപ്രിൽ – ജൂൺ)', 'അഡ്മിഷൻ ഫോം ശേഖരിക്കുക', 'ആവശ്യമായ രേഖകൾ സഹിതം ഫോം സമർപ്പിക്കുക', 'പ്രവേശനം സ്ഥിരീകരിക്കുക'],
  class1AgeEn: '5 years and above as of June 1', class1AgeMl: 'ജൂൺ 1 വരെ 5 വയസ്സ് തികഞ്ഞവർ',
  prePrimaryAgeEn: '3 years and above',           prePrimaryAgeMl: '3 വയസ്സ് തികഞ്ഞവർ',
  documentsEn: DOCUMENTS_REQUIRED.en,
  documentsMl: DOCUMENTS_REQUIRED.ml,
};

export default function AdmissionsPage() {
  const locale = useLocale() as 'ml' | 'en';
  const ml     = locale === 'ml';

  const [data,  setData]  = useState(STATIC);
  const [phone, setPhone] = useState(SCHOOL.phone);

  useEffect(() => {
    getPage('admissions').then(d => { if (d) setData({ ...STATIC, ...d }); }).catch(() => {});
    getSchoolInfo().then(info => { if ((info as any)?.phone) setPhone((info as any).phone); }).catch(() => {});
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className={`text-4xl font-bold text-primary-700 mb-2 ${ml ? 'font-malayalam' : ''}`}>
        {ml ? 'പ്രവേശനം' : 'Admissions'}
      </h1>
      <div className="h-1 w-20 bg-secondary-400 rounded-full mb-10" />

      {/* Highlights */}
      <div className="grid md:grid-cols-3 gap-4 mb-12">
        {[
          { icon: Calendar,     labelMl: 'പ്രവേശന കാലം',    labelEn: 'Admission Period', valueMl: data.periodMl,       valueEn: data.periodEn       },
          { icon: CheckCircle,  labelMl: 'പ്രവേശന പരീക്ഷ',  labelEn: 'Entrance Exam',   valueMl: data.entranceExamMl, valueEn: data.entranceExamEn },
          { icon: Phone,        labelMl: 'ബന്ധപ്പെടുക',     labelEn: 'Contact',         valueMl: phone,               valueEn: phone               },
        ].map(({ icon: Icon, labelMl, labelEn, valueMl, valueEn }) => (
          <div key={labelEn} className="card p-6 flex items-center gap-4">
            <div className="bg-primary-100 rounded-xl p-3"><Icon className="h-6 w-6 text-primary-600" /></div>
            <div>
              <div className={`text-xs text-gray-500 ${ml ? 'font-malayalam' : ''}`}>{ml ? labelMl : labelEn}</div>
              <div className={`font-bold text-primary-700 ${ml ? 'font-malayalam' : ''}`}>{ml ? valueMl : valueEn}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Steps */}
        <div>
          <h2 className={`text-2xl font-bold text-primary-700 mb-6 ${ml ? 'font-malayalam' : ''}`}>
            {ml ? 'പ്രവേശന ഘട്ടങ്ങൾ' : 'Admission Steps'}
          </h2>
          <ol className="space-y-4">
            {(ml ? data.stepsMl : data.stepsEn).map((step, i) => (
              <li key={i} className="flex items-start gap-4">
                <div className="bg-primary-600 text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center shrink-0">{i + 1}</div>
                <span className={`text-gray-700 mt-1 ${ml ? 'font-malayalam' : ''}`}>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Eligibility */}
        <div>
          <h2 className={`text-2xl font-bold text-primary-700 mb-6 ${ml ? 'font-malayalam' : ''}`}>
            {ml ? 'പ്രായ യോഗ്യത' : 'Age Eligibility'}
          </h2>
          <div className="space-y-4">
            <div className="bg-primary-50 rounded-2xl p-5">
              <div className={`font-bold text-primary-700 mb-1 ${ml ? 'font-malayalam' : ''}`}>{ml ? 'ക്ലാസ് 1' : 'Class 1'}</div>
              <div className={`text-gray-700 ${ml ? 'font-malayalam' : ''}`}>{ml ? data.class1AgeMl : data.class1AgeEn}</div>
            </div>
            <div className="bg-secondary-50 rounded-2xl p-5">
              <div className={`font-bold text-primary-700 mb-1 ${ml ? 'font-malayalam' : ''}`}>{ml ? 'പ്രീ-പ്രൈമറി' : 'Pre-Primary'}</div>
              <div className={`text-gray-700 ${ml ? 'font-malayalam' : ''}`}>{ml ? data.prePrimaryAgeMl : data.prePrimaryAgeEn}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="card p-8 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="h-6 w-6 text-primary-600" />
          <h2 className={`text-2xl font-bold text-primary-700 ${ml ? 'font-malayalam' : ''}`}>
            {ml ? 'ആവശ്യമായ രേഖകൾ' : 'Required Documents'}
          </h2>
        </div>
        <ul className="grid md:grid-cols-2 gap-3">
          {(ml ? data.documentsMl : data.documentsEn).map((doc, i) => (
            <li key={i} className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-primary-500 shrink-0 mt-0.5" />
              <span className={`text-gray-700 ${ml ? 'font-malayalam' : ''}`}>{doc}</span>
            </li>
          ))}
        </ul>
      </div>

      
    </div>
  );
}
