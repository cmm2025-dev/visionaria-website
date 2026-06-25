import { Shield, Cpu, BarChart3 } from 'lucide-react';

const pillars = [
  {
    icon: Shield,
    title: 'Seguridad Ciudadana',
    desc: 'Nuestro propósito central es proteger a las personas. Cada cámara, cada sensor, cada algoritmo existe para que los ciudadanos puedan vivir, transitar y desarrollarse en entornos seguros.',
    accent: '#F09422',
    bg: 'rgba(240,148,34,0.08)',
  },
  {
    icon: Cpu,
    title: 'Integración de Sistemas',
    desc: 'No vendemos tecnología aislada. Conectamos videovigilancia, reconocimiento facial, lectores de patentes, drones y plataformas de despacho en un ecosistema unificado que opera como un solo sistema inteligente.',
    accent: '#00d4ff',
    bg: 'rgba(0,212,255,0.08)',
  },
  {
    icon: BarChart3,
    title: 'Eficiencia del Recurso Público',
    desc: 'Diseñamos soluciones que maximizan el impacto de cada peso invertido por municipios, gobernaciones y organismos públicos: más cobertura, menos tiempos de respuesta, mejor toma de decisiones.',
    accent: '#34d399',
    bg: 'rgba(52,211,153,0.08)',
  },
];

export default function Manifesto() {
  return (
    <section className="w-full py-24 px-4" style={{ background: 'linear-gradient(180deg, #060d2e 0%, #0a1440 50%, #060d2e 100%)' }}>
      <div className="max-w-7xl mx-auto">

        {/* Headline */}
        <div className="text-center mb-16 max-w-4xl mx-auto">
          <p className="text-sm font-bold tracking-[0.3em] mb-4 uppercase" style={{ color: '#F09422' }}>
            Nuestra razón de ser
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-6">
            Tecnología integrada al servicio de{' '}
            <span style={{ color: '#F09422' }}>la seguridad de las personas</span>
          </h2>
          <p className="text-lg text-slate-300 leading-relaxed">
            Visionaria promueve activamente la integración de sistemas tecnológicos con un único propósito:
            <strong className="text-white"> resguardar la seguridad de la ciudadanía</strong>, dotando a las instituciones
            públicas de herramientas que persiguen la eficiencia operacional y la optimización de los recursos del Estado.
          </p>
        </div>

        {/* Divider line with glow */}
        <div className="relative mb-16">
          <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, #F09422, transparent)' }} />
          <div className="absolute left-1/2 -top-3 -translate-x-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center" style={{ borderColor: '#F09422', background: '#060d2e' }}>
            <div className="w-2 h-2 rounded-full" style={{ background: '#F09422' }} />
          </div>
        </div>

        {/* Three pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {pillars.map(({ icon: Icon, title, desc, accent, bg }) => (
            <div
              key={title}
              className="rounded-2xl p-8 border flex flex-col gap-5 transition-all hover:glow-cyan-sm"
              style={{ background: bg, borderColor: `${accent}25` }}
            >
              <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: `${accent}15`, border: `1px solid ${accent}30` }}>
                <Icon size={26} style={{ color: accent }} />
              </div>
              <h3 className="text-xl font-bold text-white">{title}</h3>
              <p className="text-slate-400 leading-relaxed text-sm">{desc}</p>
            </div>
          ))}
        </div>

        {/* Quote / statement */}
        <div
          className="rounded-3xl p-10 md:p-14 text-center border relative overflow-hidden"
          style={{ background: 'rgba(240,148,34,0.04)', borderColor: 'rgba(240,148,34,0.2)' }}
        >
          {/* Background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 blur-3xl opacity-10 pointer-events-none" style={{ background: '#F09422' }} />

          <p className="text-2xl sm:text-3xl font-light text-white leading-relaxed relative z-10 max-w-4xl mx-auto italic">
            "Una ciudad más segura no requiere más recursos —{' '}
            <span className="font-bold not-italic" style={{ color: '#F09422' }}>
              requiere sistemas que trabajen juntos con inteligencia.
            </span>
            "
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <div className="h-px w-12" style={{ background: '#F09422', opacity: 0.5 }} />
            <span className="text-sm tracking-widest text-slate-400 uppercase">Visionaria · Desde 2002</span>
            <div className="h-px w-12" style={{ background: '#F09422', opacity: 0.5 }} />
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: '+3.700', label: 'Cámaras en operación', sub: 'en tiempo real' },
            { value: '+60%', label: 'Participación de mercado', sub: 'seguridad pública Chile' },
            { value: '< 2 min', label: 'Tiempo de respuesta', sub: 'detección a despliegue' },
            { value: '40+', label: 'Municipalidades', sub: 'de Arica a Punta Arenas' },
          ].map(({ value, label, sub }) => (
            <div key={label} className="text-center p-6 rounded-2xl border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <p className="text-3xl font-extrabold mb-1" style={{ color: '#F09422' }}>{value}</p>
              <p className="text-white text-sm font-semibold">{label}</p>
              <p className="text-slate-500 text-xs mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
