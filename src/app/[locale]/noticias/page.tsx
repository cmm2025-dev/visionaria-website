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

const tagColors: Record<string, string> = {
  Producto: 'bg-indigo-100 text-indigo-700',
  Empresa: 'bg-purple-100 text-purple-700',
  Evento: 'bg-orange-100 text-orange-700',
  Partner: 'bg-emerald-100 text-emerald-700',
};

export default async function NoticiasPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'news' });

  return (
    <div>
      <div className="bg-gradient-to-r from-gray-900 to-indigo-900 text-white py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-extrabold">{t('title')}</h1>
          <p className="mt-3 text-gray-300 text-lg">{t('subtitle')}</p>
        </div>
      </div>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {newsItems.map(({ date, tag, title, excerpt }) => (
            <article key={title} className="border border-gray-100 rounded-2xl p-7 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${tagColors[tag] ?? 'bg-gray-100 text-gray-700'}`}>{tag}</span>
                <time className="text-xs text-gray-400">{date}</time>
              </div>
              <h3 className="text-lg font-bold text-gray-900 leading-snug">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed flex-1">{excerpt}</p>
              <Link href="#" className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800">
                {t('read_more')} <ArrowRight size={14} />
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
