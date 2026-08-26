'use client';

import { useEffect, useState, use } from 'react';
import { useTranslations } from 'next-intl';
import { LogOut, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const TIPOS_FALLA = [
  'Camaras sin Señal',
  'Falla de Servidores -VMS',
  'Falla de Sistema de Grabacion',
  'Falla en Estacion de Operador',
  'Falla de Monitor VideoWall',
];

interface Checklist {
  energiaNormal: boolean;
  sinSiniestro: boolean;
  anomaliaPersiste: boolean;
  reinicioIntentado: boolean;
  accesoInternet: boolean;
}

const PRIORITY_STYLE: Record<string, { color: string; bg: string }> = {
  Low: { color: '#3D8A82', bg: 'rgba(61,138,130,0.12)' },
  Medium: { color: '#F09422', bg: 'rgba(240,148,34,0.12)' },
  High: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
};

export default function NewTicketPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const t = useTranslations('newTicket');
  const router = useRouter();

  const [status, setStatus] = useState<'loading' | 'unauthenticated' | 'ready' | 'submitting' | 'done' | 'error'>('loading');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [tipoFalla, setTipoFalla] = useState('');
  const [camarasAfectadas, setCamarasAfectadas] = useState('');
  const [fallaGlobal, setFallaGlobal] = useState(false);
  const [ubicacion, setUbicacion] = useState('');
  const [checklist, setChecklist] = useState<Checklist>({
    energiaNormal: false,
    sinSiniestro: false,
    anomaliaPersiste: false,
    reinicioIntentado: false,
    accesoInternet: false,
  });
  const [result, setResult] = useState<{ ticketNumber: string; priority: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  const checklistComplete = Object.values(checklist).every(Boolean);
  const canSubmit = subject.trim().length > 0 && tipoFalla && checklistComplete;

  const handleLogout = async () => {
    await fetch('/api/auth/zoho/logout', { method: 'POST' });
    setStatus('unauthenticated');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus('submitting');
    setErrorMsg(null);
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          description,
          tipoFalla,
          camarasAfectadas: camarasAfectadas ? Number(camarasAfectadas) : null,
          fallaGlobal,
          ubicacion,
          checklist,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(
          data.error === 'no_account' ? t('error_no_account')
          : data.error === 'not_authorized' ? t('error_not_authorized')
          : t('error_generic')
        );
        setStatus('ready');
        return;
      }
      setResult({ ticketNumber: data.ticket.ticketNumber, priority: data.priority });
      setStatus('done');
    } catch {
      setErrorMsg(t('error_generic'));
      setStatus('ready');
    }
  };

  return (
    <div>
      <div className="text-white py-20 px-4 relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #28221A 0%, #1E1B18 100%)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: '#3D8A82' }} />
        <div className="max-w-3xl mx-auto relative">
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-2" style={{ color: '#3D8A82' }}>{t('eyebrow')}</p>
          <h1 className="text-4xl font-extrabold">{t('title')}</h1>
          <p className="mt-3 text-lg text-slate-300 max-w-2xl">{t('subtitle')}</p>
        </div>
      </div>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {status === 'loading' && <p className="text-slate-400 text-center py-16">{t('loading')}</p>}

        {status === 'unauthenticated' && (
          <div className="rounded-2xl p-10 border text-center" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
            <p className="text-slate-400 mb-6">{t('login_desc')}</p>
            <a
              href={`/api/auth/zoho/login?locale=${locale}&next=nuevo-ticket`}
              className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-full transition-all"
              style={{ background: '#F09422', color: '#1E1B18' }}
            >
              {t('login_cta')}
            </a>
          </div>
        )}

        {status === 'done' && result && (
          <div className="rounded-2xl p-10 border text-center flex flex-col items-center gap-4" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
            <CheckCircle2 size={40} style={{ color: '#34d399' }} />
            <h2 className="text-xl font-bold text-white">{t('success_title')}</h2>
            <p className="text-slate-400">{t('success_desc', { ticketNumber: result.ticketNumber })}</p>

            <div className="w-full mt-2 rounded-xl border text-left overflow-hidden" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between px-5 py-3.5" style={{ background: PRIORITY_STYLE[result.priority].bg }}>
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>{t('summary_priority')}</span>
                <span className="text-sm font-bold" style={{ color: PRIORITY_STYLE[result.priority].color }}>{t(`priority_${result.priority.toLowerCase()}`)}</span>
              </div>
              <div className="flex flex-col divide-y" style={{ background: 'var(--background)' }}>
                <div className="flex items-center justify-between px-5 py-3">
                  <span className="text-xs text-slate-500">{t('summary_status')}</span>
                  <span className="text-sm text-white font-medium">{t('summary_status_open')}</span>
                </div>
                <div className="flex items-center justify-between px-5 py-3">
                  <span className="text-xs text-slate-500">{t('field_tipo_falla')}</span>
                  <span className="text-sm text-white font-medium">{tipoFalla}</span>
                </div>
                <div className="flex items-center justify-between px-5 py-3">
                  <span className="text-xs text-slate-500">{t('field_subject')}</span>
                  <span className="text-sm text-white font-medium truncate max-w-[60%]">{subject}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => router.push(`/${locale}/soporte/estado`)}
              className="mt-2 inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-full transition-all"
              style={{ background: '#3D8A82', color: '#1E1B18' }}
            >
              {t('view_status')}
            </button>
          </div>
        )}

        {(status === 'ready' || status === 'submitting') && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            <div className="flex items-center justify-end">
              <button type="button" onClick={handleLogout} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
                <LogOut size={14} /> {t('logout')}
              </button>
            </div>

            {errorMsg && <p className="text-sm" style={{ color: '#ef4444' }}>{errorMsg}</p>}

            {/* Checklist previo */}
            <div className="rounded-2xl p-6 border" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
              <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--muted)' }}>{t('checklist_title')}</h2>
              <div className="flex flex-col gap-3">
                {([
                  ['energiaNormal', t('check_energia')],
                  ['sinSiniestro', t('check_siniestro')],
                  ['anomaliaPersiste', t('check_anomalia')],
                  ['reinicioIntentado', t('check_reinicio')],
                  ['accesoInternet', t('check_internet')],
                ] as [keyof Checklist, string][]).map(([key, label]) => (
                  <label key={key} className="flex items-start gap-3 text-sm text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist[key]}
                      onChange={e => setChecklist(c => ({ ...c, [key]: e.target.checked }))}
                      className="mt-0.5"
                    />
                    {label}
                  </label>
                ))}
              </div>
              {!checklistComplete && <p className="text-xs mt-3" style={{ color: '#F09422' }}>{t('checklist_hint')}</p>}
            </div>

            {/* Detalle del ticket */}
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm text-slate-400 block mb-1.5">{t('field_tipo_falla')}</label>
                <select
                  value={tipoFalla}
                  onChange={e => setTipoFalla(e.target.value)}
                  required
                  className="w-full rounded-lg px-4 py-2.5 border text-white text-sm"
                  style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}
                >
                  <option value="">{t('field_tipo_falla_placeholder')}</option>
                  {TIPOS_FALLA.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
                </select>
              </div>

              {tipoFalla === 'Camaras sin Señal' && (
                <div>
                  <label className="text-sm text-slate-400 block mb-1.5">{t('field_camaras_afectadas')}</label>
                  <input
                    type="number"
                    min={0}
                    value={camarasAfectadas}
                    onChange={e => setCamarasAfectadas(e.target.value)}
                    className="w-full rounded-lg px-4 py-2.5 border text-white text-sm"
                    style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}
                  />
                </div>
              )}

              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input type="checkbox" checked={fallaGlobal} onChange={e => setFallaGlobal(e.target.checked)} />
                {t('field_falla_global')}
              </label>

              <div>
                <label className="text-sm text-slate-400 block mb-1.5">{t('field_ubicacion')}</label>
                <input
                  type="text"
                  value={ubicacion}
                  onChange={e => setUbicacion(e.target.value)}
                  className="w-full rounded-lg px-4 py-2.5 border text-white text-sm"
                  style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 block mb-1.5">{t('field_subject')}</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full rounded-lg px-4 py-2.5 border text-white text-sm"
                  style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 block mb-1.5">{t('field_description')}</label>
                <textarea
                  rows={5}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full rounded-lg px-4 py-2.5 border text-white text-sm"
                  style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!canSubmit || status === 'submitting'}
              className="inline-flex items-center justify-center gap-2 font-semibold px-6 py-3 rounded-full transition-all disabled:opacity-40"
              style={{ background: '#F09422', color: '#1E1B18' }}
            >
              {status === 'submitting' ? t('submitting') : t('submit')}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
