import Link from 'next/link';
import { ArrowRight, CheckCircle, Clock, Radio, Video, Zap } from 'lucide-react';
import HeroVideoBackground from '@/components/HeroVideoBackground';
import DAFRVideoPanel from '@/components/DAFRVideoPanel';
import CaseVideoCard from '@/components/CaseVideoCard';
import ScrollCue from '@/components/ScrollCue';

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
      color: '#3D8A82',
      title: 'Video en vivo al centro de mando',
      desc: 'Transmisión Full HD en tiempo real al operador. El equipo de respuesta ve el incidente antes de llegar, mejorando la toma de decisiones y la seguridad del personal.',
    },
    {
      icon: Radio,
      color: '#C4A882',
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
    { label: 'DESPACHO', time: 'T = 5s', color: '#3D8A82', desc: 'CTD recibe la alarma y ordena el despegue automático del dron más cercano.' },
    { label: 'DESPEGUE', time: 'T = 30s', color: '#3D8A82', desc: 'El dron sale de la estación DJI Dock y navega autónomamente al punto del evento.' },
    { label: 'VIDEO EN VIVO', time: 'T = 90s', color: '#F09422', desc: 'El dron llega y transmite video Full HD en tiempo real al centro de mando.' },
    { label: 'DECISIÓN', time: '< 2 min', color: '#34d399', desc: 'El operador evalúa la situación y despacha la respuesta terrestre con información real.' },
  ];

  return (
    <div style={{ background: '#1E1B18', minHeight: '100vh' }}>

      {/* Hero */}
      <div className="relative overflow-hidden py-20 lg:py-28">
        {/* Video background — desktop only, ver HeroVideoBackground */}
        <HeroVideoBackground
          sources={['/dafr-hero-bg.mp4']}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Overlay */}
        <div
          className="absolute inset-0"
          style={{
            zIndex: 1,
            background: 'linear-gradient(135deg, rgba(20,16,12,0.80) 0%, rgba(20,16,12,0.55) 50%, rgba(20,16,12,0.35) 100%)',
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative" style={{ zIndex: 2 }}>
          <div className="max-w-3xl">
            <p className="text-xs font-bold tracking-[0.3em] uppercase mb-4" style={{ color: '#F09422', textShadow: '0 1px 6px rgba(0,0,0,0.7)' }}>
              Soluciones · DAFR
            </p>
            <h1 className="text-4xl lg:text-6xl font-extrabold text-white leading-tight" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}>
              Dron como<br />
              <span style={{ color: '#F09422' }}>Primera Fuerza</span><br />
              de Respuesta
            </h1>
            <p className="mt-6 text-lg text-slate-300 leading-relaxed max-w-2xl" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.7)' }}>
              El concepto DAFR (Drone as First Responder) redefine la seguridad urbana. Antes de que cualquier patrulla llegue al lugar del incidente, un dron autónomo ya está transmitiendo video en vivo desde el punto exacto de la alarma.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href={`/${locale}/contacto`}
                className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-full transition-all"
                style={{ background: '#F09422', color: '#1E1B18' }}
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
        <ScrollCue label="Seguir explorando" />
      </div>

      {/* Video demo */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3" style={{ color: '#F09422' }}>En acción</p>
          <h2 className="text-3xl font-extrabold text-white">Ve cómo funciona el sistema DAFR</h2>
          <p className="mt-3 text-slate-400">Desde la alarma hasta el video en vivo en menos de 90 segundos</p>
        </div>
        <DAFRVideoPanel videoId="IfCDJXEi-w4" />
        <ScrollCue label="Seguir explorando" />
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
            <div className="absolute left-6 top-6 bottom-6 w-px hidden lg:block" style={{ background: 'linear-gradient(to bottom, #F09422, #3D8A82, #34d399)' }} />
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
          <ScrollCue label="Seguir explorando" />
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
        <ScrollCue label="Seguir explorando" />
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
                { val: '24/7', label: 'Operación continua', color: '#3D8A82' },
                { val: 'Full HD', label: 'Video en vivo', color: '#C4A882' },
                { val: '0', label: 'Operadores en sitio requeridos', color: '#34d399' },
              ].map(({ val, label, color }) => (
                <div key={label} className="rounded-2xl p-6 border text-center" style={{ background: 'rgba(4,13,32,0.9)', borderColor: `${color}30` }}>
                  <p className="text-3xl font-extrabold" style={{ color }}>{val}</p>
                  <p className="text-slate-400 text-xs mt-2 leading-tight">{label}</p>
                </div>
              ))}
            </div>
          </div>
          <ScrollCue label="Seguir explorando" />
        </div>
      </section>

      {/* Accesorios DJI Dock 3 */}
      <section style={{ background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(167,139,250,0.1)', borderBottom: '1px solid rgba(167,139,250,0.1)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3" style={{ color: '#C4A882' }}>Ecosistema DJI</p>
            <h2 className="text-3xl font-extrabold text-white">Accesorios compatibles con DJI Dock 3</h2>
            <p className="mt-3 text-slate-400">Amplía las capacidades operativas según las necesidades de cada despliegue</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { color: '#C4A882', title: 'D-RTK 3 Versión Relé Fijo', desc: 'Mejora del alcance y la calidad de la transmisión de señal RTK en entornos urbanos complejos.' },
              { color: '#3D8A82', title: 'AS1 Altavoz en Tiempo Real', desc: 'Alcance de emisión de hasta 300 metros. Permite comunicación directa desde el dron al área del incidente.' },
              { color: '#F09422', title: 'AL1 Foco con Seguimiento Estabilizado', desc: 'Iluminación potente a 100 metros de distancia con seguimiento automático de objetivos.' },
              { color: '#34d399', title: 'RC Plus 2 Enterprise', desc: 'Control remoto profesional para vuelo manual del M4D/M4TD con pantalla integrada de alta visibilidad.' },
              { color: '#f87171', title: 'Módulo de Detección de Obstáculos', desc: 'Garantiza la seguridad operativa en entornos con obstáculos, evitando colisiones durante el vuelo autónomo.' },
              { color: '#C4A882', title: 'Kit de Montaje en Vehículo', desc: 'Listo para despliegue móvil. Diseño antivibraciones y calibración RTK automática en movimiento.' },
            ].map(({ color, title, desc }) => (
              <div key={title} className="rounded-2xl p-6 border flex gap-4" style={{ background: 'rgba(4,13,32,0.8)', borderColor: `${color}25` }}>
                <div className="w-2 rounded-full shrink-0" style={{ background: color, minHeight: '40px' }} />
                <div>
                  <h3 className="font-bold text-white text-sm mb-2">{title}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <ScrollCue label="Seguir explorando" />
        </div>
      </section>

      {/* DJI Dock 3 — Especificaciones */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3" style={{ color: '#F09422' }}>Hardware</p>
          <h2 className="text-3xl font-extrabold text-white">DJI Dock 3 — Preparado para cualquier reto</h2>
          <p className="mt-3 text-slate-400 max-w-2xl mx-auto">Estación de despliegue autónomo con inteligencia integrada FlightHub2, certificación EU C6 y operación en condiciones extremas.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              color: '#C4A882',
              title: 'Alto Cumplimiento Regulatorio',
              items: ['Marcado de Clase EU C6', 'Dock 3 plantillas de documentación', 'Funciones listas para BVLOS'],
            },
            {
              color: '#F09422',
              title: 'Rendimiento Superior',
              items: ['Tiempo de vuelo máximo 54 min', 'Telémetro láser para localización precisa', '10s para despegar', 'Seguimiento del terreno en tiempo real'],
            },
            {
              color: '#3D8A82',
              title: 'Seguridad de Datos Reforzada',
              items: ['ISO27001 + ISO27701', 'Versión local de FlightHub 2', 'Informe sobre seguridad de datos'],
            },
            {
              color: '#34d399',
              title: 'Robustez y Fiabilidad',
              items: ['Resistencia al viento 12 m/s en despegue', 'Temperatura de operación -30 a 50°C', 'Clasificación IP56+IP55'],
            },
            {
              color: '#C4A882',
              title: 'Múltiples Accesorios',
              items: ['Kit de montaje en vehículos', 'D-RTK3 Versión de relé de despliegue fijo', 'Módulo de detección de obstáculos'],
            },
            {
              color: '#F09422',
              title: 'Inteligencia con FlightHub2',
              items: ['Detección IA en tiempo real', 'Seguimiento inteligente', 'Detección de cambios', 'Rutas automatizadas'],
            },
          ].map(({ color, title, items }) => (
            <div key={title} className="rounded-2xl p-6 border flex flex-col gap-3" style={{ background: 'rgba(4,13,32,0.8)', borderColor: `${color}25` }}>
              <h3 className="font-bold text-white text-sm">{title}</h3>
              <ul className="flex flex-col gap-2">
                {items.map(item => (
                  <li key={item} className="flex items-start gap-2 text-slate-400 text-xs leading-relaxed">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: color }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Implementación en cualquier lugar */}
      <section style={{ background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(61,138,130,0.08)', borderBottom: '1px solid rgba(61,138,130,0.08)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3" style={{ color: '#3D8A82' }}>Despliegue</p>
            <h2 className="text-3xl font-extrabold text-white">Implementación en cualquier lugar</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                color: '#F09422',
                title: 'Preparado para despliegue en vehículos',
                desc: 'Diseño antivibraciones garantiza la fiabilidad del Dock. La calibración RTK basada en la nube y la detección del ángulo de inclinación optimizan la operación móvil y la seguridad.',
              },
              {
                color: '#3D8A82',
                title: 'Configuración RTK sencilla con D-RTK3',
                desc: 'La unión con D-RTK 3 permite una mejor adquisición de la señal RTK, superando las limitaciones de despliegue en entornos urbanos (colocando Dock3 cerca de edificios y D-RTK 3 en tejados).',
              },
              {
                color: '#34d399',
                title: 'Rendimiento mejorado de la señal RTK',
                desc: 'Módulo RTK externo con capacidad de recepción de señal incrementada en 2 dB, permite una convergencia RTK más rápida y fiable.',
              },
              {
                color: '#C4A882',
                title: 'Técnicas de aterrizaje preciso',
                desc: 'Combinación de SLAM (localización y mapeo simultáneos) y reconocimiento de marcas, garantiza un aterrizaje preciso incluso en entornos de despliegue complicados.',
              },
            ].map(({ color, title, desc }) => (
              <div key={title} className="flex gap-4 rounded-2xl p-6 border" style={{ background: 'rgba(4,13,32,0.7)', borderColor: `${color}20` }}>
                <div className="w-1 rounded-full shrink-0" style={{ background: color }} />
                <div>
                  <h3 className="font-bold text-white mb-2">{title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <ScrollCue label="Seguir explorando" />
        </div>
      </section>

      {/* Rutas automatizadas */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3" style={{ color: '#C4A882' }}>FlightHub2</p>
            <h2 className="text-3xl font-extrabold text-white mb-4">Integra la Inteligencia</h2>
            <p className="text-slate-400 leading-relaxed mb-6">El DJI Dock 3 con FlightHub2 es más inteligente que nunca. Detecta, sigue y actúa de forma autónoma en tiempo real.</p>
            <div className="flex flex-col gap-4">
              {[
                { color: '#3D8A82', title: 'Detección IA en tiempo real', desc: 'Reconocimiento de personas, vehículos y embarcaciones con umbrales configurables de alerta.' },
                { color: '#C4A882', title: 'Seguimiento inteligente', desc: 'El dron sigue automáticamente objetivos en movimiento sin intervención del operador.' },
                { color: '#34d399', title: 'Detección de cambios', desc: 'Compara imágenes de rutas recurrentes e identifica anomalías o cambios en el entorno.' },
                { color: '#F09422', title: 'Rutas automatizadas con reconocimiento', desc: 'Función de reconocimiento inteligente en waypoints: detección, aviso y captura de datos al encontrar un objetivo. Acciones: Foto, Video y vuelo estacionario.' },
              ].map(({ color, title, desc }) => (
                <div key={title} className="flex gap-3 rounded-xl px-5 py-4 border" style={{ background: 'rgba(4,13,32,0.7)', borderColor: `${color}20` }}>
                  <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: color }} />
                  <div>
                    <p className="text-white font-semibold text-sm">{title}</p>
                    <p className="text-slate-400 text-xs leading-relaxed mt-1">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {['DETECCIÓN IA EN TIEMPO REAL', 'DETECCIÓN DE CAMBIOS', 'SEGUIMIENTO INTELIGENTE', 'RUTAS AUTOMATIZADAS'].map((label, i) => {
              const colors = ['#3D8A82', '#34d399', '#C4A882', '#F09422'];
              return (
                <div key={label} className="rounded-2xl p-6 flex items-center justify-center text-center border min-h-[100px]"
                  style={{ background: `radial-gradient(ellipse at center, ${colors[i]}15 0%, rgba(4,13,32,0.9) 70%)`, borderColor: `${colors[i]}30` }}>
                  <p className="text-xs font-bold tracking-widest" style={{ color: colors[i] }}>{label}</p>
                </div>
              );
            })}
          </div>
        </div>
        <ScrollCue label="Seguir explorando" />
      </section>

      {/* Seguridad de datos */}
      <section style={{ background: 'rgba(0,0,0,0.4)', borderTop: '1px solid rgba(240,148,34,0.08)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3" style={{ color: '#F09422' }}>Privacidad</p>
            <h2 className="text-3xl font-extrabold text-white">¿Cómo protege el sistema sus datos?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                flag: '🇺🇸',
                title: 'Servidor AWS con sede en EE.UU.',
                desc: 'DJI emplea Amazon AWS como proveedor de servicios en la nube, reconocido por sus cualificaciones en materia de seguridad y alta fiabilidad. AWS cuenta con certificaciones ISO 27001/27017/27018.',
                color: '#3D8A82',
              },
              {
                flag: '🇪🇺',
                title: 'Servidor AWS con sede en la UE',
                desc: 'DJI está desplegando FlightHub 2 en Amazon AWS Frankfurt, Alemania. Todos los datos de usuarios de la UE permanecen dentro del territorio europeo, cumpliendo con las normas GDPR.',
                color: '#C4A882',
              },
            ].map(({ flag, title, desc, color }) => (
              <div key={title} className="rounded-2xl p-8 border flex gap-5" style={{ background: 'rgba(4,13,32,0.8)', borderColor: `${color}25` }}>
                <div className="text-4xl shrink-0">{flag}</div>
                <div>
                  <h3 className="font-bold text-white mb-3" style={{ color }}>{title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA + Caso real */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-10">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-extrabold text-white">¿Tu municipio está listo para el DAFR?</h2>
            <p className="mt-4 text-slate-400 max-w-xl">
              Nuestro equipo diseña la solución a medida, desde la ubicación de las estaciones hasta la integración con tu centro de mando existente.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                href={`/${locale}/contacto`}
                className="inline-flex items-center gap-2 font-semibold px-8 py-3.5 rounded-full transition-all"
                style={{ background: '#F09422', color: '#1E1B18' }}
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
          </div>
          <CaseVideoCard
            videoId="o_HdKiM1MEE"
            poster="/dafr-loop/asheville-poster.jpg"
            eyebrow="¿Quieres ver un caso real?"
            title="Asheville, USA — Respuesta post-tormenta"
          />
        </div>
      </section>
    </div>
  );
}
