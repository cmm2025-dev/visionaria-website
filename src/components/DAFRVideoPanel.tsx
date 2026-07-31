'use client';

import { useState, useEffect } from 'react';
import { Play } from 'lucide-react';

const LOOP_FRAMES = ['/dafr-loop/frame-1.jpg', '/dafr-loop/frame-2.jpg', '/dafr-loop/frame-3.jpg'];

/** Same click-to-play YouTube panel used on the home page (VideoDemo), reused here for DAFR. */
export default function DAFRVideoPanel({ videoId }: { videoId: string }) {
  const [playing, setPlaying] = useState(false);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (playing) return;
    const t = setInterval(() => setFrame(f => (f + 1) % LOOP_FRAMES.length), 3200);
    return () => clearInterval(t);
  }, [playing]);

  return (
    <div className="flex flex-col gap-4">
      {/* Main demo video */}
      <div className="relative rounded-2xl overflow-hidden border" style={{ aspectRatio: '16/9', borderColor: 'rgba(240,148,34,0.3)' }}>
        {playing ? (
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            title="DAFR — Dron como Primera Fuerza de Respuesta"
            style={{ border: 'none' }}
          />
        ) : (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer select-none"
            onClick={() => setPlaying(true)}
          >
            {/* Looping background — Central Táctica de Drones */}
            {LOOP_FRAMES.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={src}
                src={src}
                alt="Central Táctica de Drones — Visionaria"
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
                style={{ opacity: frame === i ? 1 : 0 }}
              />
            ))}
            <div className="absolute inset-0" style={{ background: 'rgba(20,17,14,0.35)' }} />

            <button
              className="relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-transform hover:scale-110"
              style={{
                background: 'rgba(240,148,34,0.15)',
                border: '2px solid rgba(240,148,34,0.6)',
                boxShadow: '0 0 40px rgba(240,148,34,0.3), 0 0 80px rgba(240,148,34,0.1)',
                backdropFilter: 'blur(2px)',
              }}
              aria-label="Reproducir video"
            >
              <Play size={32} fill="#F09422" style={{ color: '#F09422', marginLeft: 4 }} />
            </button>

            <p className="relative z-10 mt-4 text-sm text-white tracking-wide" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.8)' }}>
              Ver demostración — Sistema Integrado Visionaria
            </p>

            {['top-3 left-3', 'top-3 right-3', 'bottom-3 left-3', 'bottom-3 right-3'].map((pos, i) => (
              <div key={i} className={`absolute ${pos} w-5 h-5 z-10`} style={{ color: 'rgba(240,148,34,0.8)' }}>
                <svg viewBox="0 0 20 20" fill="none">
                  {i === 0 && <path d="M0 8V0h8" stroke="currentColor" strokeWidth="1.5" />}
                  {i === 1 && <path d="M20 8V0h-8" stroke="currentColor" strokeWidth="1.5" />}
                  {i === 2 && <path d="M0 12v8h8" stroke="currentColor" strokeWidth="1.5" />}
                  {i === 3 && <path d="M20 12v8h-8" stroke="currentColor" strokeWidth="1.5" />}
                </svg>
              </div>
            ))}
          </div>
        )}

        <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold"
          style={{ background: 'rgba(24,21,16,0.8)', border: '1px solid rgba(240,148,34,0.3)', color: '#F09422' }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#F09422' }} />
          DEMO
        </div>
      </div>
    </div>
  );
}
