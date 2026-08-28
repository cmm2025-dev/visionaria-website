'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

const SLIDES = [
  '/soporte/soporte-hero-control-room.webp',
  '/soporte/soporte-hero-diagrama-1.webp',
  '/soporte/soporte-hero-diagrama-2.webp',
];

const INTERVAL_MS = 5000;

interface SupportHeroCarouselProps {
  /** Active-dot color, matched to each section's own accent. */
  accent?: string;
}

export default function SupportHeroCarousel({ accent = '#F09422' }: SupportHeroCarouselProps) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive(i => (i + 1) % SLIDES.length), INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0"
        style={{ transform: `translateX(-${active * 100}%)`, transition: 'transform 1100ms cubic-bezier(0.65,0,0.35,1)' }}
      >
        {SLIDES.map((src, i) => (
          <div key={src} className="absolute inset-y-0" style={{ left: `${i * 100}%`, width: '100%' }}>
            <Image src={src} alt="" fill priority={i === 0} className="object-cover" style={{ opacity: 0.9 }} />
          </div>
        ))}
      </div>

      <div className="absolute inset-0" style={{ background: 'linear-gradient(115deg, #1E1B18 6%, rgba(30,27,24,0.5) 38%, rgba(30,27,24,0.05) 100%)' }} />

      <div className="absolute bottom-6 right-6 flex gap-2 pointer-events-auto">
        {SLIDES.map((src, i) => (
          <button
            key={src}
            onClick={() => setActive(i)}
            aria-label={`Ver imagen ${i + 1}`}
            className="h-2.5 rounded-full transition-all"
            style={{ background: i === active ? accent : 'rgba(255,255,255,0.35)', width: i === active ? '1.75rem' : '0.625rem' }}
          />
        ))}
      </div>
    </div>
  );
}
