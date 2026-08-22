'use client';

import { usePathname } from 'next/navigation';

export default function PromoBanner({ message }: { message: string | null | undefined }) {
  const pathname = usePathname();

  // Do not show the banner if there's no message, or if we are on the admin dashboard
  if (!message || pathname?.includes('/admin')) {
    return null;
  }

  return (
    <div style={{ 
      background: 'var(--primary)', 
      color: 'white', 
      textAlign: 'center', 
      padding: '0.6rem 1rem', 
      fontSize: 'clamp(0.78rem, 2vw, 0.875rem)', 
      lineHeight: 1.45,
      fontWeight: 600,
      position: 'relative',
      zIndex: 1000,
      width: '100%'
    }}>
      {message}
    </div>
  );
}
