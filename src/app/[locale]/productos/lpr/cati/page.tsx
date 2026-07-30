import {
  ArrowRight, ChevronRight, Shield, Zap, Camera, BarChart2,
  AlertTriangle, Car, Clock, CheckCircle, Building2, Layers,
  Radio, Eye,
} from 'lucide-react';
import Link from 'next/link';

export default async function CatiPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  const violations = [
    {
      icon: Zap,
      title: 'Exceso de velocidad',
      desc: 'Radar 60 GHz integrado mide velocidad instantánea con precisión ±2 km/h. Captura fotográfica del vehículo, patente y velocidad en un único registro de infracción.',
      accent: '#F09422',
    },
    {
      icon: AlertTriangle,
      title: 'Infracción de luz roja',
      desc: 'Enlace con controlador semafórico vía RS485/contacto seco. El sistema registra el cruce cuando la señal está en rojo, con imagen del vehículo y marca de tiempo sincronizada.',
      accent: '#ef4444',
    },
    {
      icon: Car,
      title: 'Uso indebido de vías exclusivas',
      desc: 'Detección de vehículos en carriles Bus/Metro, pistas de emergencia o vías segregadas mediante gestión de carril específico (Specific Lane Management) por horario o permanente.',
      accent: '#3D8A82',
    },
    {
      icon: Eye,
      title: 'Conducción en sentido contrario',
      desc: 'Detección automática de circulación en dirección prohibida (Reverse Driving Detection). Genera alerta inmediata y registro con imagen y patente.',
      accent: '#C4A882',
    },
    {
      icon: Camera,
      title: 'Vehículo sin patente visible',
      desc: 'Identificación de vehículos que circulan sin placa o con placa adulterada (No-plate Vehicle Capture). Registro con imagen de alta resolución como evidencia.',
      accent: '#F09422',
    },
    {
      icon: BarChart2,
      title: 'Estadística de flujo y clasificación',
      desc: 'Conteo por tipo de vehículo (automóvil, moto, camión, bus), velocidad promedio y distribución horaria. Datos para planificación vial y evaluación de cumplimiento.',
      accent: '#3D8A82',
    },
  ];

  const tiers = [
    {
      badge: 'Vías urbanas · Comunas',
      title: 'Radar + LPR Compacto',
      subtitle: '4 MP · Radar 60 GHz · 2 carriles · hasta 160 km/h',
      desc: 'Solución all-in-one para intersecciones, avenidas de 2 carriles y accesos comunales. Módulo radar integrado, sin obra adicional, alimentado por PoE. Ideal para municipios que buscan iniciar enforcement con inversión acotada.',
      specs: [
        { label: 'Resolución', value: '4 MP (2688×1520)' },
        { label: 'Carriles cubiertos', value: '2 (≥95% c/u)' },
        { label: 'Velocidad máxima', value: '160 km/h' },
        { label: 'Precisión radar', value: '±2 km/h' },
        { label: 'Distancia ANPR', value: 'Hasta 40 m' },
        { label: 'Registros lista negra', value: '20.000 en cámara' },
        { label: 'Alimentación', value: 'PoE 802.3at / DC 12V' },
        { label: 'Protección', value: 'IP67 · –40 °C a +60 °C' },
      ],
      accent: '#F09422',
      border: 'rgba(240,148,34,0.25)',
    },
    {
      badge: 'Vías expresas · Alto flujo',
      title: 'Radar + LPR 4K Premium',
      subtitle: '4K · Radar 60 GHz · 3 carriles · hasta 120 km/h',
      desc: 'Para autopistas urbanas, anillos viales y arterias de alta velocidad con 3 carriles. Resolución 4K (3840×2160) y mayor distancia de lectura para captura nítida a velocidades elevadas. Pensado para sistemas de enforcement metropolitano o interurbano.',
      specs: [
        { label: 'Resolución', value: '4K (3840×2160)' },
        { label: 'Carriles cubiertos', value: '3 (≥95% c/u)' },
        { label: 'Velocidad máxima', value: '120 km/h' },
        { label: 'Precisión radar', value: '±2 km/h' },
        { label: 'Distancia ANPR', value: 'Hasta 50 m' },
        { label: 'Registros lista negra', value: '20.000 en cámara' },
        { label: 'Alimentación', value: 'PoE 802.3at / DC 12V' },
        { label: 'Protección', value: 'IP67 · –40 °C a +60 °C' },
      ],
      accent: '#3D8A82',
      border: 'rgba(61,138,130,0.25)',
    },
  ];

  const serviceModes = [
    {
      icon: Layers,
      title: 'Upgrade sobre infraestructura existente',
      desc: 'Si ya opera cámaras LPR bajo contrato de mantención con Visionaria, incorporamos las capacidades de enforcement sobre la red instalada: actualización de firmware, integración con controladores semafóricos y activación de módulos de detección de infracciones.',
      tag: 'Sin reemplazar hardware',
      accent: '#F09422',
    },
    {
      icon: Building2,
      title: 'Nuevos puntos · Modelo concesión',
      desc: 'Visionaria financia, instala y opera los equipos. El municipio o servicio público recibe el sistema funcional y los reportes de infracciones sin desembolso inicial. El modelo de recuperación se estructura sobre los registros de infracción procesados.',
      tag: 'Inversión diferida',
      accent: '#3D8A82',
    },
    {
      icon: Radio,
      title: 'Plataforma de enforcement como servicio',
      desc: 'Los registros de infracción generados por el sistema alimentan directamente la plataforma de gestión de infracciones del municipio o del SEMTT. Reportes, evidencia fotográfica y datos de flujo disponibles vía API y portal web.',
      tag: 'EnforcementaaS',
      accent: '#C4A882',
    },
  ];

  const catiPoints = [
    'Obligatoriedad de fiscalización electrónica del tránsito en vías concesionadas y urbanas de alta congestión',
    'Registro automatizado de infracciones con evidencia fotográfica válida ante el Juzgado de Policía Local',
    'Interoperabilidad con el Registro Nacional de Infracciones del Ministerio de Transportes (SEMTT)',
    'Habilitación progresiva: comunas priorizadas según índice de siniestralidad vial CONASET',
  ];

  return (
    <div>
      {/* Hero */}
      <div
        className="text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #222018 0%, #1E1B18 100%)', borderLeft: '6px solid #F09422' }}
      >
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: '#F09422' }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-6 border"
            style={{ background: 'rgba(240,148,34,0.10)', borderColor: 'rgba(240,148,34,0.30)', color: '#F09422' }}>
            Política pública · Fiscalización vial
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight max-w-3xl">
            Ley CATI
            <span className="block text-2xl sm:text-3xl font-semibold mt-2 text-slate-300">
              Convivencia y Accidentes de Tránsito — Solución tecnológica para su implementación
            </span>
          </h1>
          <p className="mt-6 text-lg text-slate-300 max-w-2xl leading-relaxed">
            La Ley CATI exige fiscalización electrónica de infracciones de tránsito con evidencia fotográfica homologada. Visionaria entrega la plataforma completa — hardware, software y operación — sobre infraestructura nueva o existente ya bajo nuestra mantención.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href={`/${locale}/contacto`}
              className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-full transition-all glow-cyan-sm hover:glow-cyan"
              style={{ background: 'var(--accent)', color: '#1E1B18' }}
            >
              Solicitar propuesta técnica <ArrowRight size={16} />
            </Link>
            <Link
              href={`/${locale}/productos/lpr`}
              className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-full border transition-all hover:bg-white/5"
              style={{ borderColor: 'rgba(240,148,34,0.35)', color: '#F09422' }}
            >
              Ver plataforma LPR <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </div>

      {/* Contexto Ley CATI */}
      <section style={{ background: 'linear-gradient(135deg, #28221A 0%, #222018 100%)', borderBottom: '1px solid rgba(255,220,160,0.08)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#F09422' }}>Marco normativo</p>
              <h2 className="text-2xl font-extrabold text-white mb-4">¿Qué exige la Ley CATI?</h2>
              <p className="text-slate-300 leading-relaxed mb-6">
                La Ley 21.495 de Convivencia Vial y Accidentes de Tránsito establece un nuevo estándar para la fiscalización del tránsito en Chile, incorporando la tecnología como eje central de la detección y registro de infracciones. Su implementación progresiva abre una ventana crítica para municipios, servicios de tránsito y concesionarias.
              </p>
              <ul className="space-y-3">
                {catiPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle size={16} className="mt-0.5 flex-shrink-0" style={{ color: '#F09422' }} />
                    <span className="text-slate-300 text-sm leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: '2.000+', label: 'muertes anuales en siniestros viales', sub: 'Chile — CONASET 2023' },
                { value: '60%', label: 'de infracciones involucran exceso de velocidad', sub: 'o semáforo en rojo' },
                { value: '346', label: 'comunas con fiscalización pendiente', sub: 'bajo Ley CATI' },
                { value: '∞', label: 'evidencia fotográfica disponible en portal JPL', sub: 'con imagen homologada' },
              ].map(({ value, label, sub }) => (
                <div key={label} className="rounded-xl p-5 border" style={{ background: 'var(--card-bg)', borderColor: 'rgba(240,148,34,0.15)' }}>
                  <p className="text-3xl font-extrabold" style={{ color: '#F09422' }}>{value}</p>
                  <p className="text-sm text-white font-medium mt-1 leading-snug">{label}</p>
                  <p className="text-xs text-slate-500 mt-1">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Infracciones detectables */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#F09422' }}>Capacidades de detección</p>
          <h2 className="text-3xl font-extrabold text-white">Infracciones que el sistema registra automáticamente</h2>
          <p className="mt-3 text-slate-400 max-w-2xl mx-auto">Cada evento genera un registro con imagen, patente, velocidad o tipo de infracción, timestamp y coordenadas — evidencia válida para notificación y proceso ante el Juzgado de Policía Local.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {violations.map(({ icon: Icon, title, desc, accent }) => (
            <div key={title} className="rounded-2xl p-6 border flex flex-col gap-4" style={{ background: 'var(--card-bg)', borderColor: `${accent}25` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${accent}15` }}>
                <Icon size={20} style={{ color: accent }} />
              </div>
              <div>
                <h3 className="font-semibold text-white">{title}</h3>
                <p className="mt-2 text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Equipos — dos opciones */}
      <section style={{ background: 'linear-gradient(135deg, #28221A 0%, #1E1B18 100%)', borderTop: '1px solid rgba(255,220,160,0.08)', borderBottom: '1px solid rgba(255,220,160,0.08)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#3D8A82' }}>Hardware homologado</p>
            <h2 className="text-3xl font-extrabold text-white">Dos opciones para cada escenario</h2>
            <p className="mt-3 text-slate-400 max-w-2xl mx-auto">Misma arquitectura de software, misma plataforma de gestión. El equipo se elige según el tipo de vía, número de carriles y velocidad de operación.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {tiers.map(({ badge, title, subtitle, desc, specs, accent, border }) => (
              <div key={title} className="rounded-2xl border overflow-hidden" style={{ background: 'var(--card-bg)', borderColor: border }}>
                {/* Card header */}
                <div className="px-8 pt-8 pb-6" style={{ borderBottom: `1px solid ${border}` }}>
                  <span className="text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full border"
                    style={{ color: accent, borderColor: `${accent}40`, background: `${accent}10` }}>
                    {badge}
                  </span>
                  <h3 className="text-xl font-extrabold text-white mt-4">{title}</h3>
                  <p className="text-sm mt-1" style={{ color: accent }}>{subtitle}</p>
                  <p className="text-slate-400 text-sm leading-relaxed mt-3">{desc}</p>
                </div>
                {/* Specs */}
                <div className="px-8 py-6">
                  <p className="text-xs font-bold tracking-widest uppercase text-slate-500 mb-4">Especificaciones clave</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    {specs.map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-xs text-slate-500">{label}</p>
                        <p className="text-sm font-semibold text-white mt-0.5">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-slate-600 mt-6">Ambos modelos: ONVIF Profile G/M/S/T · API REST · MQTT · RS485 · Alarma I/O · PoE 802.3at · IP67 · Garantía 3/5 años</p>
        </div>
      </section>

      {/* Modelo de servicio */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#C4A882' }}>Modelo de implementación</p>
          <h2 className="text-3xl font-extrabold text-white">Enforcement como servicio</h2>
          <p className="mt-3 text-slate-400 max-w-2xl mx-auto">Visionaria opera más de 300 puntos LPR en la Región Metropolitana. La infraestructura ya instalada es la base para implementar enforcement CATI sin partir desde cero.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {serviceModes.map(({ icon: Icon, title, desc, tag, accent }) => (
            <div key={title} className="rounded-2xl p-7 border flex flex-col gap-4" style={{ background: 'var(--card-bg)', borderColor: `${accent}20` }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${accent}15` }}>
                  <Icon size={20} style={{ color: accent }} />
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full border" style={{ color: accent, borderColor: `${accent}35`, background: `${accent}10` }}>{tag}</span>
              </div>
              <div>
                <h3 className="font-semibold text-white">{title}</h3>
                <p className="mt-2 text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Integración con plataforma LPR existente */}
      <section style={{ background: 'linear-gradient(135deg, #28221A 0%, #222018 100%)', borderTop: '1px solid rgba(255,220,160,0.08)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#3D8A82' }}>Integración nativa</p>
              <h2 className="text-2xl font-extrabold text-white mb-4">Se suma a lo que ya existe</h2>
              <p className="text-slate-300 leading-relaxed mb-6">
                El módulo CATI se integra sobre la plataforma LPR/ANPR de Visionaria. Los registros de infracción comparten la misma base de datos que las alertas SEBV y los eventos SITIA — el operador gestiona todo desde una sola consola.
              </p>
              <ul className="space-y-3">
                {[
                  'Imagen de infracción + patente + velocidad en un único ticket',
                  'Exportación automática en formato requerido por SEMTT',
                  'Panel de supervisión de puntos de control con tasa de cumplimiento en tiempo real',
                  'Reportes automáticos por tramo, horario y tipo de infracción',
                  'Evidencia fotográfica almacenada con hash criptográfico para validez legal',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle size={15} className="mt-0.5 flex-shrink-0" style={{ color: '#3D8A82' }} />
                    <span className="text-slate-300 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl p-8 border" style={{ background: 'var(--card-bg)', borderColor: 'rgba(61,138,130,0.20)' }}>
              <p className="text-xs font-bold tracking-widest uppercase text-slate-500 mb-6">Flujo de un evento de infracción</p>
              {[
                { step: '01', title: 'Captura', desc: 'Radar detecta velocidad · cámara registra imagen de alta resolución con patente' },
                { step: '02', title: 'Reconocimiento', desc: 'Motor OCR identifica patente en <500 ms · atributos de vehículo asociados' },
                { step: '03', title: 'Validación', desc: 'Sistema contrasta con umbrales configurados (velocidad, carril, señal)' },
                { step: '04', title: 'Registro', desc: 'Ticket generado con evidencia, hash y metadatos · almacenado localmente y en plataforma central' },
                { step: '05', title: 'Notificación', desc: 'Alerta a operador · exportación al sistema de gestión de infracciones municipal o SEMTT' },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex gap-4 mb-5 last:mb-0">
                  <span className="text-xs font-extrabold w-6 flex-shrink-0 mt-0.5" style={{ color: '#3D8A82' }}>{step}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-3xl font-extrabold text-white mb-4">¿Su municipio o servicio necesita cumplir con la Ley CATI?</h2>
        <p className="text-slate-400 max-w-xl mx-auto mb-8">Evaluamos su infraestructura actual, definimos el modelo de implementación más conveniente y presentamos una propuesta técnica y económica sin costo.</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href={`/${locale}/contacto`}
            className="inline-flex items-center gap-2 font-semibold px-8 py-3 rounded-full transition-all glow-cyan-sm hover:glow-cyan"
            style={{ background: 'var(--accent)', color: '#1E1B18' }}
          >
            Solicitar evaluación gratuita <ArrowRight size={16} />
          </Link>
          <Link
            href={`/${locale}/productos/lpr`}
            className="inline-flex items-center gap-2 font-semibold px-8 py-3 rounded-full border transition-all hover:bg-white/5"
            style={{ borderColor: 'rgba(240,148,34,0.35)', color: '#F09422' }}
          >
            Plataforma LPR completa <ChevronRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
