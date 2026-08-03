import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { notFound } from 'next/navigation';
import { getMessages } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import { Analytics } from '@vercel/analytics/next';
import '../globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isEs = locale === 'es';
  const baseUrl = 'https://www.visionaria.cl';

  const title = isEs
    ? 'Visionaria — Integración de Sistemas de Seguridad en Chile'
    : 'Visionaria — Security Systems Integration in Chile';
  const description = isEs
    ? 'Líder en videovigilancia, reconocimiento facial, lectores de patentes LPR y drones de respuesta rápida (DAFR) para municipios y seguridad pública en Chile. Más de 80 municipios y 3.700 proyectos ejecutados.'
    : 'Leading provider of video surveillance, facial recognition, LPR license plate readers and DAFR drones for public safety in Chile. 80+ municipalities and 3,700+ projects completed.';

  return {
    title: {
      default: title,
      template: `%s | Visionaria`,
    },
    description,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: { 'es-CL': `${baseUrl}/es`, 'en': `${baseUrl}/en` },
    },
    openGraph: {
      type: 'website',
      locale: isEs ? 'es_CL' : 'en_US',
      url: `${baseUrl}/${locale}`,
      siteName: 'Visionaria',
      title,
      description,
      // Image comes from the opengraph-image.tsx file convention in this segment.
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
    keywords: isEs
      ? ['videovigilancia Chile', 'reconocimiento facial', 'lectura de patentes LPR', 'drones seguridad', 'CAD PSIM', 'municipio seguridad', 'Visionaria Chile', 'DAFR', 'Ley CATI']
      : ['video surveillance Chile', 'facial recognition', 'LPR license plate reader', 'security drones', 'CAD PSIM', 'Visionaria Chile'],
  };
}

const locales = ['es', 'en'];

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale)) notFound();

  const messages = await getMessages() as Record<string, Record<string, string>>;
  const nav = messages.nav;
  const footer = messages.footer;

  return (
    <html lang={locale} className={geist.variable}>
      <body className="min-h-screen flex flex-col font-sans antialiased" style={{background: 'var(--background)', color: 'var(--foreground)'}}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Navbar locale={locale} t={nav as Parameters<typeof Navbar>[0]['t']} />
          <main className="flex-1">{children}</main>
          <Footer locale={locale} tagline={footer.tagline} rights={footer.rights} nav={nav} />
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
