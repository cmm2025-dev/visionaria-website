'use client';

import { useEffect, useState } from 'react';

const SLIDES = [
  { src: '/feeds/ctd-v1.jpg', alt: 'Flujo operacional DFR — vista 1' },
  { src: '/feeds/ctd-v2.jpg', alt: 'Flujo operacional DFR — vista 2' },
];

const STEPS = [
  { label: 'ALARMA',   time: 'T=0s',    color: '#F09422' },
  { label: 'DESPACHO', time: 'T=5s',    color: '#00d4ff' },
  { label: 'DESPEGUE', time: 'T=30s',   color: '#00d4ff' },
  { label: 'VIDEO EN VIVO', time: 'T=90s', color: '#F09422' },
  { label: 'DECISIÓN', time: '< 2 min', color: '#34d399' },
];

export default function OperationalFlow() {
  const [idx, setIdx]       = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % SLIDES.length);
        setVisible(true);
      }, 700);
    }, 6000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="w-full overflow-hidden relative"
      style={{ background: '#040d20', borderTop: '1px solid rgba(0,212,255,0.1)', borderBottom: '1px solid rgba(0,212,255,0.1)' }}>

      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b"
        style={{ borderColor: 'rgba(0,212,255,0.12)', background: 'rgba(0,0,0,0.4)', position: 'relative', zIndex: 10 }}>
        {/* DJI */}
        <div className="flex items-center border rounded-lg px-4 py-1.5"
          style={{ borderColor: 'rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.5)' }}>
          <svg viewBox="0 0 60 24" className="h-5 w-auto fill-white">
            <text y="20" fontSize="20" fontWeight="800" fontFamily="Arial">DJI</text>
          </svg>
        </div>

        {/* Center */}
        <div className="text-center flex-1 mx-4">
          <p className="text-xs font-bold tracking-[0.25em] uppercase mb-0.5" style={{ color: '#F09422' }}>
            Central Táctica de Drones
          </p>
          <p className="text-[10px] tracking-[0.2em] font-light" style={{ color: 'rgba(255,255,255,0.4)' }}>
            DRON COMO PRIMERA FUERZA DE RESPUESTA · DFR
          </p>
        </div>

        {/* Genetec */}
        <div className="flex items-center border rounded-lg px-4 py-1.5"
          style={{ borderColor: 'rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.5)' }}>
          <svg viewBox="0 0 90 24" className="h-5 w-auto">
            <text y="20" fontSize="19" fontWeight="700" fontFamily="Arial" fill="#00aaff">Gene</text>
            <text x="46" y="20" fontSize="19" fontWeight="700" fontFamily="Arial" fill="white">tec</text>
            <text x="82" y="10" fontSize="10" fontFamily="Arial" fill="#00aaff">®</text>
          </svg>
        </div>
      </div>

      {/* Carousel image */}
      <div className="relative w-full" style={{ aspectRatio: '16/9', maxHeight: 520 }}>
        {SLIDES.map((slide, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={slide.src}
            src={slide.src}
            alt={slide.alt}
            className="absolute inset-0 w-full h-full object-cover object-center"
            style={{
              opacity: i === idx ? (visible ? 1 : 0) : 0,
              transition: 'opacity 0.7s ease-in-out',
            }}
          />
        ))}

        {/* Scanline overlay */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px)' }} />

        {/* Bottom gradient to blend into timeline */}
        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, rgba(4,13,32,0.95))' }} />

        {/* Slide dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => { setVisible(false); setTimeout(() => { setIdx(i); setVisible(true); }, 300); }}
              className="w-1.5 h-1.5 rounded-full transition-all"
              style={{ background: i === idx ? '#F09422' : 'rgba(255,255,255,0.3)', transform: i === idx ? 'scale(1.3)' : 'scale(1)' }} />
          ))}
        </div>
      </div>

      {/* Timeline bar */}
      <div className="relative px-0 py-4" style={{ background: 'rgba(4,13,32,0.97)', borderTop: '1px solid rgba(0,212,255,0.08)' }}>
        {/* Glowing line */}
        <div className="absolute left-0 right-0 h-px"
          style={{ top: '28px', background: 'linear-gradient(90deg, transparent 2%, #00d4ff 10%, #00d4ff 90%, transparent 98%)', boxShadow: '0 0 8px #00d4ff, 0 0 16px rgba(0,212,255,0.3)' }} />

        <div className="grid grid-cols-5">
          {STEPS.map((step, i) => (
            <div key={step.label} className="flex flex-col items-center gap-1.5">
              {/* Node */}
              <div className="z-10 w-7 h-7 rounded-full border-2 flex items-center justify-center"
                style={{ background: 'rgba(4,13,32,0.9)', borderColor: step.color, boxShadow: `0 0 10px ${step.color}60` }}>
                <div className="w-2 h-2 rounded-full" style={{ background: step.color }} />
              </div>
              <p className="text-[9px] sm:text-[10px] font-bold tracking-widest text-center" style={{ color: step.color }}>{step.label}</p>
              <p className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>{step.time}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
