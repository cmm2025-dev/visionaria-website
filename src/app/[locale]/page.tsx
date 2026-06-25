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
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-indigo-700 to-purple-700 text-white">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 lg:py-40 relative">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
              {t('hero_title')}
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-indigo-200 max-w-xl">
              {t('hero_subtitle')}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link
                href={`/${locale}/productos`}
                className="inline-flex items-center gap-2 bg-white text-indigo-700 font-semibold px-6 py-3 rounded-full shadow hover:bg-indigo-50 transition-colors"
              >
                {t('hero_cta')} <ArrowRight size={16} />
              </Link>
              <Link
                href={`/${locale}/casos-exito`}
                className="inline-flex items-center gap-2 border border-white/40 text-white font-semibold px-6 py-3 rounded-full hover:bg-white/10 transition-colors"
              >
                {t('hero_cta2')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {stats.map(({ value, label }) => (
            <div key={label}>
              <p className="text-4xl font-extrabold">{value}</p>
              <p className="mt-1 text-indigo-200 text-sm">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-14">{t('featured_title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col items-start gap-4 p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="p-3 bg-indigo-50 rounded-xl">
                <Icon size={24} className="text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
              <p className="text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{t('hero_title')}</h3>
            <p className="text-gray-500 mt-1">{t('hero_subtitle')}</p>
          </div>
          <Link
            href={`/${locale}/contacto`}
            className="shrink-0 inline-flex items-center gap-2 bg-indigo-700 text-white font-semibold px-7 py-3 rounded-full shadow hover:bg-indigo-800 transition-colors"
          >
            {n('contact')} <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </>
  );
}
