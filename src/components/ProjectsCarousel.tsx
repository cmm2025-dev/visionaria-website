'use client';

import { useEffect, useState } from 'react';
import { Expand, X, ChevronLeft, ChevronRight } from 'lucide-react';

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
  '/proyectos/obra-10.jpg',
  '/proyectos/obra-11.jpg',
  '/proyectos/obra-12.jpg',
];

interface ProjectsCarouselProps {
  viewLabel?: string;
}

/** Cross-fading background carousel of real fieldwork photos, dimmed behind a dark overlay so hero text stays readable. Includes a button to view the photos full-size without the overlay. */
export default function ProjectsCarousel({ viewLabel = 'Ver fotografías' }: ProjectsCarouselProps) {
  const [frame, setFrame] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    if (lightbox) return;
    const id = setInterval(() => setFrame(f => (f + 1) % FRAMES.length), 4000);
    return () => clearInterval(id);
  }, [lightbox]);

  const openLightbox = () => {
    setLightboxIndex(frame);
    setLightbox(true);
  };

  return (
    <>
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

      <button
        type="button"
        onClick={openLightbox}
        className="absolute bottom-4 right-4 z-10 inline-flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-full border backdrop-blur-sm transition-colors text-white hover:text-[#F09422] hover:border-[#F09422]"
        style={{ background: 'rgba(0,0,0,0.35)', borderColor: 'rgba(255,255,255,0.25)' }}
      >
        <Expand size={14} />
        {viewLabel}
      </button>

      {lightbox && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-end"
          style={{ background: 'rgba(10,9,8,0.92)' }}
          onClick={() => setLightbox(false)}
        >
          <button
            type="button"
            onClick={() => setLightbox(false)}
            className="absolute top-5 right-5 text-white/80 hover:text-white p-2"
            aria-label="Cerrar"
          >
            <X size={28} />
          </button>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => (i - 1 + FRAMES.length) % FRAMES.length); }}
            className="absolute left-4 sm:left-10 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2"
            aria-label="Anterior"
          >
            <ChevronLeft size={32} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => (i + 1) % FRAMES.length); }}
            className="absolute right-4 sm:right-10 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2"
            aria-label="Siguiente"
          >
            <ChevronRight size={32} />
          </button>

          <div
            className="relative w-full h-full sm:w-4/5 md:w-3/5 lg:w-1/2 flex items-center justify-center p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={FRAMES[lightboxIndex]}
              alt=""
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
}
