import { getTranslations } from 'next-intl/server';
import { ArrowRight, BarChart2, Link2, Shield, Layers } from 'lucide-react';
import Link from 'next/link';

export default async function ProductosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'products' });

  const products = [
    { icon: Layers, nameKey: 'p1_name', descKey: 'p1_desc', color: 'bg-indigo-50 text-indigo-600' },
    { icon: BarChart2, nameKey: 'p2_name', descKey: 'p2_desc', color: 'bg-purple-50 text-purple-600' },
    { icon: Link2, nameKey: 'p3_name', descKey: 'p3_desc', color: 'bg-blue-50 text-blue-600' },
    { icon: Shield, nameKey: 'p4_name', descKey: 'p4_desc', color: 'bg-emerald-50 text-emerald-600' },
  ] as const;

  return (
    <div>
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 text-white py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-extrabold">{t('title')}</h1>
          <p className="mt-3 text-indigo-200 text-lg">{t('subtitle')}</p>
        </div>
      </div>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map(({ icon: Icon, nameKey, descKey, color }) => (
            <div key={nameKey} className="border border-gray-100 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-5">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                <Icon size={22} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{t(nameKey)}</h3>
                <p className="mt-2 text-gray-500 text-sm leading-relaxed">{t(descKey)}</p>
              </div>
              <Link href={`/${locale}/contacto`} className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800">
                {t('learn_more')} <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
