import Link from 'next/link';
import { Shield, Camera, Car, KeyRound, Plane, Leaf, ArrowRight, CheckCircle, type LucideIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

const ICONS: Record<string, LucideIcon> = { Shield, Camera, Car, KeyRound, Plane, Leaf };

interface Module { id: string; icon: string; color: string; bg: string; title: string; desc: string; bullets: string[] }
interface Benefit { title: string; desc: string; color: string; icon: string }
interface Stat { val: string; label: string }

export default async function SmartCitiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'smartCities' });
  const c = await getTranslations({ locale, namespace: 'common' });

  const modules = t.raw('modules') as Module[];
  const benefits = t.raw('benefits') as Benefit[];
  const challenges = t.raw('challenges_list') as string[];
  const responseStats = t.raw('response_stats') as Stat[];

  return (
    <div style={{ background: '#1E1B18', minHeight: '100vh' }}>

      {/* Hero */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #28221A 0%, #1E1B18 60%, #221E18 100%)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(ellipse at 70% 50%, rgba(61,138,130,0.08) 0%, transparent 60%)',
        }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-bold tracking-[0.3em] uppercase mb-4" style={{ color: '#3D8A82' }}>
                {t('eyebrow')}
              </p>
              <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight">
                {t('hero_title_line1')}<br />
                <span style={{ color: '#3D8A82' }}>{t('hero_title_accent')}</span><br />
                {t('hero_title_line3')}
              </h1>
              <p className="mt-6 text-lg text-slate-300 leading-relaxed">
                {t('hero_desc')}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  href={`/${locale}/contacto`}
                  className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-full transition-all glow-cyan-sm hover:glow-cyan"
                  style={{ background: '#3D8A82', color: '#1E1B18' }}
                >
                  {t('cta_demo')} <ArrowRight size={16} />
                </Link>
                <Link
                  href={`/${locale}/casos-exito`}
                  className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-full border text-white hover:bg-white/5 transition-colors"
                  style={{ borderColor: 'rgba(255,255,255,0.2)' }}
                >
                  {t('cta_cases')}
                </Link>
              </div>
            </div>

            {/* Santiago hero image */}
            <div className="relative rounded-2xl overflow-hidden border" style={{ aspectRatio: '16/10', borderColor: 'rgba(61,138,130,0.2)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/feeds/sc-hero.jpg" alt={t('hero_image_alt')} className="absolute inset-0 w-full h-full object-cover object-center" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(4,13,32,0.7) 0%, transparent 50%)' }} />
              <div className="absolute bottom-0 left-0 p-5">
                <p className="text-xs font-mono font-bold tracking-widest" style={{ color: 'rgba(61,138,130,0.8)' }}>{t('hero_image_caption')}</p>
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
              {t('challenges_title')}
            </h2>
            <p className="mt-5 text-slate-400 leading-relaxed">
              {t('challenges_desc')}
            </p>
            <ul className="mt-6 space-y-3">
              {challenges.map(item => (
                <li key={item} className="flex items-start gap-3 text-slate-300">
                  <CheckCircle size={18} className="shrink-0 mt-0.5" style={{ color: '#3D8A82' }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl p-8 border" style={{ background: 'rgba(61,138,130,0.04)', borderColor: 'rgba(61,138,130,0.15)' }}>
            <p className="text-sm font-bold tracking-widest uppercase mb-4" style={{ color: '#F09422' }}>{t('response_eyebrow')}</p>
            <p className="text-white text-lg font-semibold leading-relaxed">
              {t('response_title')}
            </p>
            <p className="mt-4 text-slate-400 leading-relaxed">
              {t('response_desc')}
            </p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              {responseStats.map(({ val, label }) => (
                <div key={label} className="rounded-xl p-4 border" style={{ background: 'rgba(0,0,0,0.2)', borderColor: 'rgba(61,138,130,0.1)' }}>
                  <p className="text-xl font-extrabold" style={{ color: '#3D8A82' }}>{val}</p>
                  <p className="text-[10px] text-slate-400 mt-1 leading-tight">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Módulos */}
      <section style={{ background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(61,138,130,0.08)', borderBottom: '1px solid rgba(61,138,130,0.08)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-14">
            <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3" style={{ color: '#3D8A82' }}>{t('modules_eyebrow')}</p>
            <h2 className="text-3xl font-extrabold text-white">{t('modules_title')}</h2>
            <p className="mt-3 text-slate-400">{t('modules_desc')}</p>
          </div>
          <div className="flex flex-col gap-12">
            {modules.map(({ id, icon, color, bg, title, desc, bullets }, i) => {
              const Icon = ICONS[icon];
              const isTrafico = id === 'traffic';
              return (
                <div key={id} className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                  <div className={`rounded-2xl p-8 border flex flex-col gap-5 ${i % 2 === 1 ? 'lg:order-2' : ''}`} style={{ background: 'rgba(4,13,32,0.8)', borderColor: `${color}25` }}>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
                        <Icon size={28} style={{ color }} />
                      </div>
                      <h3 className="text-2xl font-bold text-white">{title}</h3>
                    </div>
                    <p className="text-slate-400 leading-relaxed">{desc}</p>
                    {isTrafico && (
                      <div className="rounded-xl overflow-hidden mt-2" style={{ aspectRatio: '16/9' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/feeds/sc-trafico.jpg" alt={t('traffic_image_alt')} className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                  <div className={`flex flex-col gap-3 ${i % 2 === 1 ? 'lg:order-1' : ''}`}>
                    {bullets.map(b => (
                      <div key={b} className="flex items-start gap-3 rounded-xl px-5 py-3.5 border" style={{ background: 'rgba(4,13,32,0.6)', borderColor: 'rgba(255,255,255,0.06)' }}>
                        <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: color }} />
                        <p className="text-slate-300 text-sm leading-relaxed">{b}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-14">
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3" style={{ color: '#3D8A82' }}>{t('benefits_eyebrow')}</p>
          <h2 className="text-3xl font-extrabold text-white">{t('benefits_title')}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {benefits.map(({ title, desc, color, icon }) => (
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
        <h2 className="text-3xl font-extrabold text-white">{t('cta_title')}</h2>
        <p className="mt-4 text-slate-400 max-w-xl mx-auto">
          {t('cta_desc')}
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={`/${locale}/contacto`}
            className="inline-flex items-center gap-2 font-semibold px-8 py-3.5 rounded-full transition-all glow-cyan-sm hover:glow-cyan"
            style={{ background: '#3D8A82', color: '#1E1B18' }}
          >
            {t('cta_primary')} <ArrowRight size={16} />
          </Link>
          <Link
            href={`/${locale}/casos-exito`}
            className="inline-flex items-center gap-2 font-semibold px-8 py-3.5 rounded-full border text-white hover:bg-white/5 transition-colors"
            style={{ borderColor: 'rgba(255,255,255,0.2)' }}
          >
            {t('cta_secondary')}
          </Link>
        </div>
      </section>
    </div>
  );
}
