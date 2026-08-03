'use client';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';

const VEHICLES = [
  { plate: 'PPGJ·72', cam: 'CAM-RM-047', loc: 'Vespucio Norte km 3.2', dir: 'S→N', tipo: 'liviano', status: 'clean' },
  { plate: 'BKTS·94', cam: 'CAM-RM-112', loc: 'Ruta 68 km 14.1',       dir: 'E→O', tipo: 'suv',     status: 'wanted' },
  { plate: 'HYFL·15', cam: 'CAM-RM-203', loc: 'Av. La Florida 8840',    dir: 'N→S', tipo: 'furgon',  status: 'clean' },
  { plate: 'CDRM·83', cam: 'CAM-RM-089', loc: 'Circunvalación Pte.',    dir: 'S→N', tipo: 'liviano', status: 'clean' },
] as const;

const HISTORY = [
  { plate: 'FHKM·51', ts: '14:22:48', status: 'clean' },
  { plate: 'GYVD·37', ts: '14:22:31', status: 'clean' },
  { plate: 'NXPL·09', ts: '14:22:19', status: 'clean' },
] as const;

type Phase = 'approach' | 'detect' | 'ocr' | 'query' | 'result' | 'exit';

export default function LprHeroVisual() {
  const t = useTranslations('lprVisual');
  const [vIdx, setVIdx]         = useState(0);
  const [phase, setPhase]       = useState<Phase>('approach');
  const [chars, setChars]       = useState('');
  const [sebvDone, setSebvDone] = useState(false);
  const [sitiaDone, setSitiaDone] = useState(false);
  const [clock, setClock]       = useState('00:00:00.0');

  const v       = VEHICLES[vIdx % VEHICLES.length];
  const isAlert = v.status === 'wanted';

  // Live clock
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      const ss = String(d.getSeconds()).padStart(2, '0');
      const ms = String(Math.floor(d.getMilliseconds() / 100));
      setClock(`${hh}:${mm}:${ss}.${ms}`);
    };
    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, []);

  // State machine per vehicle cycle
  useEffect(() => {
    setPhase('approach');
    setSebvDone(false);
    setSitiaDone(false);
    setChars('');

    const timers: ReturnType<typeof setTimeout>[] = [];
    const plate = v.plate;

    timers.push(setTimeout(() => setPhase('detect'),  700));
    timers.push(setTimeout(() => setPhase('ocr'),    1350));

    plate.split('').forEach((_, i) => {
      timers.push(setTimeout(() => setChars(plate.slice(0, i + 1)), 1450 + i * 90));
    });

    const afterOcr = 1450 + plate.length * 90;
    timers.push(setTimeout(() => setPhase('query'),  afterOcr + 100));
    timers.push(setTimeout(() => setSebvDone(true),  afterOcr + 700));
    timers.push(setTimeout(() => setSitiaDone(true), afterOcr + 1300));
    timers.push(setTimeout(() => setPhase('result'), afterOcr + 1500));
    timers.push(setTimeout(() => setPhase('exit'),   afterOcr + 3300));
    timers.push(setTimeout(() => setVIdx(i => i + 1), afterOcr + 3700));

    return () => timers.forEach(clearTimeout);
  }, [vIdx]);  // eslint-disable-line react-hooks/exhaustive-deps

  const showBox    = phase !== 'approach';
  const showOcr    = phase === 'ocr'   || phase === 'query'  || phase === 'result' || phase === 'exit';
  const showQuery  = phase === 'query' || phase === 'result' || phase === 'exit';
  const showResult = phase === 'result' || phase === 'exit';
  const vehicleIn  = phase !== 'approach';
  const vehicleOut = phase === 'exit';

  const boxColor   = isAlert && showResult ? '#f87171' : '#F09422';

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden border"
      style={{ background: '#080604', borderColor: 'rgba(196,168,130,0.18)' }}
    >
      {/* ── Header bar ── */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.55)' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: '#34d399', boxShadow: '0 0 6px #34d399', animation: 'pulse 2s infinite' }}
          />
          <span className="text-[9px] font-mono font-bold tracking-widest shrink-0" style={{ color: '#34d399' }}>{t('live')}</span>
          <span className="text-[9px] font-mono text-slate-600 shrink-0">·</span>
          <span className="text-[9px] font-mono text-slate-400 shrink-0">{v.cam}</span>
          <span className="text-[9px] font-mono text-slate-600 hidden sm:inline shrink-0">·</span>
          <span className="text-[9px] font-mono text-slate-500 truncate hidden sm:inline">{v.loc}</span>
        </div>
        <span className="text-[9px] font-mono text-slate-600 tabular-nums shrink-0 ml-2">{clock}</span>
      </div>

      {/* ── Camera feed ── */}
      <div className="relative overflow-hidden" style={{ height: 210 }}>

        {/* Road background */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 400 210"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Road surface (perspective trapezoid) */}
          <path d="M140,0 L260,0 L330,210 L70,210 Z" fill="#171414"/>
          {/* Sidewalks */}
          <rect x="0"   y="0" width="140" height="210" fill="#0d0b0b"/>
          <rect x="260" y="0" width="140" height="210" fill="#0d0b0b"/>
          {/* Road edges */}
          <line x1="140" y1="0" x2="70"  y2="210" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5"/>
          <line x1="260" y1="0" x2="330" y2="210" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5"/>
          {/* Center dashes */}
          {[0, 1, 2, 3, 4].map(i => (
            <rect key={i} x="198" y={i * 50 + 5} width="4" height="30" fill="rgba(255,255,255,0.09)" rx="2"/>
          ))}
          {/* Subtle scan grid */}
          {[42, 84, 126, 168].map(y => (
            <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="rgba(61,138,130,0.05)" strokeWidth="0.5"/>
          ))}
          {/* IR flood light glow (camera illuminator) */}
          <radialGradient id="irGlow" cx="50%" cy="0%" r="60%">
            <stop offset="0%"   stopColor="rgba(240,148,34,0.08)"/>
            <stop offset="100%" stopColor="rgba(240,148,34,0)"/>
          </radialGradient>
          <rect x="0" y="0" width="400" height="210" fill="url(#irGlow)"/>
        </svg>

        {/* Vehicle silhouette */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            top: vehicleOut ? -160 : vehicleIn ? 16 : -160,
            opacity: vehicleOut ? 0 : 1,
            transition: vehicleOut
              ? 'top 0.45s ease-in, opacity 0.3s'
              : 'top 0.75s cubic-bezier(0.22,0.61,0.36,1)',
          }}
        >
          <svg viewBox="0 0 200 150" width="196" height="147">
            {/* Body */}
            <path
              d="M10,128 L10,70 C10,42 35,18 100,16 C165,18 190,42 190,70 L190,128 Z"
              fill="#1c1919" stroke="rgba(255,255,255,0.06)" strokeWidth="1"
            />
            {/* Windshield */}
            <path d="M30,68 L50,30 L150,30 L170,68 Z"
                  fill="rgba(25,45,55,0.7)" stroke="rgba(61,138,130,0.35)" strokeWidth="0.8"/>
            {/* Roof */}
            <path d="M50,30 L150,30 L150,6 L50,6 Z"
                  fill="#161414" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5"/>
            {/* Hood */}
            <path d="M16,112 L24,100 L176,100 L184,112 Z" fill="#131010"/>
            {/* Left headlight glow */}
            <ellipse cx="45" cy="92" rx="20" ry="11" fill="rgba(255,215,90,0.55)"/>
            <ellipse cx="45" cy="92" rx="13" ry="7"  fill="rgba(255,238,160,0.95)"/>
            {/* Right headlight glow */}
            <ellipse cx="155" cy="92" rx="20" ry="11" fill="rgba(255,215,90,0.55)"/>
            <ellipse cx="155" cy="92" rx="13" ry="7"  fill="rgba(255,238,160,0.95)"/>
            {/* Grille */}
            <rect x="70" y="112" width="60" height="11" rx="2"
                  fill="#0a0808" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5"/>
            {/* IR plate illumination */}
            {showOcr && (
              <rect x="55" y="116" width="90" height="35" rx="5" fill="rgba(240,148,34,0.13)"/>
            )}
            {/* License plate */}
            <rect
              x="66" y="124" width="68" height="21" rx="2.5"
              fill={showOcr ? '#ede8d8' : '#ccc6b0'}
              stroke={showOcr ? boxColor : 'rgba(255,255,255,0.12)'}
              strokeWidth={showOcr ? 1.5 : 0.5}
            />
            {showOcr && chars && (
              <text
                x="100" y="138.5"
                textAnchor="middle" fontFamily="monospace"
                fontSize="10" fontWeight="bold" fill="#100e0a" letterSpacing="1.5"
              >
                {chars}
              </text>
            )}
          </svg>
        </div>

        {/* Detection bounding box */}
        {showBox && (
          <div
            className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
            style={{
              top: 10, width: 206, height: 170,
              opacity: vehicleOut ? 0 : 1,
              transition: 'opacity 0.35s',
            }}
          >
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-5 h-5"
                 style={{ borderTop: `2px solid ${boxColor}`, borderLeft: `2px solid ${boxColor}` }}/>
            <div className="absolute top-0 right-0 w-5 h-5"
                 style={{ borderTop: `2px solid ${boxColor}`, borderRight: `2px solid ${boxColor}` }}/>
            <div className="absolute bottom-0 left-0 w-5 h-5"
                 style={{ borderBottom: `2px solid ${boxColor}`, borderLeft: `2px solid ${boxColor}` }}/>
            <div className="absolute bottom-0 right-0 w-5 h-5"
                 style={{ borderBottom: `2px solid ${boxColor}`, borderRight: `2px solid ${boxColor}` }}/>
            {/* Top label */}
            <div
              className="absolute text-[8px] font-mono font-bold px-1.5 py-0.5 leading-none"
              style={{ top: -14, left: 16, background: boxColor, color: '#1E1B18' }}
            >
              {t(`vehicle_types.${v.tipo}`)}
            </div>
            <div
              className="absolute text-[8px] font-mono"
              style={{ top: -13, right: 16, color: 'rgba(196,168,130,0.6)' }}
            >
              {v.dir}
            </div>
          </div>
        )}

        {/* Scan beam */}
        {(phase === 'detect' || phase === 'ocr') && (
          <div
            className="absolute left-0 right-0 pointer-events-none"
            style={{
              height: 3,
              background: 'linear-gradient(to right, transparent 0%, rgba(240,148,34,0.55) 30%, rgba(240,148,34,0.7) 50%, rgba(240,148,34,0.55) 70%, transparent 100%)',
              animation: 'lprScanY 1.4s linear infinite',
            }}
          />
        )}

        {/* Camera metadata overlays */}
        <div className="absolute bottom-1.5 left-2.5 text-[7px] font-mono text-slate-700 tabular-nums select-none">
          {clock}
        </div>
        <div className="absolute top-1.5 right-2.5 text-[7px] font-mono text-slate-700 select-none">
          ⊕ 14.7° · f/1.4
        </div>
        <div className="absolute top-1.5 left-2.5 text-[7px] font-mono select-none" style={{ color: 'rgba(61,138,130,0.5)' }}>
          IR ON
        </div>
      </div>

      {/* ── Bottom: plate + query ── */}
      <div className="grid grid-cols-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>

        {/* Plate readout */}
        <div className="p-3 border-r" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <p className="text-[7px] font-mono tracking-widest mb-2" style={{ color: 'rgba(148,163,184,0.4)' }}>
            {t('plate_captured')}
          </p>
          <div
            className="font-mono font-bold text-base tracking-[0.18em] text-center py-2 rounded transition-all duration-300"
            style={{
              background: showOcr ? 'rgba(240,148,34,0.07)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${showOcr ? 'rgba(240,148,34,0.28)' : 'rgba(255,255,255,0.04)'}`,
              color: showOcr ? '#F09422' : '#252220',
              minHeight: 38,
            }}
          >
            {showOcr ? (chars || '·') : '—'}
          </div>
          <p className="text-[7px] font-mono text-center mt-1" style={{ color: showOcr ? 'rgba(196,168,130,0.5)' : 'transparent' }}>
            {t('plate_format')}
          </p>
        </div>

        {/* Query status */}
        <div className="p-3">
          <p className="text-[7px] font-mono tracking-widest mb-2" style={{ color: 'rgba(148,163,184,0.4)' }}>
            {t('query_databases')}
          </p>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[8px] font-mono text-slate-500">SEBV</span>
              {!showQuery
                ? <span className="text-[8px] font-mono text-slate-800">—</span>
                : !sebvDone
                  ? <Loader2 size={9} className="animate-spin" style={{ color: '#F09422' }}/>
                  : <span className="text-[8px] font-mono font-bold" style={{ color: isAlert ? '#f87171' : '#34d399' }}>
                      {isAlert ? t('alert_label') : t('ok_label')}
                    </span>
              }
            </div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[8px] font-mono text-slate-500">SITIA</span>
              {!showQuery
                ? <span className="text-[8px] font-mono text-slate-800">—</span>
                : !sitiaDone
                  ? <Loader2 size={9} className="animate-spin" style={{ color: '#3D8A82' }}/>
                  : <span className="text-[8px] font-mono font-bold" style={{ color: '#34d399' }}>{t('ok_label')}</span>
              }
            </div>
            {showResult && (
              <div
                className="text-center text-[8px] font-mono font-bold py-1.5 rounded tracking-widest mt-0.5 transition-all"
                style={{
                  background: isAlert ? 'rgba(248,113,113,0.1)' : 'rgba(52,211,153,0.08)',
                  border: `1px solid ${isAlert ? 'rgba(248,113,113,0.25)' : 'rgba(52,211,153,0.2)'}`,
                  color: isAlert ? '#f87171' : '#34d399',
                }}
              >
                {isAlert ? t('result_wanted') : t('result_clean')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Recent captures ticker ── */}
      <div
        className="border-t px-3 py-2"
        style={{ borderColor: 'rgba(255,255,255,0.04)', background: 'rgba(0,0,0,0.35)' }}
      >
        <p className="text-[7px] font-mono tracking-widest mb-1.5" style={{ color: 'rgba(148,163,184,0.3)' }}>
          {t('recent_captures')}
        </p>
        <div className="flex flex-col gap-0.5">
          {HISTORY.map(({ plate, ts, status }) => (
            <div key={plate} className="flex items-center justify-between">
              <span className="text-[8px] font-mono text-slate-600 tabular-nums">{ts}</span>
              <span className="text-[8px] font-mono text-slate-400 tracking-widest">{plate}</span>
              <span
                className="text-[7px] font-mono"
                style={{ color: status === 'clean' ? 'rgba(52,211,153,0.55)' : '#f87171' }}
              >
                {status === 'clean' ? t('status_clean') : t('status_wanted')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
