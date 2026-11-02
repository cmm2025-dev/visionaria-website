'use client';

import { useEffect, useState, use } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ArrowLeft, BarChart3, Camera, ChevronRight, ExternalLink, FileText, LogOut, ShieldCheck } from 'lucide-react';
import IntranetLogin from '@/components/IntranetLogin';
import SupportHeroCarousel from '@/components/SupportHeroCarousel';
import type { ProjectView } from '@/lib/projects';

const MODULE_ICON: Record<string, typeof FileText> = { evidencias: Camera, panel: BarChart3 };

export default function ProjectPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = use(params);
  const t = useTranslations('intranet');
  const [project, setProject] = useState<ProjectView | null>(null);
  const [status, setStatus] = useState<'loading' | 'unauthenticated' | 'forbidden' | 'error' | 'ready'>('loading');

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/intranet/status?locale=${locale}`)
      .then(async res => {
        if (cancelled) return;
        if (res.status === 401) return setStatus('unauthenticated');
        if (!res.ok) return setStatus('error');
        const data = await res.json();
        // Unknown and not-allowed look the same, so the page doesn't reveal which projects exist.
        const found = (data.projects as ProjectView[] | undefined)?.find(p => p.slug === slug) ?? null;
        setProject(found);
        setStatus(found ? 'ready' : 'forbidden');
      })
      .catch(() => !cancelled && setStatus('error'));
    return () => { cancelled = true; };
  }, [locale, slug]);

  const handleLogout = async () => {
    await fetch('/api/intranet/auth/logout', { method: 'POST' });
    setStatus('unauthenticated');
    setProject(null);
  };

  const card = { background: 'var(--card-bg)', borderColor: 'var(--border)' };

  return (
    <div>
      <div className="text-white py-16 px-4 relative overflow-hidden" style={{ background: '#1E1B18' }}>
        <SupportHeroCarousel accent="#F09422" />
        <div className="max-w-5xl mx-auto relative">
          <Link href={`/${locale}/intranet`} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white">
            <ArrowLeft size={14} /> {t('back_to_intranet')}
          </Link>
          <p className="text-xs font-bold tracking-[0.3em] uppercase mt-6 mb-2" style={{ color: '#F09422' }}>
            {t('project_eyebrow')}{project ? ` · ${project.code}` : ''}
          </p>
          <h1 className="text-4xl font-extrabold">{project?.name ?? t('project_title_fallback')}</h1>
          {project && (
            <>
              <p className="mt-3 text-lg text-slate-300">{project.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full px-3 py-1 font-semibold" style={{ background: 'rgba(240,148,34,0.15)', color: '#F09422' }}>
                  {project.status}
                </span>
                {project.details.map(d => (
                  <span key={d} className="rounded-full px-3 py-1 text-slate-300 border" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>{d}</span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {status === 'loading' && <p className="text-slate-400 text-center py-16">{t('loading')}</p>}

        {status === 'unauthenticated' && (
          <div className="rounded-2xl p-10 border text-center" style={card}>
            <IntranetLogin
              locale={locale}
              next={`/${locale}/intranet/proyectos/${slug}`}
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
          <div className="rounded-2xl p-10 border text-center flex flex-col items-center gap-4" style={card}>
            <p className="text-slate-300">{t('project_forbidden')}</p>
            <Link href={`/${locale}/intranet`} className="text-sm font-semibold" style={{ color: '#F09422' }}>{t('back_to_intranet')}</Link>
          </div>
        )}

        {status === 'error' && (
          <div className="rounded-2xl p-10 border text-center" style={card}>
            <p style={{ color: '#ef4444' }}>{t('error_generic')}</p>
          </div>
        )}

        {status === 'ready' && project && (
          <div className="flex flex-col gap-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-slate-400 inline-flex items-center gap-2">
                <ShieldCheck size={16} style={{ color: '#F09422' }} />
                {t('project_access')}: <span className="text-white font-semibold">{project.roles.map(r => r.label).join(' · ')}</span>
              </p>
              <button onClick={handleLogout} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
                <LogOut size={14} /> {t('logout')}
              </button>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white">{t('project_tools')}</h2>
              <p className="text-slate-500 text-sm mt-1">{t('project_tools_desc')}</p>
            </div>

            {project.modules.length === 0 ? (
              <p className="text-slate-500 text-sm">{t('project_no_modules')}</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {project.modules.map(m => {
                  const Icon = MODULE_ICON[m.id] ?? FileText;
                  const body = (
                    <>
                      <div className="shrink-0 p-3 rounded-xl self-start" style={{ background: 'rgba(240,148,34,0.12)' }}>
                        <Icon size={22} style={{ color: '#F09422' }} />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-semibold">{m.title}</p>
                        <p className="text-slate-400 text-sm mt-1">{m.description}</p>
                      </div>
                      {m.standalone
                        ? <ExternalLink size={16} className="text-slate-500 shrink-0 self-center" />
                        : <ChevronRight size={16} className="text-slate-500 shrink-0 self-center" />}
                    </>
                  );
                  const className = 'rounded-xl p-6 border flex gap-4 transition-all hover:glow-cyan-sm h-full';
                  return m.standalone ? (
                    // A standalone HTML app served by a route handler: it needs a real navigation, not client routing.
                    <a key={m.id} href={m.href} className={className} style={card}>{body}</a>
                  ) : (
                    <Link key={m.id} href={m.href} className={className} style={card}>{body}</Link>
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
