'use client';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App runtime error caught by boundary:', error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <div
        className="glass-card"
        style={{
          maxWidth: '500px',
          width: '100%',
          padding: '2.5rem 2rem',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--surface)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#fee2e2',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '2.2rem' }}>
            refresh
          </span>
        </div>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
          Une erreur temporaire est survenue
        </h2>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
          Le serveur met à jour les données. Veuillez rafraîchir la page pour réessayer.
        </p>

        <button
          type="button"
          onClick={() => reset()}
          className="btn hover-lift"
          style={{
            marginTop: '0.5rem',
            padding: '0.75rem 2rem',
            borderRadius: 'var(--radius-full)',
            background: 'var(--primary)',
            color: 'white',
            fontWeight: 800,
            fontSize: '0.95rem',
            boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          🔄 Recharger la page
        </button>
      </div>
    </div>
  );
}
