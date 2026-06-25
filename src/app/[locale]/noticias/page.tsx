import { getTranslations } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

const newsItems = [
  { date: '2025-05-20', tag: 'Smart City', title: 'Visionaria expande red de televigilancia en Gran Santiago a 26 comunas', excerpt: 'Nuevo contrato con GORE Metropolitano amplía la cobertura con 120 nuevas cámaras HD y analítica de comportamiento.' },
  { date: '2025-04-15', tag: 'Tecnología', title: 'Implementación de reconocimiento facial en tiempo real integrado con PDI', excerpt: 'Sistema biométrico instalado en 8 municipalidades permite identificar personas con alertas vigentes en menos de 2 segundos.' },
  { date: '2025-03-10', tag: 'Proyecto', title: 'Pórticos lectores de patentes en accesos de Autopista Central', excerpt: 'Nueva red LPR lee y cruza datos con el Registro Civil y Carabineros para detección automática de vehículos con órdenes de aprehensión.' },
  { date: '2025-02-28', tag: 'Industria', title: 'Plataforma unificada de despacho reducirá tiempos de respuesta en minería', excerpt: 'Sistema integrado de video-intrusión-acceso en operación minera en la zona norte conecta 3 centros de control en tiempo real.' },
  { date: '2025-01-18', tag: 'Innovación', title: 'Visionaria integra drones DJI a plataforma de despacho municipal', excerpt: 'Las aeronaves autónomas se activan automáticamente ante alertas del sistema de videovigilancia, reduciendo tiempos de respuesta a menos de 4 minutos.' },
  { date: '2024-12-05', tag: 'Empresa', title: 'Visionaria cumple 22 años liderando la seguridad tecnológica en Chile', excerpt: 'Con más de 3.700 cámaras instaladas y presencia en todo el territorio nacional, celebramos dos décadas protegiendo ciudades y organizaciones.' },
];

const tagStyles: Record<string, { color: string; bg: string }> = {
  'Smart City': { color: '#F09422', bg: 'rgba(240,148,34,0.12)' },
  Tecnología: { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  Proyecto: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  Industria: { color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  Innovación: { color: '#fb923c', bg: 'rgba(251,146,60,0.12)' },
  Empresa: { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
};

export default async function NoticiasPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'news' });

  return (
    <div>
      <div className="text-white py-20 px-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #060d2e 0%, #0a1545 100%)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: 'var(--accent)' }} />
        <div className="max-w-7xl mx-auto relative">
          <h1 className="text-4xl font-extrabold">{t('title')}</h1>
          <p className="mt-3 text-lg text-slate-300">{t('subtitle')}</p>
        </div>
      </div>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {newsItems.map(({ date, tag, title, excerpt }) => {
            const style = tagStyles[tag] ?? { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' };
            return (
              <article
                key={title}
                className="rounded-2xl p-7 border flex flex-col gap-4 transition-all hover:glow-cyan-sm"
                style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ color: style.color, background: style.bg }}>{tag}</span>
                  <time className="text-xs text-slate-500">{date}</time>
                </div>
                <h3 className="text-lg font-bold text-white leading-snug">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed flex-1">{excerpt}</p>
                <Link href="#" className="inline-flex items-center gap-1 text-sm font-medium transition-colors hover:brightness-125" style={{ color: 'var(--accent)' }}>
                  {t('read_more')} <ArrowRight size={14} />
                </Link>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
