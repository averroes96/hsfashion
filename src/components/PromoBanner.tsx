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
      padding: '0.75rem', 
      fontSize: '0.9rem', 
      fontWeight: 600,
      position: 'relative',
      zIndex: 1000,
      width: '100%'
    }}>
      {message}
    </div>
  );
}
