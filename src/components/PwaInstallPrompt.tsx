'use client';
import React, { useState, useEffect } from 'react';

interface PwaInstallPromptProps {
  dict?: any;
  lang?: string;
}

export default function PwaInstallPrompt({
  dict,
  lang = 'fr',
}: PwaInstallPromptProps) {
  const isArabic = lang === 'ar';
  const t = dict?.pwa || {};

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already in standalone PWA mode
    const isRunningStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isRunningStandalone);

    if (isRunningStandalone) return;

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // Check if dismissed before
    const isDismissed = localStorage.getItem('hsfashion_pwa_dismissed');
    if (isDismissed) return;

    // Android / Desktop beforeinstallprompt
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // If iOS and not dismissed, show prompt after 3s
    if (isIosDevice && !isRunningStandalone && !isDismissed) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3500);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('hsfashion_pwa_dismissed', 'true');
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '90px', // Above bottom bar
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 2rem)',
        maxWidth: '420px',
        zIndex: 9998,
        background: 'rgba(15, 23, 42, 0.94)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
        padding: '1rem 1.15rem',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        gap: '0.85rem',
        animation: 'slideUp 0.3s ease-out',
      }}
    >
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 4px 10px rgba(79, 70, 229, 0.4)',
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: '#ffffff' }}>
          storefront
        </span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800 }}>
          {t.installTitle || 'Application Showroom B2B'}
        </h4>
        <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: '#cbd5e1', lineHeight: 1.3 }}>
          {isIos
            ? t.iosInstruction || 'Sur Safari : appuyez sur Partager ⎋ puis « Sur l\'écran d\'accueil » ➕'
            : t.installDesc || 'Accédez au catalogue instantanément même hors-ligne.'}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
        {!isIos && deferredPrompt && (
          <button
            type="button"
            onClick={handleInstallClick}
            className="btn"
            style={{
              padding: '0.4rem 0.8rem',
              fontSize: '0.78rem',
              fontWeight: 800,
              background: '#4f46e5',
              color: 'white',
              borderRadius: 'var(--radius-full)',
              border: 'none',
            }}
          >
            {t.installBtn || 'Installer'}
          </button>
        )}

        <button
          type="button"
          onClick={handleDismiss}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            fontSize: '1rem',
          }}
          title="Fermer"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
