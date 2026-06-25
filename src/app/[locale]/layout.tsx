import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { notFound } from 'next/navigation';
import { getMessages } from 'next-intl/server';
import '../globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });

export const metadata: Metadata = {
  title: 'Visionaria',
  description: 'Tecnología que transforma el futuro',
};

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
        <Navbar locale={locale} t={nav as Parameters<typeof Navbar>[0]['t']} />
        <main className="flex-1">{children}</main>
        <Footer locale={locale} tagline={footer.tagline} rights={footer.rights} nav={nav} />
      </body>
    </html>
  );
}
