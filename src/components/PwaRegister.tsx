'use client';
import { useEffect } from 'react';

export default function PwaRegister() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('PWA: Service Worker registered successfully with scope:', registration.scope);
          })
          .catch((error) => {
            console.warn('PWA: Service Worker registration failed:', error);
          });
      });
    } else if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'development'
    ) {
      // In dev mode, register as well so offline caching can be tested
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('PWA (Dev): SW registered', reg.scope))
        .catch((e) => console.warn('PWA (Dev): SW failed', e));
    }
  }, []);

  return null;
}
