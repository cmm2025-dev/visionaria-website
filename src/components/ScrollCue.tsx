'use client';

import { ChevronDown } from 'lucide-react';

interface ScrollCueProps {
  label?: string;
}

export default function ScrollCue({ label = 'Continuar' }: ScrollCueProps) {
  return (
    <div className="flex justify-center py-8">
      <button
        onClick={() => window.scrollBy({ top: window.innerHeight * 0.85, behavior: 'smooth' })}
        className="flex flex-col items-center gap-2 group transition-opacity hover:opacity-100"
        style={{ opacity: 0.75, background: 'none', border: 'none', cursor: 'pointer' }}
        aria-label={label}
      >
        <span
          className="text-xs font-bold tracking-[0.25em] uppercase"
          style={{ color: 'var(--accent)', textShadow: '0 0 10px rgba(240,148,34,0.5)' }}
        >
          {label}
        </span>
        <span
          className="flex items-center justify-center rounded-full border-2 transition-transform group-hover:scale-110"
          style={{
            width: '2.25rem',
            height: '2.25rem',
            borderColor: 'var(--accent)',
            background: 'rgba(240,148,34,0.12)',
            boxShadow: '0 0 14px rgba(240,148,34,0.30)',
            animation: 'bounce-cue 1.6s ease-in-out infinite',
          }}
        >
          <ChevronDown size={18} style={{ color: 'var(--accent)' }} />
        </span>
      </button>
      <style>{`
        @keyframes bounce-cue {
          0%, 100% { transform: translateY(0); opacity: 0.7; }
          50%       { transform: translateY(5px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
