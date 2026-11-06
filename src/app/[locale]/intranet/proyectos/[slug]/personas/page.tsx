'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import IntranetLogin from '@/components/IntranetLogin';
import { useTranslations } from 'next-intl';

interface Persona {
  email: string;
  nombre: string;
  cargo: string;
  empresa: string;
  roles: string[];
  comunas: string[];
  vigenteHasta: string | null;
  activo: boolean;
}

const VACIA: Persona = { email: '', nombre: '', cargo: '', empresa: '', roles: [], comunas: [], vigenteHasta: null, activo: true };

/**
 * «Personas del proyecto»: who has an account in the project beyond the staff lists (an outside fiber contractor, the
 * fiber inspector, the office), with their role, comunas and end date. Only the project's administrators edit it.
 */
export default function PersonasPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = use(params);
  const t = useTranslations('intranet');
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [roles, setRoles] = useState<Record<string, string>>({});
  const [comunas, setComunas] = useState<string[]>([]);
  const [status, setStatus] = useState<'loading' | 'unauthenticated' | 'forbidden' | 'error' | 'ready'>('loading');
  const [guardado, setGuardado] = useState<{ estado: 'idle' | 'saving' | 'saved' | 'error'; mensaje?: string }>({ estado: 'idle' });

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/intranet/proyectos/${slug}/personas`)
      .then(async res => {
        if (cancelled) return;
        if (res.status === 401) return setStatus('unauthenticated');
        if (res.status === 403) return setStatus('forbidden');
        if (!res.ok) return setStatus('error');
        const data = await res.json();
        setPersonas(data.personas);
        setRoles(data.roles);
        setComunas(data.comunas);
        setStatus('ready');
      })
      .catch(() => !cancelled && setStatus('error'));
    return () => { cancelled = true; };
  }, [slug]);

  const cambiar = (i: number, cambio: Partial<Persona>) => setPersonas(prev => prev.map((p, j) => (j === i ? { ...p, ...cambio } : p)));
  const alternar = (lista: string[], valor: string) => (lista.includes(valor) ? lista.filter(x => x !== valor) : [...lista, valor]);

  const guardar = async () => {
    setGuardado({ estado: 'saving' });
    try {
      const res = await fetch(`/api/intranet/proyectos/${slug}/personas`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ personas }),
      });
      const data = await res.json();
      if (!res.ok) return setGuardado({ estado: 'error', mensaje: data.error ?? 'No se pudo guardar.' });
      setPersonas(data.personas);
      setGuardado({ estado: 'saved', mensaje: 'Guardado. Los cambios rigen desde el próximo inicio de sesión de cada persona.' });
    } catch {
      setGuardado({ estado: 'error', mensaje: 'No se pudo guardar. Revisa tu conexión y vuelve a intentar.' });
    }
  };

  const campo = 'rounded-lg px-3 py-2 border text-sm w-full';
  const estiloCampo = { background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' };

  return (
    <div>
      <div className="text-white py-14 px-4" style={{ background: '#1E1B18' }}>
        <div className="max-w-5xl mx-auto">
          <Link href={`/${locale}/intranet/proyectos/${slug}`} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-4">
            <ArrowLeft size={14} /> Volver al proyecto
          </Link>
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-2" style={{ color: '#F09422' }}>DPR Antofagasta</p>
          <h1 className="text-3xl font-extrabold">Personas del proyecto</h1>
          <p className="mt-3 text-slate-300 max-w-2xl">
            Cuentas de quienes trabajan en el proyecto fuera de las listas del personal: el contratista de fibra, el inspector y la oficina.
            Una persona externa entra a la Intranet solo mientras está activa y dentro de su fecha de término, y solo ve su área.
            Datos mínimos: nombre, cargo, correo, empresa, rol y comuna.
          </p>
        </div>
      </div>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {status === 'loading' && <p className="text-slate-400 text-center py-16">{t('loading')}</p>}
        {status === 'unauthenticated' && (
          <div className="rounded-2xl p-10 border text-center" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
            <IntranetLogin locale={locale} labels={{ description: t('login_desc'), placeholder: t('login_placeholder'), submit: t('login_cta'),
              submitting: t('login_submitting'), sentTitle: t('login_sent_title'), sentDesc: t('login_sent_desc') }} />
          </div>
        )}
        {status === 'forbidden' && (
          <p className="rounded-2xl p-10 border text-center" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)', color: '#ef4444' }}>
            Esta página la administran Iván Andaur y R. Martínez. Si necesitas un cambio, pídeselo a ellos.
          </p>
        )}
        {status === 'error' && <p className="text-center py-16" style={{ color: '#ef4444' }}>{t('error_generic')}</p>}

        {status === 'ready' && (
          <div className="flex flex-col gap-4">
            {personas.map((p, i) => (
              <div key={i} className="rounded-xl p-5 border grid gap-3 sm:grid-cols-2" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
                <label className="text-xs text-slate-400 flex flex-col gap-1">Correo
                  <input className={campo} style={estiloCampo} value={p.email} onChange={e => cambiar(i, { email: e.target.value })} placeholder="nombre@empresa.cl" />
                </label>
                <label className="text-xs text-slate-400 flex flex-col gap-1">Nombre
                  <input className={campo} style={estiloCampo} value={p.nombre} onChange={e => cambiar(i, { nombre: e.target.value })} />
                </label>
                <label className="text-xs text-slate-400 flex flex-col gap-1">Cargo
                  <input className={campo} style={estiloCampo} value={p.cargo} onChange={e => cambiar(i, { cargo: e.target.value })} />
                </label>
                <label className="text-xs text-slate-400 flex flex-col gap-1">Empresa
                  <input className={campo} style={estiloCampo} value={p.empresa} onChange={e => cambiar(i, { empresa: e.target.value })} />
                </label>
                <fieldset className="text-xs text-slate-400 flex flex-col gap-1.5"><legend className="mb-1">Rol</legend>
                  {Object.entries(roles).map(([id, label]) => (
                    <label key={id} className="flex items-center gap-2 text-sm" style={{ color: 'var(--foreground)' }}>
                      <input type="checkbox" checked={p.roles.includes(id)} onChange={() => cambiar(i, { roles: alternar(p.roles, id) })} /> {label}
                    </label>
                  ))}
                </fieldset>
                <div className="flex flex-col gap-3">
                  <fieldset className="text-xs text-slate-400 flex flex-wrap gap-x-4 gap-y-1.5"><legend className="mb-1 w-full">Comunas</legend>
                    {comunas.map(c => (
                      <label key={c} className="flex items-center gap-2 text-sm" style={{ color: 'var(--foreground)' }}>
                        <input type="checkbox" checked={p.comunas.includes(c)} onChange={() => cambiar(i, { comunas: alternar(p.comunas, c) })} /> {c}
                      </label>
                    ))}
                  </fieldset>
                  <label className="text-xs text-slate-400 flex flex-col gap-1">Acceso hasta (vacío: sin fecha de término)
                    <input type="date" className={campo} style={estiloCampo} value={p.vigenteHasta ?? ''} onChange={e => cambiar(i, { vigenteHasta: e.target.value || null })} />
                  </label>
                  <div className="flex items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--foreground)' }}>
                      <input type="checkbox" checked={p.activo} onChange={() => cambiar(i, { activo: !p.activo })} /> Cuenta activa
                    </label>
                    <button type="button" onClick={() => setPersonas(prev => prev.filter((_, j) => j !== i))} className="inline-flex items-center gap-1.5 text-sm" style={{ color: '#ef4444' }}>
                      <Trash2 size={14} /> Quitar
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => setPersonas(prev => [...prev, { ...VACIA }])} className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 border text-sm" style={{ borderColor: 'var(--border)' }}>
                <Plus size={14} /> Agregar persona
              </button>
              <button type="button" onClick={guardar} disabled={guardado.estado === 'saving'} className="rounded-full px-5 py-2 text-sm font-semibold" style={{ background: '#F09422', color: '#1E1B18' }}>
                {guardado.estado === 'saving' ? 'Guardando…' : 'Guardar cambios'}
              </button>
              {guardado.mensaje && <p className="text-sm" role="status" style={{ color: guardado.estado === 'error' ? '#ef4444' : '#22c55e' }}>{guardado.mensaje}</p>}
            </div>
            <p className="text-xs text-slate-400">Quitar a alguien o desmarcar «Cuenta activa» le cierra el acceso. Lo que esa persona registró se conserva.</p>
          </div>
        )}
      </section>
    </div>
  );
}
