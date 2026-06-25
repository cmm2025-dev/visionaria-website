'use client';

import { useEffect, useRef } from 'react';

/* Floating tech icons that drift slowly across the hero background */
const TECH_ICONS = [
  /* Camera */
  <svg key="cam" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="14" width="40" height="28" rx="4" stroke="currentColor" strokeWidth="2"/>
    <circle cx="24" cy="28" r="8" stroke="currentColor" strokeWidth="2"/>
    <circle cx="24" cy="28" r="3" fill="currentColor" opacity="0.4"/>
    <path d="M16 14v-4h16v4" stroke="currentColor" strokeWidth="2"/>
    <circle cx="36" cy="22" r="2" fill="currentColor"/>
  </svg>,
  /* Drone */
  <svg key="drone" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="18" y="20" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="2"/>
    <line x1="18" y1="22" x2="8" y2="14" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="30" y1="22" x2="40" y2="14" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="18" y1="26" x2="8" y2="34" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="30" y1="26" x2="40" y2="34" stroke="currentColor" strokeWidth="1.5"/>
    <ellipse cx="8" cy="13" rx="6" ry="2" stroke="currentColor" strokeWidth="1.5" opacity="0.7"/>
    <ellipse cx="40" cy="13" rx="6" ry="2" stroke="currentColor" strokeWidth="1.5" opacity="0.7"/>
    <ellipse cx="8" cy="35" rx="6" ry="2" stroke="currentColor" strokeWidth="1.5" opacity="0.7"/>
    <ellipse cx="40" cy="35" rx="6" ry="2" stroke="currentColor" strokeWidth="1.5" opacity="0.7"/>
  </svg>,
  /* Shield */
  <svg key="shield" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 4L8 10v14c0 10 7 18 16 20 9-2 16-10 16-20V10L24 4z" stroke="currentColor" strokeWidth="2"/>
    <path d="M16 24l5 5 11-11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>,
  /* City / building */
  <svg key="city" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="20" width="14" height="24" stroke="currentColor" strokeWidth="2"/>
    <rect x="20" y="10" width="22" height="34" stroke="currentColor" strokeWidth="2"/>
    <rect x="23" y="14" width="4" height="4" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
    <rect x="31" y="14" width="4" height="4" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
    <rect x="23" y="22" width="4" height="4" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
    <rect x="31" y="22" width="4" height="4" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
    <rect x="9" y="24" width="4" height="4" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
    <rect x="26" y="36" width="8" height="8" stroke="currentColor" strokeWidth="1.5"/>
  </svg>,
  /* Satellite / signal */
  <svg key="signal" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="28" r="4" fill="currentColor" opacity="0.5"/>
    <path d="M16 20a11 11 0 0 1 16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M10 14a19 19 0 0 1 28 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
    <path d="M4 8a27 27 0 0 1 40 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
    <line x1="24" y1="32" x2="24" y2="44" stroke="currentColor" strokeWidth="2"/>
    <line x1="18" y1="44" x2="30" y2="44" stroke="currentColor" strokeWidth="2"/>
  </svg>,
  /* License plate */
  <svg key="lpr" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="14" width="40" height="20" rx="3" stroke="currentColor" strokeWidth="2"/>
    <text x="10" y="29" fontSize="11" fontFamily="monospace" fill="currentColor" opacity="0.7">AB·1234</text>
    <circle cx="8" cy="24" r="2" fill="currentColor" opacity="0.4"/>
    <circle cx="40" cy="24" r="2" fill="currentColor" opacity="0.4"/>
  </svg>,
  /* Eye / facial rec */
  <svg key="eye" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 24s7-14 20-14 20 14 20 14-7 14-20 14S4 24 4 24z" stroke="currentColor" strokeWidth="2"/>
    <circle cx="24" cy="24" r="6" stroke="currentColor" strokeWidth="2"/>
    <circle cx="24" cy="24" r="2" fill="currentColor" opacity="0.5"/>
    <line x1="8" y1="8" x2="16" y2="16" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
    <line x1="40" y1="8" x2="32" y2="16" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
  </svg>,
  /* Network node */
  <svg key="net" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="4" stroke="currentColor" strokeWidth="2"/>
    <circle cx="8" cy="10" r="3" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="40" cy="10" r="3" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="8" cy="38" r="3" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="40" cy="38" r="3" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="11" y1="12" x2="21" y2="21" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
    <line x1="37" y1="12" x2="27" y2="21" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
    <line x1="11" y1="36" x2="21" y2="27" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
    <line x1="37" y1="36" x2="27" y2="27" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
  </svg>,
];

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  size: number; opacity: number;
}

export default function HeroCinematic() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf: number;
    const particles: Particle[] = [];
    const COUNT = 80;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.5 + 0.1,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      /* Grid lines */
      ctx.strokeStyle = 'rgba(240,148,34,0.04)';
      ctx.lineWidth = 1;
      const GRID = 60;
      for (let x = 0; x < canvas.width; x += GRID) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += GRID) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      /* Particles + connections */
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(240,148,34,${p.opacity})`;
        ctx.fill();
      }

      /* Draw lines between close particles */
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0,212,255,${0.08 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <>
      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ opacity: 0.7 }}
      />

      {/* Floating SVG tech icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        {TECH_ICONS.map((icon, i) => {
          const positions = [
            { top: '8%',  right: '6%',  size: 36, delay: 0 },
            { top: '18%', right: '22%', size: 28, delay: 1.2 },
            { top: '60%', right: '4%',  size: 44, delay: 0.7 },
            { top: '75%', right: '28%', size: 30, delay: 2.1 },
            { top: '35%', right: '12%', size: 38, delay: 1.8 },
            { top: '50%', right: '40%', size: 24, delay: 0.4 },
            { top: '85%', right: '15%', size: 32, delay: 3.0 },
            { top: '12%', right: '42%', size: 26, delay: 2.5 },
          ];
          const pos = positions[i % positions.length];
          return (
            <div
              key={i}
              className="absolute cinematic-float"
              style={{
                top: pos.top,
                right: pos.right,
                width: pos.size,
                height: pos.size,
                color: i % 2 === 0 ? 'rgba(240,148,34,0.18)' : 'rgba(0,212,255,0.15)',
                animationDelay: `${pos.delay}s`,
              }}
            >
              {icon}
            </div>
          );
        })}
      </div>

      {/* Scanning line effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="scan-line" />
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.6; }
          33%       { transform: translateY(-12px) rotate(3deg); opacity: 1; }
          66%       { transform: translateY(6px) rotate(-2deg); opacity: 0.7; }
        }
        .cinematic-float {
          animation: float 8s ease-in-out infinite;
        }

        @keyframes scanline {
          0%   { top: -2px; opacity: 0; }
          5%   { opacity: 1; }
          95%  { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .scan-line {
          position: absolute;
          left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, rgba(0,212,255,0.15) 30%, rgba(240,148,34,0.3) 50%, rgba(0,212,255,0.15) 70%, transparent 100%);
          animation: scanline 6s linear infinite;
        }
      `}</style>
    </>
  );
}
