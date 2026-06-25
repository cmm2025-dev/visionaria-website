import { getTranslations } from 'next-intl/server';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';

export default async function ContactoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });

  const info = [
    { icon: Phone, label: t('phone_title'), value: '+56 2 2345 6789' },
    { icon: Mail, label: t('email_title'), value: 'contacto@visionaria.cl' },
    { icon: MapPin, label: t('address_title'), value: 'Av. Apoquindo 4700, Las Condes, Santiago' },
    { icon: Clock, label: t('hours_title'), value: t('hours_value') },
  ];

  return (
    <div>
      <div className="bg-gradient-to-r from-indigo-900 to-purple-800 text-white py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-extrabold">{t('title')}</h1>
          <p className="mt-3 text-indigo-200 text-lg">{t('subtitle')}</p>
        </div>
      </div>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Form */}
          <div className="bg-gray-50 rounded-2xl p-10 border border-gray-100">
            <form className="flex flex-col gap-5">
              {[
                { id: 'name', label: t('name'), type: 'text' },
                { id: 'email', label: t('email'), type: 'email' },
                { id: 'company', label: t('company'), type: 'text' },
              ].map(({ id, label, type }) => (
                <div key={id} className="flex flex-col gap-1.5">
                  <label htmlFor={id} className="text-sm font-medium text-gray-700">{label}</label>
                  <input
                    id={id}
                    type={type}
                    className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              ))}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="message" className="text-sm font-medium text-gray-700">{t('message')}</label>
                <textarea
                  id="message"
                  rows={5}
                  className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white resize-none"
                />
              </div>
              <button
                type="submit"
                className="bg-indigo-700 text-white font-semibold py-3 rounded-xl hover:bg-indigo-800 transition-colors mt-2"
              >
                {t('send')}
              </button>
            </form>
          </div>

          {/* Info */}
          <div className="flex flex-col gap-8 justify-center">
            {info.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-5">
                <div className="shrink-0 w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <Icon size={20} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{label}</p>
                  <p className="text-gray-900 font-semibold mt-0.5">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
