'use client';

import { useIsDesktop } from '@/hooks/useIsDesktop';
import HeroCinematic from './HeroCinematic';

interface HeroVideoBackgroundProps {
  sources: string[];
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Autoplay hero background video, skipped entirely on narrow viewports in favor
 * of the lightweight particle canvas — mobile visitors never fetch the video
 * file. Multiple multi-MB autoplay videos loading at once was timing out page
 * loads on mobile networks.
 */
export default function HeroVideoBackground({
  sources,
  className = 'absolute inset-0 w-full h-full object-cover pointer-events-none',
  style = { zIndex: 0 },
}: HeroVideoBackgroundProps) {
  const isDesktop = useIsDesktop();

  if (!isDesktop) return <HeroCinematic />;

  return (
    <video autoPlay muted loop playsInline className={className} style={style}>
      {sources.map(src => (
        <source key={src} src={src} type="video/mp4" />
      ))}
    </video>
  );
}
