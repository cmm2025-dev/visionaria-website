'use client';

const partners = [
  {
    name: 'DJI',
    svg: (
      <svg viewBox="0 0 80 28" className="h-6 w-auto">
        <text y="22" fontSize="22" fontWeight="900" fontFamily="Arial" fill="white" letterSpacing="-1">DJI</text>
      </svg>
    ),
  },
  {
    name: 'Genetec',
    svg: (
      <svg viewBox="0 0 110 28" className="h-6 w-auto">
        <text y="22" fontSize="18" fontWeight="700" fontFamily="Arial" fill="white" letterSpacing="0.5">Genetec</text>
      </svg>
    ),
  },
  {
    name: 'Hikvision',
    svg: (
      <svg viewBox="0 0 120 28" className="h-6 w-auto">
        <text y="22" fontSize="18" fontWeight="700" fontFamily="Arial" fill="white">Hik</text>
        <text x="44" y="22" fontSize="18" fontWeight="300" fontFamily="Arial" fill="#e0e0e0">vision</text>
      </svg>
    ),
  },
  {
    name: 'Axis',
    svg: (
      <svg viewBox="0 0 70 28" className="h-6 w-auto">
        <text y="22" fontSize="20" fontWeight="800" fontFamily="Arial" fill="white" letterSpacing="2">AXIS</text>
      </svg>
    ),
  },
  {
    name: 'Milestone',
    svg: (
      <svg viewBox="0 0 120 28" className="h-6 w-auto">
        <text y="22" fontSize="18" fontWeight="600" fontFamily="Arial" fill="white">Milestone</text>
      </svg>
    ),
  },
  {
    name: 'Bosch',
    svg: (
      <svg viewBox="0 0 80 28" className="h-6 w-auto">
        <text y="22" fontSize="20" fontWeight="700" fontFamily="Arial" fill="white" letterSpacing="1">BOSCH</text>
      </svg>
    ),
  },
  {
    name: 'NEC',
    svg: (
      <svg viewBox="0 0 60 28" className="h-6 w-auto">
        <text y="22" fontSize="22" fontWeight="800" fontFamily="Arial" fill="white" letterSpacing="2">NEC</text>
      </svg>
    ),
  },
  {
    name: 'Pelco',
    svg: (
      <svg viewBox="0 0 80 28" className="h-6 w-auto">
        <text y="22" fontSize="20" fontWeight="700" fontFamily="Arial" fill="white" letterSpacing="1">PELCO</text>
      </svg>
    ),
  },
  {
    name: 'Cisco',
    svg: (
      <svg viewBox="0 0 80 28" className="h-6 w-auto">
        <text y="22" fontSize="20" fontWeight="700" fontFamily="Arial" fill="white" letterSpacing="0.5">Cisco</text>
      </svg>
    ),
  },
  {
    name: 'Ubiquiti',
    svg: (
      <svg viewBox="0 0 100 28" className="h-6 w-auto">
        <text y="22" fontSize="18" fontWeight="600" fontFamily="Arial" fill="white" letterSpacing="0.5">Ubiquiti</text>
      </svg>
    ),
  },
  {
    name: 'Hanwha',
    svg: (
      <svg viewBox="0 0 100 28" className="h-6 w-auto">
        <text y="22" fontSize="18" fontWeight="700" fontFamily="Arial" fill="white" letterSpacing="0.5">HANWHA</text>
      </svg>
    ),
  },
];

export default function PartnerStrip() {
  return (
    <section className="relative overflow-hidden py-6 border-y" style={{ background: 'rgba(6,13,46,0.95)', borderColor: 'rgba(240,148,34,0.12)' }}>
      {/* Left fade */}
      <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none" style={{ background: 'linear-gradient(to right, #060d2e, transparent)' }} />
      {/* Right fade */}
      <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none" style={{ background: 'linear-gradient(to left, #060d2e, transparent)' }} />

      {/* Label */}
      <div className="absolute left-8 top-1/2 -translate-y-1/2 z-20">
        <span className="text-xs font-bold tracking-[0.25em] uppercase" style={{ color: '#F09422' }}>Partners</span>
      </div>

      {/* Scrolling track */}
      <div className="flex partner-track">
        {/* Two copies for seamless loop */}
        {[0, 1].map((copy) => (
          <div key={copy} className="flex items-center gap-14 shrink-0 pl-14" aria-hidden={copy === 1}>
            {partners.map(({ name, svg }) => (
              <div
                key={name}
                className="opacity-40 hover:opacity-90 transition-opacity duration-300 grayscale hover:grayscale-0 shrink-0"
                title={name}
              >
                {svg}
              </div>
            ))}
          </div>
        ))}
      </div>

      <style jsx>{`
        .partner-track {
          animation: marquee 32s linear infinite;
          will-change: transform;
        }
        .partner-track:hover {
          animation-play-state: paused;
        }
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}
