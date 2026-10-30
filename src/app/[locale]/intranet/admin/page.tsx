'use client';

import { useEffect, useState, use } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Save, CheckCircle2 } from 'lucide-react';
import IntranetLogin from '@/components/IntranetLogin';
import SupportHeroCarousel from '@/components/SupportHeroCarousel';

interface IntranetLink {
  id: string;
  label: string;
  url: string;
}

type PageStatus = 'loading' | 'unauthenticated' | 'forbidden' | 'error' | 'ready';

export default function IntranetAdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const t = useTranslations('intranet');
  const [links, setLinks] = useState<IntranetLink[]>([]);
  const [status, setStatus] = useState<PageStatus>('loading');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/intranet/status')
      .then(async res => {
        if (cancelled) return;
        if (res.status === 401) return setStatus('unauthenticated');
        if (!res.ok) return setStatus('error');
        const data = await res.json();
        if (!data.isAdmin) return setStatus('forbidden');
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

  const updateLink = (id: string, field: 'label' | 'url', value: string) => {
    setLinks(prev => prev.map(l => (l.id === id ? { ...l, [field]: value } : l)));
  };

  const removeLink = (id: string) => {
    setLinks(prev => prev.filter(l => l.id !== id));
  };

  const addLink = () => {
    setLinks(prev => [...prev, { id: `new-${Date.now()}`, label: '', url: '' }]);
  };

  const handleSave = async () => {
    setSaveState('saving');
    try {
      const res = await fetch('/api/intranet/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ links }),
      });
      if (!res.ok) throw new Error('save_failed');
      const data = await res.json();
      setLinks(data.links);
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
    } catch {
      setSaveState('error');
    }
  };

  return (
    <div>
      <div className="text-white py-16 px-4 relative overflow-hidden" style={{ background: '#1E1B18' }}>
        <SupportHeroCarousel accent="#F09422" />
        <div className="max-w-3xl mx-auto relative">
          <Link href={`/${locale}/intranet`} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-4">
            <ArrowLeft size={14} /> {t('back_to_intranet')}
          </Link>
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-2" style={{ color: '#F09422' }}>{t('admin_eyebrow')}</p>
          <h1 className="text-3xl font-extrabold">{t('admin_title')}</h1>
          <p className="mt-3 text-slate-300 max-w-xl">{t('admin_subtitle')}</p>
        </div>
      </div>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
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

        {status === 'forbidden' && (
          <div className="rounded-2xl p-10 border text-center" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
            <p style={{ color: '#ef4444' }}>{t('admin_forbidden')}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="rounded-2xl p-10 border text-center" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
            <p style={{ color: '#ef4444' }}>{t('error_generic')}</p>
          </div>
        )}

        {status === 'ready' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              {links.map(link => (
                <div
                  key={link.id}
                  className="rounded-xl p-5 border flex flex-col sm:flex-row gap-3 sm:items-center"
                  style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}
                >
                  <input
                    type="text"
                    value={link.label}
                    onChange={e => updateLink(link.id, 'label', e.target.value)}
                    placeholder={t('admin_label_placeholder')}
                    className="flex-1 rounded-lg px-3 py-2 border text-white text-sm"
                    style={{ background: 'var(--background)', borderColor: 'var(--border)' }}
                  />
                  <input
                    type="text"
                    value={link.url}
                    onChange={e => updateLink(link.id, 'url', e.target.value)}
                    placeholder={t('admin_url_placeholder')}
                    className="flex-1 rounded-lg px-3 py-2 border text-white text-sm"
                    style={{ background: 'var(--background)', borderColor: 'var(--border)' }}
                  />
                  <button
                    onClick={() => removeLink(link.id)}
                    className="inline-flex items-center justify-center rounded-lg p-2 text-slate-400 hover:text-red-400 transition-colors shrink-0"
                    aria-label={t('admin_remove')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={addLink}
              className="inline-flex items-center justify-center gap-2 rounded-xl p-4 border border-dashed text-sm font-semibold text-slate-400 hover:text-white transition-colors"
              style={{ borderColor: 'var(--border)' }}
            >
              <Plus size={16} /> {t('admin_add')}
            </button>

            <div className="flex items-center gap-4 pt-2">
              <button
                onClick={handleSave}
                disabled={saveState === 'saving'}
                className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-full transition-all disabled:opacity-50"
                style={{ background: '#F09422', color: '#1E1B18' }}
              >
                <Save size={16} />
                {saveState === 'saving' ? t('admin_saving') : t('admin_save')}
              </button>
              {saveState === 'saved' && (
                <span className="inline-flex items-center gap-1.5 text-sm" style={{ color: '#34d399' }}>
                  <CheckCircle2 size={16} /> {t('admin_saved')}
                </span>
              )}
              {saveState === 'error' && (
                <span className="text-sm" style={{ color: '#ef4444' }}>{t('admin_save_error')}</span>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
