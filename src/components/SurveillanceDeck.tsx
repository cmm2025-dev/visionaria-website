'use client';

import { useEffect, useRef, useState } from 'react';

/* ─── Typewriter hook ─── */
function useTypewriter(texts: string[], speed = 55, pause = 2200) {
  const [display, setDisplay] = useState('');
  const [idx, setIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = texts[idx % texts.length];
    const delay = deleting ? speed / 2 : speed;
    const t = setTimeout(() => {
      if (!deleting) {
        setDisplay(current.slice(0, charIdx + 1));
        if (charIdx + 1 === current.length) {
          setTimeout(() => setDeleting(true), pause);
        } else {
          setCharIdx(c => c + 1);
        }
      } else {
        setDisplay(current.slice(0, charIdx - 1));
        if (charIdx - 1 === 0) {
          setDeleting(false);
          setIdx(i => i + 1);
          setCharIdx(0);
        } else {
          setCharIdx(c => c - 1);
        }
      }
    }, delay);
    return () => clearTimeout(t);
  }, [charIdx, deleting, idx, texts, speed, pause]);

  return display;
}

/* ─── Radar canvas ─── */
function RadarCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    c.width = c.offsetWidth; c.height = c.offsetHeight;
    const cx = c.width / 2, cy = c.height / 2;
    const R = Math.min(cx, cy) - 8;
    let angle = 0;
    const blips: { a: number; r: number; age: number }[] = [
      { a: 0.8, r: 0.45, age: 0 }, { a: 2.1, r: 0.65, age: 0 },
      { a: 3.7, r: 0.3,  age: 0 }, { a: 5.0, r: 0.7,  age: 0 },
      { a: 1.4, r: 0.55, age: 0 }, { a: 4.3, r: 0.4,  age: 0 },
    ];
    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      // rings
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, R * i / 4, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0,212,255,0.12)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      // cross
      ctx.strokeStyle = 'rgba(0,212,255,0.1)';
      ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();

      // sweep gradient
      const grad = ctx.createConicalGradient ? undefined : null;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      const sweep = ctx.createLinearGradient(0, 0, R, 0);
      sweep.addColorStop(0, 'rgba(240,148,34,0.35)');
      sweep.addColorStop(1, 'rgba(240,148,34,0)');
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, R, -Math.PI / 3, 0);
      ctx.closePath();
      ctx.fillStyle = sweep;
      ctx.fill();
      // sweep line
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(R, 0);
      ctx.strokeStyle = 'rgba(240,148,34,0.9)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // blips
      blips.forEach(b => {
        const swept = ((angle - b.a) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        if (swept < 0.15) b.age = 1;
        if (b.age > 0) b.age = Math.max(0, b.age - 0.008);
        if (b.age > 0) {
          const bx = cx + Math.cos(b.a) * R * b.r;
          const by = cy + Math.sin(b.a) * R * b.r;
          ctx.beginPath();
          ctx.arc(bx, by, 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(240,148,34,${b.age * 0.9})`;
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#F09422';
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      angle += 0.018;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} className="w-full h-full" />;
}

/* ─── Face scan panel ─── */
function FaceScanPanel() {
  const [step, setStep] = useState(0);
  const steps = ['ANALIZANDO...', 'VECTORIZANDO RASGOS', 'BUSCANDO EN BASE PDI', 'COINCIDENCIA: 94.7%', 'ID CONFIRMADA ✓'];
  useEffect(() => {
    const t = setInterval(() => setStep(s => (s + 1) % steps.length), 1400);
    return () => clearInterval(t);
  }, []);
  const confirmed = step === 4;
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center gap-3 p-4">
      {/* Face SVG */}
      <svg viewBox="0 0 120 140" className="w-28 h-32">
        {/* Scan line */}
        <line x1="10" x2="110" y1="0" y2="0" stroke={confirmed ? '#34d399' : '#00d4ff'} strokeWidth="1.5" opacity="0.8">
          <animateTransform attributeName="transform" type="translate" values="0,10;0,130;0,10" dur="2.5s" repeatCount="indefinite"/>
        </line>
        {/* Face outline */}
        <ellipse cx="60" cy="60" rx="38" ry="48" stroke={confirmed ? '#34d399' : '#00d4ff'} strokeWidth="1.5" fill="rgba(0,212,255,0.04)"/>
        {/* Eyes */}
        <ellipse cx="44" cy="52" rx="7" ry="5" stroke={confirmed ? '#34d399' : '#00d4ff'} strokeWidth="1.2" fill="none"/>
        <ellipse cx="76" cy="52" rx="7" ry="5" stroke={confirmed ? '#34d399' : '#00d4ff'} strokeWidth="1.2" fill="none"/>
        <circle cx="44" cy="52" r="2.5" fill={confirmed ? '#34d399' : '#00d4ff'} opacity="0.6"/>
        <circle cx="76" cy="52" r="2.5" fill={confirmed ? '#34d399' : '#00d4ff'} opacity="0.6"/>
        {/* Nose */}
        <path d="M60 58 L55 74 L65 74" stroke={confirmed ? '#34d399' : '#00d4ff'} strokeWidth="1" fill="none" opacity="0.5"/>
        {/* Mouth */}
        <path d="M46 84 Q60 94 74 84" stroke={confirmed ? '#34d399' : '#00d4ff'} strokeWidth="1.2" fill="none"/>
        {/* Corner brackets */}
        {[[-1,-1],[1,-1],[-1,1],[1,1]].map(([sx,sy], i) => (
          <g key={i} transform={`translate(${60 + sx * 50},${62 + sy * 58}) scale(${sx},${sy})`}>
            <path d="M0,-8 L0,0 L8,0" stroke={confirmed ? '#34d399' : '#F09422'} strokeWidth="2" fill="none"/>
          </g>
        ))}
        {/* Measurement lines */}
        <line x1="22" y1="52" x2="30" y2="52" stroke={confirmed ? '#34d399' : '#00d4ff'} strokeWidth="0.8" opacity="0.4"/>
        <line x1="90" y1="52" x2="98" y2="52" stroke={confirmed ? '#34d399' : '#00d4ff'} strokeWidth="0.8" opacity="0.4"/>
        <line x1="60" y1="12" x2="60" y2="20" stroke={confirmed ? '#34d399' : '#00d4ff'} strokeWidth="0.8" opacity="0.4"/>
      </svg>
      {/* Status */}
      <div className="text-center">
        <p className="text-xs font-mono tracking-widest" style={{ color: confirmed ? '#34d399' : '#00d4ff' }}>
          {steps[step]}
        </p>
        <div className="mt-1 h-0.5 w-24 mx-auto rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <div
            className="h-full transition-all duration-1000"
            style={{ width: `${(step + 1) * 20}%`, background: confirmed ? '#34d399' : '#00d4ff' }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── LPR panel ─── */
function LPRPanel() {
  const plates = ['BKRD·54', 'FZ·2290', 'GJLF·23', 'NK·8841', 'PRSK·17'];
  const [current, setCurrent] = useState(0);
  const [scanning, setScanning] = useState(true);
  useEffect(() => {
    const t = setInterval(() => {
      setScanning(true);
      setTimeout(() => { setCurrent(c => (c + 1) % plates.length); setScanning(false); }, 900);
    }, 2200);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center gap-3 p-3">
      {/* Car top-view SVG */}
      <svg viewBox="0 0 100 120" className="w-20 h-24">
        <rect x="25" y="20" width="50" height="80" rx="12" fill="rgba(100,120,180,0.15)" stroke="rgba(0,212,255,0.4)" strokeWidth="1.5"/>
        <rect x="30" y="30" width="40" height="25" rx="4" fill="rgba(0,212,255,0.06)" stroke="rgba(0,212,255,0.3)" strokeWidth="1"/>
        <rect x="15" y="35" width="10" height="20" rx="3" fill="rgba(0,212,255,0.1)" stroke="rgba(0,212,255,0.25)" strokeWidth="1"/>
        <rect x="75" y="35" width="10" height="20" rx="3" fill="rgba(0,212,255,0.1)" stroke="rgba(0,212,255,0.25)" strokeWidth="1"/>
        {/* License plate */}
        <rect x="30" y="88" width="40" height="10" rx="2" fill={scanning ? 'rgba(240,148,34,0.3)' : 'rgba(240,148,34,0.1)'} stroke="#F09422" strokeWidth="1.2"/>
        <text x="50" y="96" textAnchor="middle" fontSize="6" fontFamily="monospace" fill="#F09422" fontWeight="bold">
          {plates[current]}
        </text>
        {/* Scan beam */}
        {scanning && (
          <rect x="25" y="84" width="50" height="20" fill="rgba(240,148,34,0.08)">
            <animate attributeName="opacity" values="0;0.8;0" dur="0.9s"/>
          </rect>
        )}
        {/* Headlights */}
        <rect x="30" y="22" width="16" height="6" rx="2" fill="rgba(255,240,180,0.3)" stroke="rgba(255,220,100,0.5)" strokeWidth="1"/>
        <rect x="54" y="22" width="16" height="6" rx="2" fill="rgba(255,240,180,0.3)" stroke="rgba(255,220,100,0.5)" strokeWidth="1"/>
      </svg>
      {/* Plate display */}
      <div className="text-center">
        <div className="px-3 py-1 rounded border font-mono text-sm font-bold tracking-widest"
          style={{ borderColor: '#F09422', color: '#F09422', background: 'rgba(240,148,34,0.08)', minWidth: 80, textAlign: 'center' }}>
          {plates[current]}
        </div>
        <p className="text-xs mt-1 font-mono" style={{ color: scanning ? '#F09422' : '#34d399' }}>
          {scanning ? 'LEYENDO...' : 'REGISTRADO ✓'}
        </p>
      </div>
    </div>
  );
}

/* ─── Drone track panel ─── */
function DronePanel() {
  const [pos, setPos] = useState({ x: 50, y: 50 });
  useEffect(() => {
    const t = setInterval(() => {
      setPos({ x: 20 + Math.random() * 60, y: 20 + Math.random() * 60 });
    }, 2000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="relative w-full h-full flex items-center justify-center p-2">
      <svg viewBox="0 0 160 140" className="w-full h-full">
        {/* City grid */}
        {[20,45,70,95,120].map(x => (
          <line key={`v${x}`} x1={x} y1="10" x2={x} y2="130" stroke="rgba(0,212,255,0.07)" strokeWidth="1"/>
        ))}
        {[20,40,60,80,100,120].map(y => (
          <line key={`h${y}`} x1="10" y1={y} x2="150" y2={y} stroke="rgba(0,212,255,0.07)" strokeWidth="1"/>
        ))}
        {/* City blocks */}
        {[[22,22,20,16],[48,22,20,12],[72,22,18,20],[98,22,18,14],[22,42,16,14],[48,42,22,14],[72,44,16,12],[98,44,20,16],[22,62,20,16],[50,62,18,14],[72,62,22,16],[98,62,16,14]].map(([x,y,w,h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} rx="1" fill="rgba(30,50,100,0.4)" stroke="rgba(0,212,255,0.12)" strokeWidth="0.5"/>
        ))}
        {/* Trail */}
        <circle cx={`${pos.x * 1.4 + 10}`} cy={`${pos.y * 1.2 + 5}`} r="18" fill="none" stroke="rgba(240,148,34,0.15)" strokeWidth="1" strokeDasharray="4 3"/>
        {/* Target crosshair */}
        <g style={{ transition: 'all 1.8s ease' }}>
          <circle cx={`${pos.x * 1.4 + 10}`} cy={`${pos.y * 1.2 + 5}`} r="10" fill="none" stroke="#F09422" strokeWidth="1.2" strokeDasharray="3 2">
            <animateTransform attributeName="transform" type="rotate" values={`0 ${pos.x * 1.4 + 10} ${pos.y * 1.2 + 5};360 ${pos.x * 1.4 + 10} ${pos.y * 1.2 + 5}`} dur="4s" repeatCount="indefinite"/>
          </circle>
          <line x1={`${pos.x * 1.4 + 10 - 14}`} y1={`${pos.y * 1.2 + 5}`} x2={`${pos.x * 1.4 + 10 + 14}`} y2={`${pos.y * 1.2 + 5}`} stroke="#F09422" strokeWidth="0.8" opacity="0.7"/>
          <line x1={`${pos.x * 1.4 + 10}`} y1={`${pos.y * 1.2 + 5 - 14}`} x2={`${pos.x * 1.4 + 10}`} y2={`${pos.y * 1.2 + 5 + 14}`} stroke="#F09422" strokeWidth="0.8" opacity="0.7"/>
          <circle cx={`${pos.x * 1.4 + 10}`} cy={`${pos.y * 1.2 + 5}`} r="2.5" fill="#F09422" opacity="0.9">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="1s" repeatCount="indefinite"/>
          </circle>
        </g>
        {/* Drone icon top */}
        <g transform="translate(70, 8)">
          <rect x="-6" y="-3" width="12" height="6" rx="2" fill="rgba(200,200,255,0.3)" stroke="rgba(200,200,255,0.6)" strokeWidth="1"/>
          <line x1="-6" y1="-1" x2="-12" y2="-5" stroke="rgba(200,200,255,0.5)" strokeWidth="1"/>
          <line x1="6"  y1="-1" x2="12"  y2="-5" stroke="rgba(200,200,255,0.5)" strokeWidth="1"/>
          <ellipse cx="-12" cy="-5" rx="5" ry="1.5" stroke="rgba(200,200,255,0.5)" strokeWidth="1" fill="none" opacity="0.7"/>
          <ellipse cx="12"  cy="-5" rx="5" ry="1.5" stroke="rgba(200,200,255,0.5)" strokeWidth="1" fill="none" opacity="0.7"/>
        </g>
        {/* Coords */}
        <text x="6" y="138" fontSize="5" fontFamily="monospace" fill="rgba(0,212,255,0.5)">
          {`LAT -33.4${Math.floor(pos.x * 50 + 4000)}  LON -70.6${Math.floor(pos.y * 50 + 5000)}`}
        </text>
      </svg>
    </div>
  );
}

/* ─── Main component ─── */
export default function SurveillanceDeck() {
  const statusTexts = [
    'SISTEMA ACTIVO · VISIONARIA OPS CENTER',
    'MONITOREO 24/7 · 40+ MUNICIPALIDADES',
    '+3.700 CÁMARAS EN LÍNEA',
    'RECONOCIMIENTO FACIAL ACTIVO · BASE PDI',
    'DRONES DJI DOCK EN STANDBY · T=0 LISTO',
  ];
  const status = useTypewriter(statusTexts, 45, 2500);

  return (
    <section className="w-full py-16 px-4" style={{ background: 'linear-gradient(180deg, #040a23 0%, #060d2e 100%)' }}>
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <p className="text-xs font-bold tracking-[0.3em] uppercase mb-1" style={{ color: '#F09422' }}>
              Centro de Operaciones
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Vigilancia integrada <span style={{ color: '#F09422' }}>en tiempo real</span>
            </h2>
          </div>
          {/* Live status bar */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border font-mono text-xs"
            style={{ borderColor: 'rgba(0,212,255,0.2)', background: 'rgba(0,212,255,0.04)', color: '#00d4ff', minWidth: 280 }}>
            <span className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse" style={{ background: '#34d399' }}/>
            <span className="truncate">{status}<span className="animate-pulse">_</span></span>
          </div>
        </div>

        {/* Grid of feeds */}
        <div className="grid grid-cols-12 gap-2" style={{ height: 420 }}>

          {/* Feed 1 — Facial recognition (large) */}
          <div className="col-span-12 sm:col-span-4 row-span-2 rounded-xl border overflow-hidden relative"
            style={{ background: '#04091f', borderColor: 'rgba(0,212,255,0.15)' }}>
            <FeedHeader label="CAM-01" sublabel="RECONOCIMIENTO FACIAL" color="#00d4ff" />
            <div className="h-full pt-7">
              <FaceScanPanel />
            </div>
            <ScanlineOverlay />
          </div>

          {/* Feed 2 — Drone tracking (large) */}
          <div className="col-span-12 sm:col-span-5 rounded-xl border overflow-hidden relative"
            style={{ background: '#04091f', borderColor: 'rgba(240,148,34,0.15)', height: 204 }}>
            <FeedHeader label="UAV-01" sublabel="DRONE DJI — TRACKING" color="#F09422" />
            <div className="h-full pt-7">
              <DronePanel />
            </div>
            <ScanlineOverlay color="rgba(240,148,34,0.03)" />
          </div>

          {/* Feed 3 — Radar */}
          <div className="col-span-12 sm:col-span-3 rounded-xl border overflow-hidden relative"
            style={{ background: '#04091f', borderColor: 'rgba(240,148,34,0.12)', height: 204 }}>
            <FeedHeader label="RAD-01" sublabel="RADAR PERIMETRAL" color="#F09422" />
            <div className="h-full pt-7">
              <RadarCanvas />
            </div>
            <ScanlineOverlay color="rgba(240,148,34,0.03)" />
          </div>

          {/* Feed 4 — LPR */}
          <div className="col-span-6 sm:col-span-4 rounded-xl border overflow-hidden relative"
            style={{ background: '#04091f', borderColor: 'rgba(240,148,34,0.15)', height: 204 }}>
            <FeedHeader label="LPR-03" sublabel="LECTURA DE PATENTES" color="#F09422" />
            <div className="h-full pt-7">
              <LPRPanel />
            </div>
            <ScanlineOverlay color="rgba(240,148,34,0.03)" />
          </div>

          {/* Feed 5 — Stats / uptime */}
          <div className="col-span-6 sm:col-span-4 rounded-xl border overflow-hidden relative flex flex-col justify-between p-4"
            style={{ background: '#04091f', borderColor: 'rgba(52,211,153,0.15)', height: 204 }}>
            <FeedHeader label="SYS" sublabel="ESTADO DEL SISTEMA" color="#34d399" />
            <div className="mt-7 flex flex-col gap-2">
              {[
                { label: 'Cámaras online', val: 97, color: '#34d399' },
                { label: 'Latencia red',   val: 82, color: '#00d4ff' },
                { label: 'CPU Genetec',    val: 61, color: '#F09422' },
                { label: 'Almacenamiento', val: 44, color: '#F09422' },
              ].map(({ label, val, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-slate-500 font-mono">{label}</span>
                    <span className="font-mono font-bold" style={{ color }}>{val}%</span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full" style={{ width: `${val}%`, background: color, transition: 'width 1s' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Feed 6 — Event log */}
          <div className="col-span-12 sm:col-span-4 rounded-xl border overflow-hidden relative p-0"
            style={{ background: '#04091f', borderColor: 'rgba(52,211,153,0.12)', height: 204 }}>
            <FeedHeader label="LOG" sublabel="EVENTOS EN TIEMPO REAL" color="#34d399" />
            <EventLog />
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-3 flex items-center gap-4 px-3 py-2 rounded-lg border text-xs font-mono flex-wrap"
          style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', color: '#334155' }}>
          <span style={{ color: '#34d399' }}>● ONLINE</span>
          <span>GENETEC SC v5.12</span>
          <span>DJI DOCK 2 ×3</span>
          <span>HIKVISION DS-2CD ×847</span>
          <span>AXIS P32 ×214</span>
          <span className="ml-auto" style={{ color: '#F09422' }}>VISIONARIA OPS · SANTIAGO · CL</span>
        </div>
      </div>

      <style jsx>{`
        @keyframes scanrow {
          0%   { top: 0; }
          100% { top: 100%; }
        }
      `}</style>
    </section>
  );
}

/* ─── Shared sub-components ─── */
function FeedHeader({ label, sublabel, color }: { label: string; sublabel: string; color: string }) {
  return (
    <div className="absolute top-0 left-0 right-0 flex items-center gap-2 px-3 py-1.5 border-b z-10"
      style={{ background: 'rgba(4,9,31,0.9)', borderColor: 'rgba(255,255,255,0.06)' }}>
      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: color }} />
      <span className="text-xs font-bold font-mono" style={{ color }}>{label}</span>
      <span className="text-xs text-slate-600 font-mono tracking-wider truncate">{sublabel}</span>
      <span className="ml-auto text-xs font-mono text-slate-700" suppressHydrationWarning>
        {new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
    </div>
  );
}

function ScanlineOverlay({ color = 'rgba(0,212,255,0.025)' }: { color?: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      <div style={{
        position: 'absolute', left: 0, right: 0, height: '40%',
        background: `linear-gradient(to bottom, transparent, ${color}, transparent)`,
        animation: 'scanrow 4s linear infinite',
      }} />
    </div>
  );
}

function EventLog() {
  const events = [
    { time: '20:17:33', msg: 'Placa BKRD·54 alertada — vehículo robado', color: '#ef4444' },
    { time: '20:17:28', msg: 'Drone UAV-01 en ruta — sector Maipú', color: '#F09422' },
    { time: '20:17:21', msg: 'Rostro ID confirmado — base PDI 94.7%', color: '#34d399' },
    { time: '20:17:15', msg: 'CAM-07 movimiento detectado — zona perimetral', color: '#F09422' },
    { time: '20:17:09', msg: 'Pórtico LPR-03 operativo — 847 vehículos/h', color: '#34d399' },
    { time: '20:16:58', msg: 'Backup enlace fibra activado — nodo norte', color: '#00d4ff' },
    { time: '20:16:44', msg: 'Genetec SC sincronizado — 3.712 cámaras OK', color: '#34d399' },
  ];
  return (
    <div className="mt-7 px-3 pb-2 flex flex-col gap-1 overflow-hidden h-full">
      {events.map((e, i) => (
        <div key={i} className="flex gap-2 text-xs font-mono leading-tight py-0.5 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.04)', opacity: 1 - i * 0.1 }}>
          <span className="shrink-0 text-slate-600">{e.time}</span>
          <span style={{ color: e.color }}>{e.msg}</span>
        </div>
      ))}
    </div>
  );
}
