'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Play, X } from 'lucide-react';

interface HeroSectionProps {
  title: string;
  subtitle: string;
  cta: string;
  cta2: string;
  locale: string;
  contact: string;
}

export default function HeroSection({ title, subtitle, cta, cta2, locale }: HeroSectionProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSettled(true), 3200);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {/* Video de fondo */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ zIndex: 0 }}
      >
        <source src="/hero-bg.mp4" type="video/mp4" />
      </video>

      {/* Overlay degradado — se aclara al hacer settle */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-1000"
        style={{
          zIndex: 1,
          background: settled
            ? 'linear-gradient(135deg, rgba(20,16,12,0.65) 0%, rgba(20,16,12,0.35) 55%, rgba(20,16,12,0.20) 100%)'
            : 'linear-gradient(135deg, rgba(20,16,12,0.82) 0%, rgba(20,16,12,0.60) 55%, rgba(20,16,12,0.40) 100%)',
        }}
      />

      {/* Orbes de acento */}
      <div className="absolute top-20 right-20 w-72 h-72 rounded-full opacity-8 blur-3xl pointer-events-none" style={{ zIndex: 1, background: 'var(--accent)' }} />
      <div className="absolute bottom-0 left-10 w-48 h-48 rounded-full opacity-8 blur-3xl pointer-events-none" style={{ zIndex: 1, background: 'var(--teal)' }} />

      {/* Contenido — se desplaza a esquina superior izquierda al hacer settle */}
      <div
        className="absolute left-0 right-0 transition-all duration-1000 ease-in-out"
        style={{
          zIndex: 2,
          top: settled ? '1.5rem' : '50%',
          transform: settled ? 'translateY(0)' : 'translateY(-50%)',
          paddingLeft: settled ? '1.5rem' : undefined,
          paddingRight: settled ? '1.5rem' : undefined,
        }}
      >
        <div
          className="transition-all duration-1000 ease-in-out"
          style={{
            maxWidth: settled ? '52rem' : '48rem',
            margin: settled ? '0' : '0 auto',
            paddingLeft: settled ? '0' : '1rem',
            paddingRight: settled ? '0' : '1rem',
          }}
        >
          <h1
            className="font-extrabold leading-tight tracking-tight text-white transition-all duration-1000"
            style={{
              fontSize: settled ? 'clamp(1.25rem, 2.5vw, 1.75rem)' : 'clamp(2.2rem, 5vw, 3.75rem)',
              textShadow: '0 2px 16px rgba(0,0,0,0.8)',
              textWrap: 'balance',
            }}
          >
            {title}
          </h1>
          <p
            className="text-slate-300 transition-all duration-1000"
            style={{
              fontSize: settled ? '0.8rem' : 'clamp(1rem, 1.5vw, 1.25rem)',
              marginTop: settled ? '0.25rem' : '1.5rem',
              maxWidth: '36rem',
              textShadow: '0 1px 8px rgba(0,0,0,0.7)',
              opacity: settled ? 0.7 : 1,
            }}
          >
            {subtitle}
          </p>

          {/* CTAs */}
          <div
            className="flex flex-wrap items-center gap-3 transition-all duration-1000"
            style={{ marginTop: settled ? '0.75rem' : '2.5rem' }}
          >
            <Link
              href={`/${locale}/productos`}
              className="inline-flex items-center gap-2 font-semibold rounded-full shadow-lg transition-all glow-cyan-sm hover:glow-cyan"
              style={{
                background: 'var(--accent)',
                color: '#1E1B18',
                padding: settled ? '0.4rem 1rem' : '0.75rem 1.5rem',
                fontSize: settled ? '0.78rem' : '0.95rem',
              }}
            >
              {cta} <ArrowRight size={settled ? 13 : 16} />
            </Link>
            <Link
              href={`/${locale}/productos`}
              className="inline-flex items-center gap-2 font-semibold rounded-full transition-colors text-white border hover:bg-white/5"
              style={{
                borderColor: 'var(--border)',
                padding: settled ? '0.4rem 1rem' : '0.75rem 1.5rem',
                fontSize: settled ? '0.78rem' : '0.95rem',
              }}
            >
              {cta2}
            </Link>

            {/* Ver video — alineado a la derecha */}
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 font-semibold rounded-full transition-all hover:bg-white/10 text-white border"
              style={{
                borderColor: 'rgba(255,255,255,0.20)',
                padding: settled ? '0.4rem 1rem' : '0.75rem 1.25rem',
                fontSize: settled ? '0.78rem' : '0.95rem',
                marginLeft: 'auto',
              }}
            >
              <span
                className="rounded-full flex items-center justify-center"
                style={{
                  width: settled ? '1.4rem' : '1.75rem',
                  height: settled ? '1.4rem' : '1.75rem',
                  background: 'rgba(240,148,34,0.20)',
                  border: '1px solid rgba(240,148,34,0.40)',
                }}
              >
                <Play size={settled ? 10 : 12} style={{ color: 'var(--accent)' }} fill="currentColor" />
              </span>
              Ver video
            </button>
          </div>
        </div>
      </div>

      {/* Modal video completo */}
      {modalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ zIndex: 9999, background: 'rgba(0,0,0,0.88)' }}
          onClick={() => setModalOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl rounded-2xl overflow-hidden"
            style={{ aspectRatio: '16/9' }}
            onClick={e => e.stopPropagation()}
          >
            <video
              autoPlay
              controls
              className="w-full h-full object-cover"
              style={{ background: '#000' }}
            >
              <source src="/hero-bg.mp4" type="video/mp4" />
            </video>
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:bg-white/20"
              style={{ background: 'rgba(0,0,0,0.6)' }}
            >
              <X size={18} className="text-white" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
