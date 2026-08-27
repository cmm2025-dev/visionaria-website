'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

const SLIDES = [
  '/soporte/soporte-hero-control-room.webp',
  '/soporte/soporte-hero-diagrama-1.webp',
  '/soporte/soporte-hero-diagrama-2.webp',
];

const INTERVAL_MS = 6000;

export default function SupportHeroCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive(i => (i + 1) % SLIDES.length), INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {SLIDES.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          priority={i === 0}
          className="object-cover transition-opacity duration-1000"
          style={{ opacity: i === active ? 0.85 : 0 }}
        />
      ))}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(115deg, #1E1B18 8%, rgba(30,27,24,0.55) 40%, rgba(30,27,24,0.1) 100%)' }} />

      <div className="absolute bottom-6 right-6 flex gap-2 pointer-events-auto">
        {SLIDES.map((src, i) => (
          <button
            key={src}
            onClick={() => setActive(i)}
            aria-label={`Ver imagen ${i + 1}`}
            className="w-2 h-2 rounded-full transition-all"
            style={{ background: i === active ? '#F09422' : 'rgba(255,255,255,0.3)', width: i === active ? '1.5rem' : '0.5rem' }}
          />
        ))}
      </div>
    </div>
  );
}
