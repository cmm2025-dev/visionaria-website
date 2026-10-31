'use client';

import { useEffect, useMemo, useState, use, type FocusEvent, type PointerEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, CheckCircle2, ExternalLink, Table2, BarChart3 } from 'lucide-react';
import type { PanelRegistro, PanelSnapshot } from '@/lib/panelStore';

// The executive panel is internal and Spanish-only, like the Evidencias app it reports on.

interface Punto { code: string; comuna: string; tipo: string; direccion: string }
type Status = 'loading' | 'unauthenticated' | 'forbidden' | 'error' | 'ready';
type Periodo = 'hoy' | '7' | '30' | 'todo';

const COMUNAS = ['Antofagasta', 'Calama', 'Tocopilla'] as const;
// Categorical slots 1-3 of the validated palette, dark steps, checked all-pairs against --card-bg.
const COLOR: Record<string, string> = { Antofagasta: '#3987e5', Calama: '#d95926', Tocopilla: '#199e70' };
const ETAPAS = ['Excavación', 'Hormigón', 'Izaje', 'Grout', 'Preempalme', 'Conexión eléctrica', 'Montaje tecnología', 'Fusión FO', 'Operativo'];
const CRITICAL = '#d03b3b';
const GOOD = '#0ca30c';
const POLL_MS = 60_000;
const STALE_MIN = 10;

const chileDate = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago' }).format(d);
const shortDate = (iso: string) => iso.slice(8, 10) + '-' + iso.slice(5, 7);
const fullDate = (iso: string) => iso.split('-').reverse().join('-');
const dateTime = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat('es-CL', { timeZone: 'America/Santiago', dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso)) : '—';
const minutesSince = (iso: string, now: number) => Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000));
const ago = (min: number) => (min < 1 ? 'hace menos de un minuto' : min < 60 ? `hace ${min} min` : `hace ${Math.round(min / 60)} h`);
const fotoUrl = (ruta: string) => {
  const i = ruta.lastIndexOf('/');
  return `https://www.dropbox.com/home${encodeURI(ruta.slice(0, i))}?preview=${encodeURIComponent(ruta.slice(i + 1))}`;
};
const esNovedad = (r: PanelRegistro) => (r.tipo ?? (ETAPAS.includes(r.hecho) ? 'Etapa' : 'Novedad')) === 'Novedad';
const porCorregir = (r: PanelRegistro) => !r.anulado && !!r.control && r.control !== 'OK';

function daysBack(n: number, today: string): string[] {
  const out: string[] = [];
  const base = new Date(today + 'T12:00:00Z');
  for (let i = n - 1; i >= 0; i--) out.push(new Date(base.getTime() - i * 86_400_000).toISOString().slice(0, 10));
  return out;
}

function Legend({ comunas }: { comunas: string[] }) {
  if (comunas.length < 2) return null;
  return (
    <div className="flex flex-wrap gap-4 text-xs text-slate-300">
      {comunas.map(c => (
        <span key={c} className="inline-flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: COLOR[c] }} />{c}
        </span>
      ))}
    </div>
  );
}

interface Tip { x: number; y: number; value: string; label: string; color: string }

export default function PanelPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState('');
  const [snapshot, setSnapshot] = useState<PanelSnapshot | null>(null);
  const [puntos, setPuntos] = useState<Punto[]>([]);
  const [comuna, setComuna] = useState<'Todas' | (typeof COMUNAS)[number]>('Todas');
  const [periodo, setPeriodo] = useState<Periodo>('7');
  const [now, setNow] = useState(() => Date.now());
  const [tip, setTip] = useState<Tip | null>(null);
  const [tablaDias, setTablaDias] = useState(false);
  const [tablaEtapas, setTablaEtapas] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch('/api/intranet/panel', { cache: 'no-store' })
        .then(async res => {
          if (cancelled) return;
          if (res.status === 401) return setStatus('unauthenticated');
          if (res.status === 403) return setStatus('forbidden');
          const data = await res.json();
          if (!res.ok) {
            setError(data.error ?? '');
            return setStatus('error');
          }
          setSnapshot(data.snapshot);
          setPuntos(data.puntos);
          setNow(Date.now());
          setStatus('ready');
        })
        .catch(() => !cancelled && setStatus('error'));
    load();
    const poll = setInterval(load, POLL_MS);
    const tick = setInterval(() => setNow(Date.now()), 30_000);
    return () => { cancelled = true; clearInterval(poll); clearInterval(tick); };
  }, []);

  const today = chileDate(new Date(now));
  const comunasSel = comuna === 'Todas' ? [...COMUNAS] : [comuna];

  const view = useMemo(() => {
    const vivos = (snapshot?.registros ?? []).filter(r => !r.anulado && comunasSel.includes(r.comuna as (typeof COMUNAS)[number]));
    const nDias = periodo === 'hoy' ? 1 : periodo === '7' ? 7 : periodo === '30' ? 30 : 0;
    const desde = nDias ? daysBack(nDias, today)[0] : '0000-00-00';
    const enPeriodo = vivos.filter(r => r.fecha >= desde);
    const puntosSel = puntos.filter(p => comunasSel.includes(p.comuna as (typeof COMUNAS)[number]));

    // A point "reached" a stage when any live record of that stage exists for it.
    const alcanzados = new Map<string, Set<string>>();
    for (const r of vivos) if (ETAPAS.includes(r.hecho)) {
      const k = `${r.hecho}|${r.comuna}`;
      if (!alcanzados.has(k)) alcanzados.set(k, new Set());
      alcanzados.get(k)!.add(r.punto);
    }
    const conAvance = new Set(vivos.filter(r => ETAPAS.includes(r.hecho)).map(r => `${r.comuna}|${r.punto}`));

    const chartDays = daysBack(nDias && nDias > 1 ? nDias : 14, today);
    const porDia = chartDays.map(d => ({
      fecha: d,
      valores: comunasSel.map(c => ({ comuna: c, n: vivos.filter(r => r.fecha === d && r.comuna === c).length })),
    }));
    const maxDia = Math.max(1, ...porDia.map(d => d.valores.reduce((s, v) => s + v.n, 0)));

    const etapas = ETAPAS.map(e => ({
      etapa: e,
      valores: comunasSel.map(c => ({ comuna: c, n: alcanzados.get(`${e}|${c}`)?.size ?? 0 })),
    }));

    const ultimo = vivos.reduce<string | null>((m, r) => (r.guardado_en && (!m || r.guardado_en > m) ? r.guardado_en : m), null);
    const resumen = comunasSel.map(c => {
      const de = (r: PanelRegistro) => r.comuna === c;
      return {
        comuna: c,
        hechos: enPeriodo.filter(de).length,
        novedades: enPeriodo.filter(r => de(r) && esNovedad(r)).length,
        corregir: vivos.filter(r => de(r) && porCorregir(r)).length,
        avance: [...conAvance].filter(k => k.startsWith(c + '|')).length,
        puntos: puntos.filter(p => p.comuna === c).length,
        planilla: snapshot?.comunas.find(x => x.comuna === c)?.generada_en ?? null,
      };
    });
    const orden = (a: PanelRegistro, b: PanelRegistro) => (b.guardado_en ?? b.fecha).localeCompare(a.guardado_en ?? a.fecha);
    return {
      hechos: enPeriodo.length,
      novedades: enPeriodo.filter(esNovedad).length,
      corregir: vivos.filter(porCorregir),
      conAvance: conAvance.size,
      totalPuntos: puntosSel.length,
      ultimo,
      porDia, maxDia, etapas, resumen,
      listaNovedades: enPeriodo.filter(esNovedad).sort(orden).slice(0, 15),
      recientes: [...vivos].sort(orden).slice(0, 20),
    };
  }, [snapshot, puntos, comuna, periodo, today]); // eslint-disable-line react-hooks/exhaustive-deps

  const showTip = (e: PointerEvent<HTMLElement> | FocusEvent<HTMLElement>, value: string, label: string, color: string) => {
    const r = e.currentTarget.getBoundingClientRect();
    setTip({ x: r.left + r.width / 2, y: r.top, value, label, color });
  };
  const hideTip = () => setTip(null);

  const shell = (children: ReactNode) => (
    <div>
      <div className="text-white py-12 px-4" style={{ background: '#1E1B18' }}>
        <div className="max-w-6xl mx-auto">
          <Link href={`/${locale}/intranet`} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white">
            <ArrowLeft size={14} /> Intranet
          </Link>
          <p className="text-xs font-bold tracking-[0.3em] uppercase mt-6 mb-2" style={{ color: '#F09422' }}>Panel ejecutivo</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold">Parte diario de terreno</h1>
          <p className="mt-2 text-slate-300">DPR Antofagasta · Antofagasta, Calama y Tocopilla</p>
        </div>
      </div>
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">{children}</section>
    </div>
  );

  if (status !== 'ready') {
    const msg = {
      loading: 'Cargando el panel…',
      unauthenticated: 'Inicia sesión en la Intranet para ver el panel.',
      forbidden: 'Tu cuenta no tiene acceso al panel ejecutivo. Pídelo al administrador de la Intranet.',
      error: `No se pudo cargar el panel.${error ? ' ' + error : ''}`,
    }[status];
    return shell(
      <div className="rounded-2xl p-10 border text-center" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
        <p className="text-slate-300">{msg}</p>
        {status === 'unauthenticated' && (
          <Link href={`/${locale}/intranet`} className="inline-block mt-4 text-sm font-semibold" style={{ color: '#F09422' }}>Ir a la Intranet</Link>
        )}
      </div>,
    );
  }

  if (!snapshot) {
    return shell(
      <div className="rounded-2xl p-10 border text-center" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
        <p className="text-slate-300">El servicio del parte diario todavía no ha enviado datos al panel.</p>
      </div>,
    );
  }

  const edad = minutesSince(snapshot.generado, now);
  const atrasado = edad > STALE_MIN;
  const card = 'rounded-2xl border p-5 sm:p-6';
  const cardStyle = { background: 'var(--card-bg)', borderColor: 'var(--border)' };
  const chip = (activo: boolean) =>
    `px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors ${activo ? 'text-[#1E1B18]' : 'text-slate-300 hover:text-white'}`;
  const chipStyle = (activo: boolean) => (activo ? { background: '#F09422', borderColor: '#F09422' } : { borderColor: 'var(--border)' });
  const periodos: [Periodo, string][] = [['hoy', 'Hoy'], ['7', '7 días'], ['30', '30 días'], ['todo', 'Todo']];
  const periodoTexto = { hoy: 'hoy', '7': 'últimos 7 días', '30': 'últimos 30 días', todo: 'desde el inicio' }[periodo];

  return shell(
    <div className="flex flex-col gap-6">
      {/* Filters and freshness, one row above everything they control */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Comuna">
          {(['Todas', ...COMUNAS] as const).map(c => (
            <button key={c} onClick={() => setComuna(c)} aria-pressed={comuna === c} className={chip(comuna === c)} style={chipStyle(comuna === c)}>{c}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Período">
          {periodos.map(([p, label]) => (
            <button key={p} onClick={() => setPeriodo(p)} aria-pressed={periodo === p} className={chip(periodo === p)} style={chipStyle(periodo === p)}>{label}</button>
          ))}
        </div>
      </div>
      <p className="text-sm flex items-center gap-2" style={{ color: atrasado ? '#fab219' : '#94a3b8' }}>
        {atrasado ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} style={{ color: GOOD }} />}
        {atrasado
          ? `El servicio de la oficina no envía datos ${ago(edad)}. Revisa que el servidor esté encendido.`
          : `Datos actualizados ${ago(edad)} · se refresca cada minuto`}
      </p>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: `Hechos registrados (${periodoTexto})`, value: view.hechos.toLocaleString('es-CL') },
          { label: `Novedades (${periodoTexto})`, value: view.novedades.toLocaleString('es-CL') },
          { label: 'Puntos con avance', value: `${view.conAvance}`, sub: `de ${view.totalPuntos} puntos` },
          { label: 'Filas por corregir', value: `${view.corregir.length}`, alert: view.corregir.length > 0 },
          { label: 'Último registro', value: view.ultimo ? ago(minutesSince(view.ultimo, now)).replace('hace ', '') : '—', sub: view.ultimo ? dateTime(view.ultimo) : undefined },
        ].map(t => (
          <div key={t.label} className={card} style={cardStyle}>
            <p className="text-xs text-slate-400">{t.label}</p>
            <p className="text-3xl font-bold text-white mt-1 flex items-center gap-2">
              {t.alert && <AlertTriangle size={20} style={{ color: CRITICAL }} aria-label="Requiere atención" />}
              {t.value}
            </p>
            {t.sub && <p className="text-xs text-slate-500 mt-1">{t.sub}</p>}
          </div>
        ))}
      </div>

      {/* Hechos por día: stacked bars, one segment per comuna */}
      <div className={card} style={cardStyle}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-white font-semibold">Hechos por día{periodo === 'hoy' || periodo === 'todo' ? ' · últimos 14 días' : ''}</h2>
          <div className="flex items-center gap-4">
            <Legend comunas={comunasSel} />
            <button onClick={() => setTablaDias(v => !v)} className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1">
              {tablaDias ? <><BarChart3 size={13} /> Ver gráfico</> : <><Table2 size={13} /> Ver tabla</>}
            </button>
          </div>
        </div>
        {tablaDias ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-slate-300">
              <thead><tr className="text-left text-slate-500 text-xs"><th className="py-1 pr-4">Fecha</th>{comunasSel.map(c => <th key={c} className="py-1 pr-4 text-right">{c}</th>)}</tr></thead>
              <tbody>{view.porDia.map(d => (
                <tr key={d.fecha} className="border-t" style={{ borderColor: 'var(--border)' }}>
                  <td className="py-1 pr-4">{fullDate(d.fecha)}</td>
                  {d.valores.map(v => <td key={v.comuna} className="py-1 pr-4 text-right tabular-nums">{v.n}</td>)}
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : (
          <div>
            <div className="flex items-end gap-[2px] h-44 border-b" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
              {view.porDia.map(d => {
                const total = d.valores.reduce((s, v) => s + v.n, 0);
                return (
                  <div key={d.fecha} className="flex-1 h-full flex flex-col justify-end min-w-0">
                    <div className="flex flex-col-reverse gap-[2px]" style={{ height: `${(total / view.maxDia) * 100}%` }}>
                      {d.valores.filter(v => v.n > 0).map((v, i, arr) => (
                        <div
                          key={v.comuna}
                          tabIndex={0}
                          role="img"
                          aria-label={`${fullDate(d.fecha)}, ${v.comuna}: ${v.n} hechos`}
                          onPointerMove={e => showTip(e, `${v.n} ${v.n === 1 ? 'hecho' : 'hechos'}`, `${v.comuna} · ${fullDate(d.fecha)}`, COLOR[v.comuna])}
                          onPointerLeave={hideTip}
                          onFocus={e => showTip(e, `${v.n} ${v.n === 1 ? 'hecho' : 'hechos'}`, `${v.comuna} · ${fullDate(d.fecha)}`, COLOR[v.comuna])}
                          onBlur={hideTip}
                          className="w-full hover:brightness-125 focus:brightness-125 outline-none"
                          style={{ flex: v.n, background: COLOR[v.comuna], borderTopLeftRadius: i === arr.length - 1 ? 4 : 0, borderTopRightRadius: i === arr.length - 1 ? 4 : 0 }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-[2px] mt-1">
              {view.porDia.map((d, i) => (
                <span key={d.fecha} className="flex-1 text-center text-[10px] text-slate-500 min-w-0 truncate">
                  {view.porDia.length <= 14 || i % Math.ceil(view.porDia.length / 10) === 0 ? shortDate(d.fecha) : ''}
                </span>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">Máximo del período: {view.maxDia} {view.maxDia === 1 ? 'hecho' : 'hechos'} en un día · por fecha del hecho</p>
          </div>
        )}
      </div>

      {/* Avance por etapa: points that reached each stage, against the catalogue */}
      <div className={card} style={cardStyle}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-white font-semibold">Avance por etapa</h2>
            <p className="text-xs text-slate-500">Puntos que registran cada etapa, sobre {view.totalPuntos} puntos del catálogo</p>
          </div>
          <div className="flex items-center gap-4">
            <Legend comunas={comunasSel} />
            <button onClick={() => setTablaEtapas(v => !v)} className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1">
              {tablaEtapas ? <><BarChart3 size={13} /> Ver gráfico</> : <><Table2 size={13} /> Ver tabla</>}
            </button>
          </div>
        </div>
        {tablaEtapas ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-slate-300">
              <thead><tr className="text-left text-slate-500 text-xs"><th className="py-1 pr-4">Etapa</th>{comunasSel.map(c => <th key={c} className="py-1 pr-4 text-right">{c}</th>)}<th className="py-1 text-right">Total</th></tr></thead>
              <tbody>{view.etapas.map(e => {
                const total = e.valores.reduce((s, v) => s + v.n, 0);
                return (
                  <tr key={e.etapa} className="border-t" style={{ borderColor: 'var(--border)' }}>
                    <td className="py-1 pr-4">{e.etapa}</td>
                    {e.valores.map(v => <td key={v.comuna} className="py-1 pr-4 text-right tabular-nums">{v.n}</td>)}
                    <td className="py-1 text-right tabular-nums">{total} ({view.totalPuntos ? Math.round((total / view.totalPuntos) * 100) : 0}%)</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {view.etapas.map(e => {
              const total = e.valores.reduce((s, v) => s + v.n, 0);
              const pct = view.totalPuntos ? Math.round((total / view.totalPuntos) * 100) : 0;
              return (
                <div key={e.etapa} className="grid grid-cols-[8.5rem_1fr_5.5rem] sm:grid-cols-[10rem_1fr_6rem] items-center gap-3">
                  <span className="text-sm text-slate-300 truncate">{e.etapa}</span>
                  <div className="h-3 rounded-full overflow-hidden flex gap-[2px]" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    {e.valores.filter(v => v.n > 0).map((v, i, arr) => (
                      <div
                        key={v.comuna}
                        tabIndex={0}
                        role="img"
                        aria-label={`${e.etapa}, ${v.comuna}: ${v.n} puntos`}
                        onPointerMove={ev => showTip(ev, `${v.n} ${v.n === 1 ? 'punto' : 'puntos'}`, `${v.comuna} · ${e.etapa}`, COLOR[v.comuna])}
                        onPointerLeave={hideTip}
                        onFocus={ev => showTip(ev, `${v.n} ${v.n === 1 ? 'punto' : 'puntos'}`, `${v.comuna} · ${e.etapa}`, COLOR[v.comuna])}
                        onBlur={hideTip}
                        className="h-full hover:brightness-125 focus:brightness-125 outline-none"
                        style={{ width: `${(v.n / Math.max(1, view.totalPuntos)) * 100}%`, background: COLOR[v.comuna], borderTopRightRadius: i === arr.length - 1 ? 4 : 0, borderBottomRightRadius: i === arr.length - 1 ? 4 : 0 }}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-slate-300 text-right tabular-nums">{total} · {pct}%</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Per comuna summary */}
      <div className={card} style={cardStyle}>
        <h2 className="text-white font-semibold mb-3">Resumen por comuna <span className="text-xs font-normal text-slate-500">({periodoTexto})</span></h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-slate-300">
            <thead>
              <tr className="text-left text-slate-500 text-xs">
                <th className="py-1.5 pr-4">Comuna</th><th className="py-1.5 pr-4 text-right">Hechos</th><th className="py-1.5 pr-4 text-right">Novedades</th>
                <th className="py-1.5 pr-4 text-right">Por corregir</th><th className="py-1.5 pr-4 text-right">Puntos con avance</th><th className="py-1.5">Planilla actualizada</th>
              </tr>
            </thead>
            <tbody>{view.resumen.map(r => (
              <tr key={r.comuna} className="border-t" style={{ borderColor: 'var(--border)' }}>
                <td className="py-2 pr-4"><span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLOR[r.comuna] }} />{r.comuna}</span></td>
                <td className="py-2 pr-4 text-right tabular-nums">{r.hechos}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{r.novedades}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{r.corregir > 0 ? <span className="inline-flex items-center gap-1"><AlertTriangle size={13} style={{ color: CRITICAL }} />{r.corregir}</span> : 0}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{r.avance} de {r.puntos}</td>
                <td className="py-2 text-slate-400">{dateTime(r.planilla)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Novedades */}
        <div className={card} style={cardStyle}>
          <h2 className="text-white font-semibold mb-3">Novedades <span className="text-xs font-normal text-slate-500">({periodoTexto})</span></h2>
          {view.listaNovedades.length === 0 ? <p className="text-sm text-slate-500">Sin novedades en el período.</p> : (
            <ul className="flex flex-col divide-y" style={{ borderColor: 'var(--border)' }}>
              {view.listaNovedades.map(r => (
                <li key={r.id + r.comuna} className="py-2.5 text-sm" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-white font-medium">{r.hecho} · {r.punto}</p>
                  {r.detalle && <p className="text-slate-300 mt-0.5">{r.detalle}</p>}
                  <p className="text-xs text-slate-500 mt-0.5">{r.comuna} · {fullDate(r.fecha)} · {(r.registrado_por ?? '').split('@')[0]}
                    {r.foto_ruta && <> · <a href={fotoUrl(r.foto_ruta)} target="_blank" rel="noopener noreferrer" className="hover:text-white inline-flex items-center gap-0.5">foto <ExternalLink size={10} /></a></>}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Por corregir */}
        <div className={card} style={cardStyle}>
          <h2 className="text-white font-semibold mb-3">Filas por corregir en la planilla</h2>
          {view.corregir.length === 0 ? (
            <p className="text-sm text-slate-400 inline-flex items-center gap-1.5"><CheckCircle2 size={14} style={{ color: GOOD }} /> Todas las filas dicen OK.</p>
          ) : (
            <ul className="flex flex-col divide-y" style={{ borderColor: 'var(--border)' }}>
              {view.corregir.slice(0, 15).map(r => (
                <li key={r.id + r.comuna} className="py-2.5 text-sm" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-white font-medium">{r.id} · {r.punto} · {r.hecho}</p>
                  <p className="mt-0.5 inline-flex items-center gap-1.5 text-slate-300"><AlertTriangle size={13} style={{ color: CRITICAL }} />{r.control}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Últimos registros */}
      <div className={card} style={cardStyle}>
        <h2 className="text-white font-semibold mb-3">Últimos registros</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-slate-300">
            <thead>
              <tr className="text-left text-slate-500 text-xs">
                <th className="py-1.5 pr-4">ID</th><th className="py-1.5 pr-4">Fecha</th><th className="py-1.5 pr-4">Punto</th><th className="py-1.5 pr-4">Hecho</th>
                <th className="py-1.5 pr-4">Ejecutó</th><th className="py-1.5 pr-4">Registró</th><th className="py-1.5">Foto</th>
              </tr>
            </thead>
            <tbody>{view.recientes.map(r => (
              <tr key={r.id + r.comuna} className="border-t" style={{ borderColor: 'var(--border)' }}>
                <td className="py-2 pr-4 whitespace-nowrap">{r.id}</td>
                <td className="py-2 pr-4 whitespace-nowrap">{fullDate(r.fecha)}</td>
                <td className="py-2 pr-4 whitespace-nowrap">{r.punto}</td>
                <td className="py-2 pr-4">{r.hecho}</td>
                <td className="py-2 pr-4">{r.ejecuto ?? '—'}</td>
                <td className="py-2 pr-4">{(r.registrado_por ?? '').split('@')[0] || '—'}</td>
                <td className="py-2">{r.foto_ruta ? <a href={fotoUrl(r.foto_ruta)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-white">Ver <ExternalLink size={11} /></a> : '—'}</td>
              </tr>
            ))}</tbody>
          </table>
          {view.recientes.length === 0 && <p className="text-sm text-slate-500 py-3">Sin registros.</p>}
        </div>
      </div>

      {tip && (
        <div
          role="tooltip"
          className="fixed z-50 pointer-events-none rounded-lg px-3 py-2 text-xs shadow-lg border"
          style={{ left: tip.x, top: tip.y - 8, transform: 'translate(-50%, -100%)', background: '#1E1B18', borderColor: 'rgba(255,255,255,0.15)' }}
        >
          <p className="text-white font-semibold text-sm">{tip.value}</p>
          <p className="text-slate-400 inline-flex items-center gap-1.5"><span className="inline-block w-3 h-0.5" style={{ background: tip.color }} />{tip.label}</p>
        </div>
      )}
    </div>,
  );
}
