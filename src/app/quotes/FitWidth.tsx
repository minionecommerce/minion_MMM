'use client';

import { useSyncExternalStore, type ReactNode } from 'react';
import { fitScale } from '@/lib/quotes/fit';

// Draws what is inside at `width` px, scaled to the width of the box it sits in (see fitScale): the quote document fills the space beside the list of quotes.
// The scale is `zoom`, so the box is as tall as what is drawn in it and the page scrolls as usual. The width of the box is read from the page (one box on
// the page), and read again whenever it changes: the list of quotes opening, the window being resized or split.
const BOX = '[data-fit-width]';
const availableNow = () => document.querySelector<HTMLElement>(BOX)?.clientWidth ?? 0;

function watchBox(onChange: () => void) {
  const el = document.querySelector(BOX);
  const observer = el && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onChange) : null;
  if (el && observer) observer.observe(el);
  window.addEventListener('resize', onChange);
  return () => { observer?.disconnect(); window.removeEventListener('resize', onChange); };
}

export default function FitWidth({ width, children }: { width: number; children: ReactNode }) {
  const available = useSyncExternalStore(watchBox, availableNow, () => 0);
  const scale = fitScale(available, width);
  return (
    <div data-fit-width className="w-full" data-fit-scale={scale}>
      <div className="mx-auto" style={{ width, zoom: scale }}>{children}</div>
    </div>
  );
}
