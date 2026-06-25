import { getTranslations } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

const cases = [
  { company: 'RetailCorp', industry: 'Retail', result: '+40% eficiencia operacional', color: 'bg-indigo-600' },
  { company: 'FinBank', industry: 'Banca', result: '-60% tiempo de procesos', color: 'bg-purple-600' },
  { company: 'LogisPro', industry: 'Logística', result: '+30% visibilidad en cadena de suministro', color: 'bg-blue-600' },
  { company: 'HealthTech', industry: 'Salud', result: 'ISO 27001 en 6 meses', color: 'bg-emerald-600' },
  { company: 'EduLearn', industry: 'Educación', result: '3x más estudiantes activos', color: 'bg-orange-500' },
  { company: 'ManuCo', industry: 'Manufactura', result: '-25% costos de producción', color: 'bg-rose-600' },
];

export default async function CasosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'cases' });

  return (
    <div>
      <div className="bg-gradient-to-r from-purple-900 to-indigo-700 text-white py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-extrabold">{t('title')}</h1>
          <p className="mt-3 text-indigo-200 text-lg">{t('subtitle')}</p>
        </div>
      </div>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {cases.map(({ company, industry, result, color }) => (
            <div key={company} className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className={`${color} h-2`} />
              <div className="p-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{company}</h3>
                  <span className="text-xs font-medium bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{industry}</span>
                </div>
                <p className="text-sm text-gray-500 mb-1">{t('result')}</p>
                <p className="text-indigo-700 font-semibold">{result}</p>
                <Link href={`/${locale}/contacto`} className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800">
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
