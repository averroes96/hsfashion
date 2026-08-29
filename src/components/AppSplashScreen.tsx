'use client';
import React, { useState, useEffect } from 'react';

export default function AppSplashScreen() {
  const [showSplash, setShowSplash] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Only show full splash once per session or on standalone PWA launch
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    const hasSeenSplash = sessionStorage.getItem('hs_splash_seen');

    if (hasSeenSplash && !isStandalone) {
      setShowSplash(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsFading(true);
      setTimeout(() => {
        setShowSplash(false);
        try {
          sessionStorage.setItem('hs_splash_seen', '1');
        } catch {}
      }, 400); // fade duration
    }, 850); // splash display duration

    return () => clearTimeout(timer);
  }, []);

  if (!showSplash) return null;

  return (
    <div
      id="app-splash-screen"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: '#fed033',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        opacity: isFading ? 0 : 1,
        transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: isFading ? 'none' : 'auto',
      }}
    >
      {/* Brand Logo Card */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem',
          transform: isFading ? 'scale(1.05)' : 'scale(1)',
          transition: 'transform 0.4s ease-out',
        }}
      >
        <div
          style={{
            width: '120px',
            height: '120px',
            borderRadius: '28px',
            overflow: 'hidden',
            boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.25)',
            border: '3px solid rgba(255, 255, 255, 0.6)',
            background: '#fed033',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'scaleUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <img
            src="/splash-logo.png"
            alt="H.S.Fashion Logo"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>

        <div style={{ textAlign: 'center' }}>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 900,
              color: '#0f172a',
              letterSpacing: '0.04em',
              margin: '0 0 0.25rem 0',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            H.S.Fashion
          </h1>
          <p
            style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: 'rgba(15, 23, 42, 0.75)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            Chaussures & Maroquinerie
          </p>
        </div>

        {/* Shimmer Loading Bar */}
        <div
          style={{
            width: '140px',
            height: '4px',
            borderRadius: '999px',
            background: 'rgba(0, 0, 0, 0.12)',
            overflow: 'hidden',
            marginTop: '0.5rem',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: '50%',
              height: '100%',
              background: '#0f172a',
              borderRadius: '999px',
              animation: 'shimmer 1.2s infinite ease-in-out',
            }}
          />
        </div>
      </div>
    </div>
  );
}
