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
      <div className="text-white py-20 px-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #060d2e 0%, #0d1a5e 100%)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: 'var(--accent)' }} />
        <div className="max-w-7xl mx-auto relative">
          <h1 className="text-4xl font-extrabold">{t('title')}</h1>
          <p className="mt-3 text-lg text-slate-300">{t('subtitle')}</p>
        </div>
      </div>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Form */}
          <div className="rounded-2xl p-10 border" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
            <form className="flex flex-col gap-5">
              {[
                { id: 'name', label: t('name'), type: 'text' },
                { id: 'email', label: t('email'), type: 'email' },
                { id: 'company', label: t('company'), type: 'text' },
              ].map(({ id, label, type }) => (
                <div key={id} className="flex flex-col gap-1.5">
                  <label htmlFor={id} className="text-sm font-medium text-slate-300">{label}</label>
                  <input
                    id={id}
                    type={type}
                    className="rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 border"
                    style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'var(--border)', '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
                  />
                </div>
              ))}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="message" className="text-sm font-medium text-slate-300">{t('message')}</label>
                <textarea
                  id="message"
                  rows={5}
                  className="rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 border resize-none"
                  style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'var(--border)', '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
                />
              </div>
              <button
                type="submit"
                className="font-semibold py-3 rounded-xl transition-all mt-2 glow-cyan-sm hover:glow-cyan"
                style={{ background: 'var(--accent)', color: '#060d2e' }}
              >
                {t('send')}
              </button>
            </form>
          </div>

          {/* Info */}
          <div className="flex flex-col gap-8 justify-center">
            {info.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-5">
                <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,212,255,0.1)' }}>
                  <Icon size={20} style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">{label}</p>
                  <p className="text-white font-semibold mt-0.5">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
