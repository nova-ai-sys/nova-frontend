import { useEffect, useState } from 'react';

export interface VisualViewportBox {
  /** Height of the area actually visible, in CSS pixels. */
  height: number;
  /** How far the visible area has been pushed down the layout viewport. */
  offsetTop: number;
  /** How much of the viewport the keyboard is covering. 0 when closed. */
  keyboardInset: number;
}

/**
 * Track the visual viewport — the part of the page the user can actually see.
 *
 * iOS does not resize the layout viewport when the keyboard opens. It slides
 * the visual viewport up over it instead, which drags the whole app off the
 * top of the screen: the sidebar included, even though nothing in it is being
 * typed into. Nothing in CSS can see that offset, so the app has to read it and
 * hold itself against it — pinning its own box to the visible area, which
 * leaves the chrome exactly where it was and gives only the conversation up to
 * the keyboard.
 *
 * Falls back to the window's own size where there is no `visualViewport`.
 */
export function useVisualViewport(): VisualViewportBox {
  const [box, setBox] = useState<VisualViewportBox>(() => ({
    height: typeof window === 'undefined' ? 0 : window.innerHeight,
    offsetTop: 0,
    keyboardInset: 0,
  }));

  useEffect(() => {
    const vv = typeof window !== 'undefined' ? window.visualViewport : undefined;
    if (!vv) return;

    const measure = () => {
      // What the layout viewport has that the visual one does not, minus how
      // far the visual viewport has been pushed down. Small values are browser
      // chrome rounding rather than a keyboard, so they count as none.
      const covered = window.innerHeight - vv.height - vv.offsetTop;

      // Focusing a field makes iOS scroll the document to reveal it, and a
      // fixed body does not stop it — it just scrolls the whole fixed layer,
      // carrying the sidebar off the top with it. Putting the document back at
      // zero every time it moves is what actually pins the app down; the
      // measurements below are then the only thing that shifts anything.
      if (window.scrollY !== 0 || document.documentElement.scrollTop !== 0) {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }

      setBox({
        height: Math.round(vv.height),
        offsetTop: Math.round(vv.offsetTop),
        keyboardInset: covered > 80 ? Math.round(covered) : 0,
      });
    };

    measure();
    vv.addEventListener('resize', measure);
    vv.addEventListener('scroll', measure);
    // The scroll iOS does on focus can land after the viewport has settled, so
    // the focus itself is watched too rather than trusting the viewport events.
    window.addEventListener('focusin', measure);
    window.addEventListener('scroll', measure, { passive: true });
    return () => {
      vv.removeEventListener('resize', measure);
      vv.removeEventListener('scroll', measure);
      window.removeEventListener('focusin', measure);
      window.removeEventListener('scroll', measure);
    };
  }, []);

  return box;
}
