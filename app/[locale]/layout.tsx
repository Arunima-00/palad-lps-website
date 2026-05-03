import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Chatbot from '@/components/shared/Chatbot';
import '@/app/globals.css';

export const metadata: Metadata = {
  title:       { default: 'Palad LPS | പാളാട് എൽ പി എസ്', template: '%s | Palad LPS' },
  description: 'Palad Lower Primary School — Quality education since 1935. Kodolipuram, Mattanur, Kannur, Kerala.',
  keywords:    ['Palad LPS', 'Palad Lower Primary School', 'പാളാട് എൽ പി എസ്', 'Mattanur school', 'Kannur school'],
  openGraph: {
    siteName: 'Palad LPS',
    type:     'website',
  },
};

export function generateStaticParams() {
  return locales.map(locale => ({ locale }));
}

interface Props {
  children: React.ReactNode;
  params:   { locale: string };
}

export default async function LocaleLayout({ children, params: { locale } }: Props) {
  if (!locales.includes(locale as 'ml' | 'en')) notFound();

  const messages = await getMessages();

  return (
    <html lang={locale} className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-white text-gray-800 antialiased">
        <NextIntlClientProvider messages={messages}>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <Chatbot />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
