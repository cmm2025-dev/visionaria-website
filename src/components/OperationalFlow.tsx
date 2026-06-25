import Image from 'next/image';

const steps = [
  {
    num: '1',
    title: 'DETECCIÓN',
    sub1: 'CÁMARA DE VIGILANCIA',
    sub2: 'ACTIVA ALERTA',
    timeLabel: 'ALERTA ACTIVADA',
    time: '20:15:03',
    bg: 'radial-gradient(ellipse at 50% 80%, rgba(240,100,20,0.35) 0%, rgba(6,13,46,0.95) 60%)',
    sepColor: '#F09422',
    icon: (
      <svg viewBox="0 0 80 80" className="w-20 h-20 mx-auto mb-3 opacity-80">
        {/* Camera on pole */}
        <line x1="40" y1="75" x2="40" y2="30" stroke="#F09422" strokeWidth="3"/>
        <rect x="28" y="20" width="24" height="14" rx="3" fill="none" stroke="#F09422" strokeWidth="2"/>
        <circle cx="40" cy="27" r="4" fill="#F09422" opacity="0.6"/>
        {/* Alert rings */}
        <circle cx="40" cy="68" r="6" fill="none" stroke="#F09422" strokeWidth="1.5" opacity="0.8"/>
        <circle cx="40" cy="68" r="11" fill="none" stroke="#F09422" strokeWidth="1" opacity="0.5"/>
        <circle cx="40" cy="68" r="16" fill="none" stroke="#F09422" strokeWidth="0.8" opacity="0.3"/>
      </svg>
    ),
    timeIcon: (
      <svg viewBox="0 0 40 40" className="w-8 h-8"><circle cx="20" cy="20" r="18" fill="#00b4d8" stroke="#00d4ff" strokeWidth="1.5"/><path d="M12 20l5 5 11-10" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/></svg>
    ),
  },
  {
    num: '2',
    title: 'DESPACHO',
    sub1: 'PLATAFORMA SOFTGUARD',
    sub2: 'PSIM / CAD',
    timeLabel: 'DRONE DESPACHADO',
    time: '20:15:08',
    bg: 'radial-gradient(ellipse at 50% 60%, rgba(30,80,200,0.4) 0%, rgba(6,13,46,0.95) 65%)',
    sepColor: '#00d4ff',
    icon: (
      <svg viewBox="0 0 80 80" className="w-20 h-20 mx-auto mb-3 opacity-80">
        {/* Monitor screen */}
        <rect x="10" y="15" width="60" height="40" rx="4" fill="none" stroke="#3b82f6" strokeWidth="2"/>
        <rect x="15" y="20" width="50" height="30" rx="2" fill="rgba(59,130,246,0.12)"/>
        {/* Screen content lines */}
        <line x1="18" y1="28" x2="55" y2="28" stroke="#3b82f6" strokeWidth="1" opacity="0.7"/>
        <line x1="18" y1="34" x2="45" y2="34" stroke="#3b82f6" strokeWidth="1" opacity="0.5"/>
        <line x1="18" y1="40" x2="50" y2="40" stroke="#3b82f6" strokeWidth="1" opacity="0.5"/>
        <rect x="20" y="44" width="15" height="8" rx="1" fill="rgba(0,212,255,0.2)" stroke="#00d4ff" strokeWidth="1"/>
        <rect x="15" y="55" width="20" height="3" rx="1" fill="rgba(59,130,246,0.4)"/>
        <rect x="40" y="55" width="20" height="3" rx="1" fill="rgba(59,130,246,0.4)"/>
      </svg>
    ),
    timeIcon: (
      <svg viewBox="0 0 40 40" className="w-8 h-8"><circle cx="20" cy="20" r="18" fill="#00b4d8" stroke="#00d4ff" strokeWidth="1.5"/>
        {/* Drone icon */}
        <line x1="10" y1="20" x2="30" y2="20" stroke="white" strokeWidth="2"/>
        <line x1="15" y1="15" x2="25" y2="25" stroke="white" strokeWidth="2"/>
        <line x1="25" y1="15" x2="15" y2="25" stroke="white" strokeWidth="2"/>
        <circle cx="20" cy="20" r="3" fill="white"/>
      </svg>
    ),
  },
  {
    num: '3',
    title: 'DESPEGUE',
    sub1: 'DJI DOCK 3 + DJI M4T',
    sub2: 'MISIÓN EN CURSO',
    timeLabel: 'DESPEGUE EXITOSO',
    time: '20:15:18',
    bg: 'radial-gradient(ellipse at 50% 55%, rgba(0,160,255,0.3) 0%, rgba(6,13,46,0.95) 60%)',
    sepColor: '#00d4ff',
    icon: (
      <svg viewBox="0 0 80 80" className="w-24 h-24 mx-auto mb-3 opacity-90">
        {/* Drone body */}
        <rect x="30" y="34" width="20" height="12" rx="3" fill="none" stroke="#00d4ff" strokeWidth="2"/>
        {/* Arms */}
        <line x1="30" y1="37" x2="16" y2="28" stroke="#00d4ff" strokeWidth="2"/>
        <line x1="50" y1="37" x2="64" y2="28" stroke="#00d4ff" strokeWidth="2"/>
        <line x1="30" y1="43" x2="16" y2="52" stroke="#00d4ff" strokeWidth="2"/>
        <line x1="50" y1="43" x2="64" y2="52" stroke="#00d4ff" strokeWidth="2"/>
        {/* Rotors */}
        <ellipse cx="16" cy="27" rx="9" ry="3" fill="none" stroke="#00d4ff" strokeWidth="1.5" opacity="0.7"/>
        <ellipse cx="64" cy="27" rx="9" ry="3" fill="none" stroke="#00d4ff" strokeWidth="1.5" opacity="0.7"/>
        <ellipse cx="16" cy="53" rx="9" ry="3" fill="none" stroke="#00d4ff" strokeWidth="1.5" opacity="0.7"/>
        <ellipse cx="64" cy="53" rx="9" ry="3" fill="none" stroke="#00d4ff" strokeWidth="1.5" opacity="0.7"/>
        {/* Spotlight beam */}
        <path d="M35 46 L28 72 L52 72 L45 46Z" fill="rgba(0,212,255,0.08)" stroke="rgba(0,212,255,0.2)" strokeWidth="0.5"/>
        <line x1="40" y1="46" x2="40" y2="72" stroke="rgba(0,212,255,0.3)" strokeWidth="1"/>
      </svg>
    ),
    timeIcon: (
      <svg viewBox="0 0 40 40" className="w-8 h-8"><circle cx="20" cy="20" r="18" fill="#00b4d8" stroke="#00d4ff" strokeWidth="1.5"/>
        <path d="M20 28V12M13 19l7-7 7 7" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    num: '4',
    title: 'MONITOREO',
    sub1: 'CÁMARA TÉRMICA + VIDEO EN VIVO',
    sub2: 'ANÁLISIS EN TIEMPO REAL',
    timeLabel: 'MONITOREO EN VIVO',
    time: '20:15:45',
    bg: 'radial-gradient(ellipse at 50% 55%, rgba(200,60,0,0.35) 0%, rgba(6,13,46,0.95) 60%)',
    sepColor: '#F09422',
    icon: (
      <svg viewBox="0 0 80 80" className="w-20 h-20 mx-auto mb-3 opacity-85">
        {/* Thermal screen */}
        <rect x="8" y="18" width="64" height="40" rx="4" fill="none" stroke="#fb923c" strokeWidth="2"/>
        {/* Thermal gradient effect */}
        <ellipse cx="40" cy="38" rx="18" ry="14" fill="rgba(255,80,0,0.25)" stroke="rgba(255,120,0,0.4)" strokeWidth="1"/>
        <ellipse cx="40" cy="38" rx="10" ry="8" fill="rgba(255,140,0,0.35)" stroke="rgba(255,180,0,0.5)" strokeWidth="1"/>
        <ellipse cx="40" cy="38" rx="4" ry="3" fill="rgba(255,220,0,0.5)"/>
        {/* Camera lens */}
        <circle cx="65" cy="25" r="5" fill="none" stroke="#fb923c" strokeWidth="1.5"/>
        <circle cx="65" cy="25" r="2" fill="rgba(251,146,60,0.5)"/>
      </svg>
    ),
    timeIcon: (
      <svg viewBox="0 0 40 40" className="w-8 h-8"><circle cx="20" cy="20" r="18" fill="#00b4d8" stroke="#00d4ff" strokeWidth="1.5"/>
        <circle cx="20" cy="20" r="6" fill="none" stroke="white" strokeWidth="2"/>
        <circle cx="20" cy="20" r="2" fill="white"/>
        <line x1="20" y1="10" x2="20" y2="13" stroke="white" strokeWidth="2"/>
        <line x1="20" y1="27" x2="20" y2="30" stroke="white" strokeWidth="2"/>
        <line x1="10" y1="20" x2="13" y2="20" stroke="white" strokeWidth="2"/>
        <line x1="27" y1="20" x2="30" y2="20" stroke="white" strokeWidth="2"/>
      </svg>
    ),
  },
  {
    num: '5',
    title: 'RESOLUCIÓN',
    sub1: 'EVENTO CONTROLADO',
    sub2: 'ZONA SEGURA',
    timeLabel: 'MISIÓN COMPLETADA',
    time: '20:17:33',
    bg: 'radial-gradient(ellipse at 50% 55%, rgba(20,160,80,0.3) 0%, rgba(6,13,46,0.95) 60%)',
    sepColor: '#34d399',
    icon: (
      <svg viewBox="0 0 80 80" className="w-20 h-20 mx-auto mb-3 opacity-85">
        {/* Map grid */}
        <rect x="10" y="15" width="60" height="50" rx="3" fill="none" stroke="#34d399" strokeWidth="1.5" opacity="0.5"/>
        {/* Map lines */}
        <path d="M10 35 Q30 28 50 38 Q65 45 70 40" fill="none" stroke="#34d399" strokeWidth="1" opacity="0.5"/>
        <path d="M10 50 Q25 45 45 52 Q58 56 70 52" fill="none" stroke="#34d399" strokeWidth="1" opacity="0.4"/>
        {/* Zone circle */}
        <circle cx="40" cy="40" r="18" fill="rgba(52,211,153,0.08)" stroke="rgba(52,211,153,0.4)" strokeWidth="1.5" strokeDasharray="4 2"/>
        {/* Checkmark */}
        <circle cx="40" cy="40" r="10" fill="rgba(52,211,153,0.15)" stroke="#34d399" strokeWidth="1.5"/>
        <path d="M34 40l4 4 8-8" stroke="#34d399" strokeWidth="2" fill="none" strokeLinecap="round"/>
      </svg>
    ),
    timeIcon: (
      <svg viewBox="0 0 40 40" className="w-8 h-8"><circle cx="20" cy="20" r="18" fill="#00b4d8" stroke="#00d4ff" strokeWidth="1.5"/>
        <path d="M12 20l6 6 10-12" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

export default function OperationalFlow() {
  return (
    <section className="w-full overflow-hidden" style={{ background: '#060d2e', borderTop: '1px solid rgba(0,212,255,0.1)', borderBottom: '1px solid rgba(0,212,255,0.1)' }}>
      {/* Header bar: DJI | Visionaria | Genetec */}
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'rgba(0,212,255,0.12)', background: 'rgba(0,0,0,0.3)' }}>
        {/* DJI logo */}
        <div className="flex items-center gap-2 border rounded-lg px-4 py-2" style={{ borderColor: 'rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.4)' }}>
          <svg viewBox="0 0 60 24" className="h-6 w-auto fill-white">
            <text y="20" fontSize="20" fontWeight="800" fontFamily="Arial">DJI</text>
          </svg>
        </div>

        {/* Visionaria center logo */}
        <div className="text-center flex-1 mx-6">
          <div className="flex items-center justify-center gap-1 mb-1">
            {/* Big V with orbit ring */}
            <div className="relative inline-flex items-center justify-center">
              <svg viewBox="0 0 220 80" className="h-14 w-auto">
                <ellipse cx="60" cy="38" rx="52" ry="28" fill="none" stroke="#F09422" strokeWidth="3" transform="rotate(-10 60 38)"/>
                <circle cx="88" cy="14" r="3" fill="#F09422" opacity="0.8"/>
                <text x="0" y="58" fontSize="62" fontWeight="900" fontFamily="Arial, sans-serif" fill="#F09422">V</text>
                <text x="68" y="57" fontSize="44" fontWeight="300" fontFamily="Georgia, serif" fill="white" letterSpacing="4">isionaria</text>
              </svg>
            </div>
          </div>
          <p className="text-xs tracking-[0.25em] font-light" style={{ color: '#F09422' }}>
            SISTEMAS DE SEGURIDAD Y TECNOLOGÍA SPA.
          </p>
        </div>

        {/* Genetec logo */}
        <div className="flex items-center gap-2 border rounded-lg px-4 py-2" style={{ borderColor: 'rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.4)' }}>
          <svg viewBox="0 0 90 24" className="h-6 w-auto">
            <text y="20" fontSize="19" fontWeight="700" fontFamily="Arial" fill="#00aaff">Gene</text>
            <text x="46" y="20" fontSize="19" fontWeight="700" fontFamily="Arial" fill="white">tec</text>
            <text x="82" y="10" fontSize="10" fontFamily="Arial" fill="#00aaff">®</text>
          </svg>
        </div>
      </div>

      {/* 5 panels */}
      <div className="grid grid-cols-5 relative" style={{ minHeight: '340px' }}>
        {steps.map((step, i) => (
          <div key={step.num} className="relative flex flex-col" style={{ background: step.bg }}>
            {/* Vertical separator */}
            {i > 0 && (
              <div className="absolute left-0 top-0 bottom-0 w-px" style={{ background: `linear-gradient(to bottom, transparent, ${step.sepColor}60, ${step.sepColor}80, ${step.sepColor}60, transparent)`, boxShadow: `0 0 8px ${step.sepColor}40` }} />
            )}

            {/* Step header */}
            <div className="px-4 pt-5 pb-2">
              <p className="text-xs font-bold tracking-wider text-white opacity-90">{step.num}. {step.title}</p>
              <p className="text-[10px] tracking-wide mt-0.5" style={{ color: step.sepColor, opacity: 0.9 }}>{step.sub1}</p>
              <p className="text-[10px] tracking-wide" style={{ color: step.sepColor, opacity: 0.7 }}>{step.sub2}</p>
            </div>

            {/* Visual icon area */}
            <div className="flex-1 flex items-center justify-center py-4">
              {step.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom timeline */}
      <div className="relative px-0 pt-4 pb-5" style={{ background: 'rgba(0,0,0,0.25)' }}>
        {/* Horizontal glowing line */}
        <div className="absolute left-0 right-0 h-px" style={{ top: '32px', background: 'linear-gradient(90deg, transparent 2%, #00d4ff 10%, #00d4ff 90%, transparent 98%)', boxShadow: '0 0 8px #00d4ff, 0 0 16px rgba(0,212,255,0.3)' }} />

        <div className="grid grid-cols-5">
          {steps.map((step) => (
            <div key={step.num} className="flex flex-col items-center gap-2">
              <div className="z-10">{step.timeIcon}</div>
              <p className="text-[10px] font-bold tracking-widest text-center" style={{ color: '#00d4ff' }}>{step.timeLabel}</p>
              <p className="text-[11px] font-mono text-white opacity-70">{step.time}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
