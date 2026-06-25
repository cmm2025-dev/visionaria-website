import { getTranslations } from 'next-intl/server';
import { BookOpen, TicketCheck, Users, Activity } from 'lucide-react';
import Link from 'next/link';

export default async function SoportePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'support' });

  const cards = [
    { icon: BookOpen, title: t('docs'), desc: t('docs_desc'), href: '#', color: 'bg-indigo-50 text-indigo-600' },
    { icon: TicketCheck, title: t('ticket'), desc: t('ticket_desc'), href: `/${locale}/contacto`, color: 'bg-purple-50 text-purple-600' },
    { icon: Users, title: t('community'), desc: t('community_desc'), href: '#', color: 'bg-blue-50 text-blue-600' },
    { icon: Activity, title: t('status'), desc: t('status_desc'), href: '#', color: 'bg-emerald-50 text-emerald-600' },
  ];

  return (
    <div>
      <div className="bg-gradient-to-r from-emerald-900 to-indigo-800 text-white py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-extrabold">{t('title')}</h1>
          <p className="mt-3 text-emerald-200 text-lg">{t('subtitle')}</p>
        </div>
      </div>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {cards.map(({ icon: Icon, title, desc, href, color }) => (
            <Link key={title} href={href} className="group border border-gray-100 rounded-2xl p-10 shadow-sm hover:shadow-md transition-shadow flex items-start gap-6">
              <div className={`shrink-0 p-4 rounded-2xl ${color}`}>
                <Icon size={28} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">{title}</h3>
                <p className="mt-2 text-gray-500 leading-relaxed">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
