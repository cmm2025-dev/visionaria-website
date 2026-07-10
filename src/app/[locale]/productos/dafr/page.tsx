import Link from 'next/link';
import { ArrowRight, CheckCircle, Clock, Radio, Video, Zap } from 'lucide-react';

export default async function DAFRPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  const features = [
    {
      icon: Clock,
      color: '#F09422',
      title: 'Respuesta en menos de 90 segundos',
      desc: 'Desde la activación de la alarma hasta que el dron está sobre el punto del incidente, el tiempo de respuesta es inferior a 90 segundos — superando cualquier patrullaje terrestre.',
    },
    {
      icon: Video,
      color: '#00d4ff',
      title: 'Video en vivo al centro de mando',
      desc: 'Transmisión Full HD en tiempo real al operador. El equipo de respuesta ve el incidente antes de llegar, mejorando la toma de decisiones y la seguridad del personal.',
    },
    {
      icon: Radio,
      color: '#a78bfa',
      title: 'Despacho automático integrado',
      desc: 'La Central Táctica de Drones (CTD) recibe la alarma y despacha el dron automáticamente, sin intervención humana. Compatible con Genetec, Milestone y sistemas de despacho policial.',
    },
    {
      icon: Zap,
      color: '#34d399',
      title: 'Operación 24/7 autónoma',
      desc: 'Estación DJI Dock con recarga automática. El dron regresa, recarga y queda listo para el siguiente evento sin necesidad de operador en sitio.',
    },
  ];

  const steps = [
    { label: 'ALARMA', time: 'T = 0s', color: '#F09422', desc: 'Sensor, cámara o botón de pánico activa la alerta en el sistema.' },
    { label: 'DESPACHO', time: 'T = 5s', color: '#00d4ff', desc: 'CTD recibe la alarma y ordena el despegue automático del dron más cercano.' },
    { label: 'DESPEGUE', time: 'T = 30s', color: '#00d4ff', desc: 'El dron sale de la estación DJI Dock y navega autónomamente al punto del evento.' },
    { label: 'VIDEO EN VIVO', time: 'T = 90s', color: '#F09422', desc: 'El dron llega y transmite video Full HD en tiempo real al centro de mando.' },
    { label: 'DECISIÓN', time: '< 2 min', color: '#34d399', desc: 'El operador evalúa la situación y despacha la respuesta terrestre con información real.' },
  ];

  return (
    <div style={{ background: '#040d20', minHeight: '100vh' }}>

      {/* Hero */}
      <div className="relative overflow-hidden py-20 lg:py-28" style={{ background: 'linear-gradient(135deg, #060d2e 0%, #0d1a5e 60%, #040d20 100%)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(ellipse at 60% 40%, rgba(240,148,34,0.07) 0%, transparent 60%)' }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-bold tracking-[0.3em] uppercase mb-4" style={{ color: '#F09422' }}>
              Soluciones · DAFR
            </p>
            <h1 className="text-4xl lg:text-6xl font-extrabold text-white leading-tight">
              Dron como<br />
              <span style={{ color: '#F09422' }}>Primera Fuerza</span><br />
              de Respuesta
            </h1>
            <p className="mt-6 text-lg text-slate-300 leading-relaxed max-w-2xl">
              El concepto DAFR (Drone as First Responder) redefine la seguridad urbana. Antes de que cualquier patrulla llegue al lugar del incidente, un dron autónomo ya está transmitiendo video en vivo desde el punto exacto de la alarma.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href={`/${locale}/contacto`}
                className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-full transition-all"
                style={{ background: '#F09422', color: '#040d20' }}
              >
                Solicitar demo <ArrowRight size={16} />
              </Link>
              <Link
                href={`/${locale}/casos-exito`}
                className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-full border text-white hover:bg-white/5 transition-colors"
                style={{ borderColor: 'rgba(255,255,255,0.2)' }}
              >
                Ver casos de éxito
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Video YouTube */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3" style={{ color: '#F09422' }}>En acción</p>
          <h2 className="text-3xl font-extrabold text-white">Ve cómo funciona el sistema DAFR</h2>
          <p className="mt-3 text-slate-400">Desde la alarma hasta el video en vivo en menos de 90 segundos</p>
        </div>
        <div className="relative rounded-2xl overflow-hidden border" style={{ aspectRatio: '16/9', borderColor: 'rgba(240,148,34,0.3)' }}>
          <iframe
            src="https://www.youtube.com/embed/o_HdKiM1MEE?rel=0&modestbranding=1"
            title="DAFR — Dron como Primera Fuerza de Respuesta"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
            style={{ border: 'none' }}
          />
        </div>
      </section>

      {/* Flujo operacional */}
      <section style={{ background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(240,148,34,0.08)', borderBottom: '1px solid rgba(240,148,34,0.08)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3" style={{ color: '#F09422' }}>Protocolo</p>
            <h2 className="text-3xl font-extrabold text-white">Flujo operacional DAFR</h2>
          </div>
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-6 top-6 bottom-6 w-px hidden lg:block" style={{ background: 'linear-gradient(to bottom, #F09422, #00d4ff, #34d399)' }} />
            <div className="flex flex-col gap-6 lg:pl-16">
              {steps.map(({ label, time, color, desc }) => (
                <div key={label} className="flex items-start gap-5">
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full border-2 flex items-center justify-center hidden lg:flex" style={{ borderColor: color, background: 'rgba(4,13,32,0.9)', boxShadow: `0 0 12px ${color}50` }}>
                      <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                    </div>
                    {/* Mobile dot */}
                    <div className="w-3 h-3 rounded-full mt-2 lg:hidden" style={{ background: color }} />
                  </div>
                  <div className="rounded-xl p-5 border flex-1" style={{ background: 'rgba(4,13,32,0.7)', borderColor: `${color}20` }}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-bold tracking-widest" style={{ color }}>{label}</span>
                      <span className="text-xs font-mono text-slate-500">{time}</span>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Capacidades */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3" style={{ color: '#F09422' }}>Tecnología</p>
          <h2 className="text-3xl font-extrabold text-white">Capacidades del sistema</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="rounded-2xl p-8 border flex flex-col gap-4" style={{ background: 'rgba(4,13,32,0.8)', borderColor: `${color}25` }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
                <Icon size={24} style={{ color }} />
              </div>
              <h3 className="text-lg font-bold text-white">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Beneficios clave */}
      <section style={{ background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(240,148,34,0.08)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3" style={{ color: '#F09422' }}>Por qué DAFR</p>
              <h2 className="text-3xl font-extrabold text-white mb-6">Más rápido que cualquier patrulla terrestre</h2>
              <div className="flex flex-col gap-3">
                {[
                  'Llega al lugar del incidente en menos de 90 segundos',
                  'El operador evalúa la situación antes de enviar recursos terrestres',
                  'Reduce falsas alarmas — solo se despacha personal cuando el dron confirma el incidente',
                  'Cobertura aérea 24/7 sin riesgo para el personal de seguridad',
                  'Integración nativa con Genetec Security Center y plataformas de despacho',
                  'Compatible con los sistemas de comunicación de Carabineros y municipios',
                ].map(b => (
                  <div key={b} className="flex items-start gap-3">
                    <CheckCircle size={18} className="shrink-0 mt-0.5" style={{ color: '#F09422' }} />
                    <p className="text-slate-300 text-sm leading-relaxed">{b}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { val: '< 90s', label: 'Tiempo de respuesta', color: '#F09422' },
                { val: '24/7', label: 'Operación continua', color: '#00d4ff' },
                { val: 'Full HD', label: 'Video en vivo', color: '#a78bfa' },
                { val: '0', label: 'Operadores en sitio requeridos', color: '#34d399' },
              ].map(({ val, label, color }) => (
                <div key={label} className="rounded-2xl p-6 border text-center" style={{ background: 'rgba(4,13,32,0.9)', borderColor: `${color}30` }}>
                  <p className="text-3xl font-extrabold" style={{ color }}>{val}</p>
                  <p className="text-slate-400 text-xs mt-2 leading-tight">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-3xl font-extrabold text-white">¿Tu municipio está listo para el DAFR?</h2>
        <p className="mt-4 text-slate-400 max-w-xl mx-auto">
          Nuestro equipo diseña la solución a medida, desde la ubicación de las estaciones hasta la integración con tu centro de mando existente.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={`/${locale}/contacto`}
            className="inline-flex items-center gap-2 font-semibold px-8 py-3.5 rounded-full transition-all"
            style={{ background: '#F09422', color: '#040d20' }}
          >
            Hablar con un especialista <ArrowRight size={16} />
          </Link>
          <Link
            href={`/${locale}/productos`}
            className="inline-flex items-center gap-2 font-semibold px-8 py-3.5 rounded-full border text-white hover:bg-white/5 transition-colors"
            style={{ borderColor: 'rgba(255,255,255,0.2)' }}
          >
            Ver todas las soluciones
          </Link>
        </div>
      </section>
    </div>
  );
}
