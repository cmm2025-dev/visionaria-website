import { getTranslations } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

const cases = [
  {
    company: 'GORE Región Metropolitana',
    industry: 'Smart City',
    result: '303 cámaras · 23 comunas · Proyecto más grande en Chile',
    accent: '#F09422',
  },
  {
    company: 'Municipalidad de La Reina',
    industry: 'Televigilancia',
    result: '91 cámaras HD + pórticos LPR + reconocimiento facial PDI',
    accent: '#a78bfa',
  },
  {
    company: 'Ruta de La Araucanía',
    industry: 'Seguridad Vial',
    result: '71 cámaras térmicas militares + analítica antiterrorismo',
    accent: '#3b82f6',
  },
  {
    company: 'Codelco Salvador',
    industry: 'Minería',
    result: 'Plataforma unificada video-intrusión-acceso · enlaces 80km',
    accent: '#34d399',
  },
  {
    company: 'Santiago Smart City – Alameda',
    industry: 'Ciudad Inteligente',
    result: 'Integración multisistémica con Carabineros y UOCT',
    accent: '#fb923c',
  },
  {
    company: 'Red Municipal Chile',
    industry: 'Seguridad Pública',
    result: '+40 municipalidades · cobertura Arica a Punta Arenas',
    accent: '#f43f5e',
  },
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
                  <h3 className="text-lg font-bold text-white leading-snug">{company}</h3>
                  <span className="text-xs font-medium px-3 py-1 rounded-full text-slate-300 shrink-0 ml-2" style={{ background: 'rgba(255,255,255,0.08)' }}>{industry}</span>
                </div>
                <p className="text-sm text-slate-400 mb-1">{t('result')}</p>
                <p className="font-semibold text-sm leading-snug" style={{ color: accent }}>{result}</p>
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
