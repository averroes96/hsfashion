'use client';

import { useEffect } from 'react';

export default function ProductTracker({ productId }: { productId: string }) {
  useEffect(() => {
    // Check if we've already tracked a view for this product in this session
    const sessionKey = `viewed_${productId}`;
    if (!sessionStorage.getItem(sessionKey)) {
      // Set immediately to prevent React StrictMode from firing twice
      sessionStorage.setItem(sessionKey, 'true');
      
      // Fire and forget
      fetch('/api/analytics/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      }).catch(err => {
        // Revert on failure so they can track it next time
        sessionStorage.removeItem(sessionKey);
        console.error('Failed to track view', err);
      });
    }
  }, [productId]);

  return null; // Invisible component
}
