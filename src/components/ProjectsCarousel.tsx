'use client';

import { useEffect, useState } from 'react';

const FRAMES = [
  '/proyectos/obra-1.jpg',
  '/proyectos/obra-2.jpg',
  '/proyectos/obra-3.jpg',
  '/proyectos/obra-4.jpg',
  '/proyectos/obra-5.jpg',
  '/proyectos/obra-6.jpg',
  '/proyectos/obra-7.jpg',
  '/proyectos/obra-8.jpg',
  '/proyectos/obra-9.jpg',
];

/** Cross-fading background carousel of real fieldwork photos, dimmed behind a dark overlay so hero text stays readable. */
export default function ProjectsCarousel() {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setFrame(f => (f + 1) % FRAMES.length), 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="absolute inset-0" aria-hidden>
      {FRAMES.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
          style={{ opacity: frame === i ? 1 : 0 }}
        />
      ))}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(145deg, rgba(40,34,26,0.88) 0%, rgba(30,27,24,0.80) 60%, rgba(34,32,24,0.85) 100%)' }}
      />
    </div>
  );
}
