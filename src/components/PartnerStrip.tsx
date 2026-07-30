'use client';

const brands = [
  {
    name: 'Hikvision',
    svg: (
      <svg viewBox="0 0 180 36" className="h-7 w-auto" aria-label="Hikvision">
        <text
          y="27" fontSize="26" fontWeight="900" fontFamily="Arial, sans-serif"
          fill="white" letterSpacing="-0.5"
          transform="skewX(-8)"
        >HIKVISION</text>
        <text x="161" y="16" fontSize="9" fontFamily="Arial" fill="white">®</text>
      </svg>
    ),
  },
  {
    name: 'IQSIGHT',
    svg: (
      <svg viewBox="0 0 150 36" className="h-7 w-auto" aria-label="IQSIGHT">
        <text y="28" fontSize="28" fontWeight="900" fontFamily="Arial Black, Arial, sans-serif" fill="#E52222" letterSpacing="1">IQSIGHT</text>
      </svg>
    ),
  },
  {
    name: 'Dahua',
    svg: (
      <svg viewBox="0 0 160 40" className="h-8 w-auto" aria-label="Dahua Technology">
        {/* Circular d icon */}
        <circle cx="18" cy="20" r="14" fill="none" stroke="#E52222" strokeWidth="3.5" />
        <path d="M18 8 Q28 8 28 20 Q28 32 18 32 L18 8Z" fill="#E52222" />
        <path d="M10 20 Q10 10 18 10" fill="none" stroke="#E52222" strokeWidth="0" />
        {/* "hua" text */}
        <text x="38" y="25" fontSize="20" fontWeight="400" fontFamily="Arial, sans-serif" fill="white" letterSpacing="0.5">hua</text>
        {/* TECHNOLOGY */}
        <text x="38" y="36" fontSize="7.5" fontWeight="600" fontFamily="Arial, sans-serif" fill="rgba(255,255,255,0.7)" letterSpacing="1.5">TECHNOLOGY</text>
      </svg>
    ),
  },
  {
    name: 'Milesight',
    svg: (
      <svg viewBox="0 0 150 36" className="h-7 w-auto" aria-label="Milesight">
        {/* Arc above text */}
        <path d="M10 14 Q75 2 140 14" fill="none" stroke="#00AEEF" strokeWidth="2.5" strokeLinecap="round" />
        <text x="2" y="32" fontSize="20" fontWeight="700" fontFamily="Arial, sans-serif" fill="white" letterSpacing="0.3">Milesight</text>
      </svg>
    ),
  },
  {
    name: 'Genetec',
    svg: (
      <svg viewBox="0 0 140 36" className="h-7 w-auto" aria-label="Genetec">
        {/* Small geometric G mark */}
        <rect x="0" y="8" width="18" height="18" rx="2" fill="#00A3E0" />
        <text x="4" y="22" fontSize="14" fontWeight="900" fontFamily="Arial, sans-serif" fill="white">G</text>
        <text x="24" y="26" fontSize="20" fontWeight="600" fontFamily="Arial, sans-serif" fill="white" letterSpacing="0.3">Genetec</text>
      </svg>
    ),
  },
  {
    name: 'DJI',
    svg: (
      <svg viewBox="0 0 220 150" className="h-8 w-auto" aria-label="DJI">
        {/* d — rounded rect with square cutout */}
        <path
          d="M 8,4 Q 4,4 4,8 L 4,118 Q 4,142 28,142 L 90,142 L 90,104 L 36,104 Q 28,104 28,96 L 28,54 L 90,54 L 90,4 Z"
          fill="white"
        />
        <rect x="44" y="18" width="46" height="50" fill="black" rx="2" />
        {/* j — tall center shape with curved bottom */}
        <path
          d="M 102,4 L 102,118 Q 102,142 78,142 L 78,126 Q 86,126 86,118 L 86,4 Z"
          fill="white"
        />
        {/* i — two diagonal slash bars */}
        <path d="M 112,4 L 136,4 L 136,56 L 112,56 Z" fill="white" transform="skewX(-10)" />
        <path d="M 112,70 L 136,70 L 136,142 L 112,142 Z" fill="white" transform="skewX(-10)" />
      </svg>
    ),
  },
  {
    name: 'Hanwha',
    svg: (
      <svg viewBox="0 0 200 44" className="h-8 w-auto" aria-label="Hanwha Vision">
        {/* Three overlapping ellipses */}
        <ellipse cx="22" cy="22" rx="18" ry="13" fill="none" stroke="#E8621A" strokeWidth="3.5" transform="rotate(-30 22 22)" opacity="1" />
        <ellipse cx="22" cy="22" rx="18" ry="13" fill="none" stroke="#F0956A" strokeWidth="3" transform="rotate(10 22 22)" opacity="0.85" />
        <ellipse cx="22" cy="22" rx="18" ry="13" fill="none" stroke="#F5B894" strokeWidth="2.5" transform="rotate(50 22 22)" opacity="0.7" />
        {/* HANWHA text */}
        <text x="50" y="29" fontSize="20" fontWeight="700" fontFamily="Arial, sans-serif" fill="white" letterSpacing="1.5">HANWHA</text>
      </svg>
    ),
  },
  {
    name: 'RADWIN',
    svg: (
      <svg viewBox="0 0 130 36" className="h-7 w-auto" aria-label="RADWIN">
        <text y="28" fontSize="26" fontWeight="900" fontFamily="Arial Black, Arial, sans-serif" fill="white" letterSpacing="2">RADWIN</text>
      </svg>
    ),
  },
  {
    name: 'Axis',
    svg: (
      <svg viewBox="0 0 90 36" className="h-7 w-auto" aria-label="Axis Communications">
        <text y="28" fontSize="28" fontWeight="900" fontFamily="Arial Black, Arial, sans-serif" fill="white" letterSpacing="3">AXIS</text>
      </svg>
    ),
  },
];

export default function PartnerStrip() {
  return (
    <section className="relative overflow-hidden py-7 border-y" style={{ background: 'rgba(30,27,24,0.95)', borderColor: 'rgba(240,148,34,0.10)' }}>
      {/* Left fade */}
      <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none" style={{ background: 'linear-gradient(to right, #1E1B18, transparent)' }} />
      {/* Right fade */}
      <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none" style={{ background: 'linear-gradient(to left, #1E1B18, transparent)' }} />

      {/* Scrolling track — two copies for seamless loop */}
      <div className="flex partner-track">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex items-center gap-16 shrink-0 px-8" aria-hidden={copy === 1}>
            {brands.map(({ name, svg }) => (
              <div
                key={name}
                className="opacity-35 hover:opacity-90 transition-all duration-300 grayscale hover:grayscale-0 shrink-0"
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
          animation: marquee 28s linear infinite;
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
