import {
  ArrowRight, ChevronRight, Zap, Camera, BarChart2,
  AlertTriangle, Car, CheckCircle, Building2, Layers,
  Radio, Eye, type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

const ICONS: Record<string, LucideIcon> = { Zap, AlertTriangle, Car, Eye, Camera, BarChart2, Layers, Building2, Radio };

interface Violation { icon: string; title: string; desc: string; accent: string }
interface Spec { label: string; value: string }
interface Tier { badge: string; title: string; subtitle: string; desc: string; specs: Spec[]; accent: string; border: string }
interface ServiceMode { icon: string; title: string; desc: string; tag: string; accent: string }
interface Stat { value: string; label: string; sub: string }
interface FlowStep { step: string; title: string; desc: string }

export default async function CatiPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'cati' });

  const violations = t.raw('violations') as Violation[];
  const stats = t.raw('stats') as Stat[];
  const points = t.raw('points') as string[];
  const tiers = t.raw('tiers') as Tier[];
  const serviceModes = t.raw('service_modes') as ServiceMode[];
  const integrationList = t.raw('integration_list') as string[];
  const flowSteps = t.raw('flow_steps') as FlowStep[];

  return (
    <div>
      {/* Hero */}
      <div
        className="text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #222018 0%, #1E1B18 100%)', borderLeft: '6px solid #F09422' }}
      >
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: '#F09422' }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-6 border"
            style={{ background: 'rgba(240,148,34,0.10)', borderColor: 'rgba(240,148,34,0.30)', color: '#F09422' }}>
            {t('badge')}
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight max-w-3xl">
            {t('hero_title')}
            <span className="block text-2xl sm:text-3xl font-semibold mt-2 text-slate-300">
              {t('hero_subtitle')}
            </span>
          </h1>
          <p className="mt-6 text-lg text-slate-300 max-w-2xl leading-relaxed">
            {t('hero_desc')}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href={`/${locale}/contacto`}
              className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-full transition-all glow-cyan-sm hover:glow-cyan"
              style={{ background: 'var(--accent)', color: '#1E1B18' }}
            >
              {t('cta_primary')} <ArrowRight size={16} />
            </Link>
            <Link
              href={`/${locale}/productos/lpr`}
              className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-full border transition-all hover:bg-white/5"
              style={{ borderColor: 'rgba(240,148,34,0.35)', color: '#F09422' }}
            >
              {t('cta_secondary')} <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </div>

      {/* Contexto Ley CATI */}
      <section style={{ background: 'linear-gradient(135deg, #28221A 0%, #222018 100%)', borderBottom: '1px solid rgba(255,220,160,0.08)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#F09422' }}>{t('context_eyebrow')}</p>
              <h2 className="text-2xl font-extrabold text-white mb-4">{t('context_title')}</h2>
              <p className="text-slate-300 leading-relaxed mb-6">
                {t('context_desc')}
              </p>
              <ul className="space-y-3">
                {points.map((point, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle size={16} className="mt-0.5 flex-shrink-0" style={{ color: '#F09422' }} />
                    <span className="text-slate-300 text-sm leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {stats.map(({ value, label, sub }) => (
                <div key={label} className="rounded-xl p-5 border" style={{ background: 'var(--card-bg)', borderColor: 'rgba(240,148,34,0.15)' }}>
                  <p className="text-3xl font-extrabold" style={{ color: '#F09422' }}>{value}</p>
                  <p className="text-sm text-white font-medium mt-1 leading-snug">{label}</p>
                  <p className="text-xs text-slate-500 mt-1">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Infracciones detectables */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#F09422' }}>{t('detection_eyebrow')}</p>
          <h2 className="text-3xl font-extrabold text-white">{t('detection_title')}</h2>
          <p className="mt-3 text-slate-400 max-w-2xl mx-auto">{t('detection_desc')}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {violations.map(({ icon, title, desc, accent }) => {
            const Icon = ICONS[icon];
            return (
              <div key={title} className="rounded-2xl p-6 border flex flex-col gap-4" style={{ background: 'var(--card-bg)', borderColor: `${accent}25` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${accent}15` }}>
                  <Icon size={20} style={{ color: accent }} />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{title}</h3>
                  <p className="mt-2 text-slate-400 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Equipos — dos opciones */}
      <section style={{ background: 'linear-gradient(135deg, #28221A 0%, #1E1B18 100%)', borderTop: '1px solid rgba(255,220,160,0.08)', borderBottom: '1px solid rgba(255,220,160,0.08)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#3D8A82' }}>{t('hardware_eyebrow')}</p>
            <h2 className="text-3xl font-extrabold text-white">{t('hardware_title')}</h2>
            <p className="mt-3 text-slate-400 max-w-2xl mx-auto">{t('hardware_desc')}</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {tiers.map(({ badge, title, subtitle, desc, specs, accent, border }) => (
              <div key={title} className="rounded-2xl border overflow-hidden" style={{ background: 'var(--card-bg)', borderColor: border }}>
                {/* Card header */}
                <div className="px-8 pt-8 pb-6" style={{ borderBottom: `1px solid ${border}` }}>
                  <span className="text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full border"
                    style={{ color: accent, borderColor: `${accent}40`, background: `${accent}10` }}>
                    {badge}
                  </span>
                  <h3 className="text-xl font-extrabold text-white mt-4">{title}</h3>
                  <p className="text-sm mt-1" style={{ color: accent }}>{subtitle}</p>
                  <p className="text-slate-400 text-sm leading-relaxed mt-3">{desc}</p>
                </div>
                {/* Specs */}
                <div className="px-8 py-6">
                  <p className="text-xs font-bold tracking-widest uppercase text-slate-500 mb-4">{t('specs_label')}</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    {specs.map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-xs text-slate-500">{label}</p>
                        <p className="text-sm font-semibold text-white mt-0.5">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-slate-600 mt-6">{t('hardware_footnote')}</p>
        </div>
      </section>

      {/* Modelo de servicio */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#C4A882' }}>{t('service_eyebrow')}</p>
          <h2 className="text-3xl font-extrabold text-white">{t('service_title')}</h2>
          <p className="mt-3 text-slate-400 max-w-2xl mx-auto">{t('service_desc')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {serviceModes.map(({ icon, title, desc, tag, accent }) => {
            const Icon = ICONS[icon];
            return (
              <div key={title} className="rounded-2xl p-7 border flex flex-col gap-4" style={{ background: 'var(--card-bg)', borderColor: `${accent}20` }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${accent}15` }}>
                    <Icon size={20} style={{ color: accent }} />
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full border" style={{ color: accent, borderColor: `${accent}35`, background: `${accent}10` }}>{tag}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white">{title}</h3>
                  <p className="mt-2 text-slate-400 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Integración con plataforma LPR existente */}
      <section style={{ background: 'linear-gradient(135deg, #28221A 0%, #222018 100%)', borderTop: '1px solid rgba(255,220,160,0.08)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#3D8A82' }}>{t('integration_eyebrow')}</p>
              <h2 className="text-2xl font-extrabold text-white mb-4">{t('integration_title')}</h2>
              <p className="text-slate-300 leading-relaxed mb-6">
                {t('integration_desc')}
              </p>
              <ul className="space-y-3">
                {integrationList.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle size={15} className="mt-0.5 flex-shrink-0" style={{ color: '#3D8A82' }} />
                    <span className="text-slate-300 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl p-8 border" style={{ background: 'var(--card-bg)', borderColor: 'rgba(61,138,130,0.20)' }}>
              <p className="text-xs font-bold tracking-widest uppercase text-slate-500 mb-6">{t('flow_label')}</p>
              {flowSteps.map(({ step, title, desc }) => (
                <div key={step} className="flex gap-4 mb-5 last:mb-0">
                  <span className="text-xs font-extrabold w-6 flex-shrink-0 mt-0.5" style={{ color: '#3D8A82' }}>{step}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-3xl font-extrabold text-white mb-4">{t('cta_title')}</h2>
        <p className="text-slate-400 max-w-xl mx-auto mb-8">{t('cta_desc')}</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href={`/${locale}/contacto`}
            className="inline-flex items-center gap-2 font-semibold px-8 py-3 rounded-full transition-all glow-cyan-sm hover:glow-cyan"
            style={{ background: 'var(--accent)', color: '#1E1B18' }}
          >
            {t('cta_primary2')} <ArrowRight size={16} />
          </Link>
          <Link
            href={`/${locale}/productos/lpr`}
            className="inline-flex items-center gap-2 font-semibold px-8 py-3 rounded-full border transition-all hover:bg-white/5"
            style={{ borderColor: 'rgba(240,148,34,0.35)', color: '#F09422' }}
          >
            {t('cta_secondary2')} <ChevronRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
