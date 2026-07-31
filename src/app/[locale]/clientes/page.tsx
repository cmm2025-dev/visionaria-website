import ScrollCue from '@/components/ScrollCue';

const CLIENTS = [
  { name: 'Municipalidad de Las Condes', logo: '/clientes/las-condes.png' },
  { name: 'Gobierno Regional de Ñuble', logo: '/clientes/nuble.png' },
  { name: 'Municipalidad de Santiago', logo: '/clientes/santiago.png' },
  { name: 'Subsecretaría de Prevención del Delito', logo: '/clientes/spd.png' },
  { name: 'Ruta de la Araucanía', logo: '/clientes/ruta-araucania.png' },
  { name: 'Ruta de Los Ríos', logo: '/clientes/ruta-los-rios.png' },
  { name: 'Municipalidad de Puente Alto', logo: '/clientes/puente-alto.png' },
  { name: 'Municipalidad de Algarrobo', logo: '/clientes/algarrobo.png' },
];

const TESTIMONIALS = [
  {
    quote: 'Esta es una iniciativa emblemática del Gobierno Regional que busca fortalecer la seguridad en toda nuestra región mediante tecnología de punta, incluyendo inteligencia artificial, para prevenir delitos y contar con medios probatorios en caso de incidentes.',
    name: 'Óscar Crisóstomo',
    role: 'Gobernador Regional de Ñuble',
  },
  {
    quote: 'Valoro profundamente la sintonía que tenemos con el Gobierno Regional en materia de seguridad, porque esta alianza nos permite potenciar la vigilancia y la persecución de la delincuencia con un claro enfoque preventivo. Hoy inauguramos 26 cámaras y cuatro puntos de Wi-Fi, una inversión que agradezco, y que además proyectamos complementar con pórticos para detectar vehículos con encargo por robo, porque nuestro objetivo es garantizar tranquilidad tanto en la comuna como en toda la región.',
    name: 'Jorge Del Pozo',
    role: 'Alcalde de Chillán Viejo',
  },
  {
    quote: 'Herramienta fantástica y eficaz para combatir los delitos.',
    name: 'Enrique Zamora',
    role: 'Prefecto Inspector, PDI',
  },
  {
    quote: 'Reforzar nuestro servicio, analizar y focalizar de manera eficiente el trabajo policial.',
    name: 'Sandra Vargas',
    role: 'Coronel, Jefa del Departamento de Operaciones Policiales de Ñuble, Carabineros',
  },
  {
    quote: 'Han funcionado de maravilla, lo que nos tiene seguros y tranquilos como vecinos.',
    name: 'Cecilia Tauda',
    role: 'Presidenta, Junta de Vecinos Hacienda Naranjo del Futuro',
  },
];

export default function ClientesPage() {
  return (
    <div style={{ background: '#1E1B18', minHeight: '100vh' }}>
      <div className="text-white py-20 px-4 relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #28221A 0%, #1E1B18 100%)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: '#F09422' }} />
        <div className="max-w-7xl mx-auto relative">
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-4" style={{ color: '#F09422' }}>
            Confianza institucional
          </p>
          <h1 className="text-4xl lg:text-5xl font-extrabold">Clientes principales</h1>
          <p className="mt-4 text-lg text-slate-300 max-w-2xl">
            Instituciones públicas y privadas que confían en Visionaria para proteger a sus comunidades.
          </p>
        </div>
        <ScrollCue label="Seguir explorando" />
      </div>

      {/* Caso de éxito — Chillán Viejo / GORE Ñuble */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-4">
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3" style={{ color: '#F09422' }}>Caso de éxito</p>
          <h2 className="text-3xl font-extrabold text-white">Chillán Viejo inaugura sistema de televigilancia con 26 cámaras</h2>
          <p className="mt-3 text-slate-400 max-w-2xl mx-auto">
            Proyecto del Gobierno Regional de Ñuble por $3.656 millones para 209 cámaras de alta gama en toda la región,
            con sala de monitoreo municipal, salas espejo en Carabineros y PDI, y análisis con inteligencia artificial
            mediante el convenio SITIA con la Subsecretaría de Prevención del Delito.
          </p>
          <p className="mt-2 text-xs text-slate-500">Fuente: La Discusión, 18 de marzo de 2026</p>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {TESTIMONIALS.map(({ quote, name, role }) => (
            <blockquote
              key={name}
              className="rounded-2xl p-6 border flex flex-col gap-4"
              style={{ background: 'rgba(4,13,32,0.6)', borderColor: 'rgba(240,148,34,0.18)' }}
            >
              <p className="text-slate-200 text-sm leading-relaxed">&ldquo;{quote}&rdquo;</p>
              <footer className="mt-auto">
                <p className="text-sm font-bold text-white">{name}</p>
                <p className="text-xs text-slate-500">{role}</p>
              </footer>
            </blockquote>
          ))}
        </div>
        <ScrollCue label="Seguir explorando" />
      </section>

      {/* Emblemas institucionales */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3" style={{ color: '#F09422' }}>Más instituciones</p>
          <h2 className="text-2xl font-extrabold text-white">Confían en Visionaria</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
          {CLIENTS.map(({ name, logo }) => (
            <div
              key={name}
              className="flex items-center justify-center p-6 transition-all hover:scale-[1.05]"
              style={{ minHeight: 120 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo} alt={name} title={name} className="max-h-16 max-w-full object-contain" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
