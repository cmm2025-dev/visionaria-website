import { getTranslations } from 'next-intl/server';
import { FlaskConical, BrainCircuit, Cloud } from 'lucide-react';

export default async function InnovacionPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'innovation' });

  const pillars = [
    { icon: FlaskConical, title: t('rd_title'), desc: t('rd_desc'), accent: '#00d4ff', iconBg: 'rgba(0,212,255,0.12)' },
    { icon: BrainCircuit, title: t('ai_title'), desc: t('ai_desc'), accent: '#a78bfa', iconBg: 'rgba(167,139,250,0.12)' },
    { icon: Cloud, title: t('cloud_title'), desc: t('cloud_desc'), accent: '#3b82f6', iconBg: 'rgba(59,130,246,0.12)' },
  ];

  return (
    <div>
      <div className="text-white py-20 px-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #060d2e 0%, #0a1545 100%)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: '#3b82f6' }} />
        <div className="max-w-7xl mx-auto relative">
          <h1 className="text-4xl font-extrabold">{t('title')}</h1>
          <p className="mt-3 text-lg text-slate-300">{t('subtitle')}</p>
        </div>
      </div>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {pillars.map(({ icon: Icon, title, desc, accent, iconBg }) => (
            <div
              key={title}
              className="rounded-2xl p-10 border flex flex-col gap-5 transition-all hover:glow-cyan-sm"
              style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}
            >
              <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: iconBg }}>
                <Icon size={28} style={{ color: accent }} />
              </div>
              <h3 className="text-xl font-bold text-white">{title}</h3>
              <p className="text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-20 rounded-3xl p-10 text-white text-center border glow-cyan-sm" style={{ background: 'linear-gradient(135deg, #0d1a5e 0%, #1e1065 100%)', borderColor: 'rgba(0,212,255,0.2)' }}>
          <p className="text-5xl font-extrabold text-glow-cyan" style={{ color: 'var(--accent)' }}>20%</p>
          <p className="mt-3 text-lg text-slate-300">{t('rd_desc')}</p>
        </div>
      </section>
    </div>
  );
}
