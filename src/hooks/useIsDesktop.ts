'use client';

import { useEffect, useState } from 'react';

/**
 * True only once we've confirmed client-side that the viewport is at or above
 * `breakpoint`. Starts `false` so narrow viewports never mount a gated element —
 * relying on CSS `display:none` alone doesn't reliably stop a browser from
 * fetching a <video> resource, so callers should use this to skip rendering
 * the element entirely rather than just hiding it.
 */
export function useIsDesktop(breakpoint = 768): boolean {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${breakpoint}px)`);
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [breakpoint]);

  return isDesktop;
}
