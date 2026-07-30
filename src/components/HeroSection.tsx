'use client';

import { useState } from 'react';
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

  return (
    <>
      {/* Video de fondo — loop continuo */}
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

      {/* Overlay degradado */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          background: 'linear-gradient(135deg, rgba(20,16,12,0.82) 0%, rgba(20,16,12,0.60) 55%, rgba(20,16,12,0.40) 100%)',
        }}
      />

      {/* Orbes de acento */}
      <div className="absolute top-20 right-20 w-72 h-72 rounded-full opacity-8 blur-3xl pointer-events-none" style={{ zIndex: 1, background: 'var(--accent)' }} />
      <div className="absolute bottom-0 left-10 w-48 h-48 rounded-full opacity-8 blur-3xl pointer-events-none" style={{ zIndex: 1, background: 'var(--teal)' }} />

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 lg:py-40 relative" style={{ zIndex: 2 }}>
        <div className="max-w-3xl">
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-white"
            style={{ textShadow: '0 2px 16px rgba(0,0,0,0.8)' }}
          >
            {title}
          </h1>
          <p
            className="mt-6 text-lg sm:text-xl max-w-xl text-slate-300"
            style={{ textShadow: '0 1px 8px rgba(0,0,0,0.7)' }}
          >
            {subtitle}
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href={`/${locale}/productos`}
              className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-full shadow-lg transition-all glow-cyan-sm hover:glow-cyan"
              style={{ background: 'var(--accent)', color: '#1E1B18' }}
            >
              {cta} <ArrowRight size={16} />
            </Link>
            <Link
              href={`/${locale}/casos-exito`}
              className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-full transition-colors text-white border hover:bg-white/5"
              style={{ borderColor: 'var(--border)' }}
            >
              {cta2}
            </Link>
            {/* Botón ver video completo */}
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 font-semibold px-5 py-3 rounded-full transition-all hover:bg-white/10 text-white border"
              style={{ borderColor: 'rgba(255,255,255,0.20)' }}
            >
              <span className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(240,148,34,0.20)', border: '1px solid rgba(240,148,34,0.40)' }}>
                <Play size={12} style={{ color: 'var(--accent)' }} fill="currentColor" />
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
