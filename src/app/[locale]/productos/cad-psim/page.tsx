import { getTranslations } from 'next-intl/server';
import {
  ArrowRight, MonitorCheck, Layers, Camera, Car, Smartphone, Bell, Phone, Wind, MapPin,
  BarChart2, TrendingUp, FileText, ClipboardCheck, Table2, Lock, type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const ICONS: Record<string, LucideIcon> = {
  MonitorCheck, Layers, Camera, Car, Smartphone, Bell, Phone, Wind, MapPin, BarChart2,
  TrendingUp, FileText, ClipboardCheck, Table2, Lock,
};

interface IconItem { icon: string; title: string; desc: string }
interface TitleDesc { title: string; desc: string }
interface Step { n: string; title: string; desc: string }
interface Highlight { b: string; s: string }
interface FinancingStep { n: string; s: string }

const strongWhite = { strong: (chunks: React.ReactNode) => <strong className="text-white">{chunks}</strong> };

export default async function CadPsimPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'cadPsim' });
  const c = await getTranslations({ locale, namespace: 'common' });

  const capabilities = t.raw('capabilities') as IconItem[];
  const traceability = t.raw('traceability') as IconItem[];
  const benefits = t.raw('benefits') as TitleDesc[];
  const audience = t.raw('audience') as TitleDesc[];
  const financing = t.raw('financing') as TitleDesc[];
  const orderSteps = t.raw('order_steps') as Step[];
  const solutionHighlights = t.raw('solution_highlights') as Highlight[];
  const financingSteps = t.raw('financing_steps') as FinancingStep[];
  const techChips = t.raw('tech_chips') as string[];

  return (
    <div>
      {/* Hero */}
      <div className="text-white relative overflow-hidden" style={{ borderLeft: '6px solid #3D8A82' }}>
        {/* Fondo estático — centro de despacho CAD/PSIM */}
        <Image
          src="/cad-hero-bg.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />

        {/* Overlay */}
        <div
          className="absolute inset-0"
          style={{
            zIndex: 1,
            background: 'linear-gradient(135deg, rgba(20,16,12,0.80) 0%, rgba(20,16,12,0.55) 50%, rgba(20,16,12,0.35) 100%)',
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative" style={{ zIndex: 2 }}>
          <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: '#3D8A82', textShadow: '0 1px 6px rgba(0,0,0,0.7)' }}>
            {t('hero_eyebrow')}
          </p>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight max-w-2xl" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}>
            {t('hero_title')}
            <span className="block text-2xl sm:text-3xl font-semibold mt-2 text-slate-300">{t('hero_subtitle')}</span>
          </h1>
          <p className="mt-6 text-lg text-slate-300 max-w-2xl leading-relaxed" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.7)' }}>
            {t('hero_desc')}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href={`/${locale}/contacto`} className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-all hover:brightness-110" style={{ background: '#3D8A82' }}>
              {t('cta_contact')} <ArrowRight size={16} />
            </Link>
            <a href="#capacidades" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold border border-white/30 text-white hover:bg-white/10 transition-all">
              {t('cta_capabilities')}
            </a>
          </div>
        </div>
      </div>

      {/* Manifesto */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <p className="text-xs font-bold tracking-widest uppercase mb-6" style={{ color: '#3D8A82' }}>{t('manifesto_eyebrow')}</p>
        <blockquote className="text-3xl sm:text-4xl font-bold text-white leading-snug max-w-3xl border-l-4 pl-6 mb-8" style={{ borderColor: '#3D8A82' }}>
          {t('manifesto_quote')}
        </blockquote>
        <p className="text-slate-300 text-lg max-w-3xl leading-relaxed mb-10">
          {t('manifesto_desc')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl mb-8">
          <div className="rounded-xl p-6 border" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
            <p className="text-xs font-bold tracking-widest uppercase text-slate-500 mb-2">{t('compare_see_label')}</p>
            <h3 className="text-white font-bold text-lg mb-2">{t('compare_see_title')}</h3>
            <p className="text-slate-400 text-sm">{t('compare_see_desc')}</p>
          </div>
          <div className="rounded-xl p-6 border" style={{ background: 'var(--card-bg)', borderColor: '#3D8A8240' }}>
            <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: '#3D8A82' }}>{t('compare_act_label')}</p>
            <h3 className="text-white font-bold text-lg mb-2">{t('compare_act_title')}</h3>
            <p className="text-slate-400 text-sm">{t('compare_act_desc')}</p>
          </div>
        </div>
        <p className="font-bold text-white text-base">{t('manifesto_footer')}</p>
      </section>

      {/* El orden correcto */}
      <section className="py-16 px-4" style={{ background: 'linear-gradient(145deg, #222018 0%, #1E1B18 100%)' }}>
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#3D8A82' }}>{t('order_eyebrow')}</p>
          <h2 className="text-3xl font-extrabold text-white mb-2">{t('order_title')}</h2>
          <p className="text-slate-400 mb-10">{t('order_desc')}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {orderSteps.map(s => (
              <div key={s.n}>
                <p className="text-5xl font-extrabold mb-2" style={{ color: '#3D8A82' }}>{s.n}</p>
                <h4 className="text-white font-bold mb-1">{s.title}</h4>
                <p className="text-slate-400 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* La solución */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#3D8A82' }}>{t('solution_eyebrow')}</p>
        <h2 className="text-3xl font-extrabold text-white mb-4">{t('solution_title')}</h2>
        <p className="text-slate-400 text-lg max-w-3xl mb-8 leading-relaxed">
          {t.rich('solution_desc1', strongWhite)}
        </p>
        <p className="text-slate-400 max-w-3xl mb-10 leading-relaxed">
          {t.rich('solution_desc2', strongWhite)}
        </p>
        <div className="flex flex-wrap gap-4 mb-12">
          {solutionHighlights.map(st => (
            <div key={st.b} className="rounded-xl px-6 py-4 border-l-4 border" style={{ background: 'var(--card-bg)', borderColor: '#3D8A82', borderLeftColor: '#3D8A82' }}>
              <strong className="text-white block">{st.b}</strong>
              <span className="text-slate-400 text-sm">{st.s}</span>
            </div>
          ))}
        </div>

        {/* Architecture diagram */}
        <div className="max-w-lg mx-auto">
          <p className="text-xs font-bold tracking-widest uppercase mb-4 text-center" style={{ color: '#3D8A82' }}>{t('arch_label')}</p>
          <div className="flex flex-col gap-0 rounded-2xl overflow-hidden border" style={{ borderColor: '#3D8A8240' }}>
            <div className="px-6 py-4 text-center text-white font-bold" style={{ background: 'rgba(167,139,250,0.2)', borderBottom: '1px solid rgba(167,139,250,0.2)' }}>
              {t('arch_control_room')}
            </div>
            <div className="text-center text-xl py-2" style={{ color: '#3D8A82' }}>▲</div>
            <div className="px-6 py-4 text-center border-b" style={{ background: 'var(--card-bg)', borderColor: 'rgba(167,139,250,0.2)' }}>
              <strong className="text-white">{t('arch_cad_title')}</strong>
              <p className="text-slate-400 text-sm mt-1">{t('arch_cad_desc')}</p>
            </div>
            <div className="text-center text-xl py-2" style={{ color: '#3D8A82' }}>▲</div>
            <div className="px-6 py-4 text-center border-b" style={{ background: 'var(--card-bg)', borderColor: 'rgba(167,139,250,0.2)' }}>
              <strong className="text-white">{t('arch_psim_title')}</strong>
              <p className="text-slate-400 text-sm mt-1">{t('arch_psim_desc')}</p>
            </div>
            <div className="text-center text-xl py-2" style={{ color: '#3D8A82' }}>▲</div>
            <div className="px-6 py-4 text-center" style={{ background: 'rgba(167,139,250,0.05)' }}>
              <strong className="text-slate-300">{t('arch_sources_title')}</strong>
              <p className="text-slate-500 text-sm mt-1">{t('arch_sources_desc')}</p>
            </div>
          </div>
          <p className="text-slate-500 text-sm text-center mt-4">
            {t.rich('arch_footer', { strong: (chunks) => <strong className="text-slate-300">{chunks}</strong> })}
          </p>
        </div>
      </section>

      {/* Capacidades */}
      <section id="capacidades" className="py-20 px-4" style={{ background: 'linear-gradient(145deg, #28221A 0%, #1E1B18 100%)' }}>
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#3D8A82' }}>{t('capabilities_eyebrow')}</p>
          <h2 className="text-3xl font-extrabold text-white mb-3">{t('capabilities_title')}</h2>
          <p className="text-slate-400 mb-10">{t('capabilities_desc')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map(({ icon, title, desc }) => {
              const Icon = ICONS[icon];
              return (
                <div key={title} className="rounded-2xl p-6 border flex flex-col gap-4 transition-all hover:glow-cyan-sm" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(167,139,250,0.12)' }}>
                    <Icon size={20} style={{ color: '#3D8A82' }} />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">{title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Integración tecnológica */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#3D8A82' }}>{t('integration_eyebrow')}</p>
        <h2 className="text-3xl font-extrabold text-white mb-3">{t('integration_title')}</h2>
        <p className="text-slate-400 mb-8">{t('integration_desc')}</p>
        <div className="flex flex-wrap gap-3">
          {techChips.map(chip => (
            <span key={chip} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold text-slate-300" style={{ borderColor: 'rgba(167,139,250,0.4)', background: 'rgba(167,139,250,0.06)' }}>
              {chip}
            </span>
          ))}
        </div>
      </section>

      {/* Trazabilidad */}
      <section className="py-20 px-4" style={{ background: 'linear-gradient(145deg, #222018 0%, #1E1B18 100%)' }}>
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#3D8A82' }}>{t('traceability_eyebrow')}</p>
          <h2 className="text-3xl font-extrabold text-white mb-3">{t('traceability_title')}</h2>
          <p className="text-slate-400 mb-10 max-w-2xl">{t('traceability_desc')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {traceability.map(({ icon, title, desc }) => {
              const Icon = ICONS[icon];
              return (
                <div key={title} className="rounded-2xl p-6 border flex flex-col gap-4" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(167,139,250,0.12)' }}>
                    <Icon size={20} style={{ color: '#3D8A82' }} />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">{title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#3D8A82' }}>{t('benefits_eyebrow')}</p>
        <h2 className="text-3xl font-extrabold text-white mb-10">{t('benefits_title')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {benefits.map(({ title, desc }) => (
            <div key={title} className="flex gap-4">
              <span className="flex-shrink-0 mt-2 w-3 h-3 rotate-45 rounded-sm" style={{ background: '#3D8A82' }} />
              <div>
                <h3 className="text-white font-bold text-lg mb-1">{title}</h3>
                <p className="text-slate-400 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Para quién */}
      <section className="py-16 px-4" style={{ background: 'linear-gradient(145deg, #28221A 0%, #1E1B18 100%)' }}>
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#3D8A82' }}>{t('audience_eyebrow')}</p>
          <h2 className="text-3xl font-extrabold text-white mb-8">{t('audience_title')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {audience.map(w => (
              <div key={w.title} className="rounded-2xl p-6 border" style={{ background: 'var(--card-bg)', borderColor: 'rgba(167,139,250,0.3)' }}>
                <h3 className="text-white font-bold text-lg mb-2">{w.title}</h3>
                <p className="text-slate-400 text-sm">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Financiamiento */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#3D8A82' }}>{t('financing_eyebrow')}</p>
        <h2 className="text-3xl font-extrabold text-white mb-3">{t('financing_title')}</h2>
        <p className="text-slate-400 mb-8 max-w-2xl">{t('financing_desc')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {financing.map(({ title, desc }) => (
            <div key={title} className="rounded-2xl p-5 border-l-4" style={{ background: 'var(--card-bg)', borderColor: '#3D8A82' }}>
              <h3 className="text-white font-bold mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
        <div className="rounded-2xl p-6 border-l-4 mb-4" style={{ background: 'rgba(167,139,250,0.06)', borderColor: '#3D8A82' }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {financingSteps.map(s => (
              <div key={s.n}>
                <strong className="text-white block mb-1">{s.n}</strong>
                <span className="text-slate-400 text-sm">{s.s}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-slate-500 text-sm max-w-3xl">
          {t('financing_footnote')}
        </p>
      </section>

      {/* CTA */}
      <section className="py-20 px-4" style={{ background: 'linear-gradient(145deg, #222018 0%, #1E1B18 100%)', borderLeft: '6px solid #3D8A82' }}>
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#3D8A82' }}>{t('cta2_eyebrow')}</p>
          <h2 className="text-3xl font-extrabold text-white mb-3">{t('cta2_title')}</h2>
          <p className="text-slate-400 mb-8">{t('cta2_desc')}</p>
          <div className="rounded-2xl p-8 border flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between" style={{ background: 'rgba(167,139,250,0.06)', borderColor: 'rgba(167,139,250,0.3)' }}>
            <div>
              <p className="text-white font-bold text-xl">{t('cta2_company')}</p>
              <p className="text-slate-400 mb-3">{t('cta2_tagline')}</p>
              <p className="text-slate-300 text-sm leading-loose">
                <a href="mailto:info@visionaria.cl" className="hover:underline" style={{ color: '#3D8A82' }}>info@visionaria.cl</a><br />
                +56 2 2925 4140
              </p>
            </div>
            <Link href={`/${locale}/contacto`} className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white whitespace-nowrap transition-all hover:brightness-110" style={{ background: '#3D8A82' }}>
              {t('cta2_button')} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
