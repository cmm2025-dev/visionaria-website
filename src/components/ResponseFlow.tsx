const panels = [
  {
    time: 'T=0s',
    timeColor: '#F09422',
    label: 'ALARMA',
    bg: 'radial-gradient(ellipse at 40% 70%, rgba(220,50,0,0.45) 0%, rgba(4,10,35,0.97) 65%)',
    sep: '#F09422',
    icon: (
      <svg viewBox="0 0 120 180" className="w-28 h-40 mx-auto">
        {/* Street pole */}
        <line x1="60" y1="170" x2="60" y2="60" stroke="#aaa" strokeWidth="4"/>
        <line x1="60" y1="60" x2="85" y2="60" stroke="#aaa" strokeWidth="4"/>
        {/* Camera */}
        <rect x="75" y="52" width="22" height="13" rx="3" fill="#666" stroke="#999" strokeWidth="1"/>
        <circle cx="97" cy="58" r="4" fill="#333" stroke="#aaa" strokeWidth="1"/>
        {/* Red alert light on pole top */}
        <circle cx="60" cy="45" r="8" fill="rgba(255,50,0,0.9)" style={{ filter: 'drop-shadow(0 0 8px #ff3300)' }}/>
        <circle cx="60" cy="45" r="4" fill="#ff6644"/>
        {/* Orange alert rings on ground */}
        <ellipse cx="60" cy="168" rx="18" ry="5" fill="none" stroke="#F09422" strokeWidth="2" opacity="0.9" style={{ filter: 'drop-shadow(0 0 6px #F09422)' }}/>
        <ellipse cx="60" cy="168" rx="30" ry="8" fill="none" stroke="#F09422" strokeWidth="1.2" opacity="0.55"/>
        <ellipse cx="60" cy="168" rx="44" ry="11" fill="none" stroke="#F09422" strokeWidth="0.8" opacity="0.3"/>
      </svg>
    ),
  },
  {
    time: 'T=5s',
    timeColor: '#00d4ff',
    label: 'DESPACHO',
    bg: 'radial-gradient(ellipse at 50% 55%, rgba(0,80,200,0.4) 0%, rgba(4,10,35,0.97) 65%)',
    sep: '#00d4ff',
    icon: (
      <svg viewBox="0 0 120 180" className="w-28 h-40 mx-auto">
        {/* Operator silhouette */}
        <ellipse cx="60" cy="150" rx="28" ry="8" fill="rgba(0,80,200,0.15)"/>
        <rect x="35" y="105" width="50" height="40" rx="2" fill="#1a2240" stroke="#2a3860" strokeWidth="1"/>
        <circle cx="60" cy="95" r="12" fill="#1a2240" stroke="#2a3860" strokeWidth="1"/>
        {/* Screen glow */}
        <rect x="5" y="20" width="110" height="72" rx="4" fill="rgba(0,60,180,0.15)" stroke="#00d4ff" strokeWidth="1.5" style={{ filter: 'drop-shadow(0 0 8px rgba(0,180,255,0.4))' }}/>
        {/* Genetec screen content */}
        <text x="10" y="36" fontSize="8" fill="#00d4ff" fontFamily="Arial" fontWeight="bold">Genetec</text>
        {/* Map lines */}
        <line x1="10" y1="50" x2="80" y2="50" stroke="#1a4080" strokeWidth="1"/>
        <line x1="10" y1="60" x2="80" y2="60" stroke="#1a4080" strokeWidth="1"/>
        <line x1="30" y1="35" x2="30" y2="85" stroke="#1a4080" strokeWidth="1"/>
        <line x1="55" y1="35" x2="55" y2="85" stroke="#1a4080" strokeWidth="1"/>
        {/* Drone icon on map */}
        <circle cx="45" cy="58" r="8" fill="rgba(0,180,255,0.15)" stroke="#00d4ff" strokeWidth="1"/>
        <line x1="40" y1="58" x2="50" y2="58" stroke="#00d4ff" strokeWidth="1.5"/>
        <line x1="45" y1="53" x2="45" y2="63" stroke="#00d4ff" strokeWidth="1.5"/>
        <circle cx="45" cy="58" r="2" fill="#00d4ff"/>
      </svg>
    ),
  },
  {
    time: 'T=30s',
    timeColor: '#00d4ff',
    label: 'DESPEGUE',
    bg: 'radial-gradient(ellipse at 50% 45%, rgba(0,120,255,0.35) 0%, rgba(4,10,35,0.95) 60%)',
    sep: '#00d4ff',
    icon: (
      <svg viewBox="0 0 120 180" className="w-28 h-40 mx-auto">
        {/* DJI Dock base */}
        <rect x="30" y="130" width="60" height="35" rx="4" fill="#ddd" stroke="#bbb" strokeWidth="1.5"/>
        <rect x="35" y="120" width="50" height="15" rx="3" fill="#e8e8e8" stroke="#ccc" strokeWidth="1"/>
        <text x="52" y="152" fontSize="8" fontFamily="Arial" fontWeight="bold" fill="#333">DJI</text>
        {/* Drone body */}
        <rect x="45" y="68" width="30" height="18" rx="4" fill="#f0f0f0" stroke="#ccc" strokeWidth="1.5"/>
        {/* Arms */}
        <line x1="45" y1="72" x2="24" y2="58" stroke="#ccc" strokeWidth="2"/>
        <line x1="75" y1="72" x2="96" y2="58" stroke="#ccc" strokeWidth="2"/>
        <line x1="45" y1="82" x2="24" y2="96" stroke="#ccc" strokeWidth="2"/>
        <line x1="75" y1="82" x2="96" y2="96" stroke="#ccc" strokeWidth="2"/>
        {/* Rotors */}
        <ellipse cx="24" cy="57" rx="12" ry="3.5" fill="none" stroke="#aaa" strokeWidth="1.5" opacity="0.7"/>
        <ellipse cx="96" cy="57" rx="12" ry="3.5" fill="none" stroke="#aaa" strokeWidth="1.5" opacity="0.7"/>
        <ellipse cx="24" cy="97" rx="12" ry="3.5" fill="none" stroke="#aaa" strokeWidth="1.5" opacity="0.7"/>
        <ellipse cx="96" cy="97" rx="12" ry="3.5" fill="none" stroke="#aaa" strokeWidth="1.5" opacity="0.7"/>
        {/* Spotlight beam */}
        <path d="M53 86 L42 125 L78 125 L67 86Z" fill="rgba(0,212,255,0.08)"/>
        <line x1="60" y1="86" x2="60" y2="125" stroke="rgba(0,212,255,0.4)" strokeWidth="1.5" style={{ filter: 'drop-shadow(0 0 4px #00d4ff)' }}/>
      </svg>
    ),
  },
  {
    time: 'T=90s',
    timeColor: '#F09422',
    label: 'VIDEO EN VIVO',
    bg: 'radial-gradient(ellipse at 50% 50%, rgba(180,80,0,0.35) 0%, rgba(4,10,35,0.97) 65%)',
    sep: '#F09422',
    icon: (
      <svg viewBox="0 0 120 180" className="w-28 h-40 mx-auto">
        {/* Main screen - aerial view */}
        <rect x="5" y="10" width="110" height="70" rx="3" fill="rgba(180,60,0,0.15)" stroke="#F09422" strokeWidth="1.5"/>
        {/* Aerial city blocks */}
        <rect x="15" y="20" width="30" height="20" rx="1" fill="rgba(100,50,0,0.4)" stroke="#664400" strokeWidth="0.5"/>
        <rect x="50" y="20" width="25" height="15" rx="1" fill="rgba(80,40,0,0.4)" stroke="#664400" strokeWidth="0.5"/>
        <rect x="15" y="45" width="20" height="25" rx="1" fill="rgba(100,50,0,0.4)" stroke="#664400" strokeWidth="0.5"/>
        {/* Fire/thermal hotspot */}
        <ellipse cx="75" cy="45" rx="20" ry="15" fill="rgba(255,100,0,0.3)" style={{ filter: 'drop-shadow(0 0 8px rgba(255,80,0,0.6))' }}/>
        <ellipse cx="75" cy="45" rx="10" ry="8" fill="rgba(255,160,0,0.45)"/>
        <ellipse cx="75" cy="45" rx="4" ry="3" fill="rgba(255,220,0,0.6)"/>
        {/* Target box */}
        <rect x="60" y="33" width="30" height="25" fill="none" stroke="#F09422" strokeWidth="1.5" strokeDasharray="3 2"/>
        {/* Second smaller screen */}
        <rect x="5" y="90" width="52" height="38" rx="3" fill="rgba(20,40,80,0.5)" stroke="#2a4080" strokeWidth="1"/>
        <text x="10" y="103" fontSize="6" fill="#00d4ff" fontFamily="Arial">CÁMARA 2</text>
        {/* Operator panel */}
        <rect x="62" y="90" width="53" height="38" rx="3" fill="rgba(20,40,80,0.4)" stroke="#2a4080" strokeWidth="1"/>
        <text x="67" y="103" fontSize="6" fill="#34d399" fontFamily="Arial">GENETEC</text>
        {/* Operator silhouettes */}
        <circle cx="75" cy="150" r="10" fill="#1a2240" stroke="#2a3860" strokeWidth="1"/>
        <circle cx="95" cy="148" r="10" fill="#1a2240" stroke="#2a3860" strokeWidth="1"/>
        <rect x="62" y="158" width="52" height="15" rx="2" fill="#0a1530" stroke="#1a2850" strokeWidth="1"/>
      </svg>
    ),
  },
  {
    time: '< 2 min',
    timeColor: '#34d399',
    label: 'DECISIÓN',
    bg: 'radial-gradient(ellipse at 50% 50%, rgba(20,140,80,0.35) 0%, rgba(4,10,35,0.97) 65%)',
    sep: '#34d399',
    icon: (
      <svg viewBox="0 0 120 180" className="w-28 h-40 mx-auto">
        {/* Screen with checks */}
        <rect x="8" y="15" width="104" height="75" rx="4" fill="rgba(20,80,50,0.15)" stroke="#34d399" strokeWidth="1.5" style={{ filter: 'drop-shadow(0 0 6px rgba(52,211,153,0.3))' }}/>
        <text x="14" y="30" fontSize="7" fill="#34d399" fontFamily="Arial" fontWeight="bold">GENETEC · DECISIÓN</text>
        {/* Checklist items */}
        {[38, 50, 62].map((y, i) => (
          <g key={i}>
            <circle cx="22" cy={y} r="6" fill="rgba(52,211,153,0.2)" stroke="#34d399" strokeWidth="1.2"/>
            <path d={`M18 ${y}l3 3 5-5`} stroke="#34d399" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            <rect x="32" y={y - 4} width={40 + i * 8} height="6" rx="2" fill="rgba(52,211,153,0.15)" stroke="rgba(52,211,153,0.3)" strokeWidth="0.5"/>
          </g>
        ))}
        {/* Map with zone */}
        <rect x="8" y="95" width="104" height="42" rx="3" fill="rgba(10,30,20,0.5)" stroke="#1a4030" strokeWidth="1"/>
        <circle cx="60" cy="116" r="20" fill="rgba(52,211,153,0.08)" stroke="rgba(52,211,153,0.4)" strokeWidth="1" strokeDasharray="4 2"/>
        <circle cx="60" cy="116" r="8" fill="rgba(52,211,153,0.15)" stroke="#34d399" strokeWidth="1.5"/>
        <path d="M55 116l3 3 7-7" stroke="#34d399" strokeWidth="2" fill="none" strokeLinecap="round"/>
        {/* Operator */}
        <circle cx="95" cy="155" r="11" fill="#1a2240" stroke="#2a3860" strokeWidth="1"/>
        <rect x="78" y="163" width="34" height="12" rx="2" fill="#0a1530" stroke="#1a2850" strokeWidth="1"/>
      </svg>
    ),
  },
];

export default function ResponseFlow() {
  return (
    <section className="w-full overflow-hidden" style={{ background: 'linear-gradient(180deg, #040a23 0%, #060d2e 100%)' }}>
      {/* 5 panels */}
      <div className="grid grid-cols-5 relative" style={{ minHeight: '360px' }}>
        {panels.map((panel, i) => (
          <div key={panel.label} className="relative flex flex-col items-center pt-10 pb-4 px-3" style={{ background: panel.bg }}>
            {/* Vertical separator */}
            {i > 0 && (
              <div className="absolute left-0 top-0 bottom-0 w-px" style={{
                background: `linear-gradient(to bottom, transparent 5%, ${panel.sep}80 20%, ${panel.sep}90 50%, ${panel.sep}80 80%, transparent 95%)`,
                boxShadow: `0 0 12px ${panel.sep}50, 0 0 4px ${panel.sep}`,
              }} />
            )}

            {/* Time badge */}
            <div className="absolute top-4 left-4">
              <span className="text-sm font-bold tracking-wider" style={{ color: panel.timeColor, textShadow: `0 0 10px ${panel.timeColor}` }}>
                {panel.label} <span className="text-xs opacity-80">{panel.time}</span>
              </span>
            </div>

            {/* Icon */}
            <div className="mt-6 flex-1 flex items-center justify-center">
              {panel.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom: Visionaria tagline */}
      <div className="flex items-center justify-end px-8 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 160 32" className="h-7 w-auto">
            <text y="26" fontSize="28" fontWeight="900" fontFamily="Arial" fill="#F09422">V</text>
            <text x="22" y="25" fontSize="20" fontWeight="300" fontFamily="Georgia, serif" fill="white" letterSpacing="3">isionaria</text>
          </svg>
          <span className="text-xs tracking-[0.2em] text-slate-500 font-light">SECURITY · VISION · INNOVATION</span>
        </div>
      </div>
    </section>
  );
}
