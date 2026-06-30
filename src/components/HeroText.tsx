'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface HeroTextProps {
  title: string;
  subtitle: string;
  cta: string;
  cta2: string;
  locale: string;
  contact: string;
}

export default function HeroText({ title, subtitle, cta, cta2, locale }: HeroTextProps) {
  const [phase, setPhase] = useState<'hidden' | 'enter' | 'visible' | 'exit'>('hidden');

  useEffect(() => {
    // Entrada
    const t1 = setTimeout(() => setPhase('enter'), 100);
    // Visible pleno
    const t2 = setTimeout(() => setPhase('visible'), 900);
    // Inicio de desvanecimiento
    const t3 = setTimeout(() => setPhase('exit'), 5500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const base = 'transition-all duration-700 ease-in-out';

  const titleStyle = {
    hidden:  { opacity: 0, transform: 'translateY(40px)' },
    enter:   { opacity: 1, transform: 'translateY(0px)'  },
    visible: { opacity: 1, transform: 'translateY(0px)'  },
    exit:    { opacity: 0, transform: 'translateY(-20px)' },
  }[phase];

  const subtitleStyle = {
    hidden:  { opacity: 0, transform: 'translateY(30px)', transitionDelay: '0ms'   },
    enter:   { opacity: 1, transform: 'translateY(0px)',  transitionDelay: '150ms'  },
    visible: { opacity: 1, transform: 'translateY(0px)',  transitionDelay: '0ms'    },
    exit:    { opacity: 0, transform: 'translateY(-15px)', transitionDelay: '100ms' },
  }[phase];

  const ctaStyle = {
    hidden:  { opacity: 0, transform: 'translateY(20px)', transitionDelay: '0ms'   },
    enter:   { opacity: 1, transform: 'translateY(0px)',  transitionDelay: '300ms'  },
    visible: { opacity: 1, transform: 'translateY(0px)',  transitionDelay: '0ms'    },
    exit:    { opacity: 0, transform: 'translateY(-10px)', transitionDelay: '200ms' },
  }[phase];

  return (
    <div className="max-w-3xl">
      <h1
        className={`text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-white ${base}`}
        style={titleStyle}
      >
        {title}
      </h1>

      <p
        className={`mt-6 text-lg sm:text-xl max-w-xl text-slate-300 ${base}`}
        style={subtitleStyle}
      >
        {subtitle}
      </p>

      <div
        className={`mt-10 flex flex-col sm:flex-row gap-4 ${base}`}
        style={ctaStyle}
      >
        <Link
          href={`/${locale}/productos`}
          className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-full shadow-lg transition-all glow-cyan-sm hover:glow-cyan"
          style={{ background: 'var(--accent)', color: '#060d2e' }}
        >
          {cta} <ArrowRight size={16} />
        </Link>
        <Link
          href={`/${locale}/casos-exito`}
          className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-full transition-colors text-white border hover:bg-white/5"
          style={{ borderColor: 'var(--border)' }}
        >
          {cta2}
        </Link>
      </div>
    </div>
  );
}
