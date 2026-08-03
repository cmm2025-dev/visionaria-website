'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight, Play, X, ChevronDown } from 'lucide-react';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import HeroCinematic from './HeroCinematic';

interface HeroSectionProps {
  title: string;
  subtitle: string;
  cta: string;
  cta2: string;
  locale: string;
  contact: string;
}

const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
const DUR = '1.4s';

export default function HeroSection({ title, subtitle, cta, cta2, locale }: HeroSectionProps) {
  const t = useTranslations('home');
  const [modalOpen, setModalOpen] = useState(false);
  const [settled, setSettled] = useState(false);
  const isDesktop = useIsDesktop();

  useEffect(() => {
    const t = setTimeout(() => setSettled(true), 3400);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {/* Video en desktop; canvas de partículas en mobile — un video de ~25MB en
          autoplay agotaba el timeout de carga antes de que la página renderizara */}
      {isDesktop ? (
        <video
          autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ zIndex: 0 }}
        >
          <source src="/hero-bg.mp4" type="video/mp4" />
        </video>
      ) : (
        <HeroCinematic />
      )}

      {/* Overlay — se aclara gradualmente al settle */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          background: settled
            ? 'linear-gradient(135deg, rgba(20,16,12,0.58) 0%, rgba(20,16,12,0.28) 55%, rgba(20,16,12,0.12) 100%)'
            : 'linear-gradient(135deg, rgba(20,16,12,0.82) 0%, rgba(20,16,12,0.60) 55%, rgba(20,16,12,0.40) 100%)',
          transition: `background ${DUR} ${EASE}`,
        }}
      />

      {/* Orbes */}
      <div className="absolute top-20 right-20 w-72 h-72 rounded-full opacity-8 blur-3xl pointer-events-none" style={{ zIndex: 1, background: 'var(--accent)' }} />
      <div className="absolute bottom-0 left-10 w-48 h-48 rounded-full opacity-8 blur-3xl pointer-events-none" style={{ zIndex: 1, background: 'var(--teal)' }} />

      {/* Botón Ver video — esquina superior derecha */}
      <button
        onClick={() => setModalOpen(true)}
        className="absolute top-5 right-5 inline-flex items-center gap-2 font-semibold rounded-full hover:bg-white/10 text-white border"
        style={{ zIndex: 10, borderColor: 'rgba(255,255,255,0.20)', padding: '0.45rem 1rem', fontSize: '0.8rem', transition: 'background 0.2s' }}
      >
        <span className="rounded-full flex items-center justify-center shrink-0"
          style={{ width: '1.5rem', height: '1.5rem', background: 'rgba(240,148,34,0.20)', border: '1px solid rgba(240,148,34,0.40)' }}>
          <Play size={10} style={{ color: 'var(--accent)' }} fill="currentColor" />
        </span>
        {t('watch_video')}
      </button>

      {/* Contenedor que define la altura de la sección */}
      <div className="relative w-full" style={{ zIndex: 2, minHeight: '78vh' }}>

        {/*
          El contenido siempre está en top:0 + paddingTop fijo.
          Solo se anima transform: translateY — una sola propiedad, GPU.
          Initial: translateY(38vh) → aparece centrado visualmente.
          Settled: translateY(0)    → queda en la esquina superior.
        */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            paddingTop: '1.75rem',
            paddingLeft: '1.5rem',
            paddingRight: '1.5rem',
            transform: settled ? 'translateY(0)' : 'translateY(38vh)',
            transition: `transform ${DUR} ${EASE}`,
            willChange: 'transform',
          }}
        >
          <div style={{ maxWidth: '52rem' }}>
            {/* Título — escala de grande a pequeño */}
            <h1
              className="font-extrabold leading-tight tracking-tight text-white"
              style={{
                fontSize: settled ? 'clamp(1.05rem, 1.8vw, 1.4rem)' : 'clamp(2rem, 4.5vw, 3.75rem)',
                textShadow: '0 2px 16px rgba(0,0,0,0.8)',
                transition: `font-size ${DUR} ${EASE}`,
              }}
            >
              {title}
            </h1>

            {/* Subtítulo — se desvanece al settle */}
            <p
              className="text-slate-300"
              style={{
                fontSize: settled ? '0.72rem' : 'clamp(0.95rem, 1.3vw, 1.2rem)',
                marginTop: settled ? '0.15rem' : '1.4rem',
                maxWidth: '34rem',
                textShadow: '0 1px 8px rgba(0,0,0,0.7)',
                opacity: settled ? 0.55 : 1,
                transition: `font-size ${DUR} ${EASE}, margin-top ${DUR} ${EASE}, opacity ${DUR} ${EASE}`,
              }}
            >
              {subtitle}
            </p>

            {/* CTAs */}
            <div
              className="flex flex-wrap items-center gap-3"
              style={{
                marginTop: settled ? '0.5rem' : '2.4rem',
                transition: `margin-top ${DUR} ${EASE}`,
              }}
            >
              <Link
                href={`/${locale}/productos`}
                className="inline-flex items-center gap-2 font-semibold rounded-full shadow-lg glow-cyan-sm hover:glow-cyan"
                style={{
                  background: 'var(--accent)',
                  color: '#1E1B18',
                  padding: settled ? '0.3rem 0.85rem' : '0.72rem 1.4rem',
                  fontSize: settled ? '0.72rem' : '0.92rem',
                  transition: `padding ${DUR} ${EASE}, font-size ${DUR} ${EASE}`,
                }}
              >
                {cta} <ArrowRight size={settled ? 11 : 15} />
              </Link>
              <Link
                href={`/${locale}/productos`}
                className="inline-flex items-center gap-2 font-semibold rounded-full text-white border hover:bg-white/5"
                style={{
                  borderColor: 'var(--border)',
                  padding: settled ? '0.3rem 0.85rem' : '0.72rem 1.4rem',
                  fontSize: settled ? '0.72rem' : '0.92rem',
                  transition: `padding ${DUR} ${EASE}, font-size ${DUR} ${EASE}`,
                }}
              >
                {cta2}
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <button
          onClick={() => window.scrollBy({ top: window.innerHeight * 0.85, behavior: 'smooth' })}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 group"
          style={{
            opacity: settled ? 1 : 0,
            pointerEvents: settled ? 'auto' : 'none',
            background: 'none', border: 'none', cursor: 'pointer',
            transition: `opacity 0.8s ${EASE}`,
          }}
          aria-label={t('explore_aria')}
        >
          <span className="text-xs font-bold tracking-[0.25em] uppercase"
            style={{ color: 'var(--accent)', textShadow: '0 0 12px rgba(240,148,34,0.6)' }}>
            {t('explore')}
          </span>
          <span
            className="flex items-center justify-center rounded-full border-2 transition-transform group-hover:scale-110"
            style={{
              width: '2.25rem', height: '2.25rem',
              borderColor: 'var(--accent)',
              background: 'rgba(240,148,34,0.15)',
              boxShadow: '0 0 16px rgba(240,148,34,0.35)',
              animation: settled ? 'bounce-cue 1.6s ease-in-out infinite' : 'none',
            }}
          >
            <ChevronDown size={18} style={{ color: 'var(--accent)' }} />
          </span>
        </button>
      </div>

      <style>{`
        @keyframes bounce-cue {
          0%, 100% { transform: translateY(0); opacity: 0.6; }
          50%       { transform: translateY(6px); opacity: 1; }
        }
      `}</style>

      {/* Modal video */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4"
          style={{ zIndex: 9999, background: 'rgba(0,0,0,0.88)' }}
          onClick={() => setModalOpen(false)}>
          <div className="relative w-full max-w-4xl rounded-2xl overflow-hidden"
            style={{ aspectRatio: '16/9' }}
            onClick={e => e.stopPropagation()}>
            <video autoPlay controls className="w-full h-full object-cover" style={{ background: '#000' }}>
              <source src="/hero-bg.mp4" type="video/mp4" />
            </video>
            <button onClick={() => setModalOpen(false)}
              className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/20"
              style={{ background: 'rgba(0,0,0,0.6)' }}>
              <X size={18} className="text-white" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
