'use client';

import { useEffect, useState, use } from 'react';
import { useTranslations } from 'next-intl';
import { MessageCircle, LogOut } from 'lucide-react';
import MagicLinkLogin from '@/components/MagicLinkLogin';

const WHATSAPP_URL = 'https://wa.me/56229254140';

export default function MesaDeAyudaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const t = useTranslations('supportWhatsapp');
  const [status, setStatus] = useState<'loading' | 'unauthenticated' | 'ready'>('loading');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/support/status')
      .then(res => {
        if (cancelled) return;
        setStatus(res.status === 401 ? 'unauthenticated' : 'ready');
      })
      .catch(() => !cancelled && setStatus('unauthenticated'));
    return () => { cancelled = true; };
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/zoho/logout', { method: 'POST' });
    setStatus('unauthenticated');
  };

  return (
    <div>
      <div className="text-white py-20 px-4 relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #28221A 0%, #1E1B18 100%)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: '#C4A882' }} />
        <div className="max-w-3xl mx-auto relative">
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-2" style={{ color: '#C4A882' }}>{t('eyebrow')}</p>
          <h1 className="text-4xl font-extrabold">{t('title')}</h1>
          <p className="mt-3 text-lg text-slate-300 max-w-2xl">{t('subtitle')}</p>
        </div>
      </div>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {status === 'loading' && <p className="text-slate-400 text-center py-16">{t('loading')}</p>}

        {status === 'unauthenticated' && (
          <div className="rounded-2xl p-10 border text-center" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
            <MagicLinkLogin
              locale={locale}
              next="mesa-ayuda"
              labels={{
                description: t('login_desc'),
                placeholder: t('login_placeholder'),
                submit: t('login_cta'),
                submitting: t('login_submitting'),
                sentTitle: t('login_sent_title'),
                sentDesc: t('login_sent_desc'),
              }}
            />
          </div>
        )}

        {status === 'ready' && (
          <div className="rounded-2xl p-10 border text-center flex flex-col items-center gap-4" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
            <MessageCircle size={40} style={{ color: '#C4A882' }} />
            <h2 className="text-xl font-bold text-white">{t('ready_title')}</h2>
            <p className="text-slate-400 max-w-sm">{t('ready_desc')}</p>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-full transition-all"
              style={{ background: '#C4A882', color: '#1E1B18' }}
            >
              {t('open_whatsapp')}
            </a>
            <button
              onClick={handleLogout}
              className="mt-2 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <LogOut size={14} /> {t('logout')}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
