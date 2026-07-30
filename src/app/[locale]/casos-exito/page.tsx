import { getTranslations } from 'next-intl/server';
import { ArrowRight, MapPin } from 'lucide-react';
import Link from 'next/link';

const featured = [
  {
    company: 'GORE Región Metropolitana',
    industry: 'Smart City',
    region: 'Región Metropolitana',
    result: '303 cámaras · 23 comunas · Proyecto más grande en Chile',
    detail: 'Red de televigilancia metropolitana integrada con Carabineros y UOCT, cubriendo las 23 comunas del Gran Santiago en una plataforma unificada.',
    accent: '#F09422',
  },
  {
    company: 'Municipalidad de Las Condes',
    industry: 'Televigilancia',
    region: 'Región Metropolitana',
    result: '23 proyectos ejecutados · Mayor recurrencia del portafolio',
    detail: 'Relación estratégica de largo plazo con el municipio de mayor recurrencia en el portafolio Visionaria, abarcando videovigilancia HD, LPR y reconocimiento facial.',
    accent: '#3D8A82',
  },
  {
    company: 'Municipalidad de La Reina',
    industry: 'Televigilancia',
    region: 'Región Metropolitana',
    result: '91 cámaras HD + pórticos LPR + reconocimiento facial PDI',
    detail: 'Sistema integrado de última generación con cámaras 4K, pórticos lectores de patentes y módulo de reconocimiento facial conectado a base de datos PDI.',
    accent: '#C4A882',
  },
  {
    company: 'Municipalidad de Puente Alto',
    industry: 'Seguridad Pública',
    region: 'Región Metropolitana',
    result: '11 proyectos ejecutados · Cobertura comunal completa',
    detail: 'Una de las comunas con mayor densidad poblacional del país, con red de televigilancia desplegada en múltiples etapas de expansión.',
    accent: '#F09422',
  },
  {
    company: 'GORE de Ñuble',
    industry: 'Smart City Regional',
    region: 'Región de Ñuble',
    result: '21 municipios beneficiarios · Cobertura regional 100%',
    detail: 'Proyecto regional de escala única: un solo contrato crea presencia operacional en los 21 municipios de la región, con postventa y soporte centralizado.',
    accent: '#3D8A82',
  },
  {
    company: 'Ruta de La Araucanía',
    industry: 'Seguridad Vial',
    region: 'Región de La Araucanía',
    result: '71 cámaras térmicas militares + analítica antiterrorismo',
    detail: 'Solución de alta complejidad con cámaras térmicas de grado militar y analítica de video para detección de amenazas en rutas críticas del sur de Chile.',
    accent: '#C4A882',
  },
  {
    company: 'Municipalidad de Santiago',
    industry: 'Ciudad Inteligente',
    region: 'Región Metropolitana',
    result: '15 proyectos ejecutados · Integración multisistémica',
    detail: 'Centro histórico y administrativo del país, con integración de videovigilancia, control de acceso y plataforma de despacho coordinada con Carabineros.',
    accent: '#F09422',
  },
  {
    company: 'Municipalidad de Arica',
    industry: 'Seguridad Pública',
    region: 'Región de Arica y Parinacota',
    result: '14 proyectos · Presencia sostenida en frontera norte',
    detail: 'Presencia de larga data en el extremo norte del país, con proyectos de videovigilancia en zona fronteriza de alta complejidad operacional.',
    accent: '#3D8A82',
  },
  {
    company: 'Codelco Salvador',
    industry: 'Minería',
    region: 'Región de Atacama',
    result: 'Plataforma unificada video-intrusión-acceso · enlaces 80km',
    detail: 'Solución industrial para operaciones mineras en zonas remotas: video, control de intrusión y acceso integrados con radioenlaces de hasta 80 kilómetros.',
    accent: '#C4A882',
  },
];

const presencia = [
  { region: 'Metropolitana', proyectos: 193, entidades: 39 },
  { region: 'Valparaíso', proyectos: 28, entidades: 10 },
  { region: 'Arica y Parinacota', proyectos: 14, entidades: 1 },
  { region: 'Tarapacá', proyectos: 4, entidades: 3 },
  { region: 'Coquimbo', proyectos: 5, entidades: 2 },
  { region: 'Maule', proyectos: 6, entidades: 1 },
  { region: 'Ñuble', proyectos: 1, entidades: 21 },
  { region: 'Antofagasta', proyectos: 1, entidades: 1 },
];

export default async function CasosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'cases' });

  return (
    <div>
      {/* Hero */}
      <div className="text-white py-20 px-4 relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #28221A 0%, #1E1B18 60%, #222018 100%)', borderLeft: '4px solid var(--accent)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: 'var(--accent)' }} />
        <div className="max-w-7xl mx-auto relative">
          <h1 className="text-4xl font-extrabold">{t('title')}</h1>
          <p className="mt-3 text-lg text-slate-300">{t('subtitle')}</p>
        </div>
      </div>

      {/* Presencia nacional — stats bar */}
      <div className="border-b" style={{ background: 'rgba(240,148,34,0.04)', borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { value: '80+', label: 'Municipios con presencia', sub: 'directa o vinculada' },
            { value: '10/16', label: 'Regiones cubiertas', sub: 'de Arica a Punta Arenas' },
            { value: '320+', label: 'Proyectos ejecutados', sub: 'desde 2002' },
            { value: '84%', label: 'Videovigilancia', sub: 'especialización del portafolio' },
          ].map(({ value, label, sub }) => (
            <div key={label}>
              <p className="text-3xl font-extrabold" style={{ color: 'var(--accent)' }}>{value}</p>
              <p className="mt-1 text-white text-sm font-semibold">{label}</p>
              <p className="text-slate-500 text-xs mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cases grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {featured.map(({ company, industry, region, result, detail, accent }) => (
            <Link
              key={company}
              href={`/${locale}/contacto`}
              className="rounded-2xl overflow-hidden border transition-all hover:glow-cyan-sm hover:scale-[1.02] flex flex-col cursor-pointer group"
              style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}
            >
              <div className="h-1 transition-all group-hover:h-1.5" style={{ background: accent }} />
              <div className="p-8 flex flex-col flex-1 gap-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-white leading-snug">{company}</h3>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full text-slate-300 shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }}>{industry}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <MapPin size={11} />
                  <span>{region}</span>
                </div>
                <p className="text-xs font-bold uppercase tracking-wider mt-1" style={{ color: 'var(--muted)' }}>Resultado clave</p>
                <p className="font-semibold text-sm leading-snug" style={{ color: accent }}>{result}</p>
                <p className="text-xs text-slate-500 leading-relaxed flex-1">{detail}</p>
                <div className="mt-2 inline-flex items-center gap-1 text-sm font-semibold transition-all group-hover:gap-2" style={{ color: 'var(--accent)' }}>
                  {t('read_more')} <ArrowRight size={14} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Presencia regional */}
      <section className="border-t" style={{ background: 'rgba(61,138,130,0.04)', borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-10">
            <p className="text-xs font-bold tracking-[0.3em] uppercase mb-2" style={{ color: 'var(--teal)' }}>Distribución geográfica</p>
            <h2 className="text-2xl font-bold text-white">Presencia en 10 regiones de Chile</h2>
            <p className="mt-2 text-slate-400 text-sm max-w-2xl">Desde Arica hasta el extremo sur, con proyectos activos en las principales regiones del país y cobertura completa en Ñuble.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {presencia.map(({ region, proyectos, entidades }) => (
              <div key={region} className="rounded-xl p-5 border" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
                <p className="text-white font-semibold text-sm mb-3">{region}</p>
                <div className="flex gap-4">
                  <div>
                    <p className="text-xl font-extrabold" style={{ color: 'var(--accent)' }}>{proyectos}</p>
                    <p className="text-xs text-slate-500 mt-0.5">proyectos</p>
                  </div>
                  <div>
                    <p className="text-xl font-extrabold" style={{ color: 'var(--teal)' }}>{entidades}</p>
                    <p className="text-xs text-slate-500 mt-0.5">entidades</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-slate-600 text-center">Datos del portafolio histórico Visionaria · Corte julio 2026</p>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t" style={{ borderColor: 'var(--border)', background: 'var(--background)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold text-white">¿Tu municipio o institución no aparece aquí?</h3>
            <p className="mt-1 text-slate-400 text-sm">Conversemos — 265 municipalidades aún no tienen cobertura de televigilancia integrada.</p>
          </div>
          <Link
            href={`/${locale}/contacto`}
            className="shrink-0 inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-lg shadow-lg transition-all hover:brightness-110"
            style={{ background: 'var(--accent)', color: '#1E1B18' }}
          >
            Contactar a Visionaria <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Presencia regional */}
      <section className="border-t" style={{ background: 'rgba(61,138,130,0.04)', borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-10">
            <p className="text-xs font-bold tracking-[0.3em] uppercase mb-2" style={{ color: 'var(--teal)' }}>Distribución geográfica</p>
            <h2 className="text-2xl font-bold text-white">Presencia en 10 regiones de Chile</h2>
            <p className="mt-2 text-slate-400 text-sm max-w-2xl">Desde Arica hasta el extremo sur, con proyectos activos en las principales regiones del país y cobertura completa en Ñuble.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {presencia.map(({ region, proyectos, entidades }) => (
              <div key={region} className="rounded-xl p-5 border" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
                <p className="text-white font-semibold text-sm mb-3">{region}</p>
                <div className="flex gap-4">
                  <div>
                    <p className="text-xl font-extrabold" style={{ color: 'var(--accent)' }}>{proyectos}</p>
                    <p className="text-xs text-slate-500 mt-0.5">proyectos</p>
                  </div>
                  <div>
                    <p className="text-xl font-extrabold" style={{ color: 'var(--teal)' }}>{entidades}</p>
                    <p className="text-xs text-slate-500 mt-0.5">entidades</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-slate-600 text-center">Datos del portafolio histórico Visionaria · Corte julio 2026</p>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t" style={{ borderColor: 'var(--border)', background: 'var(--background)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold text-white">¿Tu municipio o institución no aparece aquí?</h3>
            <p className="mt-1 text-slate-400 text-sm">Conversemos — 265 municipalidades aún no tienen cobertura de televigilancia integrada.</p>
          </div>
          <Link
            href={`/${locale}/contacto`}
            className="shrink-0 inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-lg shadow-lg transition-all hover:brightness-110"
            style={{ background: 'var(--accent)', color: '#1E1B18' }}
          >
            Contactar a Visionaria <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
