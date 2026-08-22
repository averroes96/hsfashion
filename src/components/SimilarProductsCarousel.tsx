'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import SmartImage from './SmartImage';

interface SimilarProductsCarouselProps {
  currentReference: string;
  lang: string;
  dict: any;
}

export default function SimilarProductsCarousel({
  currentReference,
  lang,
  dict,
}: SimilarProductsCarouselProps) {
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchSimilar() {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/products/${encodeURIComponent(currentReference)}/similar?lang=${lang}`
        );
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setMatches(data.matches || []);
          }
        }
      } catch (err) {
        console.error('Failed to fetch similar products:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchSimilar();
    return () => {
      isMounted = false;
    };
  }, [currentReference, lang]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const sp = dict?.similarProducts || {};

  // Don't render anything if finished loading and no matches found
  if (!isLoading && matches.length === 0) {
    return null;
  }

  return (
    <section style={{ marginTop: '4rem', marginBottom: '2rem' }}>
      {/* Section Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span
              style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #ec4899 100%)',
                color: 'white',
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--radius-full)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Gemini AI
            </span>
            <h2 style={{ fontSize: '1.5rem', margin: 0, fontWeight: 800 }}>
              {sp.title || 'Similar Styles Recommended by AI ✨'}
            </h2>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            {sp.subtitle || 'Discover other curated footwear with matching silhouettes and finishes.'}
          </p>
        </div>

        {/* Carousel Navigation Buttons */}
        {!isLoading && matches.length > 3 && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => scroll('left')}
              aria-label="Previous"
              className="btn btn-outline hover-lift"
              style={{
                width: '40px',
                height: '40px',
                padding: 0,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--surface)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              ←
            </button>
            <button
              onClick={() => scroll('right')}
              aria-label="Next"
              className="btn btn-outline hover-lift"
              style={{
                width: '40px',
                height: '40px',
                padding: 0,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--surface)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              →
            </button>
          </div>
        )}
      </div>

      {/* Carousel Scroll Container */}
      <div
        ref={scrollContainerRef}
        style={{
          display: 'flex',
          gap: '1.25rem',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          paddingBottom: '1rem',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {/* Loading Skeletons */}
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={`sim-skel-${i}`}
              className="glass-card"
              style={{
                flex: '0 0 280px',
                scrollSnapAlign: 'start',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                height: '340px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div className="skeleton-bg" style={{ height: '200px' }} />
              <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div className="skeleton-bg" style={{ height: '20px', width: '60%', borderRadius: '4px' }} />
                <div className="skeleton-bg" style={{ height: '14px', width: '40%', borderRadius: '4px' }} />
                <div className="skeleton-bg" style={{ height: '14px', width: '90%', borderRadius: '4px', marginTop: '0.25rem' }} />
              </div>
            </div>
          ))}

        {/* Product Cards */}
        {!isLoading &&
          matches.map((item: any) => {
            const product = item.product;
            const image = product?.image;

            return (
              <Link
                key={product.id}
                href={`/${lang}/product/${encodeURIComponent(product.reference)}`}
                className="glass-card hover-lift"
                style={{
                  flex: '0 0 280px',
                  scrollSnapAlign: 'start',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  border: '1px solid var(--border-color)',
                  position: 'relative',
                  background: 'var(--surface)',
                }}
              >
                {/* Match Highlight Badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    zIndex: 10,
                    background: 'rgba(79, 70, 229, 0.92)',
                    color: 'white',
                    padding: '0.25rem 0.6rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    backdropFilter: 'blur(4px)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  <span>✨</span>
                  <span>{item.similarityScore}% {sp.matchScore || 'Match'}</span>
                </div>

                {/* Image Showcase */}
                <div style={{ height: '210px', background: 'var(--bg-color)', position: 'relative' }}>
                  {image ? (
                    <SmartImage
                      src={image.mediumUrl || image.thumbnailUrl}
                      alt={product.reference}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      wrapperStyle={{ width: '100%', height: '100%' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-muted)',
                      }}
                    >
                      No Image
                    </div>
                  )}
                </div>

                {/* Details */}
                <div
                  style={{
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    flex: 1,
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                        {product.reference}
                      </h3>
                      <span className="badge" style={{ fontSize: '0.75rem' }}>
                        {product.family?.name || ''}
                      </span>
                    </div>

                    {item.matchReason && (
                      <p
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--primary)',
                          background: 'var(--primary-light)',
                          padding: '0.4rem 0.6rem',
                          borderRadius: 'var(--radius-sm)',
                          marginTop: '0.5rem',
                          marginBottom: '0.5rem',
                          lineHeight: 1.35,
                        }}
                      >
                        💡 {item.matchReason}
                      </p>
                    )}
                  </div>

                  <div
                    style={{
                      color: 'var(--primary)',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      marginTop: '0.5rem',
                    }}
                  >
                    <span>{sp.viewProduct || 'View Product'}</span>
                    <span>→</span>
                  </div>
                </div>
              </Link>
            );
          })}
      </div>
    </section>
  );
}
