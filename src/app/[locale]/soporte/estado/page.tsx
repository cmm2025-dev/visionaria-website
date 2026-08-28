'use client';

import { useEffect, useState, use } from 'react';
import { useTranslations } from 'next-intl';
import {
  AlertTriangle, CheckCircle2, LogOut, ShieldAlert, Camera, Server,
  Router, Battery, Monitor, HardDrive, Clock, Ticket, MapPin, Activity, Gauge,
} from 'lucide-react';
import MagicLinkLogin from '@/components/MagicLinkLogin';
import SupportHeroCarousel from '@/components/SupportHeroCarousel';

interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string | null;
  isOverdue: boolean;
  modifiedTime: string | null;
}

interface InventoryItem {
  assetType: string;
  totalCount: number;
}

interface ZabbixSnapshot {
  estadoGeneral: 'OPERATIVO' | 'CON_INCIDENCIAS';
  camarasOnline: number;
  camarasTotal: number;
  sitiosOnline: number;
  sitiosTotal: number;
  incidentesActivos: number;
  disponibilidadPct: number;
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
  inventory: InventoryItem[];
  zabbix: ZabbixSnapshot | null;
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

/** Best-effort icon for a free-text inventory asset type (cf_tipo_activo) coming out of Zoho. */
function iconForAsset(assetType: string) {
  const v = assetType.toLowerCase();
  if (v.includes('cámara') || v.includes('camara')) return Camera;
  if (v.includes('servidor')) return Server;
  if (v.includes('switch') || v.includes('red')) return Router;
  if (v.includes('ups') || v.includes('energ')) return Battery;
  if (v.includes('monitor') || v.includes('videowall')) return Monitor;
  return HardDrive;
}

function formatRemaining(dueDate: string | null, locale: string): string | null {
  if (!dueDate) return null;
  const diffMs = new Date(dueDate).getTime() - Date.now();
  if (diffMs <= 0) return null;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return locale === 'en' ? `${hours}h ${minutes}m` : `${hours} h ${minutes} min`;
}

function formatRelative(iso: string | null, locale: string): string {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 1) return locale === 'en' ? 'just now' : 'recién';
  if (minutes < 60) return locale === 'en' ? `${minutes}m ago` : `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return locale === 'en' ? `${hours}h ago` : `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return locale === 'en' ? `${days}d ago` : `hace ${days} d`;
}

export default function SupportStatusPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const t = useTranslations('supportStatus');
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [status, setStatus] = useState<'loading' | 'unauthenticated' | 'error' | 'no_account' | 'ready'>('loading');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

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

  const displayed = snapshot?.isMultiAccount
    ? snapshot.accounts?.find(a => a.accountId === selectedAccountId) ?? snapshot
    : snapshot;
  const recentEvents = displayed
    ? [...displayed.tickets].sort((a, b) => (b.modifiedTime ?? '').localeCompare(a.modifiedTime ?? '')).slice(0, 6)
    : [];

  return (
    <div>
      <div className="text-white py-20 px-4 relative overflow-hidden" style={{ background: '#1E1B18' }}>
        <SupportHeroCarousel accent="#34d399" />
        <div className="max-w-6xl mx-auto relative">
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-2" style={{ color: '#34d399' }}>{t('eyebrow')}</p>
          <h1 className="text-4xl font-extrabold">{t('title')}</h1>
          <p className="mt-3 text-lg text-slate-300 max-w-2xl">{t('subtitle')}</p>
        </div>
      </div>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {status === 'loading' && (
          <p className="text-slate-400 text-center py-16">{t('loading')}</p>
        )}

        {status === 'unauthenticated' && (
          <div className="rounded-2xl p-10 border text-center" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
            <MagicLinkLogin
              locale={locale}
              next="estado"
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

            {/* General status + KPI tiles */}
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

            {/* Multi-account client picker */}
            {snapshot.isMultiAccount && snapshot.accounts && (
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--muted)' }}>{t('breakdown_title')}</h3>
                <p className="text-xs text-slate-500 mb-4">{t('breakdown_hint')}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {snapshot.accounts.map(acc => {
                    const style = SEMAPHORE_STYLE[acc.semaphore];
                    const Icon = style.Icon;
                    const selected = selectedAccountId === acc.accountId;
                    return (
                      <button
                        key={acc.accountId}
                        onClick={() => setSelectedAccountId(selected ? null : acc.accountId)}
                        className="text-left rounded-xl border p-5 flex flex-col gap-3 transition-all hover:glow-cyan-sm cursor-pointer"
                        style={{
                          background: 'var(--card-bg)',
                          borderColor: selected ? style.color : 'var(--border)',
                          boxShadow: selected ? `0 0 0 1px ${style.color}` : undefined,
                        }}
                      >
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
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {(!snapshot.isMultiAccount || displayed !== snapshot) && displayed && (
              <>
                {/* Live monitoring (Zabbix) */}
                {displayed.zabbix && (
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--muted)' }}>{t('monitoring_title')}</h3>
                    <p className="text-xs text-slate-500 mb-4">{t('monitoring_hint')}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                      <div className="rounded-xl p-5 border flex flex-col gap-3" style={{ background: 'var(--card-bg)', borderColor: displayed.zabbix.estadoGeneral === 'OPERATIVO' ? '#34d399' : '#F09422' }}>
                        <Activity size={20} style={{ color: displayed.zabbix.estadoGeneral === 'OPERATIVO' ? '#34d399' : '#F09422' }} />
                        <div>
                          <p className="text-lg font-extrabold" style={{ color: displayed.zabbix.estadoGeneral === 'OPERATIVO' ? '#34d399' : '#F09422' }}>
                            {displayed.zabbix.estadoGeneral === 'OPERATIVO' ? t('monitoring_operativo') : t('monitoring_incidencias')}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">{t('monitoring_estado_general')}</p>
                        </div>
                      </div>
                      <div className="rounded-xl p-5 border flex flex-col gap-3" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
                        <Camera size={20} style={{ color: '#34d399' }} />
                        <div>
                          <p className="text-2xl font-extrabold text-white">{displayed.zabbix.camarasOnline} / {displayed.zabbix.camarasTotal}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{t('monitoring_camaras')}</p>
                        </div>
                      </div>
                      <div className="rounded-xl p-5 border flex flex-col gap-3" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
                        <MapPin size={20} style={{ color: '#34d399' }} />
                        <div>
                          <p className="text-2xl font-extrabold text-white">{displayed.zabbix.sitiosOnline} / {displayed.zabbix.sitiosTotal}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{t('monitoring_sitios')}</p>
                        </div>
                      </div>
                      <div className="rounded-xl p-5 border flex flex-col gap-3" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
                        <AlertTriangle size={20} style={{ color: displayed.zabbix.incidentesActivos > 0 ? '#F09422' : '#34d399' }} />
                        <div>
                          <p className="text-2xl font-extrabold text-white">{displayed.zabbix.incidentesActivos}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{t('monitoring_incidentes')}</p>
                        </div>
                      </div>
                      <div className="rounded-xl p-5 border flex flex-col gap-3" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
                        <Gauge size={20} style={{ color: '#34d399' }} />
                        <div>
                          <p className="text-2xl font-extrabold text-white">{displayed.zabbix.disponibilidadPct}%</p>
                          <p className="text-xs text-slate-500 mt-0.5">{t('monitoring_disponibilidad')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Installed assets */}
                {displayed.inventory.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--muted)' }}>{t('assets_title')}</h3>
                    <p className="text-xs text-slate-500 mb-4">{t('assets_hint')}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {displayed.inventory.map(item => {
                        const Icon = iconForAsset(item.assetType);
                        return (
                          <div key={item.assetType} className="rounded-xl p-5 border flex flex-col gap-3" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
                            <Icon size={20} style={{ color: '#34d399' }} />
                            <div>
                              <p className="text-2xl font-extrabold text-white">{item.totalCount}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{item.assetType}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Two-column: ticket list + recent events */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--muted)' }}>{t('tickets_title')}</h3>
                    {displayed.tickets.length === 0 ? (
                      <p className="text-slate-500 text-sm">{t('no_tickets')}</p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {displayed.tickets.map(ticket => {
                          const remaining = formatRemaining(ticket.dueDate, locale);
                          return (
                            <div key={ticket.id} className="rounded-xl p-5 border flex flex-col gap-2" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
                              <p className="text-white font-semibold text-sm">#{ticket.ticketNumber} {ticket.subject}</p>
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-slate-500">{ticket.status}</p>
                                <div className="flex items-center gap-3 shrink-0">
                                  <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ color: PRIORITY_COLOR[ticket.priority] ?? '#F09422', background: 'rgba(255,255,255,0.06)' }}>
                                    {t(`priority_${ticket.priority.toLowerCase()}`)}
                                  </span>
                                  <span className="text-xs" style={{ color: ticket.isOverdue ? '#ef4444' : 'var(--muted)' }}>
                                    {ticket.isOverdue ? t('sla_overdue') : remaining ? `${t('sla_remaining')}: ${remaining}` : ''}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--muted)' }}>{t('events_title')}</h3>
                    {recentEvents.length === 0 ? (
                      <p className="text-slate-500 text-sm">{t('no_events')}</p>
                    ) : (
                      <div className="rounded-xl border divide-y" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
                        {recentEvents.map(ticket => (
                          <div key={ticket.id} className="px-5 py-4 flex items-start gap-3">
                            <Ticket size={16} className="mt-0.5 shrink-0" style={{ color: PRIORITY_COLOR[ticket.priority] ?? '#F09422' }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white truncate">#{ticket.ticketNumber} {ticket.subject}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{ticket.status}</p>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-slate-500 shrink-0">
                              <Clock size={12} />
                              {formatRelative(ticket.modifiedTime, locale)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {snapshot.isMultiAccount && displayed === snapshot && (
              <p className="text-xs text-slate-500">{t('breakdown_hint')}</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
