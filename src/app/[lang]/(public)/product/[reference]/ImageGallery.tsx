'use client';
import { useState } from 'react';
import SmartImage from '@/components/SmartImage';

export default function ImageGallery({ images }: { images: any[] }) {
  const primaryImage = images.find((img: any) => img.isPrimary) || images[0];
  const [activeImage, setActiveImage] = useState(primaryImage);

  if (!activeImage) {
    return (
      <div className="glass-card" style={{ width: '100%', paddingBottom: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        No Image
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '100px' }}>
      {/* Main Image */}
      <div className="glass-card fade-in" style={{ width: '100%', overflow: 'hidden', padding: '1rem', background: 'var(--surface)' }}>
        <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--bg-color)' }}>
          <SmartImage 
            src={activeImage.fullUrl || activeImage.mediumUrl || activeImage.thumbnailUrl} 
            alt="Product" 
            style={{ width: '100%', display: 'block', objectFit: 'contain', maxHeight: '70vh' }}
          />
        </div>
      </div>
      
      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="fade-in delay-1" style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {images.map((img: any) => (
            <div 
              key={img.id} 
              onClick={() => setActiveImage(img)}
              className="glass-card"
              style={{ 
                width: '80px', 
                height: '80px', 
                flexShrink: 0,
                cursor: 'pointer',
                border: img.id === activeImage.id ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                opacity: img.id === activeImage.id ? 1 : 0.6,
                transition: 'all 0.2s ease',
                background: 'var(--surface)',
                overflow: 'hidden',
                padding: '4px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => {
                if (img.id !== activeImage.id) e.currentTarget.style.opacity = '0.6';
              }}
            >
              <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', height: '100%', width: '100%' }}>
                <SmartImage src={img.thumbnailUrl} alt="thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} wrapperStyle={{ width: '100%', height: '100%' }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
