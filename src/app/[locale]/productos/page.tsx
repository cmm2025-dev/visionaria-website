import { getTranslations } from 'next-intl/server';
import { ArrowRight, BarChart2, Link2, Plane, Layers } from 'lucide-react';
import Link from 'next/link';

export default async function ProductosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'products' });

  const products = [
    { icon: Layers, nameKey: 'p1_name', descKey: 'p1_desc', accent: '#F09422', iconBg: 'rgba(240,148,34,0.12)', href: null },
    { icon: BarChart2, nameKey: 'p2_name', descKey: 'p2_desc', accent: '#3D8A82', iconBg: 'rgba(61,138,130,0.12)', href: `/${locale}/productos/cad-psim` },
    { icon: Link2, nameKey: 'p3_name', descKey: 'p3_desc', accent: '#C4A882', iconBg: 'rgba(196,168,130,0.12)', href: `/${locale}/productos/lpr` },
    { icon: Plane, nameKey: 'p4_name', descKey: 'p4_desc', accent: '#34d399', iconBg: 'rgba(52,211,153,0.12)', href: `/${locale}/productos/dafr` },
  ] as const;

  return (
    <div>
      {/* Hero con video de fondo */}
      <div className="relative overflow-hidden text-white" style={{ minHeight: '52vh' }}>
        {/* Video */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ zIndex: 0 }}
        >
          <source src="/soluciones-hero-bg.mp4" type="video/mp4" />
          <source src="/hero-bg.mp4" type="video/mp4" />
        </video>

        {/* Overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 1,
            background: 'linear-gradient(135deg, rgba(20,16,12,0.88) 0%, rgba(20,16,12,0.65) 55%, rgba(20,16,12,0.45) 100%)',
          }}
        />

        {/* Acento izquierdo */}
        <div className="absolute left-0 top-0 bottom-0 w-1 pointer-events-none" style={{ zIndex: 2, background: 'var(--accent)' }} />

        {/* Orbe decorativo */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ zIndex: 1, background: 'var(--accent)' }} />

        {/* Contenido */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative" style={{ zIndex: 2 }}>
          <h1
            className="text-4xl sm:text-5xl font-extrabold text-white"
            style={{ textShadow: '0 2px 16px rgba(0,0,0,0.8)' }}
          >
            {t('title')}
          </h1>
          <p
            className="mt-3 text-lg text-slate-300 max-w-xl"
            style={{ textShadow: '0 1px 8px rgba(0,0,0,0.7)' }}
          >
            {t('subtitle')}
          </p>
        </div>
      </div>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map(({ icon: Icon, nameKey, descKey, accent, iconBg, href }) => (
            <Link
              key={nameKey}
              href={href ?? `/${locale}/contacto`}
              className="rounded-2xl p-8 border flex flex-col gap-5 transition-all hover:glow-cyan-sm hover:scale-[1.02] cursor-pointer group"
              style={{ background: 'var(--card-bg)', borderColor: href ? `${accent}40` : 'var(--border)' }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: iconBg }}>
                <Icon size={22} style={{ color: accent }} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">{t(nameKey)}</h3>
                <p className="mt-2 text-slate-400 text-sm leading-relaxed">{t(descKey)}</p>
              </div>
              <div className="mt-auto inline-flex items-center gap-1 text-sm font-semibold transition-all group-hover:gap-2" style={{ color: accent }}>
                {t('learn_more')} <ArrowRight size={14} />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
