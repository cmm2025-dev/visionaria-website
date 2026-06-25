import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { ArrowRight, Zap, HeadphonesIcon, TrendingUp } from 'lucide-react';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  const n = await getTranslations({ locale, namespace: 'nav' });

  const stats = [
    { value: '500+', label: t('stats_clients') },
    { value: '1.200+', label: t('stats_projects') },
    { value: '18', label: t('stats_countries') },
    { value: '10+', label: t('stats_years') },
  ];

  const features = [
    { icon: Zap, title: t('featured_innovation'), desc: t('featured_innovation_desc') },
    { icon: HeadphonesIcon, title: t('featured_support'), desc: t('featured_support_desc') },
    { icon: TrendingUp, title: t('featured_results'), desc: t('featured_results_desc') },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden text-white" style={{ background: 'linear-gradient(135deg, #060d2e 0%, #0a1545 50%, #0d1a5e 100%)' }}>
        {/* Decorative glowing orbs */}
        <div className="absolute top-20 right-20 w-72 h-72 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: 'var(--accent)' }} />
        <div className="absolute bottom-0 left-10 w-48 h-48 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: '#3b82f6' }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 lg:py-40 relative">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-white">
              {t('hero_title')}
            </h1>
            <p className="mt-6 text-lg sm:text-xl max-w-xl text-slate-300">
              {t('hero_subtitle')}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link
                href={`/${locale}/productos`}
                className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-full shadow-lg transition-all glow-cyan-sm hover:glow-cyan"
                style={{ background: 'var(--accent)', color: '#060d2e' }}
              >
                {t('hero_cta')} <ArrowRight size={16} />
              </Link>
              <Link
                href={`/${locale}/casos-exito`}
                className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-full transition-colors text-white border hover:bg-white/5"
                style={{ borderColor: 'var(--border)' }}
              >
                {t('hero_cta2')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b" style={{ background: 'rgba(0,212,255,0.05)', borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {stats.map(({ value, label }) => (
            <div key={label}>
              <p className="text-4xl font-extrabold text-glow-cyan" style={{ color: 'var(--accent)' }}>{value}</p>
              <p className="mt-1 text-slate-400 text-sm">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <h2 className="text-3xl font-bold text-center text-white mb-14">{t('featured_title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex flex-col items-start gap-4 p-8 rounded-2xl border transition-all hover:glow-cyan-sm"
              style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}
            >
              <div className="p-3 rounded-xl" style={{ background: 'rgba(0,212,255,0.1)' }}>
                <Icon size={24} style={{ color: 'var(--accent)' }} />
              </div>
              <h3 className="text-xl font-semibold text-white">{title}</h3>
              <p className="text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="border-t border-b" style={{ background: 'rgba(0,212,255,0.04)', borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold text-white">{t('hero_title')}</h3>
            <p className="text-slate-400 mt-1">{t('hero_subtitle')}</p>
          </div>
          <Link
            href={`/${locale}/contacto`}
            className="shrink-0 inline-flex items-center gap-2 font-semibold px-7 py-3 rounded-full shadow-lg transition-all glow-cyan-sm hover:glow-cyan"
            style={{ background: 'var(--accent)', color: '#060d2e' }}
          >
            {n('contact')} <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </>
  );
}
