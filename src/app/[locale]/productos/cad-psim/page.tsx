import { getTranslations } from 'next-intl/server';
import { ArrowRight, MonitorCheck, Layers, Camera, Car, Smartphone, Bell, Phone, Wind, MapPin, BarChart2, Shield, FileText, TrendingUp, ClipboardCheck, Table2, Lock } from 'lucide-react';
import Link from 'next/link';

export default async function CadPsimPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'products' });

  const capabilities = [
    { icon: MonitorCheck, title: 'Despacho asistido (CAD)', desc: 'Recepción, clasificación, geolocalización, despacho de recursos y trazabilidad completa de cada incidente, en una única consola operativa.' },
    { icon: Layers, title: 'Integración PSIM', desc: 'Una sola vista de cámaras, alarmas, control de acceso y sensores, con correlación de eventos y conciencia situacional en tiempo real.' },
    { icon: Camera, title: 'Videovigilancia y analítica', desc: 'Monitoreo en vivo con analítica de video que detecta y prioriza eventos relevantes para el operador.' },
    { icon: Car, title: 'Reconocimiento de matrículas (LPR)', desc: 'Lectura automática de patentes (ALPR/LPR) para control vehicular, alertas y apoyo a investigaciones.' },
    { icon: Smartphone, title: 'App ciudadana', desc: 'Botón de pánico y reporte para la comunidad, disponible en las tiendas móviles y conectado al centro de control.' },
    { icon: Bell, title: 'Red de alarmas comunitarias', desc: 'Alarmas vecinales integradas al centro, con activación y respuesta coordinada por el operador.' },
    { icon: Phone, title: 'Telefonía de emergencias', desc: 'Gestión unificada de las llamadas de emergencia dentro del mismo flujo de incidentes.' },
    { icon: Wind, title: 'Dron como primera respuesta', desc: 'Despacho aéreo ágil ante un evento, para reconocimiento y conciencia situacional antes de la llegada de recursos terrestres.' },
    { icon: MapPin, title: 'GPS y seguimiento', desc: 'Posición de recursos y móviles en tiempo real sobre el mapa regional para una asignación óptima.' },
    { icon: BarChart2, title: 'Accesos municipales', desc: 'Cada comuna opera su propio nodo con autonomía, dentro de una red regional colaborativa e interoperable.' },
  ];

  const traceability = [
    { icon: TrendingUp, title: 'Tiempos de respuesta', desc: 'Detección, despacho y resolución medidos en cada incidente, para identificar cuellos de botella y mejorar.' },
    { icon: FileText, title: 'Trazabilidad del caso', desc: 'Línea de tiempo completa y auditable de cada evento: quién lo recibió, cómo se clasificó y qué recursos se despacharon.' },
    { icon: BarChart2, title: 'Desempeño operativo', desc: 'Volumen y tipo de incidentes por comuna, zona, turno y operador, con tendencias en el tiempo.' },
    { icon: ClipboardCheck, title: 'Cumplimiento de protocolos', desc: 'Verificación de que cada situación se atendió según el protocolo definido, con alertas ante desviaciones.' },
    { icon: Table2, title: 'Reportes y tableros', desc: 'Tableros en vivo y reportes periódicos para la autoridad y el municipio, listos para la rendición de cuentas.' },
    { icon: Lock, title: 'Evidencia y auditoría', desc: 'Registro íntegro y evidencia asociada, disponible para auditorías, investigaciones y toma de decisiones.' },
  ];

  const benefits = [
    { title: 'Un estándar regional homogéneo', desc: 'Todas las comunas operan bajo la misma plataforma y los mismos protocolos, con una experiencia de seguridad equivalente en todo el territorio.' },
    { title: 'Respuesta más rápida', desc: 'La correlación de eventos y el despacho asistido acortan los tiempos de detección y de reacción ante un incidente.' },
    { title: 'Optimización de recursos públicos', desc: 'Una infraestructura compartida evita la duplicación de inversiones municipales y aprovecha economías de escala.' },
    { title: 'Escalable y a prueba de futuro', desc: 'La arquitectura crece por módulos y suma nuevas tecnologías —IA de video, drones, IoT— a medida que el territorio lo necesita.' },
  ];

  const techChips = ['CCTV', 'Drones / DFR', 'LPR / ALPR', 'Reconocimiento facial', 'Comunicaciones microondas', 'IoT', 'LoRaWAN', '5G', 'Bodycams', 'Demos multisensor', 'IA de video', 'Videoanalítica'];

  const financing = [
    { title: 'FNDR', desc: 'Fondo Nacional de Desarrollo Regional: el principal vehículo de inversión de los Gobiernos Regionales, idóneo para proyectos de alcance regional.' },
    { title: 'Seguridad pública', desc: 'Recursos orientados a prevención del delito y seguridad ciudadana, como el Fondo Nacional de Seguridad Pública y las subvenciones regionales de seguridad.' },
    { title: 'FRIL / PMU', desc: 'Para componentes de menor escala o mejoramiento: Fondo Regional de Iniciativa Local y Programa de Mejoramiento Urbano.' },
    { title: 'Convenios y sectorial', desc: 'Convenios de programación entre el GORE y servicios sectoriales, y aportes municipales complementarios.' },
  ];

  return (
    <div>
      {/* Hero */}
      <div className="text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #060d2e 0%, #0d1a5e 100%)', borderLeft: '6px solid #a78bfa' }}>
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: '#a78bfa' }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
          <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: '#a78bfa' }}>
            Portafolio de soluciones · Protección ciudadana
          </p>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight max-w-2xl">
            Plataforma CAD/PSIM
            <span className="block text-2xl sm:text-3xl font-semibold mt-2 text-slate-300">Protección ciudadana integrada, a escala regional</span>
          </h1>
          <p className="mt-6 text-lg text-slate-300 max-w-2xl leading-relaxed">
            Unificamos los recursos de seguridad de todo un territorio —videovigilancia, alarmas, control de acceso, telefonía de emergencia y más— en una sola plataforma que coordina la operación y acorta los tiempos de respuesta.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href={`/${locale}/contacto`} className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-all hover:brightness-110" style={{ background: '#a78bfa' }}>
              Conversemos sobre tu territorio <ArrowRight size={16} />
            </Link>
            <a href="#capacidades" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold border border-white/30 text-white hover:bg-white/10 transition-all">
              Ver capacidades
            </a>
          </div>
        </div>
      </div>

      {/* Manifesto */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <p className="text-xs font-bold tracking-widest uppercase mb-6" style={{ color: '#a78bfa' }}>Nuestra mirada</p>
        <blockquote className="text-3xl sm:text-4xl font-bold text-white leading-snug max-w-3xl border-l-4 pl-6 mb-8" style={{ borderColor: '#a78bfa' }}>
          Ver no es lo mismo que responder.
        </blockquote>
        <p className="text-slate-300 text-lg max-w-3xl leading-relaxed mb-10">
          Un muro de monitores observa, registra y disuade, pero no decide quién actúa, cómo lo hace, ni deja trazabilidad de lo ocurrido. Un sistema de televigilancia no es, por sí solo, una plataforma de despacho (CAD); y una plataforma CAD tampoco reemplaza a las cámaras. Son piezas distintas y complementarias.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl mb-8">
          <div className="rounded-xl p-6 border" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
            <p className="text-xs font-bold tracking-widest uppercase text-slate-500 mb-2">Ver</p>
            <h3 className="text-white font-bold text-lg mb-2">Una sala de televigilancia</h3>
            <p className="text-slate-400 text-sm">Observa, registra y disuade; aporta evidencia. Pero no coordina la respuesta ni gestiona el caso.</p>
          </div>
          <div className="rounded-xl p-6 border" style={{ background: 'var(--card-bg)', borderColor: '#a78bfa40' }}>
            <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: '#a78bfa' }}>Actuar</p>
            <h3 className="text-white font-bold text-lg mb-2">Una plataforma CAD/PSIM</h3>
            <p className="text-slate-400 text-sm">Integra la información, decide y despacha recursos, y deja trazabilidad completa de cada incidente.</p>
          </div>
        </div>
        <p className="font-bold text-white text-base">No son lo mismo — se potencian.</p>
      </section>

      {/* El orden correcto */}
      <section className="py-16 px-4" style={{ background: 'linear-gradient(135deg, #0a0f2e 0%, #0d1a5e 100%)' }}>
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#a78bfa' }}>El orden correcto</p>
          <h2 className="text-3xl font-extrabold text-white mb-2">Primero la operación; la tecnología, a su servicio.</h2>
          <p className="text-slate-400 mb-10">Por eso partimos por la operación y la gestión de casos. La tecnología viene después — a potenciarla, no a reemplazarla.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { n: '1', title: 'Saber cómo actuar', desc: 'Protocolos claros para cada tipo de situación.' },
              { n: '2', title: 'Coordinar e interactuar', desc: 'Que los organismos operen juntos, no en silos.' },
              { n: '3', title: 'Gestionar cada caso', desc: 'Registro, seguimiento y cierre de cada incidente.' },
              { n: '4', title: 'Sumar tecnología', desc: 'Cámaras, sensores y analítica al servicio de esa operación.' },
            ].map(s => (
              <div key={s.n}>
                <p className="text-5xl font-extrabold mb-2" style={{ color: '#a78bfa' }}>{s.n}</p>
                <h4 className="text-white font-bold mb-1">{s.title}</h4>
                <p className="text-slate-400 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* La solución */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#a78bfa' }}>La solución</p>
        <h2 className="text-3xl font-extrabold text-white mb-4">Una sola plataforma para toda la región</h2>
        <p className="text-slate-400 text-lg max-w-3xl mb-8 leading-relaxed">
          La plataforma combina dos capas complementarias. Una <strong className="text-white">capa de integración (PSIM)</strong> reúne en una sola vista los sistemas de seguridad distribuidos —cámaras, analítica, alarmas, control de acceso y sensores—, correlaciona eventos y entrega conciencia situacional. Una <strong className="text-white">capa de despacho asistido (CAD)</strong> gestiona el ciclo completo del incidente: recepción, clasificación, geolocalización, despacho de recursos y trazabilidad.
        </p>
        <p className="text-slate-400 max-w-3xl mb-10 leading-relaxed">
          Todo se despliega sobre una arquitectura <strong className="text-white">hub-and-spoke</strong>: un nodo central de alcance regional concentra la información y la coordinación, mientras cada comuna opera con un nodo local de acceso independiente. El resultado es un estándar de protección homogéneo para todo el territorio, sin duplicar inversiones.
        </p>
        <div className="flex flex-wrap gap-4 mb-12">
          {[
            { b: 'Cobertura multi-comuna', s: 'Un mismo estándar en todo el territorio' },
            { b: 'Operación coordinada', s: 'Centro regional 24/7' },
            { b: 'Plataforma interoperable', s: 'Integra la tecnología existente' },
          ].map(st => (
            <div key={st.b} className="rounded-xl px-6 py-4 border-l-4 border" style={{ background: 'var(--card-bg)', borderColor: '#a78bfa', borderLeftColor: '#a78bfa' }}>
              <strong className="text-white block">{st.b}</strong>
              <span className="text-slate-400 text-sm">{st.s}</span>
            </div>
          ))}
        </div>

        {/* Architecture diagram */}
        <div className="max-w-lg mx-auto">
          <p className="text-xs font-bold tracking-widest uppercase mb-4 text-center" style={{ color: '#a78bfa' }}>Arquitectura · Hub-and-Spoke</p>
          <div className="flex flex-col gap-0 rounded-2xl overflow-hidden border" style={{ borderColor: '#a78bfa40' }}>
            <div className="px-6 py-4 text-center text-white font-bold" style={{ background: 'rgba(167,139,250,0.2)', borderBottom: '1px solid rgba(167,139,250,0.2)' }}>
              Sala de control regional · Operadores
            </div>
            <div className="text-center text-xl py-2" style={{ color: '#a78bfa' }}>▲</div>
            <div className="px-6 py-4 text-center border-b" style={{ background: 'var(--card-bg)', borderColor: 'rgba(167,139,250,0.2)' }}>
              <strong className="text-white">Capa CAD — Despacho asistido</strong>
              <p className="text-slate-400 text-sm mt-1">Recepción · Clasificación · Geolocalización · Despacho · Trazabilidad</p>
            </div>
            <div className="text-center text-xl py-2" style={{ color: '#a78bfa' }}>▲</div>
            <div className="px-6 py-4 text-center border-b" style={{ background: 'var(--card-bg)', borderColor: 'rgba(167,139,250,0.2)' }}>
              <strong className="text-white">Capa PSIM — Integración</strong>
              <p className="text-slate-400 text-sm mt-1">Conciencia situacional unificada · correlación de eventos</p>
            </div>
            <div className="text-center text-xl py-2" style={{ color: '#a78bfa' }}>▲</div>
            <div className="px-6 py-4 text-center" style={{ background: 'rgba(167,139,250,0.05)' }}>
              <strong className="text-slate-300">Fuentes y dispositivos</strong>
              <p className="text-slate-500 text-sm mt-1">Cámaras · Analítica · Alarmas · GPS · Control de acceso · App · Telefonía</p>
            </div>
          </div>
          <p className="text-slate-500 text-sm text-center mt-4">
            Cada comuna dispone de un <strong className="text-slate-300">acceso municipal independiente</strong> con autonomía operativa dentro de la red regional.
          </p>
        </div>
      </section>

      {/* Capacidades */}
      <section id="capacidades" className="py-20 px-4" style={{ background: 'linear-gradient(135deg, #060d2e 0%, #0a1545 100%)' }}>
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#a78bfa' }}>Capacidades</p>
          <h2 className="text-3xl font-extrabold text-white mb-3">Lo que hace la plataforma</h2>
          <p className="text-slate-400 mb-10">Capacidades centrales que operan de forma coordinada dentro de una misma consola.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl p-6 border flex flex-col gap-4 transition-all hover:glow-cyan-sm" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(167,139,250,0.12)' }}>
                  <Icon size={20} style={{ color: '#a78bfa' }} />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">{title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integración tecnológica */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#a78bfa' }}>Integración</p>
        <h2 className="text-3xl font-extrabold text-white mb-3">Tecnologías que se integran</h2>
        <p className="text-slate-400 mb-8">La plataforma incorpora y correlaciona un ecosistema amplio de tecnologías de seguridad y ciudad inteligente.</p>
        <div className="flex flex-wrap gap-3">
          {techChips.map(chip => (
            <span key={chip} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold text-slate-300" style={{ borderColor: 'rgba(167,139,250,0.4)', background: 'rgba(167,139,250,0.06)' }}>
              {chip}
            </span>
          ))}
        </div>
      </section>

      {/* Trazabilidad */}
      <section className="py-20 px-4" style={{ background: 'linear-gradient(135deg, #0a0f2e 0%, #0d1a5e 100%)' }}>
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#a78bfa' }}>Trazabilidad y accountability</p>
          <h2 className="text-3xl font-extrabold text-white mb-3">Gestión que se puede medir y auditar</h2>
          <p className="text-slate-400 mb-10 max-w-2xl">En la gestión pública, lo que no se puede medir no se puede mejorar —ni rendir cuentas. Cada incidente queda registrado de principio a fin.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {traceability.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl p-6 border flex flex-col gap-4" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(167,139,250,0.12)' }}>
                  <Icon size={20} style={{ color: '#a78bfa' }} />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">{title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#a78bfa' }}>Impacto</p>
        <h2 className="text-3xl font-extrabold text-white mb-10">Qué gana el territorio</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {benefits.map(({ title, desc }) => (
            <div key={title} className="flex gap-4">
              <span className="flex-shrink-0 mt-2 w-3 h-3 rotate-45 rounded-sm" style={{ background: '#a78bfa' }} />
              <div>
                <h3 className="text-white font-bold text-lg mb-1">{title}</h3>
                <p className="text-slate-400 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Para quién */}
      <section className="py-16 px-4" style={{ background: 'linear-gradient(135deg, #060d2e 0%, #0a1545 100%)' }}>
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#a78bfa' }}>Para quién</p>
          <h2 className="text-3xl font-extrabold text-white mb-8">Pensada para el sector público</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { title: 'Gobiernos regionales', desc: 'Un estándar de protección ciudadana homogéneo para todas las comunas de la región.' },
              { title: 'Municipios', desc: 'Un nodo propio con autonomía operativa, integrado a la red regional.' },
              { title: 'Seguridad pública', desc: 'Coordinación entre organismos y trazabilidad completa del incidente.' },
            ].map(w => (
              <div key={w.title} className="rounded-2xl p-6 border" style={{ background: 'var(--card-bg)', borderColor: 'rgba(167,139,250,0.3)' }}>
                <h3 className="text-white font-bold text-lg mb-2">{w.title}</h3>
                <p className="text-slate-400 text-sm">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Financiamiento */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#a78bfa' }}>Financiamiento</p>
        <h2 className="text-3xl font-extrabold text-white mb-3">De la idea al presupuesto</h2>
        <p className="text-slate-400 mb-8 max-w-2xl">Muchas iniciativas de seguridad no avanzan por una sola razón: no está claro con qué recursos se financian. Te ayudamos a identificar la partida adecuada y a formular el proyecto para que sea elegible.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {financing.map(({ title, desc }) => (
            <div key={title} className="rounded-2xl p-5 border-l-4" style={{ background: 'var(--card-bg)', borderColor: '#a78bfa' }}>
              <h3 className="text-white font-bold mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
        <div className="rounded-2xl p-6 border-l-4 mb-4" style={{ background: 'rgba(167,139,250,0.06)', borderColor: '#a78bfa' }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { n: '1 · Formulación', s: 'Estructuramos el proyecto con su justificación técnica y económica.' },
              { n: '2 · Evaluación · SNI / RS', s: 'Preparamos el ingreso al Sistema Nacional de Inversiones para obtener la Recomendación Satisfactoria.' },
              { n: '3 · Gestión ante DIPRES / GORE', s: 'Acompañamos la solicitud y la asignación presupuestaria.' },
            ].map(s => (
              <div key={s.n}>
                <strong className="text-white block mb-1">{s.n}</strong>
                <span className="text-slate-400 text-sm">{s.s}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-slate-500 text-sm max-w-3xl">
          El instrumento aplicable depende de la naturaleza, escala y titularidad de cada iniciativa, y debe validarse con el GORE y la DIPRES. Visionaria acompaña la identificación y formulación; no sustituye la evaluación de la autoridad.
        </p>
      </section>

      {/* CTA */}
      <section className="py-20 px-4" style={{ background: 'linear-gradient(135deg, #0a0f2e 0%, #0d1a5e 100%)', borderLeft: '6px solid #a78bfa' }}>
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#a78bfa' }}>Hablemos</p>
          <h2 className="text-3xl font-extrabold text-white mb-3">Lleva esta plataforma a tu región</h2>
          <p className="text-slate-400 mb-8">Diseñamos el alcance a la medida de tu territorio, sobre la infraestructura que ya tienes.</p>
          <div className="rounded-2xl p-8 border flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between" style={{ background: 'rgba(167,139,250,0.06)', borderColor: 'rgba(167,139,250,0.3)' }}>
            <div>
              <p className="text-white font-bold text-xl">Visionaria</p>
              <p className="text-slate-400 mb-3">Integradores de tecnología para seguridad pública</p>
              <p className="text-slate-300 text-sm leading-loose">
                <a href="mailto:info@visionaria.cl" className="hover:underline" style={{ color: '#a78bfa' }}>info@visionaria.cl</a><br />
                +56 2 2925 4140
              </p>
            </div>
            <Link href={`/${locale}/contacto`} className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white whitespace-nowrap transition-all hover:brightness-110" style={{ background: '#a78bfa' }}>
              Solicitar una presentación <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
