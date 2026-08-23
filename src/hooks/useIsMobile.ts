import { useSyncExternalStore } from 'react';

/** Tailwind's `md` breakpoint — below it, the phone layout applies. */
export const MOBILE_QUERY = '(max-width: 767px)';

/** Read the breakpoint synchronously, for lazy `useState` initialisers. */
export function isMobileViewport(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia(MOBILE_QUERY).matches;
}

/**
 * Whether the pointer can actually hover.
 *
 * A touch screen has no hover: tapping fires the enter handlers and nothing
 * ever fires the leave, so a hover-only affordance opens and then stays open
 * over the UI. Anything that only reveals information on hover checks this
 * first and simply does not appear on touch.
 */
export function canHover(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return true;
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

function subscribe(onChange: () => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const mql = window.matchMedia(MOBILE_QUERY);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

/**
 * Track whether the viewport is phone-sized.
 *
 * Layout decisions that CSS alone cannot express — the sidebar overlaying the
 * chat instead of sitting beside it — need the breakpoint as state, not just
 * as a class, so they can drive the animated width as well as the markup.
 *
 * The media query is an external store rather than effect-synced state: the
 * viewport can already have crossed the breakpoint by the time an effect runs,
 * and this reads it at render time with no extra pass.
 */
export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, isMobileViewport, () => false);
}
