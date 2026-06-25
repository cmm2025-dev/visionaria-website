import { getTranslations } from 'next-intl/server';
import { ArrowRight, BarChart2, Link2, Shield, Layers } from 'lucide-react';
import Link from 'next/link';

export default async function ProductosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'products' });

  const products = [
    { icon: Layers, nameKey: 'p1_name', descKey: 'p1_desc', accent: '#F09422', iconBg: 'rgba(240,148,34,0.12)' },
    { icon: BarChart2, nameKey: 'p2_name', descKey: 'p2_desc', accent: '#a78bfa', iconBg: 'rgba(167,139,250,0.12)' },
    { icon: Link2, nameKey: 'p3_name', descKey: 'p3_desc', accent: '#3b82f6', iconBg: 'rgba(59,130,246,0.12)' },
    { icon: Shield, nameKey: 'p4_name', descKey: 'p4_desc', accent: '#34d399', iconBg: 'rgba(52,211,153,0.12)' },
  ] as const;

  return (
    <div>
      <div className="text-white py-20 px-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #060d2e 0%, #0d1a5e 100%)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: 'var(--accent)' }} />
        <div className="max-w-7xl mx-auto relative">
          <h1 className="text-4xl font-extrabold">{t('title')}</h1>
          <p className="mt-3 text-lg text-slate-300">{t('subtitle')}</p>
        </div>
      </div>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map(({ icon: Icon, nameKey, descKey, accent, iconBg }) => (
            <div
              key={nameKey}
              className="rounded-2xl p-8 border flex flex-col gap-5 transition-all hover:glow-cyan-sm"
              style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: iconBg }}>
                <Icon size={22} style={{ color: accent }} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{t(nameKey)}</h3>
                <p className="mt-2 text-slate-400 text-sm leading-relaxed">{t(descKey)}</p>
              </div>
              <Link href={`/${locale}/contacto`} className="mt-auto inline-flex items-center gap-1 text-sm font-medium transition-colors hover:brightness-125" style={{ color: 'var(--accent)' }}>
                {t('learn_more')} <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
