import { getTranslations } from 'next-intl/server';
import { FlaskConical, BrainCircuit, Cloud } from 'lucide-react';

export default async function InnovacionPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'innovation' });

  const pillars = [
    { icon: FlaskConical, title: t('rd_title'), desc: t('rd_desc'), bg: 'bg-indigo-50', color: 'text-indigo-600' },
    { icon: BrainCircuit, title: t('ai_title'), desc: t('ai_desc'), bg: 'bg-purple-50', color: 'text-purple-600' },
    { icon: Cloud, title: t('cloud_title'), desc: t('cloud_desc'), bg: 'bg-blue-50', color: 'text-blue-600' },
  ];

  return (
    <div>
      <div className="bg-gradient-to-r from-blue-900 to-indigo-700 text-white py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-extrabold">{t('title')}</h1>
          <p className="mt-3 text-blue-200 text-lg">{t('subtitle')}</p>
        </div>
      </div>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {pillars.map(({ icon: Icon, title, desc, bg, color }) => (
            <div key={title} className={`rounded-2xl p-10 ${bg} flex flex-col gap-5`}>
              <Icon size={36} className={color} />
              <h3 className="text-xl font-bold text-gray-900">{title}</h3>
              <p className="text-gray-600 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-20 bg-gradient-to-br from-indigo-900 to-purple-800 rounded-3xl p-10 text-white text-center">
          <p className="text-5xl font-extrabold">20%</p>
          <p className="mt-3 text-indigo-200 text-lg">{t('rd_desc')}</p>
        </div>
      </section>
    </div>
  );
}
