import { getTranslations } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

const newsItems = [
  { date: '2025-06-10', tag: 'Producto', title: 'Visionaria lanza Analytics 3.0 con IA generativa integrada', excerpt: 'La nueva versión incorpora modelos de lenguaje para análisis predictivo automático.' },
  { date: '2025-05-28', tag: 'Empresa', title: 'Visionaria cierra ronda Serie B por USD 15M', excerpt: 'Los fondos impulsarán la expansión en Latinoamérica y el desarrollo de nuevos productos.' },
  { date: '2025-05-15', tag: 'Evento', title: 'Visionaria Summit 2025: más de 800 asistentes', excerpt: 'La conferencia anual reunió a líderes tecnológicos y clientes de toda la región.' },
  { date: '2025-04-30', tag: 'Partner', title: 'Alianza estratégica con Microsoft Azure', excerpt: 'Visionaria se convierte en partner certificado de Microsoft, ampliando las integraciones cloud.' },
  { date: '2025-04-10', tag: 'Producto', title: 'Nuevo módulo de Soporte Predictivo en Visionaria Shield', excerpt: 'Detecta vulnerabilidades antes de que sean explotadas usando análisis conductual.' },
  { date: '2025-03-20', tag: 'Empresa', title: 'Visionaria nombrada entre las 50 startups más innovadoras de LATAM', excerpt: 'Reconocimiento otorgado por la revista TechLatam en su edición anual.' },
];

const tagStyles: Record<string, { color: string; bg: string }> = {
  Producto: { color: '#F09422', bg: 'rgba(240,148,34,0.12)' },
  Empresa: { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  Evento: { color: '#fb923c', bg: 'rgba(251,146,60,0.12)' },
  Partner: { color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
};
const defaultTag = { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' };

export default async function NoticiasPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'news' });

  return (
    <div>
      <div className="text-white py-20 px-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #060d2e 0%, #0a1545 100%)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: 'var(--accent)' }} />
        <div className="max-w-7xl mx-auto relative">
          <h1 className="text-4xl font-extrabold">{t('title')}</h1>
          <p className="mt-3 text-lg text-slate-300">{t('subtitle')}</p>
        </div>
      </div>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {newsItems.map(({ date, tag, title, excerpt }) => {
            const style = tagStyles[tag] ?? defaultTag;
            return (
              <article
                key={title}
                className="rounded-2xl p-7 border flex flex-col gap-4 transition-all hover:glow-cyan-sm"
                style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ color: style.color, background: style.bg }}>{tag}</span>
                  <time className="text-xs text-slate-500">{date}</time>
                </div>
                <h3 className="text-lg font-bold text-white leading-snug">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed flex-1">{excerpt}</p>
                <Link href="#" className="inline-flex items-center gap-1 text-sm font-medium transition-colors hover:brightness-125" style={{ color: 'var(--accent)' }}>
                  {t('read_more')} <ArrowRight size={14} />
                </Link>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
