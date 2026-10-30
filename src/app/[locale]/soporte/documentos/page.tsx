'use client';

import { useEffect, useState, use } from 'react';
import { useTranslations } from 'next-intl';
import { FileText, PlayCircle, LogOut, ExternalLink } from 'lucide-react';
import MagicLinkLogin from '@/components/MagicLinkLogin';
import SupportHeroCarousel from '@/components/SupportHeroCarousel';

interface ClientDocument {
  id: string;
  name: string;
  url: string | null;
  system: string | null;
}

const VIDEO_HOST_OR_EXT = /dropbox\.com|youtube\.com|youtu\.be|vimeo\.com|\.(mp4|mov|webm|m4v)(\?|$)/i;

function isVideoLink(url: string | null): boolean {
  return !!url && VIDEO_HOST_OR_EXT.test(url);
}

export default function SupportDocumentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const t = useTranslations('supportDocs');
  const [clientName, setClientName] = useState<string | null>(null);
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [status, setStatus] = useState<'loading' | 'unauthenticated' | 'error' | 'no_account' | 'ready'>('loading');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/support/documents')
      .then(async res => {
        if (cancelled) return;
        if (res.status === 401) return setStatus('unauthenticated');
        if (res.status === 404) return setStatus('no_account');
        if (!res.ok) return setStatus('error');
        const data = await res.json();
        setClientName(data.clientName);
        setDocuments(data.documents);
        setStatus('ready');
      })
      .catch(() => !cancelled && setStatus('error'));
    return () => { cancelled = true; };
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/zoho/logout', { method: 'POST' });
    setStatus('unauthenticated');
    setDocuments([]);
    setClientName(null);
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
            <MagicLinkLogin
              locale={locale}
              next="documentos"
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

        {(status === 'error' || status === 'no_account') && (
          <div className="rounded-2xl p-10 border text-center flex flex-col items-center gap-6" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
            <p style={{ color: '#ef4444' }}>{status === 'error' ? t('error_generic') : t('error_no_account')}</p>
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
              <h2 className="text-2xl font-bold text-white">{clientName}</h2>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
              >
                <LogOut size={14} /> {t('logout')}
              </button>
            </div>

            {documents.length === 0 ? (
              <p className="text-slate-500 text-sm">{t('no_documents')}</p>
            ) : (
              <div className="flex flex-col gap-3">
                {documents.map(doc => {
                  const video = isVideoLink(doc.url);
                  return (
                    <a
                      key={doc.id}
                      href={doc.url ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl p-5 border flex items-center gap-4 transition-all hover:glow-cyan-sm"
                      style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}
                    >
                      <div className="shrink-0 p-3 rounded-xl" style={{ background: video ? 'rgba(61,138,130,0.12)' : 'rgba(240,148,34,0.12)' }}>
                        {video
                          ? <PlayCircle size={20} style={{ color: '#3D8A82' }} />
                          : <FileText size={20} style={{ color: '#F09422' }} />}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-semibold text-sm">{doc.name}</p>
                        {doc.system && <p className="text-xs text-slate-500 mt-0.5">{doc.system}</p>}
                      </div>
                      <ExternalLink size={16} className="text-slate-500 shrink-0" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
