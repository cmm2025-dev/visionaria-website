'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Video } from 'lucide-react';

interface CaseVideoCardProps {
  videoId: string;
  poster: string;
  eyebrow: string;
  title: string;
}

/** Inline case-study video card — plays in place (no new tab), only fullscreen via the iframe's own control. */
export default function CaseVideoCard({ videoId, poster, eyebrow, title }: CaseVideoCardProps) {
  const t = useTranslations('caseVideoCard');
  const [playing, setPlaying] = useState(false);

  return (
    <div className="w-full sm:w-72 rounded-xl overflow-hidden border shadow-lg shrink-0" style={{ borderColor: 'rgba(240,148,34,0.35)', background: '#0f0d0b' }}>
      <p className="text-[10px] font-bold tracking-widest uppercase px-3 pt-3" style={{ color: '#F09422' }}>{eyebrow}</p>
      <div className="relative mt-2" style={{ aspectRatio: '16/9' }}>
        {playing ? (
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            title={title}
            style={{ border: 'none' }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group/case absolute inset-0 w-full h-full cursor-pointer"
            aria-label={`${t('play_aria_prefix')} ${title}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={poster} alt={title} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.35)' }}>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover/case:scale-110"
                style={{ background: 'rgba(240,148,34,0.85)' }}
              >
                <Video size={16} style={{ color: '#1E1B18' }} />
              </div>
            </div>
          </button>
        )}
      </div>
      <div className="px-3 py-2">
        <p className="text-xs text-slate-300 leading-snug">{title}</p>
      </div>
    </div>
  );
}
