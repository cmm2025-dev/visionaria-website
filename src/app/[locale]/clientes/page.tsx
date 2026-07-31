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

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
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
