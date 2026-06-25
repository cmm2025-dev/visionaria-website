'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Play, ArrowRight } from 'lucide-react';

interface VideoDemoProps {
  /** YouTube video ID (e.g. "dQw4w9WgXcQ") OR a direct .mp4 URL */
  videoSrc: string;
  /** Poster image URL shown before play */
  poster?: string;
  locale?: string;
}

function isYouTube(src: string) {
  return !src.startsWith('http') || src.includes('youtube') || src.includes('youtu.be');
}

function youtubeId(src: string) {
  const match = src.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
  return match ? match[1] : src;
}

export default function VideoDemo({ videoSrc, poster, locale = 'es' }: VideoDemoProps) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ytMode = isYouTube(videoSrc);

  const handlePlay = () => {
    setPlaying(true);
    if (!ytMode && videoRef.current) {
      videoRef.current.play();
    }
  };

  return (
    <section className="w-full py-20 px-4" style={{ background: 'linear-gradient(180deg, #060d2e 0%, #080f38 100%)' }}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

        {/* Left: Text */}
        <div className="order-2 lg:order-1">
          {/* Eyebrow */}
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-4" style={{ color: '#F09422' }}>
            Demo en vivo
          </p>

          {/* Heading */}
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-6">
            Mira cómo funciona{' '}
            <span style={{ color: '#F09422' }}>en tiempo real</span>
          </h2>

          <p className="text-slate-400 leading-relaxed mb-4">
            Desde la detección automática de un incidente hasta el despliegue de un drone y la confirmación de identidad — todo en menos de dos minutos.
          </p>
          <p className="text-slate-400 leading-relaxed mb-8">
            Plataforma Genetec Security Center integrada con drones DJI Dock, reconocimiento facial y lectores LPR en un único ecosistema de respuesta.
          </p>

          {/* Stats row */}
          <div className="flex gap-8 mb-10">
            {[
              { value: '< 2 min', label: 'Tiempo de respuesta' },
              { value: '+3.700', label: 'Cámaras activas' },
              { value: '40+', label: 'Municipalidades' },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-xl font-extrabold" style={{ color: '#F09422' }}>{value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <Link
            href={`/${locale}/contacto`}
            className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-full transition-all glow-cyan-sm hover:glow-cyan"
            style={{ background: 'var(--accent)', color: '#060d2e' }}
          >
            Solicitar demo presencial <ArrowRight size={16} />
          </Link>
        </div>

        {/* Right: Video player */}
        <div className="order-1 lg:order-2 relative group">
          {/* Glow halo */}
          <div
            className="absolute -inset-1 rounded-2xl blur-2xl opacity-30 pointer-events-none transition-opacity group-hover:opacity-50"
            style={{ background: 'linear-gradient(135deg, #F09422, #00d4ff)' }}
          />

          <div
            className="relative rounded-2xl overflow-hidden border"
            style={{ borderColor: 'rgba(240,148,34,0.25)', aspectRatio: '16/9' }}
          >
            {/* YouTube embed */}
            {ytMode && playing && (
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${youtubeId(videoSrc)}?autoplay=1&rel=0&modestbranding=1`}
                allow="autoplay; encrypted-media"
                allowFullScreen
                title="Visionaria demo"
              />
            )}

            {/* Direct video */}
            {!ytMode && (
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                src={videoSrc}
                poster={poster}
                muted
                loop
                playsInline
              />
            )}

            {/* Poster / overlay before play */}
            {!playing && (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer select-none"
                style={{ background: poster ? 'rgba(6,13,46,0.55)' : 'linear-gradient(135deg, #0a1545 0%, #0d1a5e 100%)' }}
                onClick={handlePlay}
              >
                {/* Decorative scanner lines */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
                  {[20, 40, 60, 80].map((pct) => (
                    <div
                      key={pct}
                      className="absolute w-full h-px"
                      style={{ top: `${pct}%`, background: 'rgba(0,212,255,0.5)' }}
                    />
                  ))}
                </div>

                {/* City silhouette SVG placeholder */}
                {!poster && (
                  <svg viewBox="0 0 640 200" className="absolute bottom-0 w-full opacity-10" fill="none">
                    <rect x="20"  y="80"  width="60"  height="120" fill="#F09422"/>
                    <rect x="90"  y="50"  width="80"  height="150" fill="#F09422"/>
                    <rect x="180" y="100" width="50"  height="100" fill="#F09422"/>
                    <rect x="240" y="30"  width="100" height="170" fill="#F09422"/>
                    <rect x="350" y="70"  width="60"  height="130" fill="#F09422"/>
                    <rect x="420" y="90"  width="80"  height="110" fill="#F09422"/>
                    <rect x="510" y="60"  width="70"  height="140" fill="#F09422"/>
                    <rect x="590" y="110" width="50"  height="90"  fill="#F09422"/>
                    {/* Drone */}
                    <circle cx="320" cy="80" r="3" fill="#00d4ff" opacity="0.9"/>
                    <line x1="310" y1="80" x2="330" y2="80" stroke="#00d4ff" strokeWidth="1.5" opacity="0.7"/>
                    <line x1="320" y1="70" x2="320" y2="90" stroke="#00d4ff" strokeWidth="1.5" opacity="0.7"/>
                    {/* Scan beam */}
                    <path d="M315 83 L300 130 L340 130 L325 83Z" fill="rgba(0,212,255,0.08)"/>
                  </svg>
                )}

                {/* Play button */}
                <button
                  className="relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  style={{
                    background: 'rgba(240,148,34,0.15)',
                    border: '2px solid rgba(240,148,34,0.6)',
                    boxShadow: '0 0 40px rgba(240,148,34,0.3), 0 0 80px rgba(240,148,34,0.1)',
                  }}
                  aria-label="Reproducir video"
                >
                  <Play size={32} fill="#F09422" style={{ color: '#F09422', marginLeft: 4 }} />
                </button>

                <p className="mt-4 text-sm text-slate-400 tracking-wide z-10">
                  Ver demostración — Sistema Integrado Visionaria
                </p>

                {/* Corner brackets */}
                {['top-3 left-3', 'top-3 right-3', 'bottom-3 left-3', 'bottom-3 right-3'].map((pos, i) => (
                  <div key={i} className={`absolute ${pos} w-5 h-5`} style={{ color: 'rgba(240,148,34,0.5)' }}>
                    <svg viewBox="0 0 20 20" fill="none">
                      {i === 0 && <><path d="M0 8V0h8" stroke="currentColor" strokeWidth="1.5"/></>}
                      {i === 1 && <><path d="M20 8V0h-8" stroke="currentColor" strokeWidth="1.5"/></>}
                      {i === 2 && <><path d="M0 12v8h8" stroke="currentColor" strokeWidth="1.5"/></>}
                      {i === 3 && <><path d="M20 12v8h-8" stroke="currentColor" strokeWidth="1.5"/></>}
                    </svg>
                  </div>
                ))}
              </div>
            )}

            {/* Live badge */}
            <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold"
              style={{ background: 'rgba(6,13,46,0.8)', border: '1px solid rgba(240,148,34,0.3)', color: '#F09422' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#F09422' }} />
              DEMO
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
