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

export default function ClientsHero() {
  return (
    <section className="w-full py-20 px-4" style={{ background: '#1E1B18' }}>
      <div className="max-w-7xl mx-auto text-center">
        <p className="text-xs font-bold tracking-[0.3em] uppercase mb-4" style={{ color: '#F09422' }}>
          Confianza institucional
        </p>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-14">
          Clientes principales
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
          {CLIENTS.map(({ name, logo }) => (
            <div
              key={name}
              className="flex items-center justify-center rounded-2xl border p-6 transition-all hover:scale-[1.03]"
              style={{ background: '#FAFAF8', borderColor: 'rgba(240,148,34,0.15)', minHeight: 120 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo} alt={name} title={name} className="max-h-16 max-w-full object-contain" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
