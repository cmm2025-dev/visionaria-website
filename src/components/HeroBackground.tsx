'use client';

import { useRef, useState } from 'react';
import HeroCinematic from './HeroCinematic';

export default function HeroBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoVisible, setVideoVisible] = useState(true);

  return (
    <>
      {/* Canvas de partículas — siempre presente */}
      <HeroCinematic />

      {/* Video — desaparece suavemente al terminar */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        onEnded={() => setVideoVisible(false)}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{
          opacity: videoVisible ? 1 : 0,
          transition: 'opacity 1.5s ease-out',
        }}
      >
        <source src="/hero-bg.mp4" type="video/mp4" />
      </video>

      {/* Overlay oscuro — también desaparece con el video */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(6,13,46,0.45) 0%, rgba(6,13,46,0.25) 50%, rgba(6,13,46,0.40) 100%)',
          opacity: videoVisible ? 1 : 0,
          transition: 'opacity 1.5s ease-out',
        }}
      />
    </>
  );
}
