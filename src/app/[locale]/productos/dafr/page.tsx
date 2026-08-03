import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, CheckCircle, Clock, Radio, Video, Zap, type LucideIcon } from 'lucide-react';
import HeroVideoBackground from '@/components/HeroVideoBackground';
import DAFRVideoPanel from '@/components/DAFRVideoPanel';
import CaseVideoCard from '@/components/CaseVideoCard';
import ScrollCue from '@/components/ScrollCue';

const ICONS: Record<string, LucideIcon> = { Clock, Video, Radio, Zap };

interface Feature { icon: string; color: string; title: string; desc: string }
interface Step { label: string; time: string; color: string; desc: string }
interface Stat { val: string; label: string; color: string }
interface Colored { color: string; title: string; desc: string }
interface HardwareGroup { color: string; title: string; items: string[] }
interface PrivacyRegion { flag: string; title: string; desc: string; color: string }

export default async function DAFRPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'dafr' });
  const c = await getTranslations({ locale, namespace: 'common' });

  const features = t.raw('features') as Feature[];
  const steps = t.raw('steps') as Step[];
  const whyBullets = t.raw('why_bullets') as string[];
  const whyStats = t.raw('why_stats') as Stat[];
  const accessories = t.raw('accessories') as Colored[];
  const hardwareGroups = t.raw('hardware_groups') as HardwareGroup[];
  const deployments = t.raw('deployments') as Colored[];
  const flighthubFeatures = t.raw('flighthub_features') as Colored[];
  const flighthubLabels = t.raw('flighthub_labels') as string[];
  const privacyRegions = t.raw('privacy_regions') as PrivacyRegion[];
  const flighthubColors = ['#3D8A82', '#34d399', '#C4A882', '#F09422'];

  return (
    <div style={{ background: '#1E1B18', minHeight: '100vh' }}>

      {/* Hero */}
      <div className="relative overflow-hidden py-20 lg:py-28">
        {/* Video background — desktop only, ver HeroVideoBackground */}
        <HeroVideoBackground
          sources={['/dafr-hero-bg.mp4']}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Overlay */}
        <div
          className="absolute inset-0"
          style={{
            zIndex: 1,
            background: 'linear-gradient(135deg, rgba(20,16,12,0.80) 0%, rgba(20,16,12,0.55) 50%, rgba(20,16,12,0.35) 100%)',
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative" style={{ zIndex: 2 }}>
          <div className="max-w-3xl">
            <p className="text-xs font-bold tracking-[0.3em] uppercase mb-4" style={{ color: '#F09422', textShadow: '0 1px 6px rgba(0,0,0,0.7)' }}>
              {t('hero_eyebrow')}
            </p>
            <h1 className="text-4xl lg:text-6xl font-extrabold text-white leading-tight" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}>
              {t('hero_title_1')}<br />
              <span style={{ color: '#F09422' }}>{t('hero_title_2')}</span><br />
              {t('hero_title_3')}
            </h1>
            <p className="mt-6 text-lg text-slate-300 leading-relaxed max-w-2xl" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.7)' }}>
              {t('hero_desc')}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href={`/${locale}/contacto`}
                className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-full transition-all"
                style={{ background: '#F09422', color: '#1E1B18' }}
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
        </div>
        <ScrollCue label={c('scroll_cue')} />
      </div>

      {/* Video demo */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3" style={{ color: '#F09422' }}>{t('video_eyebrow')}</p>
          <h2 className="text-3xl font-extrabold text-white">{t('video_title')}</h2>
          <p className="mt-3 text-slate-400">{t('video_desc')}</p>
        </div>
        <DAFRVideoPanel videoId="IfCDJXEi-w4" />
        <ScrollCue label={c('scroll_cue')} />
      </section>

      {/* Flujo operacional */}
      <section style={{ background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(240,148,34,0.08)', borderBottom: '1px solid rgba(240,148,34,0.08)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3" style={{ color: '#F09422' }}>{t('protocol_eyebrow')}</p>
            <h2 className="text-3xl font-extrabold text-white">{t('protocol_title')}</h2>
          </div>
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-6 top-6 bottom-6 w-px hidden lg:block" style={{ background: 'linear-gradient(to bottom, #F09422, #3D8A82, #34d399)' }} />
            <div className="flex flex-col gap-6 lg:pl-16">
              {steps.map(({ label, time, color, desc }) => (
                <div key={label} className="flex items-start gap-5">
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full border-2 flex items-center justify-center hidden lg:flex" style={{ borderColor: color, background: 'rgba(4,13,32,0.9)', boxShadow: `0 0 12px ${color}50` }}>
                      <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                    </div>
                    {/* Mobile dot */}
                    <div className="w-3 h-3 rounded-full mt-2 lg:hidden" style={{ background: color }} />
                  </div>
                  <div className="rounded-xl p-5 border flex-1" style={{ background: 'rgba(4,13,32,0.7)', borderColor: `${color}20` }}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-bold tracking-widest" style={{ color }}>{label}</span>
                      <span className="text-xs font-mono text-slate-500">{time}</span>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <ScrollCue label={c('scroll_cue')} />
        </div>
      </section>

      {/* Capacidades */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3" style={{ color: '#F09422' }}>{t('tech_eyebrow')}</p>
          <h2 className="text-3xl font-extrabold text-white">{t('tech_title')}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map(({ icon, color, title, desc }) => {
            const Icon = ICONS[icon];
            return (
              <div key={title} className="rounded-2xl p-8 border flex flex-col gap-4" style={{ background: 'rgba(4,13,32,0.8)', borderColor: `${color}25` }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
                  <Icon size={24} style={{ color }} />
                </div>
                <h3 className="text-lg font-bold text-white">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            );
          })}
        </div>
        <ScrollCue label={c('scroll_cue')} />
      </section>

      {/* Beneficios clave */}
      <section style={{ background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(240,148,34,0.08)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3" style={{ color: '#F09422' }}>{t('why_eyebrow')}</p>
              <h2 className="text-3xl font-extrabold text-white mb-6">{t('why_title')}</h2>
              <div className="flex flex-col gap-3">
                {whyBullets.map(b => (
                  <div key={b} className="flex items-start gap-3">
                    <CheckCircle size={18} className="shrink-0 mt-0.5" style={{ color: '#F09422' }} />
                    <p className="text-slate-300 text-sm leading-relaxed">{b}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {whyStats.map(({ val, label, color }) => (
                <div key={label} className="rounded-2xl p-6 border text-center" style={{ background: 'rgba(4,13,32,0.9)', borderColor: `${color}30` }}>
                  <p className="text-3xl font-extrabold" style={{ color }}>{val}</p>
                  <p className="text-slate-400 text-xs mt-2 leading-tight">{label}</p>
                </div>
              ))}
            </div>
          </div>
          <ScrollCue label={c('scroll_cue')} />
        </div>
      </section>

      {/* Accesorios DJI Dock 3 */}
      <section style={{ background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(167,139,250,0.1)', borderBottom: '1px solid rgba(167,139,250,0.1)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3" style={{ color: '#C4A882' }}>{t('dji_eyebrow')}</p>
            <h2 className="text-3xl font-extrabold text-white">{t('dji_title')}</h2>
            <p className="mt-3 text-slate-400">{t('dji_desc')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {accessories.map(({ color, title, desc }) => (
              <div key={title} className="rounded-2xl p-6 border flex gap-4" style={{ background: 'rgba(4,13,32,0.8)', borderColor: `${color}25` }}>
                <div className="w-2 rounded-full shrink-0" style={{ background: color, minHeight: '40px' }} />
                <div>
                  <h3 className="font-bold text-white text-sm mb-2">{title}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <ScrollCue label={c('scroll_cue')} />
        </div>
      </section>

      {/* DJI Dock 3 — Especificaciones */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3" style={{ color: '#F09422' }}>{t('hardware_eyebrow')}</p>
          <h2 className="text-3xl font-extrabold text-white">{t('hardware_title')}</h2>
          <p className="mt-3 text-slate-400 max-w-2xl mx-auto">{t('hardware_desc')}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {hardwareGroups.map(({ color, title, items }) => (
            <div key={title} className="rounded-2xl p-6 border flex flex-col gap-3" style={{ background: 'rgba(4,13,32,0.8)', borderColor: `${color}25` }}>
              <h3 className="font-bold text-white text-sm">{title}</h3>
              <ul className="flex flex-col gap-2">
                {items.map(item => (
                  <li key={item} className="flex items-start gap-2 text-slate-400 text-xs leading-relaxed">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: color }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Implementación en cualquier lugar */}
      <section style={{ background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(61,138,130,0.08)', borderBottom: '1px solid rgba(61,138,130,0.08)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3" style={{ color: '#3D8A82' }}>{t('deploy_eyebrow')}</p>
            <h2 className="text-3xl font-extrabold text-white">{t('deploy_title')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {deployments.map(({ color, title, desc }) => (
              <div key={title} className="flex gap-4 rounded-2xl p-6 border" style={{ background: 'rgba(4,13,32,0.7)', borderColor: `${color}20` }}>
                <div className="w-1 rounded-full shrink-0" style={{ background: color }} />
                <div>
                  <h3 className="font-bold text-white mb-2">{title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <ScrollCue label={c('scroll_cue')} />
        </div>
      </section>

      {/* Rutas automatizadas */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3" style={{ color: '#C4A882' }}>{t('flighthub_eyebrow')}</p>
            <h2 className="text-3xl font-extrabold text-white mb-4">{t('flighthub_title')}</h2>
            <p className="text-slate-400 leading-relaxed mb-6">{t('flighthub_desc')}</p>
            <div className="flex flex-col gap-4">
              {flighthubFeatures.map(({ color, title, desc }) => (
                <div key={title} className="flex gap-3 rounded-xl px-5 py-4 border" style={{ background: 'rgba(4,13,32,0.7)', borderColor: `${color}20` }}>
                  <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: color }} />
                  <div>
                    <p className="text-white font-semibold text-sm">{title}</p>
                    <p className="text-slate-400 text-xs leading-relaxed mt-1">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {flighthubLabels.map((label, i) => (
              <div key={label} className="rounded-2xl p-6 flex items-center justify-center text-center border min-h-[100px]"
                style={{ background: `radial-gradient(ellipse at center, ${flighthubColors[i]}15 0%, rgba(4,13,32,0.9) 70%)`, borderColor: `${flighthubColors[i]}30` }}>
                <p className="text-xs font-bold tracking-widest" style={{ color: flighthubColors[i] }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
        <ScrollCue label={c('scroll_cue')} />
      </section>

      {/* Seguridad de datos */}
      <section style={{ background: 'rgba(0,0,0,0.4)', borderTop: '1px solid rgba(240,148,34,0.08)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3" style={{ color: '#F09422' }}>{t('privacy_eyebrow')}</p>
            <h2 className="text-3xl font-extrabold text-white">{t('privacy_title')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {privacyRegions.map(({ flag, title, desc, color }) => (
              <div key={title} className="rounded-2xl p-8 border flex gap-5" style={{ background: 'rgba(4,13,32,0.8)', borderColor: `${color}25` }}>
                <div className="text-4xl shrink-0">{flag}</div>
                <div>
                  <h3 className="font-bold text-white mb-3" style={{ color }}>{title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA + Caso real */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-10">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-extrabold text-white">{t('final_cta_title')}</h2>
            <p className="mt-4 text-slate-400 max-w-xl">
              {t('final_cta_desc')}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                href={`/${locale}/contacto`}
                className="inline-flex items-center gap-2 font-semibold px-8 py-3.5 rounded-full transition-all"
                style={{ background: '#F09422', color: '#1E1B18' }}
              >
                {c('talk_to_specialist')} <ArrowRight size={16} />
              </Link>
              <Link
                href={`/${locale}/productos`}
                className="inline-flex items-center gap-2 font-semibold px-8 py-3.5 rounded-full border text-white hover:bg-white/5 transition-colors"
                style={{ borderColor: 'rgba(255,255,255,0.2)' }}
              >
                {t('final_cta_secondary')}
              </Link>
            </div>
          </div>
          <CaseVideoCard
            videoId="o_HdKiM1MEE"
            poster="/dafr-loop/asheville-poster.jpg"
            eyebrow={t('case_eyebrow')}
            title={t('case_title')}
          />
        </div>
      </section>
    </div>
  );
}
