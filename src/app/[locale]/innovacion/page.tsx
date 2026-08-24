import { getTranslations } from 'next-intl/server';
import { FlaskConical, BrainCircuit, Cloud } from 'lucide-react';
import Link from 'next/link';

export default async function InnovacionPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'innovation' });
  const c = await getTranslations({ locale, namespace: 'common' });

  const pillars = [
    { icon: FlaskConical, title: t('rd_title'), desc: t('rd_desc'), accent: '#F09422', iconBg: 'rgba(240,148,34,0.12)', href: null },
    { icon: BrainCircuit, title: t('ai_title'), desc: t('ai_desc'), accent: '#a78bfa', iconBg: 'rgba(167,139,250,0.12)', href: `/${locale}/innovacion/smart-cities` },
    { icon: Cloud, title: t('cloud_title'), desc: t('cloud_desc'), accent: '#C4A882', iconBg: 'rgba(196,168,130,0.12)', href: null },
  ];

  return (
    <div>
      <div className="text-white py-20 px-4 relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #1E2820 0%, #1E1B18 60%, #1E2018 100%)', borderLeft: '4px solid var(--teal)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: 'var(--teal)' }} />
        <div className="max-w-7xl mx-auto relative">
          <h1 className="text-4xl font-extrabold">{t('title')}</h1>
          <p className="mt-3 text-lg text-slate-300">{t('subtitle')}</p>
        </div>
      </div>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {pillars.map(({ icon: Icon, title, desc, accent, iconBg, href }) => {
            const card = (
              <div
                className={`rounded-2xl p-10 border flex flex-col gap-5 transition-all hover:glow-cyan-sm h-full ${href ? 'cursor-pointer' : ''}`}
                style={{ background: 'var(--card-bg)', borderColor: href ? accent + '40' : 'var(--border)' }}
              >
                <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: iconBg }}>
                  <Icon size={28} style={{ color: accent }} />
                </div>
                <h3 className="text-xl font-bold text-white">{title}</h3>
                <p className="text-slate-400 leading-relaxed">{desc}</p>
                {href && (
                  <p className="text-sm font-semibold mt-auto" style={{ color: accent }}>
                    {t('learn_more')}
                  </p>
                )}
              </div>
            );
            return href
              ? <Link key={title} href={href} className="block">{card}</Link>
              : <div key={title}>{card}</div>;
          })}
        </div>

        <div className="mt-20 rounded-3xl p-10 text-white text-center border glow-cyan-sm" style={{ background: 'linear-gradient(135deg, #282018 0%, #1E1B18 100%)', borderColor: 'rgba(240,148,34,0.2)' }}>
          <p className="text-5xl font-extrabold text-glow-cyan" style={{ color: 'var(--accent)' }}>20%</p>
          <p className="mt-3 text-lg text-slate-300">{t('rd_desc')}</p>
        </div>
      </section>
    </div>
  );
}
