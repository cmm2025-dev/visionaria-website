import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import {
  ShieldCheck, FileText, CalendarClock, Link2, Gauge, Wrench, Search,
  LifeBuoy, RefreshCcw, BookOpen, Info, MessageCircle, KeyRound, Users,
} from 'lucide-react';
import SupportHeroCarousel from '@/components/SupportHeroCarousel';

/** Static institutional notice -- same content for every client/account, no login required. */
export default async function ContinuidadOperacionalPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'continuity' });

  const scope = [
    { title: t('scope_warranty_title'), body: t('scope_warranty_body') },
    { title: t('scope_support_title'), body: t('scope_support_body') },
    { title: t('scope_maintenance_title'), body: t('scope_maintenance_body') },
    { title: t('scope_continuity_title'), body: t('scope_continuity_body') },
  ];

  const exclusions = [
    { title: t('exclusion_lifecycle_title'), body: t('exclusion_lifecycle_body') },
    { title: t('exclusion_infra_title'), body: t('exclusion_infra_body') },
    { title: t('exclusion_third_party_title'), body: t('exclusion_third_party_body') },
    { title: t('exclusion_events_title'), body: t('exclusion_events_body') },
  ];

  const pillars = [
    { icon: Gauge, title: t('pillar_monitor_title'), body: t('pillar_monitor_body') },
    { icon: Wrench, title: t('pillar_prevent_title'), body: t('pillar_prevent_body') },
    { icon: Search, title: t('pillar_detect_title'), body: t('pillar_detect_body') },
    { icon: LifeBuoy, title: t('pillar_respond_title'), body: t('pillar_respond_body') },
    { icon: RefreshCcw, title: t('pillar_recover_title'), body: t('pillar_recover_body') },
    { icon: BookOpen, title: t('pillar_document_title'), body: t('pillar_document_body') },
  ];

  const steps = [
    { title: t('step1_title'), body: t('step1_body') },
    { title: t('step2_title'), body: t('step2_body') },
    { title: t('step3_title'), body: t('step3_body') },
    { title: t('step4_title'), body: t('step4_body') },
    { title: t('step5_title'), body: t('step5_body') },
    { title: t('step6_title'), body: t('step6_body') },
  ];

  const followUp = [
    { icon: Gauge, title: t('follow_status_title'), body: t('follow_status_body') },
    { icon: Users, title: t('follow_permissions_title'), body: t('follow_permissions_body') },
    { icon: MessageCircle, title: t('follow_whatsapp_title'), body: t('follow_whatsapp_body') },
    { icon: KeyRound, title: t('follow_operators_title'), body: t('follow_operators_body') },
  ];

  return (
    <div>
      <div className="text-white py-20 px-4 relative overflow-hidden" style={{ background: '#1E1B18' }}>
        <SupportHeroCarousel accent="#F09422" />
        <div className="max-w-5xl mx-auto relative">
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-2" style={{ color: '#F09422' }}>{t('eyebrow')}</p>
          <h1 className="text-4xl font-extrabold">{t('title')}</h1>
          <p className="mt-3 text-lg text-slate-300 max-w-2xl">{t('subtitle')}</p>

          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl">
            {[
              { icon: FileText, label: t('meta_ref_label'), value: t('meta_ref_value') },
              { icon: CalendarClock, label: t('meta_date_label'), value: t('meta_date_value') },
              { icon: ShieldCheck, label: t('meta_effective_label'), value: t('meta_effective_value') },
              { icon: Link2, label: t('meta_portal_label'), value: 'visionaria.cl/es/soporte' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-xl p-3 border" style={{ background: 'rgba(240,148,34,0.06)', borderColor: 'var(--border)' }}>
                <Icon size={16} style={{ color: '#F09422' }} />
                <p className="text-[10px] uppercase tracking-wider text-slate-400 mt-2">{label}</p>
                <p className="text-sm font-semibold text-white mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col gap-16">
        <div className="flex flex-col gap-4">
          <p className="text-slate-300 leading-relaxed">{t('intro_p1')}</p>
          <p className="text-slate-300 leading-relaxed">{t('intro_p2')}</p>
        </div>

        {/* 1 · Atención y trazabilidad */}
        <div className="flex flex-col gap-4">
          <SectionHeading number="1" eyebrow={t('s1_eyebrow')} title={t('s1_title')} />
          <ul className="flex flex-col gap-3">
            {['s1_b1', 's1_b2', 's1_b3', 's1_b4'].map(key => (
              <BulletItem key={key} text={t(key)} />
            ))}
          </ul>
        </div>

        {/* 2 · Contexto regulatorio */}
        <div className="flex flex-col gap-4">
          <SectionHeading number="2" eyebrow={t('s2_eyebrow')} title={t('s2_title')} />
          <p className="text-slate-300 leading-relaxed">{t('s2_intro')}</p>
          <ul className="flex flex-col gap-3">
            <BulletItem text={t('s2_b1')} />
            <BulletItem text={t('s2_b2')} />
            <BulletItem text={t('s2_b3')} />
          </ul>
        </div>

        {/* 3 · Alcance de servicio */}
        <div className="flex flex-col gap-4">
          <SectionHeading number="3" eyebrow={t('s3_eyebrow')} title={t('s3_title')} />
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            {scope.map((row, i) => (
              <div
                key={row.title}
                className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-6 p-5"
                style={{ background: i % 2 === 0 ? 'var(--card-bg)' : 'transparent', borderTop: i > 0 ? '1px solid var(--border)' : undefined }}
              >
                <p className="font-bold text-white sm:col-span-1">{row.title}</p>
                <p className="text-slate-400 text-sm sm:col-span-2">{row.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 4 · Riesgos y exclusiones */}
        <div className="flex flex-col gap-4">
          <SectionHeading number="4" eyebrow={t('s4_eyebrow')} title={t('s4_title')} />
          <p className="text-slate-300 leading-relaxed">{t('s4_intro')}</p>
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            {exclusions.map((row, i) => (
              <div
                key={row.title}
                className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-6 p-5"
                style={{ background: i % 2 === 0 ? 'var(--card-bg)' : 'transparent', borderTop: i > 0 ? '1px solid var(--border)' : undefined }}
              >
                <p className="font-bold text-white sm:col-span-1">{row.title}</p>
                <p className="text-slate-400 text-sm sm:col-span-2">{row.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 5 · Servicio de continuidad operacional */}
        <div className="flex flex-col gap-4">
          <SectionHeading number="5" eyebrow={t('s5_eyebrow')} title={t('s5_title')} />
          <p className="text-slate-300 leading-relaxed">{t('s5_intro')}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {pillars.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-xl p-4 border" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
                <div className="inline-flex p-2 rounded-lg mb-2" style={{ background: 'rgba(240,148,34,0.12)' }}>
                  <Icon size={16} style={{ color: '#F09422' }} />
                </div>
                <p className="text-white font-semibold text-sm">{title}</p>
                <p className="text-slate-500 text-xs mt-1">{body}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl p-6 border text-center flex flex-col items-center gap-3" style={{ background: 'rgba(240,148,34,0.06)', borderColor: 'var(--border)' }}>
            <p className="text-white font-semibold">{t('s5_cta_title')}</p>
            <p className="text-slate-400 text-sm max-w-xl">{t('s5_cta_body')}</p>
            <p className="text-sm text-slate-300">{t('s5_cta_contact')}</p>
            <Link
              href={`/${locale}/contacto`}
              className="inline-flex items-center gap-2 font-semibold px-6 py-2.5 rounded-full transition-all"
              style={{ background: '#F09422', color: '#1E1B18' }}
            >
              {t('s5_cta_button')}
            </Link>
          </div>
        </div>

        {/* Anexo: paso a paso */}
        <div className="flex flex-col gap-4">
          <SectionHeading number="A" eyebrow={t('annex_eyebrow')} title={t('annex_title')} />
          <p className="text-slate-300 leading-relaxed">{t('annex_intro')}</p>

          <p className="text-white font-semibold mt-2">{t('annex_steps_title')}</p>
          <ol className="flex flex-col gap-3">
            {steps.map((step, i) => (
              <li key={step.title} className="rounded-xl p-4 border flex gap-4" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
                <span
                  className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: '#F09422', color: '#1E1B18' }}
                >
                  {i + 1}
                </span>
                <p className="text-slate-300 text-sm">
                  <span className="text-white font-semibold">{step.title} </span>
                  {step.body}
                </p>
              </li>
            ))}
          </ol>

          <p className="text-white font-semibold mt-4">{t('annex_followup_title')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {followUp.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-xl p-4 border flex gap-3" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
                <div className="shrink-0 p-2 rounded-lg h-fit" style={{ background: 'rgba(240,148,34,0.12)' }}>
                  <Icon size={16} style={{ color: '#F09422' }} />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{title}</p>
                  <p className="text-slate-500 text-xs mt-1">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transparencia + cierre */}
        <div className="flex flex-col gap-4">
          <SectionHeading number="6" eyebrow={t('s6_eyebrow')} title={t('s6_title')} />
          <div className="rounded-xl p-5 border flex gap-3" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
            <Info size={18} className="shrink-0 mt-0.5" style={{ color: '#F09422' }} />
            <p className="text-slate-400 text-sm leading-relaxed">{t('s6_body')}</p>
          </div>
        </div>

        <div className="text-center flex flex-col items-center gap-1 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <p className="text-slate-300 text-sm">{t('signature_body')}</p>
          <p className="text-white font-semibold mt-4">{t('signature_name')}</p>
          <p className="text-slate-500 text-sm">{t('signature_role')}</p>
          <p className="text-slate-500 text-xs mt-6">{t('reference_framework')}</p>
        </div>
      </section>
    </div>
  );
}

function SectionHeading({ number, eyebrow, title }: { number: string; eyebrow: string; title: string }) {
  return (
    <div className="flex gap-4 items-start">
      <div
        className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm"
        style={{ background: 'rgba(240,148,34,0.12)', color: '#F09422' }}
      >
        {number}
      </div>
      <div>
        <p className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: '#F09422' }}>{eyebrow}</p>
        <h2 className="text-xl font-bold text-white mt-1">{title}</h2>
      </div>
    </div>
  );
}

function BulletItem({ text }: { text: string }) {
  return (
    <li className="flex gap-3">
      <span className="shrink-0 w-1.5 h-1.5 rounded-full mt-2" style={{ background: '#F09422' }} />
      <p className="text-slate-300 text-sm leading-relaxed">{text}</p>
    </li>
  );
}
