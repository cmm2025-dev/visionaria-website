import { getTranslations } from 'next-intl/server';
import { ArrowRight, MapPin } from 'lucide-react';
import Link from 'next/link';
import ScrollCue from '@/components/ScrollCue';
import ProjectsCarousel from '@/components/ProjectsCarousel';

interface Case { company: string; industry: string; region: string; result: string; detail: string; accent: string }
interface Stat { value: string; label: string; sub: string }
interface Presence { region: string; proyectos: number; entidades: number }

export default async function CasosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'cases' });
  const c = await getTranslations({ locale, namespace: 'common' });

  const featured = t.raw('featured') as Case[];
  const stats = t.raw('stats') as Stat[];
  const presencia = t.raw('presencia') as Presence[];

  return (
    <div>
      {/* Hero */}
      <div className="text-white py-20 px-4 relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #28221A 0%, #1E1B18 60%, #222018 100%)', borderLeft: '4px solid var(--accent)' }}>
        <ProjectsCarousel viewLabel={t('gallery_view')} />
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: 'var(--accent)' }} />
        <div className="max-w-7xl mx-auto relative">
          <h1 className="text-4xl font-extrabold">{t('title')}</h1>
          <p className="mt-3 text-lg text-slate-300">{t('subtitle')}</p>
        </div>
        <ScrollCue label={c('scroll_cue')} />
      </div>

      {/* Presencia nacional — stats bar */}
      <div className="border-b" style={{ background: 'rgba(240,148,34,0.04)', borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {stats.map(({ value, label, sub }) => (
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
                <p className="text-xs font-bold uppercase tracking-wider mt-1" style={{ color: 'var(--muted)' }}>{t('result')}</p>
                <p className="font-semibold text-sm leading-snug" style={{ color: accent }}>{result}</p>
                <p className="text-xs text-slate-500 leading-relaxed flex-1">{detail}</p>
                <div className="mt-2 inline-flex items-center gap-1 text-sm font-semibold transition-all group-hover:gap-2" style={{ color: 'var(--accent)' }}>
                  {t('read_more')} <ArrowRight size={14} />
                </div>
              </div>
            </Link>
          ))}
        </div>
        <ScrollCue label={c('scroll_cue')} />
      </section>

      {/* Presencia regional */}
      <section className="border-t" style={{ background: 'rgba(61,138,130,0.04)', borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-10">
            <p className="text-xs font-bold tracking-[0.3em] uppercase mb-2" style={{ color: 'var(--teal)' }}>{t('presence_eyebrow')}</p>
            <h2 className="text-2xl font-bold text-white">{t('presence_title')}</h2>
            <p className="mt-2 text-slate-400 text-sm max-w-2xl">{t('presence_desc')}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {presencia.map(({ region, proyectos, entidades }) => (
              <div key={region} className="rounded-xl p-5 border" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
                <p className="text-white font-semibold text-sm mb-3">{region}</p>
                <div className="flex gap-4">
                  <div>
                    <p className="text-xl font-extrabold" style={{ color: 'var(--accent)' }}>{proyectos}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{t('presence_projects_label')}</p>
                  </div>
                  <div>
                    <p className="text-xl font-extrabold" style={{ color: 'var(--teal)' }}>{entidades}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{t('presence_entities_label')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-slate-600 text-center">{t('presence_footnote')}</p>
        </div>
        <ScrollCue label={c('scroll_cue')} />
      </section>

      {/* CTA */}
      <section className="border-t" style={{ borderColor: 'var(--border)', background: 'var(--background)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold text-white">{t('cta_title')}</h3>
            <p className="mt-1 text-slate-400 text-sm">{t('cta_desc')}</p>
          </div>
          <Link
            href={`/${locale}/contacto`}
            className="shrink-0 inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-lg shadow-lg transition-all hover:brightness-110"
            style={{ background: 'var(--accent)', color: '#1E1B18' }}
          >
            {t('cta_button')} <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
