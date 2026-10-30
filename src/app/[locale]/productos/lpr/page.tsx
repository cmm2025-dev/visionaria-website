import { getTranslations } from 'next-intl/server';
import {
  ArrowRight, Car, Shield, Database, Search, BarChart2,
  Lock, FileText, MapPin, CheckCircle, AlertCircle, Clock,
  Building2, Network, ChevronRight, type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import LprHeroVisual from '@/components/LprHeroVisual';
import HeroVideoBackground from '@/components/HeroVideoBackground';

const ICONS: Record<string, LucideIcon> = {
  Car, Shield, Database, Search, BarChart2, Lock, FileText, MapPin, CheckCircle,
  AlertCircle, Clock, Building2, Network,
};

interface Capability { icon: string; title: string; desc: string; accent: string }
interface Integration { name: string; full: string; desc: string; badge: string; color: string }
interface Stat3 { value: string; label: string; sub: string }
interface Stat2 { value: string; label: string }
interface Spec { param: string; value: string }
interface IconTitleDesc { icon: string; title: string; desc: string }
interface TitleDesc { title: string; desc: string }
interface FlowStep { label: string; sub: string }

export default async function LprPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'lpr' });
  const c = await getTranslations({ locale, namespace: 'common' });

  const capabilities = t.raw('capabilities') as Capability[];
  const integrations = t.raw('integrations') as Integration[];
  const caseStats = t.raw('case_stats') as Stat3[];
  const heroStats = t.raw('hero_stats') as Stat2[];
  const specs = t.raw('specs') as Spec[];
  const regulatory = t.raw('regulatory') as IconTitleDesc[];
  const useCases = t.raw('use_cases') as IconTitleDesc[];
  const implementationNotes = t.raw('implementation_notes') as TitleDesc[];
  const catiTags = t.raw('cati_tags') as string[];
  const caseTags = t.raw('case_tags') as string[];
  const archFlow = t.raw('arch_flow') as FlowStep[];

  return (
    <div>
      {/* Hero */}
      <div className="text-white relative overflow-hidden" style={{ borderLeft: '6px solid #C4A882' }}>
        {/* Video background — desktop only, ver HeroVideoBackground */}
        <HeroVideoBackground
          sources={['/lpr-hero-bg.mp4']}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Overlay: darkens video so text stays readable, with brand tint */}
        <div
          className="absolute inset-0"
          style={{
            zIndex: 1,
            background: 'linear-gradient(135deg, rgba(20,16,12,0.72) 0%, rgba(20,16,12,0.50) 50%, rgba(20,16,12,0.30) 100%)',
          }}
        />

        {/* Subtle left-edge gradient to reinforce the border-left accent */}
        <div
          className="absolute inset-y-0 left-0 w-32 pointer-events-none"
          style={{ zIndex: 2, background: 'linear-gradient(to right, rgba(196,168,130,0.08), transparent)' }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative" style={{ zIndex: 3 }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: text */}
            <div>
              <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: '#C4A882' }}>
                {t('hero_eyebrow')}
              </p>
              <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}>
                {t('hero_title')}
                <span className="block text-2xl sm:text-3xl font-semibold mt-2 text-slate-300">
                  {t('hero_subtitle')}
                </span>
              </h1>
              <p className="mt-6 text-lg text-slate-300 leading-relaxed" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.7)' }}>
                {t('hero_desc')}
              </p>

              {/* Hero stats */}
              <div className="mt-10 flex flex-wrap gap-8">
                {heroStats.map(({ value, label }) => (
                  <div key={label}>
                    <p className="text-3xl font-extrabold" style={{ color: '#C4A882' }}>{value}</p>
                    <p className="text-sm text-slate-400 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href={`/${locale}/contacto`}
                  className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-full transition-all glow-cyan-sm hover:glow-cyan"
                  style={{ background: 'var(--accent)', color: '#1E1B18' }}
                >
                  {t('cta_primary')} <ArrowRight size={16} />
                </Link>
                <Link
                  href={`/${locale}/casos-exito`}
                  className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-full border transition-all hover:bg-white/5"
                  style={{ borderColor: 'rgba(196,168,130,0.4)', color: '#C4A882' }}
                >
                  {t('cta_secondary')} <ChevronRight size={16} />
                </Link>
              </div>
            </div>

            {/* Right: animated LPR simulation */}
            <div>
              <LprHeroVisual />
            </div>
          </div>
        </div>
      </div>

      {/* Ley CATI — sección destacada */}
      <section
        className="border-y"
        style={{ background: 'linear-gradient(135deg, #2A2018 0%, #1E1B18 100%)', borderColor: 'rgba(240,148,34,0.15)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex flex-col lg:flex-row gap-10 items-center">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-5"
                style={{ background: 'rgba(240,148,34,0.10)', border: '1px solid rgba(240,148,34,0.30)', color: '#F09422' }}>
                {t('cati_badge')}
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                {t('cati_title')}<br />
                <span className="text-slate-300 font-semibold text-xl">{t('cati_subtitle')}</span>
              </h2>
              <p className="mt-4 text-slate-300 leading-relaxed max-w-xl">
                {t('cati_desc')}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {catiTags.map(tag => (
                  <span key={tag} className="text-xs font-semibold px-3 py-1 rounded-full border"
                    style={{ borderColor: 'rgba(240,148,34,0.30)', color: '#F09422', background: 'rgba(240,148,34,0.07)' }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row lg:flex-col gap-4 lg:w-72">
              <div className="rounded-xl p-5 border flex-1" style={{ background: 'var(--card-bg)', borderColor: 'rgba(240,148,34,0.20)' }}>
                <p className="text-2xl font-extrabold" style={{ color: '#F09422' }}>{t('cati_box_value')}</p>
                <p className="text-sm text-slate-400 mt-1">{t('cati_box_desc')}</p>
              </div>
              <Link
                href={`/${locale}/productos/lpr/cati`}
                className="inline-flex items-center justify-center gap-2 font-semibold px-6 py-4 rounded-xl transition-all hover:brightness-110 text-center"
                style={{ background: 'var(--accent)', color: '#1E1B18' }}
              >
                {t('cati_cta')} <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Proyecto emblemático: SPD Región Metropolitana */}
      <section
        className="border-y"
        style={{ background: 'linear-gradient(135deg, #28221A 0%, #222018 100%)', borderColor: 'rgba(196,168,130,0.15)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col lg:flex-row gap-12 items-start">
            {/* Left: narrative */}
            <div className="flex-1">
              <div
                className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-5"
                style={{ background: 'rgba(196,168,130,0.1)', border: '1px solid rgba(196,168,130,0.3)', color: '#C4A882' }}
              >
                {t('case_badge')}
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight mb-4">
                {t('case_title')}<br />
                <span style={{ color: '#C4A882' }}>{t('case_title_accent')}</span>
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                {t('case_desc1')}
              </p>
              <p className="text-slate-400 leading-relaxed mb-6">
                {t('case_desc2')}
              </p>
              <div className="flex flex-wrap gap-2">
                {caseTags.map(tag => (
                  <span
                    key={tag}
                    className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(196,168,130,0.08)', border: '1px solid rgba(196,168,130,0.2)', color: '#C4A882' }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:w-80 shrink-0">
              {caseStats.map(({ value, label, sub }) => (
                <div
                  key={label}
                  className="rounded-2xl p-5 border"
                  style={{ background: 'var(--card-bg)', borderColor: 'rgba(196,168,130,0.15)' }}
                >
                  <p className="text-2xl font-extrabold" style={{ color: '#C4A882' }}>{value}</p>
                  <p className="text-white text-sm font-semibold mt-1 leading-snug">{label}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Integraciones institucionales */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="mb-12 text-center">
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3" style={{ color: 'var(--accent)' }}>{t('integrations_eyebrow')}</p>
          <h2 className="text-3xl font-extrabold text-white">{t('integrations_title')}</h2>
          <p className="mt-3 text-slate-400 max-w-2xl mx-auto">
            {t('integrations_desc')}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {integrations.map(({ name, full, desc, badge, color }) => (
            <div
              key={name}
              className="rounded-2xl overflow-hidden border flex flex-col"
              style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}
            >
              <div className="h-1" style={{ background: color }} />
              <div className="p-7 flex flex-col flex-1 gap-3">
                <span
                  className="self-start text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full"
                  style={{ background: `${color}18`, border: `1px solid ${color}40`, color }}
                >
                  {badge}
                </span>
                <h3 className="text-base font-bold text-white leading-snug">{name}</h3>
                <p className="text-xs text-slate-500 italic">{full}</p>
                <p className="text-sm text-slate-300 leading-relaxed flex-1">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Flujo de arquitectura */}
      <section className="border-y" style={{ background: 'rgba(61,138,130,0.04)', borderColor: 'var(--border)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-10 text-center">
            <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3" style={{ color: '#3D8A82' }}>{t('arch_eyebrow')}</p>
            <h2 className="text-2xl font-extrabold text-white">{t('arch_title')}</h2>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-1 flex-wrap">
            {archFlow.map(({ label, sub }, i, arr) => (
              <div key={label} className="flex items-center gap-1">
                <div
                  className="text-center px-4 py-3 rounded-xl border min-w-[110px]"
                  style={{ background: 'var(--card-bg)', borderColor: i === 3 ? 'rgba(240,148,34,0.4)' : 'var(--border)' }}
                >
                  <p className="text-sm font-bold text-white">{label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>
                </div>
                {i < arr.length - 1 && (
                  <ArrowRight size={14} className="shrink-0" style={{ color: '#3D8A82' }} />
                )}
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-slate-600">
            {t('arch_footer')}
          </p>
        </div>
      </section>

      {/* Capacidades */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="mb-12">
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3" style={{ color: 'var(--accent)' }}>{t('capabilities_eyebrow')}</p>
          <h2 className="text-3xl font-extrabold text-white">{t('capabilities_title')}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilities.map(({ icon, title, desc, accent }) => {
            const Icon = ICONS[icon];
            return (
              <div
                key={title}
                className="rounded-2xl p-7 border transition-all hover:glow-cyan-sm flex flex-col gap-4"
                style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}
              >
                <div className="p-2.5 rounded-xl w-fit" style={{ background: `${accent}18` }}>
                  <Icon size={22} style={{ color: accent }} />
                </div>
                <h3 className="font-bold text-white text-base leading-snug">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Especificaciones técnicas */}
      <section className="border-t" style={{ background: 'rgba(240,148,34,0.03)', borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <p className="text-xs font-bold tracking-[0.3em] uppercase mb-4" style={{ color: 'var(--accent)' }}>{t('specs_eyebrow')}</p>
            <h2 className="text-2xl font-extrabold text-white mb-6">{t('specs_title')}</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              {t('specs_desc')}
            </p>
            <div className="rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
              {specs.map(({ param, value }, i) => (
                <div
                  key={param}
                  className="flex items-start justify-between gap-4 px-5 py-3.5 text-sm"
                  style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none', background: i % 2 === 0 ? 'var(--card-bg)' : 'transparent' }}
                >
                  <span className="text-slate-400">{param}</span>
                  <span className="font-semibold text-white text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold tracking-[0.3em] uppercase mb-4" style={{ color: '#3D8A82' }}>{t('legal_eyebrow')}</p>
            <h2 className="text-2xl font-extrabold text-white mb-6">{t('legal_title')}</h2>
            <div className="flex flex-col gap-4">
              {regulatory.map(({ icon, title, desc }) => {
                const Icon = ICONS[icon];
                return (
                  <div
                    key={title}
                    className="flex gap-4 p-5 rounded-xl border"
                    style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}
                  >
                    <div className="shrink-0 mt-0.5">
                      <Icon size={18} style={{ color: '#3D8A82' }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white mb-1">{title}</p>
                      <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Casos de uso */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="mb-12">
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3" style={{ color: 'var(--accent)' }}>{t('usecases_eyebrow')}</p>
          <h2 className="text-3xl font-extrabold text-white">{t('usecases_title')}</h2>
          <p className="mt-2 text-slate-400 max-w-xl">{t('usecases_desc')}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {useCases.map(({ title, desc, icon }) => {
            const Icon = ICONS[icon];
            return (
              <div
                key={title}
                className="flex gap-4 p-6 rounded-xl border"
                style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}
              >
                <div className="shrink-0 p-2 rounded-lg h-fit" style={{ background: 'rgba(240,148,34,0.1)' }}>
                  <Icon size={18} style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm mb-1">{title}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Notas de implementación */}
      <section className="border-t" style={{ background: 'rgba(61,138,130,0.04)', borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-4" style={{ color: '#3D8A82' }}>{t('implementation_eyebrow')}</p>
          <h2 className="text-2xl font-extrabold text-white mb-8">{t('implementation_title')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {implementationNotes.map(({ title, desc }) => (
              <div key={title} className="flex gap-3 p-5 rounded-xl border" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
                <CheckCircle size={18} className="shrink-0 mt-0.5" style={{ color: '#3D8A82' }} />
                <div>
                  <p className="font-semibold text-white text-sm mb-1">{title}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t" style={{ borderColor: 'var(--border)', background: 'var(--background)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold text-white">{t('final_cta_title')}</h3>
            <p className="mt-1 text-slate-400 text-sm max-w-lg">
              {t('final_cta_desc')}
            </p>
          </div>
          <Link
            href={`/${locale}/contacto`}
            className="shrink-0 inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-lg shadow-lg transition-all hover:brightness-110"
            style={{ background: 'var(--accent)', color: '#1E1B18' }}
          >
            {c('talk_to_specialist')} <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
