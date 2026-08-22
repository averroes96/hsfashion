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
    <a 
      href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="btn btn-primary" 
      style={{ width: '100%', padding: '1rem 1.5rem', fontSize: '1.125rem', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>chat</span>
      {inquireText}
    </a>
  );
}
