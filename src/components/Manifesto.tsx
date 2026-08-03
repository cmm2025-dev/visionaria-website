import { getTranslations } from 'next-intl/server';
import { Shield, Cpu, BarChart3, type LucideIcon } from 'lucide-react';
import ScrollCue from './ScrollCue';

const ICONS: Record<string, LucideIcon> = { Shield, Cpu, BarChart3 };

interface Pillar { icon: string; title: string; desc: string; accent: string; bg: string }
interface Stat { value: string; label: string; sub: string }

export default async function Manifesto({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'manifesto' });
  const pillars = t.raw('pillars') as Pillar[];
  const stats = t.raw('stats') as Stat[];

  return (
    <section className="w-full py-24 px-4" style={{ background: 'linear-gradient(180deg, #1E1B18 0%, #222018 50%, #1E1B18 100%)' }}>
      <div className="max-w-7xl mx-auto">

        {/* Headline */}
        <div className="text-center mb-16 max-w-4xl mx-auto">
          <p className="text-sm font-bold tracking-[0.3em] mb-4 uppercase" style={{ color: '#F09422' }}>
            {t('eyebrow')}
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-6">
            {t('title_1')}{' '}
            <span style={{ color: '#F09422' }}>{t('title_accent')}</span>
          </h2>
          <p className="text-lg text-slate-300 leading-relaxed">
            {t('desc_pre')}
            <strong className="text-white"> {t('desc_strong')}</strong>
            {t('desc_post')}
          </p>
        </div>

        {/* Divider line with glow */}
        <div className="relative mb-16">
          <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, #F09422, transparent)' }} />
          <div className="absolute left-1/2 -top-3 -translate-x-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center" style={{ borderColor: '#F09422', background: '#1E1B18' }}>
            <div className="w-2 h-2 rounded-full" style={{ background: '#F09422' }} />
          </div>
        </div>

        {/* Three pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {pillars.map(({ icon, title, desc, accent, bg }) => {
            const Icon = ICONS[icon];
            return (
              <div
                key={title}
                className="rounded-2xl p-8 border flex flex-col gap-5 transition-all hover:glow-cyan-sm"
                style={{ background: bg, borderColor: `${accent}25` }}
              >
                <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: `${accent}15`, border: `1px solid ${accent}30` }}>
                  <Icon size={26} style={{ color: accent }} />
                </div>
                <h3 className="text-xl font-bold text-white">{title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm">{desc}</p>
              </div>
            );
          })}
        </div>

        {/* Quote / statement */}
        <div
          className="rounded-3xl p-10 md:p-14 text-center border relative overflow-hidden"
          style={{ background: 'rgba(240,148,34,0.04)', borderColor: 'rgba(240,148,34,0.2)' }}
        >
          {/* Background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 blur-3xl opacity-10 pointer-events-none" style={{ background: '#F09422' }} />

          <p className="text-2xl sm:text-3xl font-light text-white leading-relaxed relative z-10 max-w-4xl mx-auto italic">
            &quot;{t('quote_pre')}{' '}
            <span className="font-bold not-italic" style={{ color: '#F09422' }}>
              {t('quote_accent')}
            </span>
            &quot;
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <div className="h-px w-12" style={{ background: '#F09422', opacity: 0.5 }} />
            <span className="text-sm tracking-widest text-slate-400 uppercase">{t('quote_footer')}</span>
            <div className="h-px w-12" style={{ background: '#F09422', opacity: 0.5 }} />
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map(({ value, label, sub }) => (
            <div key={label} className="text-center p-6 rounded-2xl border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <p className="text-3xl font-extrabold mb-1" style={{ color: '#F09422' }}>{value}</p>
              <p className="text-white text-sm font-semibold">{label}</p>
              <p className="text-slate-500 text-xs mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

      <ScrollCue label={t('scroll_cue')} />
      </div>
    </section>
  );
}
