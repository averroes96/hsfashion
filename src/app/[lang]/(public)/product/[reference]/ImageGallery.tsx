'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import SmartImage from '@/components/SmartImage';

export default function ImageGallery({ images }: { images: any[] }) {
  const primaryImage = images.find((img: any) => img.isPrimary) || images[0];
  const [activeImage, setActiveImage] = useState(primaryImage);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close lightbox on Escape key, navigate on arrows
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isZoomed) return;
      if (e.key === 'Escape') setIsZoomed(false);
      
      const currentIndex = images.findIndex(img => img.id === activeImage.id);
      if (e.key === 'ArrowRight') {
        const nextIndex = (currentIndex + 1) % images.length;
        setActiveImage(images[nextIndex]);
      }
      if (e.key === 'ArrowLeft') {
        const prevIndex = (currentIndex - 1 + images.length) % images.length;
        setActiveImage(images[prevIndex]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZoomed, activeImage, images]);

  // Lock body scroll when zoomed
  useEffect(() => {
    if (isZoomed) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isZoomed]);

  if (!activeImage) {
    return (
      <div className="glass-card" style={{ width: '100%', paddingBottom: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        No Image
      </div>
    );
  }

  const navigateImage = (e: React.MouseEvent, direction: 'next' | 'prev') => {
    e.stopPropagation();
    const currentIndex = images.findIndex(img => img.id === activeImage.id);
    if (direction === 'next') {
      setActiveImage(images[(currentIndex + 1) % images.length]);
    } else {
      setActiveImage(images[(currentIndex - 1 + images.length) % images.length]);
    }
  };

  const renderLightbox = () => {
    if (!isZoomed || !mounted) return null;
    return createPortal(
      <div 
        style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)',
          zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'zoom-out'
        }}
        onClick={() => setIsZoomed(false)}
      >
        {images.length > 1 && (
          <button 
            onClick={(e) => navigateImage(e, 'prev')}
            style={{
              position: 'absolute', left: '2rem', top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(255, 255, 255, 0.1)', color: 'white', border: 'none',
              width: '50px', height: '50px', borderRadius: '50%', fontSize: '1.5rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.2s', zIndex: 1000000
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
          >
            ←
          </button>
        )}

        <img 
          src={activeImage.fullUrl || activeImage.mediumUrl} 
          alt="Product Zoomed" 
          style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', userSelect: 'none' }}
        />

        {images.length > 1 && (
          <button 
            onClick={(e) => navigateImage(e, 'next')}
            style={{
              position: 'absolute', right: '2rem', top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(255, 255, 255, 0.1)', color: 'white', border: 'none',
              width: '50px', height: '50px', borderRadius: '50%', fontSize: '1.5rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.2s', zIndex: 1000000
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
          >
            →
          </button>
        )}

        <button 
          onClick={(e) => { e.stopPropagation(); setIsZoomed(false); }}
          style={{
            position: 'absolute', top: '2rem', right: '2rem',
            background: 'transparent', color: 'white', border: 'none',
            fontSize: '3rem', cursor: 'pointer', lineHeight: 1, zIndex: 1000000
          }}
        >
          &times;
        </button>
      </div>,
      document.body
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '100px' }}>
      
      {/* Lightbox Overlay via Portal */}
      {renderLightbox()}

      {/* Main Image */}
      <div 
        className="glass-card fade-in" 
        style={{ width: '100%', overflow: 'hidden', padding: '1rem', background: 'var(--surface)', cursor: 'zoom-in' }}
        onClick={() => setIsZoomed(true)}
      >
        <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--bg-color)', position: 'relative' }}>
          <SmartImage 
            src={activeImage.fullUrl || activeImage.mediumUrl || activeImage.thumbnailUrl} 
            alt="Product" 
            style={{ width: '100%', display: 'block', objectFit: 'contain', maxHeight: '70vh' }}
          />
          {/* Zoom icon hint */}
          <div style={{
            position: 'absolute', bottom: '1rem', right: '1rem',
            background: 'rgba(255, 255, 255, 0.8)', color: 'var(--text-main)',
            width: '40px', height: '40px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', pointerEvents: 'none'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="11" y1="8" x2="11" y2="14"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </div>
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
