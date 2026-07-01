'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import HeroCinematic from './HeroCinematic';

type Phase = 'text-in' | 'text-visible' | 'text-out' | 'video' | 'video-fade' | 'canvas' | 'text-return' | 'text-return-visible';

interface HeroSectionProps {
  title: string;
  subtitle: string;
  cta: string;
  cta2: string;
  locale: string;
  contact: string;
}

export default function HeroSection({ title, subtitle, cta, cta2, locale }: HeroSectionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<Phase>('text-in');

  useEffect(() => {
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Texto entra
    timers.push(setTimeout(() => setPhase('text-visible'), 800));

    if (!isMobile) {
      // Texto sale → arranca video (tras 700ms de transición de salida)
      timers.push(setTimeout(() => {
        setPhase('text-out');
        setTimeout(() => {
          setPhase('video');
          if (videoRef.current) {
            videoRef.current.playbackRate = 1.2;
            videoRef.current.play().catch(() => {});
          }
        }, 700);
      }, 5500));
    }

    return () => timers.forEach(clearTimeout);
  }, []);

  // onEnded se dispara al terminar el video (50s a 1.2x) — sin necesidad de timeouts adicionales

  const handleVideoEnded = () => {
    // Video terminó → fade out
    setPhase('video-fade');
    setTimeout(() => {
      // Canvas limpio
      setPhase('canvas');
      setTimeout(() => {
        // Texto reaparece
        setPhase('text-return');
        setTimeout(() => setPhase('text-return-visible'), 800);
      }, 400); // pequeña pausa para que el canvas se vea limpio
    }, 1500); // duración del fade out
  };

  // Opacidad del video
  const videoOpacity = phase === 'video' ? 1
    : phase === 'video-fade' ? 0
    : 0;

  // Visibilidad del texto
  const textVisible = phase === 'text-in' || phase === 'text-visible' || phase === 'text-return' || phase === 'text-return-visible';
  const textFullVisible = phase === 'text-visible' || phase === 'text-return-visible';
  const textTranslate = textFullVisible ? 'translateY(0px)' : 'translateY(30px)';
  const textOpacity = textVisible ? (textFullVisible ? 1 : 0) : 0;

  return (
    <>
      {/* Canvas de partículas — siempre presente en segundo plano */}
      <HeroCinematic />

      {/* Video — solo visible en desktop durante fase 'video' y 'video-fade' */}
      <video
        ref={videoRef}
        muted
        playsInline
        preload="none"
        onEnded={handleVideoEnded}
        className="hidden md:block absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{
          opacity: videoOpacity,
          transition: phase === 'video-fade' ? 'opacity 1.5s ease-out' : 'none',
        }}
      >
        <source src="/hero-bg.mp4" type="video/mp4" />
      </video>

      {/* Overlay oscuro — solo durante el video */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(6,13,46,0.45) 0%, rgba(6,13,46,0.25) 50%, rgba(6,13,46,0.40) 100%)',
          opacity: videoOpacity,
          transition: phase === 'video-fade' ? 'opacity 1.5s ease-out' : 'none',
        }}
      />

      {/* Orbes decorativos */}
      <div className="absolute top-20 right-20 w-72 h-72 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: 'var(--accent)' }} />
      <div className="absolute bottom-0 left-10 w-48 h-48 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: '#3b82f6' }} />

      {/* Texto hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 lg:py-40 relative">
        <div
          className="max-w-3xl"
          style={{
            opacity: textOpacity,
            transform: textTranslate,
            transition: 'opacity 0.7s ease-in-out, transform 0.7s ease-in-out',
          }}
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-white">
            {title}
          </h1>
          <p className="mt-6 text-lg sm:text-xl max-w-xl text-slate-300">
            {subtitle}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link
              href={`/${locale}/productos`}
              className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-full shadow-lg transition-all glow-cyan-sm hover:glow-cyan"
              style={{ background: 'var(--accent)', color: '#060d2e' }}
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
          </div>
        </div>
      </div>
    </>
  );
}
