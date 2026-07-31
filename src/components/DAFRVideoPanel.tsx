'use client';

import { useState } from 'react';
import { Play, Video } from 'lucide-react';

/** Same click-to-play YouTube panel used on the home page (VideoDemo), reused here for DAFR. */
export default function DAFRVideoPanel({ videoId }: { videoId: string }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="relative group">
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
            style={{ background: 'linear-gradient(135deg, #28221A 0%, #222018 100%)' }}
            onClick={() => setPlaying(true)}
          >
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
              {[20, 40, 60, 80].map((pct) => (
                <div key={pct} className="absolute w-full h-px" style={{ top: `${pct}%`, background: 'rgba(61,138,130,0.5)' }} />
              ))}
            </div>

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

            <p className="mt-4 text-sm text-slate-400 tracking-wide z-10">Ver demostración — Sistema Integrado Visionaria</p>

            {['top-3 left-3', 'top-3 right-3', 'bottom-3 left-3', 'bottom-3 right-3'].map((pos, i) => (
              <div key={i} className={`absolute ${pos} w-5 h-5`} style={{ color: 'rgba(240,148,34,0.5)' }}>
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

      {/* Caso real — Asheville, USA (post-tormenta) */}
      <a
        href="https://www.youtube.com/watch?v=o_HdKiM1MEE"
        target="_blank"
        rel="noopener noreferrer"
        className="group/case absolute bottom-3 right-3 sm:-bottom-6 sm:-right-6 w-40 sm:w-56 rounded-xl overflow-hidden border shadow-2xl transition-transform hover:scale-105 z-30"
        style={{ borderColor: 'rgba(240,148,34,0.4)', background: '#0f0d0b' }}
      >
        <div className="relative" style={{ aspectRatio: '16/9' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://img.youtube.com/vi/o_HdKiM1MEE/hqdefault.jpg"
            alt="Caso real: Asheville, USA — respuesta post-tormenta"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.35)' }}>
            <div
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-transform group-hover/case:scale-110"
              style={{ background: 'rgba(240,148,34,0.85)' }}
            >
              <Video size={16} style={{ color: '#1E1B18' }} />
            </div>
          </div>
        </div>
        <div className="px-2.5 py-2" style={{ background: 'rgba(15,13,11,0.95)' }}>
          <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#F09422' }}>Caso real</p>
          <p className="text-[11px] sm:text-xs text-slate-300 leading-snug mt-0.5">Asheville, USA — Respuesta post-tormenta</p>
        </div>
      </a>
    </div>
  );
}
