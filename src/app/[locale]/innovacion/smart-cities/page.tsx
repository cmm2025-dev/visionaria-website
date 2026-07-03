import Link from 'next/link';
import { Shield, Camera, Car, KeyRound, Plane, Leaf, ArrowRight, CheckCircle } from 'lucide-react';

export default async function SmartCitiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  const modules = [
    {
      icon: Shield,
      color: '#F09422',
      bg: 'rgba(240,148,34,0.10)',
      title: 'Seguridad Pública',
      desc: 'Los sensores IoT integrados con nuestra plataforma permiten la monitorización en tiempo real, recopilación de datos y respuestas automatizadas ante emergencias. Mejoramos significativamente la resiliencia urbana, con énfasis en prevención de incidentes y coordinación policial.',
      bullets: [
        'Detección automática de incidentes y comportamientos anómalos',
        'Integración con Carabineros y sistemas de despacho policial',
        'Alertas en tiempo real a centros de mando unificados',
        'Cobertura 24/7 con respaldo energético y redundancia de red',
      ],
    },
    {
      icon: Camera,
      color: '#00d4ff',
      bg: 'rgba(0,212,255,0.10)',
      title: 'Televigilancia Inteligente',
      desc: 'Red de cámaras IP de alta resolución con analítica de video basada en inteligencia artificial. Detecta eventos en tiempo real sin intervención humana constante, optimizando los recursos operacionales de cada municipio.',
      bullets: [
        'Cámaras PTZ de largo alcance con zoom óptico 40x',
        'Analítica: conteo de personas, detección de merodeo, objetos abandonados',
        'Reconocimiento de matrículas (LPR) en pórticos y accesos',
        'Gestión centralizada desde sala de control Genetec',
      ],
    },
    {
      icon: Car,
      color: '#34d399',
      bg: 'rgba(52,211,153,0.10)',
      title: 'Gestión de Tránsito',
      desc: 'Soluciones integradas para el monitoreo y gestión del flujo vehicular en tiempo real. Reducimos la congestión, mejoramos los tiempos de respuesta de emergencias y entregamos datos valiosos para la planificación urbana.',
      bullets: [
        'Conteo vehicular y análisis de velocidad promedio',
        'Detección de infracciones: luz roja, sentido contrario, exceso de velocidad',
        'Integración con semáforos inteligentes y paneles de mensaje variable',
        'Dashboard de tráfico en tiempo real para autoridades',
      ],
    },
    {
      icon: KeyRound,
      color: '#a78bfa',
      bg: 'rgba(167,139,250,0.10)',
      title: 'Control de Acceso',
      desc: 'Plataformas de control de acceso vehicular y peatonal para zonas críticas, edificios municipales y perímetros sensibles. Integración total con el ecosistema de videovigilancia para una seguridad perimetral completa.',
      bullets: [
        'Barreras vehiculares con reconocimiento de patente automático',
        'Control biométrico (facial, huella) en instalaciones críticas',
        'Listas blancas y negras sincronizadas en tiempo real',
        'Registro de auditoría completo con evidencia de video asociada',
      ],
    },
    {
      icon: Leaf,
      color: '#34d399',
      bg: 'rgba(52,211,153,0.10)',
      title: 'Monitoreo Ambiental',
      desc: 'La monitorización ambiental es esencial para la gestión urbana, mejorando la salud pública, la seguridad y la sostenibilidad. Sensores IoT distribuidos en la ciudad recopilan y analizan datos ambientales en tiempo real, permitiendo decisiones informadas a las autoridades municipales.',
      bullets: [
        'Sensores de distancia en contenedores: monitoreo de nivel de llenado y optimización de rutas de recolección de residuos',
        'Controladores de válvula solenoide: riego automatizado según tiempo, caudal y humedad del suelo',
        'Cámaras de detección: monitoreo de espacios verdes, infestaciones de plagas y signos de vandalismo',
        'Sensores de humedad del suelo: datos en tiempo real sobre humedad, temperatura y conductividad eléctrica del suelo',
        'Estaciones meteorológicas: temperatura, humedad, velocidad/dirección del viento, presión barométrica y precipitaciones',
      ],
    },
    {
      icon: Plane,
      color: '#F09422',
      bg: 'rgba(240,148,34,0.10)',
      title: 'Drones como Primera Respuesta (DFR)',
      desc: 'Sistema de drones autónomos desplegados desde estaciones fijas que responden a alarmas en menos de 90 segundos. La Central Táctica de Drones coordina el despacho automático y transmite video en vivo al centro de mando.',
      bullets: [
        'Tiempo de llegada al punto de alarma: menos de 90 segundos',
        'Video en vivo Full HD transmitido a sala de control',
        'Integración con cámaras PTZ para seguimiento coordinado',
        'Operación 24/7 con recarga automática en estación DJI Dock',
      ],
    },
  ];

  return (
    <div style={{ background: '#040d20', minHeight: '100vh' }}>

      {/* Hero */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #060d2e 0%, #0d1a5e 60%, #040d20 100%)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(ellipse at 70% 50%, rgba(0,212,255,0.08) 0%, transparent 60%)',
        }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-bold tracking-[0.3em] uppercase mb-4" style={{ color: '#00d4ff' }}>
                Innovación · Smart Cities
              </p>
              <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight">
                La solución de<br />
                <span style={{ color: '#00d4ff' }}>Ciudad Inteligente</span><br />
                para Chile
              </h1>
              <p className="mt-6 text-lg text-slate-300 leading-relaxed">
                Visionaria integra televigilancia, gestión del tránsito, control de acceso y drones de respuesta en un ecosistema unificado diseñado para las ciudades chilenas. Datos en tiempo real, coordinación centralizada y respuesta más rápida ante cada incidente.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  href={`/${locale}/contacto`}
                  className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-full transition-all glow-cyan-sm hover:glow-cyan"
                  style={{ background: '#00d4ff', color: '#040d20' }}
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

            {/* City image placeholder — reemplazar con imagen real */}
            <div className="relative rounded-2xl overflow-hidden border" style={{ aspectRatio: '16/10', borderColor: 'rgba(0,212,255,0.2)', background: 'linear-gradient(135deg, #0d1a5e, #040d20)' }}>
              {/* Decorative city grid SVG */}
              <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice">
                <defs>
                  <radialGradient id="glow" cx="50%" cy="60%" r="50%">
                    <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.4"/>
                    <stop offset="100%" stopColor="#00d4ff" stopOpacity="0"/>
                  </radialGradient>
                </defs>
                <rect width="400" height="250" fill="url(#glow)"/>
                {/* Grid lines */}
                {[0,40,80,120,160,200,240,280,320,360,400].map(x => (
                  <line key={x} x1={x} y1="0" x2={x} y2="250" stroke="#00d4ff" strokeWidth="0.3" opacity="0.4"/>
                ))}
                {[0,30,60,90,120,150,180,210,240].map(y => (
                  <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#00d4ff" strokeWidth="0.3" opacity="0.4"/>
                ))}
                {/* Buildings */}
                {[[80,140,30,110],[120,100,25,150],[160,80,35,170],[200,60,30,190],[240,90,28,160],[280,110,32,140],[320,130,26,120]].map(([x,h,w,y],i) => (
                  <rect key={i} x={x} y={y} width={w} height={h} fill="#00d4ff" opacity="0.15" stroke="#00d4ff" strokeWidth="0.5" strokeOpacity="0.4"/>
                ))}
                {/* Data pulses */}
                <circle cx="200" cy="125" r="40" fill="none" stroke="#00d4ff" strokeWidth="0.8" opacity="0.5"/>
                <circle cx="200" cy="125" r="70" fill="none" stroke="#00d4ff" strokeWidth="0.4" opacity="0.3"/>
                <circle cx="200" cy="125" r="100" fill="none" stroke="#00d4ff" strokeWidth="0.2" opacity="0.15"/>
                <circle cx="200" cy="125" r="5" fill="#F09422"/>
              </svg>
              <div className="absolute inset-0 flex items-end p-6">
                <div className="text-xs font-mono" style={{ color: 'rgba(0,212,255,0.6)' }}>
                  SANTIAGO · SMART CITY PLATFORM · LIVE
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Intro retos */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-extrabold text-white">
              ¿Cuáles son los retos de construir una ciudad inteligente?
            </h2>
            <p className="mt-5 text-slate-400 leading-relaxed">
              La ciudad inteligente es un entorno donde las soluciones digitales optimizan el uso de infraestructura y servicios, mejorando la calidad de vida de los residentes. Sin embargo, el camino hacia ese objetivo presenta desafíos concretos:
            </p>
            <ul className="mt-6 space-y-3">
              {[
                'Sistemas legacy aislados que no se comunican entre sí',
                'Infraestructura de red insuficiente para datos en tiempo real',
                'Escalar soluciones existentes es costoso e ineficiente',
                'Falta de visibilidad unificada para la toma de decisiones',
                'Coordinación fragmentada entre organismos de seguridad',
              ].map(item => (
                <li key={item} className="flex items-start gap-3 text-slate-300">
                  <CheckCircle size={18} className="shrink-0 mt-0.5" style={{ color: '#00d4ff' }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl p-8 border" style={{ background: 'rgba(0,212,255,0.04)', borderColor: 'rgba(0,212,255,0.15)' }}>
            <p className="text-sm font-bold tracking-widest uppercase mb-4" style={{ color: '#F09422' }}>La respuesta de Visionaria</p>
            <p className="text-white text-lg font-semibold leading-relaxed">
              Un ecosistema integrado que conecta cámaras, sensores, drones, control de acceso y comunicaciones en una plataforma única de gestión.
            </p>
            <p className="mt-4 text-slate-400 leading-relaxed">
              Trabajamos con las mejores marcas del mundo — Genetec, DJI, Axis, Hikvision — e integramos cada componente para que los operadores vean todo desde una sola pantalla y respondan en segundos, no en minutos.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-4 text-center">
              {[['&lt; 90s', 'Tiempo respuesta DFR'], ['24/7', 'Monitoreo continuo'], ['80 km', 'Alcance de red']].map(([val, label]) => (
                <div key={label} className="rounded-xl p-4 border" style={{ background: 'rgba(0,0,0,0.3)', borderColor: 'rgba(0,212,255,0.1)' }}>
                  <p className="text-xl font-extrabold" style={{ color: '#00d4ff' }} dangerouslySetInnerHTML={{ __html: val }} />
                  <p className="text-[10px] text-slate-400 mt-1 leading-tight">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Módulos */}
      <section style={{ background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(0,212,255,0.08)', borderBottom: '1px solid rgba(0,212,255,0.08)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-14">
            <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3" style={{ color: '#00d4ff' }}>Capacidades</p>
            <h2 className="text-3xl font-extrabold text-white">Módulos del ecosistema Smart Cities</h2>
            <p className="mt-3 text-slate-400">Cada módulo opera de forma autónoma o integrado con los demás</p>
          </div>
          <div className="flex flex-col gap-12">
            {modules.map(({ icon: Icon, color, bg, title, desc, bullets }, i) => (
              <div key={title} className={`grid grid-cols-1 lg:grid-cols-2 gap-10 items-center ${i % 2 === 1 ? 'lg:flex lg:flex-row-reverse' : ''}`}>
                <div className="rounded-2xl p-8 border flex flex-col gap-5" style={{ background: 'rgba(4,13,32,0.8)', borderColor: `${color}25` }}>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
                      <Icon size={28} style={{ color }} />
                    </div>
                    <h3 className="text-2xl font-bold text-white">{title}</h3>
                  </div>
                  <p className="text-slate-400 leading-relaxed">{desc}</p>
                </div>
                <div className="flex flex-col gap-3">
                  {bullets.map(b => (
                    <div key={b} className="flex items-start gap-3 rounded-xl px-5 py-3.5 border" style={{ background: 'rgba(4,13,32,0.6)', borderColor: 'rgba(255,255,255,0.06)' }}>
                      <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: color }} />
                      <p className="text-slate-300 text-sm leading-relaxed">{b}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-14">
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3" style={{ color: '#00d4ff' }}>Resultados</p>
          <h2 className="text-3xl font-extrabold text-white">¿Qué beneficios obtendrás?</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Toma de decisiones basada en datos',
              desc: 'Los sensores IoT analizan grandes flujos de datos y permiten identificar patrones rápidamente. Esto conduce a conocimientos accionables para la planificación urbana, asignación de recursos y gestión general de la ciudad.',
              color: '#F09422',
              icon: '📊',
            },
            {
              title: 'Servicios públicos e infraestructuras eficientes',
              desc: 'La integración de datos en tiempo real optimiza la operación de servicios críticos: alumbrado inteligente, gestión de residuos, tránsito y emergencias — reduciendo costos y mejorando la calidad del servicio.',
              color: '#00d4ff',
              icon: '🏙️',
            },
            {
              title: 'Mayor participación y experiencia ciudadana',
              desc: 'Una ciudad más segura, limpia y eficiente mejora directamente la calidad de vida de los residentes y fomenta la confianza en las instituciones públicas a través de resultados medibles y transparentes.',
              color: '#34d399',
              icon: '👥',
            },
          ].map(({ title, desc, color, icon }) => (
            <div key={title} className="rounded-2xl overflow-hidden border flex flex-col" style={{ borderColor: `${color}30`, background: 'rgba(4,13,32,0.8)' }}>
              <div className="p-8 flex flex-col flex-1 gap-4">
                <div className="text-4xl">{icon}</div>
                <h3 className="text-lg font-bold text-white">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
              <div className="h-1" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-3xl font-extrabold text-white">¿Tu municipio está listo para el siguiente nivel?</h2>
        <p className="mt-4 text-slate-400 max-w-xl mx-auto">
          Hablemos de las necesidades específicas de tu ciudad. Nuestro equipo diseña la solución a medida.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={`/${locale}/contacto`}
            className="inline-flex items-center gap-2 font-semibold px-8 py-3.5 rounded-full transition-all glow-cyan-sm hover:glow-cyan"
            style={{ background: '#00d4ff', color: '#040d20' }}
          >
            Contactar a un especialista <ArrowRight size={16} />
          </Link>
          <Link
            href={`/${locale}/casos-exito`}
            className="inline-flex items-center gap-2 font-semibold px-8 py-3.5 rounded-full border text-white hover:bg-white/5 transition-colors"
            style={{ borderColor: 'rgba(255,255,255,0.2)' }}
          >
            Ver proyectos realizados
          </Link>
        </div>
      </section>
    </div>
  );
}
