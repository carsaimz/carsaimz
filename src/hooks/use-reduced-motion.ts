'use client';

import { useSyncExternalStore } from 'react';

// Subscribe to prefers-reduced-motion media query
// Uses useSyncExternalStore for proper React 19 subscription pattern

function getSnapshot(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getServerSnapshot(): boolean {
  // Server-side: assume no reduced motion preference
  return false;
}

function subscribe(callback: () => void): () => void {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', callback);
  return () => mq.removeEventListener('change', callback);
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
