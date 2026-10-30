import { getTranslations } from 'next-intl/server';

interface Institution { name: string; logo: string }
interface Testimonial { quote: string; name: string; role: string }

export default async function ClientesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'clients' });
  const c = await getTranslations({ locale, namespace: 'common' });

  const institutions = t.raw('institutions') as Institution[];
  const testimonials = t.raw('testimonials') as Testimonial[];

  return (
    <div style={{ background: '#1E1B18', minHeight: '100vh' }}>
      <div className="text-white py-20 px-4 relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #28221A 0%, #1E1B18 100%)' }}>
        <video
          autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ mixBlendMode: 'screen', filter: 'brightness(0.62)' }}
        >
          <source src="/clientes/nuble-sala-crisis.mp4" type="video/mp4" />
        </video>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: '#F09422' }} />
        <div className="max-w-7xl mx-auto relative">
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-4" style={{ color: '#F09422' }}>
            {t('eyebrow')}
          </p>
          <h1 className="text-4xl lg:text-5xl font-extrabold">{t('title')}</h1>
          <p className="mt-4 text-lg text-slate-300 max-w-2xl">
            {t('subtitle')}
          </p>
        </div>
      </div>

      {/* Caso de éxito — Chillán Viejo / GORE Ñuble */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-4">
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3" style={{ color: '#F09422' }}>{t('case_study_eyebrow')}</p>
          <h2 className="text-3xl font-extrabold text-white">{t('case_study_title')}</h2>
          <p className="mt-3 text-slate-400 max-w-2xl mx-auto">
            {t('case_study_desc')}
          </p>
          <p className="mt-2 text-xs text-slate-500">{t('case_study_source')}</p>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {testimonials.map(({ quote, name, role }) => (
            <blockquote
              key={name}
              className="rounded-2xl p-6 border flex flex-col gap-4"
              style={{ background: 'rgba(4,13,32,0.6)', borderColor: 'rgba(240,148,34,0.18)' }}
            >
              <p className="text-slate-200 text-sm leading-relaxed">&ldquo;{quote}&rdquo;</p>
              <footer className="mt-auto">
                <p className="text-sm font-bold text-white">{name}</p>
                <p className="text-xs text-slate-500">{role}</p>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      {/* Emblemas institucionales */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3" style={{ color: '#F09422' }}>{t('more_institutions_eyebrow')}</p>
          <h2 className="text-2xl font-extrabold text-white">{t('more_institutions_title')}</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
          {institutions.map(({ name, logo }) => (
            <div
              key={name}
              className="flex items-center justify-center p-6 transition-all hover:scale-[1.05]"
              style={{ minHeight: 120 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo} alt={name} title={name} className="max-h-16 max-w-full object-contain" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
