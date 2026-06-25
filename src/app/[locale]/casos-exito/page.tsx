import { getTranslations } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

const cases = [
  { company: 'RetailCorp', industry: 'Retail', result: '+40% eficiencia operacional', accent: '#F09422' },
  { company: 'FinBank', industry: 'Banca', result: '-60% tiempo de procesos', accent: '#a78bfa' },
  { company: 'LogisPro', industry: 'Logística', result: '+30% visibilidad en cadena de suministro', accent: '#3b82f6' },
  { company: 'HealthTech', industry: 'Salud', result: 'ISO 27001 en 6 meses', accent: '#34d399' },
  { company: 'EduLearn', industry: 'Educación', result: '3x más estudiantes activos', accent: '#fb923c' },
  { company: 'ManuCo', industry: 'Manufactura', result: '-25% costos de producción', accent: '#f43f5e' },
];

export default async function CasosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'cases' });

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {cases.map(({ company, industry, result, accent }) => (
            <div
              key={company}
              className="rounded-2xl overflow-hidden border transition-all hover:glow-cyan-sm"
              style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}
            >
              <div className="h-1" style={{ background: accent }} />
              <div className="p-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">{company}</h3>
                  <span className="text-xs font-medium px-3 py-1 rounded-full text-slate-300" style={{ background: 'rgba(255,255,255,0.08)' }}>{industry}</span>
                </div>
                <p className="text-sm text-slate-400 mb-1">{t('result')}</p>
                <p className="font-semibold" style={{ color: accent }}>{result}</p>
                <Link href={`/${locale}/contacto`} className="mt-6 inline-flex items-center gap-1 text-sm font-medium transition-colors hover:brightness-125" style={{ color: 'var(--accent)' }}>
                  {t('read_more')} <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
