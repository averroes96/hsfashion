'use client';
import { useEffect, useState } from 'react';
import { track } from '@vercel/analytics';

export default function WhatsAppButton({ 
  phoneNumber, 
  inquireText, 
  reference 
}: { 
  phoneNumber: string; 
  inquireText: string; 
  reference: string; 
}) {
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  // Format phone number to only contain digits and +
  const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');
  
  // Format message: "Inquire text: REFERENCE - URL"
  const message = `${inquireText}: ${reference}\n${currentUrl}`;

  const handleClick = () => {
    try {
      track('whatsapp_inquiry', { reference });
    } catch {
      // ignore
    }
  };

  return (
    <>
      {/* Standard In-Page Button (Desktop & Scrolling Flow) */}
      <a 
        href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="btn app-tap-target" 
        style={{
          width: '100%',
          padding: '0.95rem 1.5rem',
          fontSize: '1.05rem',
          textAlign: 'center',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: '#25D366',
          color: '#ffffff',
          fontWeight: 700,
          borderRadius: 'var(--radius-full)',
          boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)',
          textDecoration: 'none',
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', color: '#ffffff' }}>chat</span>
        <span style={{ color: '#ffffff' }}>{inquireText}</span>
      </a>

      {/* Fixed Mobile Bottom Action Sheet (Instant One-Tap Conversion) */}
      <div className="product-mobile-bottom-bar hide-desktop">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Réf</span>
          <strong style={{ fontSize: '1.1rem', color: 'var(--text-main)', lineHeight: 1.2 }}>{reference}</strong>
        </div>
        
        <a 
          href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          className="btn app-tap-target" 
          style={{ 
            padding: '0.65rem 1.25rem', 
            fontSize: '0.92rem', 
            borderRadius: 'var(--radius-full)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.4rem',
            backgroundColor: '#25D366',
            color: '#ffffff',
            fontWeight: 700,
            boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)',
            textDecoration: 'none',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.15rem', color: '#ffffff' }}>chat</span>
          <span style={{ color: '#ffffff' }}>{inquireText}</span>
        </a>
      </div>
    </>
  );
}
