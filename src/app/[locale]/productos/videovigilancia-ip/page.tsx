import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, Brain, Route, ScanFace, Users, AlertTriangle, Eye, type LucideIcon } from 'lucide-react';
import HeroVideoBackground from '@/components/HeroVideoBackground';
import ScrollCue from '@/components/ScrollCue';

const ICONS: Record<string, LucideIcon> = { Brain, Route, ScanFace, Users, AlertTriangle, Eye };

interface Feature { icon: string; color: string; title: string; desc: string }
interface Spec { label: string; value: string }
interface Colored { color: string; title: string; desc: string }
interface Stat { val: string; label: string; color: string }

export default async function IPVideoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'ipVideo' });
  const c = await getTranslations({ locale, namespace: 'common' });

  const analyticsFeatures = t.raw('analytics_features') as Feature[];
  const specs = t.raw('specs') as Spec[];
  const agnosticBrands = t.raw('agnostic_brands') as string[];
  const iotFeatures = t.raw('iot_features') as Colored[];
  const whyBullets = t.raw('why_bullets') as string[];
  const whyStats = t.raw('why_stats') as Stat[];

  return (
    <div style={{ background: '#1E1B18', minHeight: '100vh' }}>

      {/* Hero */}
      <div className="relative overflow-hidden py-20 lg:py-28">
        {/* Video background — desktop only, ver HeroVideoBackground */}
        <HeroVideoBackground
          sources={['/ip-video-hero-bg.mp4']}
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

      {/* Analítica e IA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-14">
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3" style={{ color: '#F09422' }}>{t('analytics_eyebrow')}</p>
          <h2 className="text-3xl font-extrabold text-white">{t('analytics_title')}</h2>
          <p className="mt-3 text-slate-400 max-w-2xl mx-auto">{t('analytics_desc')}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {analyticsFeatures.map(({ icon, color, title, desc }) => {
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

      {/* Especificaciones de la plataforma VMS */}
      <section style={{ background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(240,148,34,0.08)', borderBottom: '1px solid rgba(240,148,34,0.08)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3" style={{ color: '#F09422' }}>{t('specs_eyebrow')}</p>
            <h2 className="text-3xl font-extrabold text-white">{t('specs_title')}</h2>
          </div>
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--card-bg)' }}>
            {specs.map(({ label, value }, i) => (
              <div
                key={label}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-6 py-4"
                style={i > 0 ? { borderTop: '1px solid var(--border)' } : undefined}
              >
                <span className="text-slate-400 text-sm">{label}</span>
                <span className="text-white font-semibold text-sm">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agnósticos por diseño */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3" style={{ color: '#3D8A82' }}>{t('agnostic_eyebrow')}</p>
          <h2 className="text-3xl font-extrabold text-white">{t('agnostic_title')}</h2>
          <p className="mt-4 text-slate-400 max-w-2xl mx-auto leading-relaxed">{t('agnostic_desc')}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          {agnosticBrands.map(brand => (
            <div
              key={brand}
              className="px-8 py-5 rounded-xl border text-white font-bold text-lg tracking-wide"
              style={{ background: 'rgba(4,13,32,0.8)', borderColor: 'rgba(61,138,130,0.25)' }}
            >
              {brand}
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-slate-500 max-w-xl mx-auto">{t('agnostic_note')}</p>
      </section>

      {/* IoT + VMS */}
      <section style={{ background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(61,138,130,0.08)', borderBottom: '1px solid rgba(61,138,130,0.08)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3" style={{ color: '#3D8A82' }}>{t('iot_eyebrow')}</p>
              <h2 className="text-3xl font-extrabold text-white mb-4">{t('iot_title')}</h2>
              <p className="text-slate-400 leading-relaxed">{t('iot_desc')}</p>
            </div>
            <div className="flex flex-col gap-4">
              {iotFeatures.map(({ color, title, desc }) => (
                <div key={title} className="flex gap-4 rounded-2xl p-6 border" style={{ background: 'rgba(4,13,32,0.7)', borderColor: `${color}20` }}>
                  <div className="w-1 rounded-full shrink-0" style={{ background: color }} />
                  <div>
                    <h3 className="font-bold text-white text-sm mb-1.5">{title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <ScrollCue label={c('scroll_cue')} />
        </div>
      </section>

      {/* Por qué Visionaria */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3" style={{ color: '#F09422' }}>{t('why_eyebrow')}</p>
            <h2 className="text-3xl font-extrabold text-white mb-6">{t('why_title')}</h2>
            <div className="flex flex-col gap-3">
              {whyBullets.map(b => (
                <div key={b} className="flex items-start gap-3 rounded-xl px-5 py-3.5 border" style={{ background: 'rgba(4,13,32,0.6)', borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: '#F09422' }} />
                  <p className="text-slate-300 text-sm leading-relaxed">{b}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {whyStats.map(({ val, label, color }) => (
              <div key={label} className="rounded-2xl p-6 border text-center" style={{ background: 'rgba(4,13,32,0.9)', borderColor: `${color}30` }}>
                <p className="text-2xl font-extrabold" style={{ color }}>{val}</p>
                <p className="text-slate-400 text-xs mt-2 leading-tight">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section style={{ background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(240,148,34,0.08)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h2 className="text-3xl font-extrabold text-white">{t('final_cta_title')}</h2>
          <p className="mt-4 text-slate-400 max-w-xl mx-auto">{t('final_cta_desc')}</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
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
      </section>
    </div>
  );
}
