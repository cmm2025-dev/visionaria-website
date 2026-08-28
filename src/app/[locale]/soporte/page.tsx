import { getTranslations } from 'next-intl/server';
import { BookOpen, TicketCheck, Users, Activity } from 'lucide-react';
import Link from 'next/link';
import SupportHeroCarousel from '@/components/SupportHeroCarousel';

export default async function SoportePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'support' });
  const c = await getTranslations({ locale, namespace: 'common' });

  const cards = [
    { icon: BookOpen, title: t('docs'), desc: t('docs_desc'), href: `/${locale}/soporte/documentos`, accent: '#F09422', iconBg: 'rgba(240,148,34,0.12)' },
    { icon: TicketCheck, title: t('ticket'), desc: t('ticket_desc'), href: `/${locale}/soporte/nuevo-ticket`, accent: '#3D8A82', iconBg: 'rgba(61,138,130,0.12)' },
    { icon: Users, title: t('community'), desc: t('community_desc'), href: `/${locale}/soporte/mesa-ayuda`, accent: '#C4A882', iconBg: 'rgba(196,168,130,0.12)' },
    { icon: Activity, title: t('status'), desc: t('status_desc'), href: `/${locale}/soporte/estado`, accent: '#34d399', iconBg: 'rgba(52,211,153,0.12)' },
  ];

  return (
    <div>
      <div className="text-white py-28 px-4 relative overflow-hidden" style={{ background: '#1E1B18' }}>
        <SupportHeroCarousel accent="#F09422" />
        <div className="max-w-7xl mx-auto relative">
          <h1 className="text-4xl font-extrabold">{t('title')}</h1>
          <p className="mt-3 text-lg text-slate-300 max-w-xl">{t('subtitle')}</p>
        </div>
      </div>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {cards.map(({ icon: Icon, title, desc, href, accent, iconBg }) => (
            <Link
              key={title}
              href={href}
              className="group rounded-2xl p-10 border flex items-start gap-6 transition-all hover:glow-cyan-sm"
              style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}
            >
              <div className="shrink-0 p-4 rounded-2xl" style={{ background: iconBg }}>
                <Icon size={28} style={{ color: accent }} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white transition-colors group-hover:text-[#F09422]">{title}</h3>
                <p className="mt-2 text-slate-400 leading-relaxed">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
