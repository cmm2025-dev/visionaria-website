import { getTranslations } from 'next-intl/server';
import {
  ArrowRight, Car, Shield, Database, Bell, Search, BarChart2,
  Lock, FileText, Zap, MapPin, CheckCircle, AlertCircle, Clock,
  Building2, Network, Camera, ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import LprHeroVisual from '@/components/LprHeroVisual';
import HeroVideoBackground from '@/components/HeroVideoBackground';

export default async function LprPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  /* ── Capacidades principales ── */
  const capabilities = [
    {
      icon: Car,
      title: 'Reconocimiento en tiempo real',
      desc: 'Lectura automática de patentes en movimiento o detenidas, a velocidades de hasta 150 km/h, en condiciones diurnas y nocturnas, lluvia y contraluz.',
      accent: '#F09422',
    },
    {
      icon: Database,
      title: 'Gestión de listas y alertas',
      desc: 'Listas negras (vehículos sustraídos, inhabilitados, búsqueda activa) y listas blancas (acceso autorizado). Alerta instantánea al operador ante cualquier coincidencia.',
      accent: '#3D8A82',
    },
    {
      icon: Network,
      title: 'Integración con bases externas',
      desc: 'Conexión directa con bases de datos institucionales — incluyendo registros de Carabineros y plataformas del Ministerio del Interior — mediante protocolos seguros y acuerdos formales.',
      accent: '#F09422',
    },
    {
      icon: Search,
      title: 'Consulta e historial vehicular',
      desc: 'Búsqueda por patente completa o parcial, rango de fechas y punto de control. Historial de paso con imagen frontal, dirección de circulación y velocidad estimada.',
      accent: '#3D8A82',
    },
    {
      icon: BarChart2,
      title: 'Analítica de flujo vehicular',
      desc: 'Estadísticas de afluencia por punto de control, franja horaria y tipo de vía. Datos accionables para gestión del tránsito y planificación de patrullaje.',
      accent: '#C4A882',
    },
    {
      icon: Lock,
      title: 'Control de acceso vehicular',
      desc: 'Apertura automática de barrera o portón ante patente autorizada. Registro de entrada y salida en estacionamientos, recintos industriales y accesos municipales.',
      accent: '#C4A882',
    },
  ];

  /* ── Integraciones institucionales ── */
  const integrations = [
    {
      name: 'SEBV — Carabineros de Chile',
      full: 'Sistema de Estadísticas de Búsqueda Vehicular',
      desc: 'Integración en tiempo real con el registro nacional de vehículos sustraídos de Carabineros. Cada lectura se contrasta automáticamente: si el vehículo está en búsqueda activa, el sistema genera alerta inmediata y abre un incidente en el CAD.',
      badge: 'Búsqueda activa',
      color: '#F09422',
    },
    {
      name: 'SITIA — Subsecretaría de Prevención del Delito',
      full: 'Sistema de Información y Tecnologías para la Investigación y Acción',
      desc: 'El sistema LPR alimenta y consulta la plataforma SITIA del Ministerio del Interior, aportando registros de paso como evidencia para investigaciones criminales y análisis de patrones delictuales a nivel regional.',
      badge: 'Evidencia digital',
      color: '#3D8A82',
    },
    {
      name: 'CAD / PSIM Regional',
      full: 'Centro de despacho y gestión de incidentes',
      desc: 'Cada coincidencia con lista negra abre automáticamente un incidente en la plataforma CAD. El operador recibe imagen del vehículo, datos del propietario (si disponible) y protocolo de respuesta sugerido.',
      badge: 'Despacho automático',
      color: '#C4A882',
    },
  ];

  /* ── Caso emblemático ── */
  const caseStats = [
    { value: '303', label: 'cámaras LPR activas', sub: 'en zona metropolitana' },
    { value: '23', label: 'comunas cubiertas', sub: 'Gran Santiago' },
    { value: '24/7', label: 'operación continua', sub: 'sin intervención manual' },
    { value: '<500ms', label: 'tiempo de matching', sub: 'vs. bases SEBV/SITIA' },
  ];

  /* ── Specs técnicas ── */
  const specs = [
    { param: 'Velocidad de captura', value: 'Hasta 150 km/h' },
    { param: 'Tiempo de procesamiento', value: '< 500 ms por vehículo' },
    { param: 'Precisión de reconocimiento', value: '> 95% en condiciones estándar' },
    { param: 'Formatos soportados', value: 'Patentes chilenas, MERCOSUR, internacionales' },
    { param: 'Operación', value: 'Día/Noche — lluvia — contraluz' },
    { param: 'Cámaras por carril', value: '1–4 según disposición vial' },
    { param: 'Retención de imágenes', value: 'Configurable según normativa vigente' },
    { param: 'Protección IP', value: 'IP67 o superior en zonas adversas' },
  ];

  /* ── Marco regulatorio ── */
  const regulatory = [
    {
      icon: Shield,
      title: 'Ley 21.719 — Datos personales',
      desc: 'La patente vincula a su propietario. El sistema opera bajo tratamiento lícito de datos, con propósito declarado, registro de consultas y restricción de acceso a personal autorizado.',
    },
    {
      icon: FileText,
      title: 'Convenios interinstitucionales',
      desc: 'La integración con bases de Carabineros y SPD requiere acuerdo formal previo. Visionaria acompaña la gestión documental y técnica del convenio como parte del proyecto.',
    },
    {
      icon: Clock,
      title: 'Período de retención definido',
      desc: 'El almacenamiento de imágenes LPR se dimensiona y acota al período máximo permitido por la normativa, con política de eliminación automática al vencer el plazo.',
    },
  ];

  /* ── Casos de uso ── */
  const useCases = [
    { title: 'Televigilancia municipal', desc: 'Pórticos en accesos comunales con alerta automática a Carabineros ante vehículo buscado.', icon: Building2 },
    { title: 'Investigación criminal', desc: 'Reconstrucción de rutas de un vehículo de interés a partir del historial de paso en múltiples puntos de control.', icon: Search },
    { title: 'Control de acceso industrial', desc: 'Ingreso automático de vehículos autorizados en plantas, puertos y recintos de alta seguridad.', icon: Lock },
    { title: 'Seguridad vial y estadística', desc: 'Conteo, clasificación y velocidad de flujo vehicular para autoridades de tránsito.', icon: BarChart2 },
    { title: 'Zonas de alta criticidad', desc: 'Vigilancia con cámaras térmicas y reconocimiento en rutas críticas, zonas fronterizas e infraestructura estratégica.', icon: AlertCircle },
    { title: 'Estacionamientos y accesos', desc: 'Gestión de listas de acceso para conjuntos residenciales, hospitales, universidades y edificios corporativos.', icon: Car },
  ];

  return (
    <div>
      {/* Hero */}
      <div className="text-white relative overflow-hidden" style={{ borderLeft: '6px solid #C4A882' }}>
        {/* Video background — desktop only, ver HeroVideoBackground */}
        <HeroVideoBackground
          sources={['/lpr-hero-bg.mp4']}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Overlay: darkens video so text stays readable, with brand tint */}
        <div
          className="absolute inset-0"
          style={{
            zIndex: 1,
            background: 'linear-gradient(135deg, rgba(20,16,12,0.72) 0%, rgba(20,16,12,0.50) 50%, rgba(20,16,12,0.30) 100%)',
          }}
        />

        {/* Subtle left-edge gradient to reinforce the border-left accent */}
        <div
          className="absolute inset-y-0 left-0 w-32 pointer-events-none"
          style={{ zIndex: 2, background: 'linear-gradient(to right, rgba(196,168,130,0.08), transparent)' }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative" style={{ zIndex: 3 }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: text */}
            <div>
              <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: '#C4A882' }}>
                Portafolio de soluciones · Control vehicular
              </p>
              <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}>
                Plataforma LPR / ANPR
                <span className="block text-2xl sm:text-3xl font-semibold mt-2 text-slate-300">
                  Lectura automática de patentes con integración institucional
                </span>
              </h1>
              <p className="mt-6 text-lg text-slate-300 leading-relaxed" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.7)' }}>
                Reconocimiento vehicular en tiempo real, conectado con las bases de búsqueda de Carabineros (SEBV) y la plataforma de investigación del Ministerio del Interior (SITIA) — en menos de medio segundo por lectura.
              </p>

              {/* Hero stats */}
              <div className="mt-10 flex flex-wrap gap-8">
                {[
                  { value: '303', label: 'cámaras activas en RM' },
                  { value: '23', label: 'comunas integradas' },
                  { value: '<500ms', label: 'matching vs. SEBV/SITIA' },
                ].map(({ value, label }) => (
                  <div key={label}>
                    <p className="text-3xl font-extrabold" style={{ color: '#C4A882' }}>{value}</p>
                    <p className="text-sm text-slate-400 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href={`/${locale}/contacto`}
                  className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-full transition-all glow-cyan-sm hover:glow-cyan"
                  style={{ background: 'var(--accent)', color: '#1E1B18' }}
                >
                  Solicitar evaluación <ArrowRight size={16} />
                </Link>
                <Link
                  href={`/${locale}/casos-exito`}
                  className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-full border transition-all hover:bg-white/5"
                  style={{ borderColor: 'rgba(196,168,130,0.4)', color: '#C4A882' }}
                >
                  Ver proyectos ejecutados <ChevronRight size={16} />
                </Link>
              </div>
            </div>

            {/* Right: animated LPR simulation */}
            <div className="hidden lg:block">
              <LprHeroVisual />
            </div>
          </div>
        </div>
      </div>

      {/* Ley CATI — sección destacada */}
      <section
        className="border-y"
        style={{ background: 'linear-gradient(135deg, #2A2018 0%, #1E1B18 100%)', borderColor: 'rgba(240,148,34,0.15)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex flex-col lg:flex-row gap-10 items-center">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-5"
                style={{ background: 'rgba(240,148,34,0.10)', border: '1px solid rgba(240,148,34,0.30)', color: '#F09422' }}>
                Nuevo · Ley CATI
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                Fiscalización electrónica de tránsito<br />
                <span className="text-slate-300 font-semibold text-xl">Velocidad · Semáforo en rojo · Carriles exclusivos · Conducción inversa</span>
              </h2>
              <p className="mt-4 text-slate-300 leading-relaxed max-w-xl">
                La Ley CATI exige enforcement automatizado con evidencia fotográfica homologada. Activamos estas capacidades sobre la infraestructura LPR existente o con nuevos puntos — sin que municipios y servicios tengan que partir desde cero.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {['Exceso de velocidad', 'Luz roja', 'Carril exclusivo', 'Sentido contrario', 'Sin patente'].map(tag => (
                  <span key={tag} className="text-xs font-semibold px-3 py-1 rounded-full border"
                    style={{ borderColor: 'rgba(240,148,34,0.30)', color: '#F09422', background: 'rgba(240,148,34,0.07)' }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row lg:flex-col gap-4 lg:w-72">
              <div className="rounded-xl p-5 border flex-1" style={{ background: 'var(--card-bg)', borderColor: 'rgba(240,148,34,0.20)' }}>
                <p className="text-2xl font-extrabold" style={{ color: '#F09422' }}>2 modelos</p>
                <p className="text-sm text-slate-400 mt-1">Vías urbanas (2 carriles, 160 km/h) o vías expresas (3 carriles, 4K)</p>
              </div>
              <Link
                href={`/${locale}/productos/lpr/cati`}
                className="inline-flex items-center justify-center gap-2 font-semibold px-6 py-4 rounded-xl transition-all hover:brightness-110 text-center"
                style={{ background: 'var(--accent)', color: '#1E1B18' }}
              >
                Ver solución CATI completa <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Proyecto emblemático: SPD Región Metropolitana */}
      <section
        className="border-y"
        style={{ background: 'linear-gradient(135deg, #28221A 0%, #222018 100%)', borderColor: 'rgba(196,168,130,0.15)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col lg:flex-row gap-12 items-start">
            {/* Left: narrative */}
            <div className="flex-1">
              <div
                className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-5"
                style={{ background: 'rgba(196,168,130,0.1)', border: '1px solid rgba(196,168,130,0.3)', color: '#C4A882' }}
              >
                Proyecto emblemático
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight mb-4">
                Red LPR Metropolitana<br />
                <span style={{ color: '#C4A882' }}>Subsecretaría de Prevención del Delito</span>
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                El proyecto más grande de lectura de patentes en Chile: 303 cámaras LPR desplegadas en puntos estratégicos de las 23 comunas del Gran Santiago, operadas desde el Centro Metropolitano de Despacho con integración directa a las plataformas SEBV de Carabineros y SITIA de la Subsecretaría de Prevención del Delito.
              </p>
              <p className="text-slate-400 leading-relaxed mb-6">
                Cada lectura se contrasta en menos de 500 ms contra ambas bases. Una coincidencia genera alerta inmediata al operador, apertura de incidente en CAD, y notificación al cuartel policial más cercano con imagen del vehículo y su ruta de paso.
              </p>
              <div className="flex flex-wrap gap-2">
                {['SEBV — Carabineros', 'SITIA — SPD', 'CAD regional', 'VMS integrado', '23 comunas', 'Operación 24/7'].map(tag => (
                  <span
                    key={tag}
                    className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(196,168,130,0.08)', border: '1px solid rgba(196,168,130,0.2)', color: '#C4A882' }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: stats */}
            <div className="grid grid-cols-2 gap-4 lg:w-80 shrink-0">
              {caseStats.map(({ value, label, sub }) => (
                <div
                  key={label}
                  className="rounded-2xl p-5 border"
                  style={{ background: 'var(--card-bg)', borderColor: 'rgba(196,168,130,0.15)' }}
                >
                  <p className="text-2xl font-extrabold" style={{ color: '#C4A882' }}>{value}</p>
                  <p className="text-white text-sm font-semibold mt-1 leading-snug">{label}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Integraciones institucionales */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="mb-12 text-center">
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3" style={{ color: 'var(--accent)' }}>Ecosistema institucional</p>
          <h2 className="text-3xl font-extrabold text-white">Integrado con las plataformas del Estado</h2>
          <p className="mt-3 text-slate-400 max-w-2xl mx-auto">
            La plataforma LPR de Visionaria opera dentro del ecosistema de seguridad pública chileno, no como un silo aislado.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {integrations.map(({ name, full, desc, badge, color }) => (
            <div
              key={name}
              className="rounded-2xl overflow-hidden border flex flex-col"
              style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}
            >
              <div className="h-1" style={{ background: color }} />
              <div className="p-7 flex flex-col flex-1 gap-3">
                <span
                  className="self-start text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full"
                  style={{ background: `${color}18`, border: `1px solid ${color}40`, color }}
                >
                  {badge}
                </span>
                <h3 className="text-base font-bold text-white leading-snug">{name}</h3>
                <p className="text-xs text-slate-500 italic">{full}</p>
                <p className="text-sm text-slate-300 leading-relaxed flex-1">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Flujo de arquitectura */}
      <section className="border-y" style={{ background: 'rgba(61,138,130,0.04)', borderColor: 'var(--border)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-10 text-center">
            <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3" style={{ color: '#3D8A82' }}>Arquitectura</p>
            <h2 className="text-2xl font-extrabold text-white">Flujo de procesamiento</h2>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-1 flex-wrap">
            {[
              { label: 'Cámara LPR', sub: 'IR · alta velocidad' },
              { label: 'Motor OCR', sub: 'reconocimiento local' },
              { label: 'Motor matching', sub: 'vs. listas activas' },
              { label: 'SEBV / SITIA', sub: 'bases institucionales' },
              { label: 'CAD / PSIM', sub: 'despacho automático' },
            ].map(({ label, sub }, i, arr) => (
              <div key={label} className="flex items-center gap-1">
                <div
                  className="text-center px-4 py-3 rounded-xl border min-w-[110px]"
                  style={{ background: 'var(--card-bg)', borderColor: i === 3 ? 'rgba(240,148,34,0.4)' : 'var(--border)' }}
                >
                  <p className="text-sm font-bold text-white">{label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>
                </div>
                {i < arr.length - 1 && (
                  <ArrowRight size={14} className="shrink-0" style={{ color: '#3D8A82' }} />
                )}
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-slate-600">
            Todo el flujo ocurre en menos de 500 ms. La alerta llega al operador antes de que el vehículo abandone el cuadro de la cámara.
          </p>
        </div>
      </section>

      {/* Capacidades */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="mb-12">
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3" style={{ color: 'var(--accent)' }}>Plataforma</p>
          <h2 className="text-3xl font-extrabold text-white">Capacidades principales</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilities.map(({ icon: Icon, title, desc, accent }) => (
            <div
              key={title}
              className="rounded-2xl p-7 border transition-all hover:glow-cyan-sm flex flex-col gap-4"
              style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}
            >
              <div className="p-2.5 rounded-xl w-fit" style={{ background: `${accent}18` }}>
                <Icon size={22} style={{ color: accent }} />
              </div>
              <h3 className="font-bold text-white text-base leading-snug">{title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Especificaciones técnicas */}
      <section className="border-t" style={{ background: 'rgba(240,148,34,0.03)', borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <p className="text-xs font-bold tracking-[0.3em] uppercase mb-4" style={{ color: 'var(--accent)' }}>Especificaciones</p>
            <h2 className="text-2xl font-extrabold text-white mb-6">Parámetros técnicos referenciales</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Los valores indicados corresponden a condiciones estándar de instalación. Cada proyecto incluye un levantamiento técnico del sitio para determinar la configuración óptima según volumen de tráfico, iluminación y tipo de vía.
            </p>
            <div className="rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
              {specs.map(({ param, value }, i) => (
                <div
                  key={param}
                  className="flex items-start justify-between gap-4 px-5 py-3.5 text-sm"
                  style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none', background: i % 2 === 0 ? 'var(--card-bg)' : 'transparent' }}
                >
                  <span className="text-slate-400">{param}</span>
                  <span className="font-semibold text-white text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold tracking-[0.3em] uppercase mb-4" style={{ color: '#3D8A82' }}>Marco legal</p>
            <h2 className="text-2xl font-extrabold text-white mb-6">Cumplimiento regulatorio</h2>
            <div className="flex flex-col gap-4">
              {regulatory.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="flex gap-4 p-5 rounded-xl border"
                  style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}
                >
                  <div className="shrink-0 mt-0.5">
                    <Icon size={18} style={{ color: '#3D8A82' }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white mb-1">{title}</p>
                    <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Casos de uso */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="mb-12">
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3" style={{ color: 'var(--accent)' }}>Aplicaciones</p>
          <h2 className="text-3xl font-extrabold text-white">Casos de uso</h2>
          <p className="mt-2 text-slate-400 max-w-xl">Una plataforma, múltiples contextos de despliegue.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {useCases.map(({ title, desc, icon: Icon }) => (
            <div
              key={title}
              className="flex gap-4 p-6 rounded-xl border"
              style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}
            >
              <div className="shrink-0 p-2 rounded-lg h-fit" style={{ background: 'rgba(240,148,34,0.1)' }}>
                <Icon size={18} style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <p className="font-semibold text-white text-sm mb-1">{title}</p>
                <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Notas de implementación */}
      <section className="border-t" style={{ background: 'rgba(61,138,130,0.04)', borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-4" style={{ color: '#3D8A82' }}>A considerar en cada proyecto</p>
          <h2 className="text-2xl font-extrabold text-white mb-8">Lo que hace la diferencia en terreno</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              {
                title: 'Levantamiento físico obligatorio',
                desc: 'El posicionamiento y ángulo de la cámara es crítico para la tasa de reconocimiento. Siempre realizamos un levantamiento en sitio antes de dimensionar el proyecto.',
              },
              {
                title: 'Integración institucional gestionada desde el inicio',
                desc: 'La conexión con SEBV y SITIA requiere convenio formal. Acompañamos la coordinación interinstitucional como parte del proceso, no como etapa posterior.',
              },
              {
                title: 'Infraestructura de red evaluada en detalle',
                desc: 'Cada punto de control requiere análisis de conectividad, latencia y redundancia para garantizar el tiempo de respuesta comprometido.',
              },
              {
                title: 'Dimensionamiento de almacenamiento',
                desc: 'Las imágenes LPR crecen rápido. Calculamos el volumen real antes de definir la infraestructura de almacenamiento, considerando la normativa de retención aplicable.',
              },
            ].map(({ title, desc }) => (
              <div key={title} className="flex gap-3 p-5 rounded-xl border" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
                <CheckCircle size={18} className="shrink-0 mt-0.5" style={{ color: '#3D8A82' }} />
                <div>
                  <p className="font-semibold text-white text-sm mb-1">{title}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t" style={{ borderColor: 'var(--border)', background: 'var(--background)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold text-white">¿Tu municipio o institución necesita control vehicular?</h3>
            <p className="mt-1 text-slate-400 text-sm max-w-lg">
              Te asesoramos en el diseño del sistema, los convenios institucionales y el dimensionamiento técnico — sin costo.
            </p>
          </div>
          <Link
            href={`/${locale}/contacto`}
            className="shrink-0 inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-lg shadow-lg transition-all hover:brightness-110"
            style={{ background: 'var(--accent)', color: '#1E1B18' }}
          >
            Hablar con un especialista <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
