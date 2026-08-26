'use client';

import { useEffect, useState, use } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, CheckCircle2, LogOut, ShieldAlert } from 'lucide-react';

interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string | null;
  isOverdue: boolean;
}

interface Snapshot {
  clientName: string;
  semaphore: 'green' | 'yellow' | 'red';
  activeCount: number;
  highPriorityCount: number;
  nearSlaCount: number;
  overdueCount: number;
  updatedAt: string;
  tickets: Ticket[];
  isMultiAccount?: boolean;
  accounts?: (Snapshot & { accountId: string })[];
}

const SEMAPHORE_STYLE = {
  green: { color: '#34d399', bg: 'rgba(52,211,153,0.12)', Icon: CheckCircle2 },
  yellow: { color: '#F09422', bg: 'rgba(240,148,34,0.12)', Icon: AlertTriangle },
  red: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', Icon: ShieldAlert },
} as const;

const PRIORITY_COLOR: Record<string, string> = {
  low: '#3D8A82',
  medium: '#F09422',
  high: '#ef4444',
  urgent: '#ef4444',
};

function formatRemaining(dueDate: string | null, locale: string): string | null {
  if (!dueDate) return null;
  const diffMs = new Date(dueDate).getTime() - Date.now();
  if (diffMs <= 0) return null;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return locale === 'en' ? `${hours}h ${minutes}m` : `${hours} h ${minutes} min`;
}

export default function SupportStatusPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const t = useTranslations('supportStatus');
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [status, setStatus] = useState<'loading' | 'unauthenticated' | 'error' | 'no_account' | 'ready'>('loading');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/support/status')
      .then(async res => {
        if (cancelled) return;
        if (res.status === 401) return setStatus('unauthenticated');
        if (res.status === 404) return setStatus('no_account');
        if (!res.ok) return setStatus('error');
        const data = await res.json();
        setSnapshot(data);
        setStatus('ready');
      })
      .catch(() => !cancelled && setStatus('error'));
    return () => { cancelled = true; };
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/zoho/logout', { method: 'POST' });
    setStatus('unauthenticated');
    setSnapshot(null);
  };

  return (
    <div>
      <div className="text-white py-20 px-4 relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #28221A 0%, #1E1B18 100%)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: '#34d399' }} />
        <div className="max-w-5xl mx-auto relative">
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-2" style={{ color: '#34d399' }}>{t('eyebrow')}</p>
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
            <p className="text-slate-400 mb-6">{t('login_desc')}</p>
            <a
              href={`/api/auth/zoho/login?locale=${locale}`}
              className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-full transition-all"
              style={{ background: '#F09422', color: '#1E1B18' }}
            >
              {t('login_cta')}
            </a>
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

        {status === 'ready' && snapshot && (
          <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">{snapshot.clientName}</h2>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
              >
                <LogOut size={14} /> {t('logout')}
              </button>
            </div>

            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--card-bg)' }}>
              <div className="px-8 py-6 flex items-center gap-4" style={{ background: SEMAPHORE_STYLE[snapshot.semaphore].bg }}>
                {(() => { const Icon = SEMAPHORE_STYLE[snapshot.semaphore].Icon; return <Icon size={28} style={{ color: SEMAPHORE_STYLE[snapshot.semaphore].color }} />; })()}
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>{t('section_title')}</p>
                  <p className="text-lg font-bold" style={{ color: SEMAPHORE_STYLE[snapshot.semaphore].color }}>
                    {t(`status_${snapshot.semaphore}`)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x" style={{ borderColor: 'var(--border)' }}>
                {[
                  { label: t('active'), value: snapshot.activeCount },
                  { label: t('high_priority'), value: snapshot.highPriorityCount },
                  { label: t('near_sla'), value: snapshot.nearSlaCount },
                  { label: t('overdue'), value: snapshot.overdueCount },
                ].map(({ label, value }) => (
                  <div key={label} className="px-6 py-5 text-center" style={{ borderColor: 'var(--border)' }}>
                    <p className="text-2xl font-extrabold text-white">{value}</p>
                    <p className="text-xs text-slate-500 mt-1">{label}</p>
                  </div>
                ))}
              </div>
              <div className="px-8 py-3 text-xs text-slate-500 border-t" style={{ borderColor: 'var(--border)' }}>
                {t('updated_at')}: {new Date(snapshot.updatedAt).toLocaleString(locale === 'en' ? 'en-US' : 'es-CL')}
              </div>
            </div>

            {snapshot.isMultiAccount && snapshot.accounts && (
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--muted)' }}>{t('breakdown_title')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {snapshot.accounts.map(acc => {
                    const style = SEMAPHORE_STYLE[acc.semaphore];
                    const Icon = style.Icon;
                    return (
                      <div key={acc.accountId} className="rounded-xl border p-5 flex flex-col gap-3" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
                        <div className="flex items-center justify-between">
                          <p className="text-white font-semibold text-sm">{acc.clientName}</p>
                          <Icon size={16} style={{ color: style.color }} />
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-lg font-extrabold text-white">{acc.activeCount}</p>
                            <p className="text-slate-500">{t('active')}</p>
                          </div>
                          <div>
                            <p className="text-lg font-extrabold" style={{ color: acc.overdueCount > 0 ? '#ef4444' : 'white' }}>{acc.overdueCount}</p>
                            <p className="text-slate-500">{t('overdue')}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--muted)' }}>{t('tickets_title')}</h3>
              {snapshot.tickets.length === 0 ? (
                <p className="text-slate-500 text-sm">{t('no_tickets')}</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {snapshot.tickets.map(ticket => {
                    const remaining = formatRemaining(ticket.dueDate, locale);
                    return (
                      <div key={ticket.id} className="rounded-xl p-5 border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
                        <div>
                          <p className="text-white font-semibold text-sm">#{ticket.ticketNumber} {ticket.subject}</p>
                          <p className="text-xs text-slate-500 mt-1">{ticket.status}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ color: PRIORITY_COLOR[ticket.priority] ?? '#F09422', background: 'rgba(255,255,255,0.06)' }}>
                            {t(`priority_${ticket.priority.toLowerCase()}`)}
                          </span>
                          <span className="text-xs" style={{ color: ticket.isOverdue ? '#ef4444' : 'var(--muted)' }}>
                            {ticket.isOverdue ? t('sla_overdue') : remaining ? `${t('sla_remaining')}: ${remaining}` : ''}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
