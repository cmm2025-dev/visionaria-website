import { getTranslations } from 'next-intl/server';
import { BookOpen, TicketCheck, Users, Activity } from 'lucide-react';
import Link from 'next/link';

export default async function SoportePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'support' });

  const cards = [
    { icon: BookOpen, title: t('docs'), desc: t('docs_desc'), href: '#', accent: '#00d4ff', iconBg: 'rgba(0,212,255,0.12)' },
    { icon: TicketCheck, title: t('ticket'), desc: t('ticket_desc'), href: `/${locale}/contacto`, accent: '#a78bfa', iconBg: 'rgba(167,139,250,0.12)' },
    { icon: Users, title: t('community'), desc: t('community_desc'), href: '#', accent: '#3b82f6', iconBg: 'rgba(59,130,246,0.12)' },
    { icon: Activity, title: t('status'), desc: t('status_desc'), href: '#', accent: '#34d399', iconBg: 'rgba(52,211,153,0.12)' },
  ];

  return (
    <div>
      <div className="text-white py-20 px-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #060d2e 0%, #0a1545 100%)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: '#34d399' }} />
        <div className="max-w-7xl mx-auto relative">
          <h1 className="text-4xl font-extrabold">{t('title')}</h1>
          <p className="mt-3 text-lg text-slate-300">{t('subtitle')}</p>
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
                <h3 className="text-xl font-bold text-white transition-colors group-hover:text-[#00d4ff]">{title}</h3>
                <p className="mt-2 text-slate-400 leading-relaxed">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
