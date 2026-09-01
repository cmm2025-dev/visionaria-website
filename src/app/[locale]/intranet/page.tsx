'use client';

import { useEffect, useState, use } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { FileText, LogOut, ExternalLink, LayoutGrid, Pencil } from 'lucide-react';
import IntranetLogin from '@/components/IntranetLogin';
import SupportHeroCarousel from '@/components/SupportHeroCarousel';

interface IntranetLink {
  id: string;
  label: string;
  url: string;
}

export default function IntranetPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const t = useTranslations('intranet');
  const [email, setEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [links, setLinks] = useState<IntranetLink[]>([]);
  const [status, setStatus] = useState<'loading' | 'unauthenticated' | 'error' | 'ready'>('loading');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/intranet/status')
      .then(async res => {
        if (cancelled) return;
        if (res.status === 401) return setStatus('unauthenticated');
        if (!res.ok) return setStatus('error');
        const data = await res.json();
        setEmail(data.email);
        setIsAdmin(!!data.isAdmin);
        const linksRes = await fetch('/api/intranet/content');
        if (cancelled) return;
        if (!linksRes.ok) return setStatus('error');
        const linksData = await linksRes.json();
        setLinks(linksData.links);
        setStatus('ready');
      })
      .catch(() => !cancelled && setStatus('error'));
    return () => { cancelled = true; };
  }, []);

  const handleLogout = async () => {
    await fetch('/api/intranet/auth/logout', { method: 'POST' });
    setStatus('unauthenticated');
    setEmail(null);
  };

  return (
    <div>
      <div className="text-white py-20 px-4 relative overflow-hidden" style={{ background: '#1E1B18' }}>
        <SupportHeroCarousel accent="#F09422" />
        <div className="max-w-5xl mx-auto relative">
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-2" style={{ color: '#F09422' }}>{t('eyebrow')}</p>
          <h1 className="text-4xl font-extrabold">{t('title')}</h1>
          <p className="mt-3 text-lg text-slate-300 max-w-2xl">{t('subtitle')}</p>
        </div>
      </div>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {status === 'loading' && (
          <p className="text-slate-400 text-center py-16">{t('loading')}</p>
        )}

        {status === 'unauthenticated' && (
          <div className="rounded-2xl p-10 border text-center" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
            <IntranetLogin
              locale={locale}
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

        {status === 'error' && (
          <div className="rounded-2xl p-10 border text-center flex flex-col items-center gap-6" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
            <p style={{ color: '#ef4444' }}>{t('error_generic')}</p>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
            >
              <LogOut size={14} /> {t('logout')}
            </button>
          </div>
        )}

        {status === 'ready' && (
          <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <LayoutGrid size={22} style={{ color: '#F09422' }} />
                {t('welcome', { email: email ?? '' })}
              </h2>
              <div className="flex items-center gap-4">
                {isAdmin && (
                  <Link
                    href={`/${locale}/intranet/admin`}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
                    style={{ color: '#F09422' }}
                  >
                    <Pencil size={14} /> {t('edit_content')}
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  <LogOut size={14} /> {t('logout')}
                </button>
              </div>
            </div>

            {links.length === 0 ? (
              <p className="text-slate-500 text-sm">{t('no_links')}</p>
            ) : (
              <div className="flex flex-col gap-3">
                {links.map(link => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl p-5 border flex items-center gap-4 transition-all hover:glow-cyan-sm"
                    style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}
                  >
                    <div className="shrink-0 p-3 rounded-xl" style={{ background: 'rgba(240,148,34,0.12)' }}>
                      <FileText size={20} style={{ color: '#F09422' }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-semibold text-sm">{link.label}</p>
                    </div>
                    <ExternalLink size={16} className="text-slate-500 shrink-0" />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
