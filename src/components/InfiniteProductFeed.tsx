'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import SmartImage from './SmartImage';

interface InfiniteProductFeedProps {
  initialProducts: any[];
  catalogSlug: string;
  familySlug?: string;
  lang: string;
  totalProducts: number;
  dict: any;
  limit?: number;
}

export default function InfiniteProductFeed({
  initialProducts,
  catalogSlug,
  familySlug,
  lang,
  totalProducts,
  dict,
  limit = 12,
}: InfiniteProductFeedProps) {
  const [products, setProducts] = useState<any[]>(initialProducts);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialProducts.length < totalProducts);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isFetchingRef = useRef(false);

  // Sync if initialProducts changes (e.g. navigation between categories)
  useEffect(() => {
    setProducts(initialProducts);
    setPage(1);
    setHasMore(initialProducts.length < totalProducts);
    setIsLoadingMore(false);
    setFetchError(null);
  }, [initialProducts, totalProducts]);

  const loadMoreProducts = useCallback(async () => {
    if (isFetchingRef.current || !hasMore) return;

    isFetchingRef.current = true;
    setIsLoadingMore(true);
    setFetchError(null);

    const nextPage = page + 1;
    const queryParams = new URLSearchParams({
      page: nextPage.toString(),
      limit: limit.toString(),
    });

    if (catalogSlug) queryParams.set('catalogSlug', catalogSlug);
    if (familySlug) queryParams.set('familySlug', familySlug);

    try {
      const res = await fetch(`/api/products?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch next products');

      const data = await res.json();
      const newItems = data.products || [];

      setProducts((prev) => {
        // Prevent accidental duplicates
        const existingIds = new Set(prev.map((p) => p.id));
        const filteredNew = newItems.filter((p: any) => !existingIds.has(p.id));
        return [...prev, ...filteredNew];
      });

      setPage(nextPage);
      setHasMore(data.hasMore === true);
    } catch (err: any) {
      console.error('Error loading more products:', err);
      setFetchError(err.message || 'Error loading more products');
    } finally {
      setIsLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [page, hasMore, catalogSlug, familySlug, limit]);

  // Set up IntersectionObserver on sentinel
  useEffect(() => {
    if (!hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && !isFetchingRef.current) {
          loadMoreProducts();
        }
      },
      {
        rootMargin: '300px', // Fetch early before user reaches the very bottom
        threshold: 0.1,
      }
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
      observer.disconnect();
    };
  }, [hasMore, loadMoreProducts]);

  const pg = dict?.pagination || {};

  return (
    <div>
      {/* Product Grid */}
      <div className="product-card-grid">
        {products.map((product: any, index: number) => {
          const primaryImage = product.images?.[0];
          return (
            <Link
              key={product.id}
              href={`/${lang}/product/${encodeURIComponent(product.reference)}`}
              className="product-card fade-in-up"
              style={{ animationDelay: `${(index % 4) * 0.05}s` }}
            >
              <div className="product-card-media">
                {primaryImage ? (
                  <SmartImage
                    src={primaryImage.mediumUrl || primaryImage.thumbnailUrl}
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
                      fontSize: '0.8rem',
                    }}
                  >
                    No Image
                  </div>
                )}
              </div>

              <div className="product-card-body">
                <h3 className="product-card-title">{product.reference}</h3>
                <p className="product-card-subtitle">
                  {product.details || 'View details'}
                </p>
              </div>
            </Link>
          );
        })}

        {/* Shimmer Skeleton Placeholder Effect While Fetching Next Batch */}
        {isLoadingMore &&
          Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={`loading-placeholder-${idx}`}
              className="product-card fade-in"
              style={{ opacity: 0.85 }}
            >
              <div className="product-card-media skeleton-bg" />
              <div className="product-card-body" style={{ gap: '0.45rem' }}>
                <div
                  className="skeleton-bg"
                  style={{ height: '18px', width: '65%', borderRadius: '4px' }}
                />
                <div
                  className="skeleton-bg"
                  style={{ height: '12px', width: '45%', borderRadius: '4px' }}
                />
              </div>
            </div>
          ))}
      </div>

      {/* Invisible Sentinel to Trigger Next Page */}
      <div ref={sentinelRef} style={{ height: '20px', margin: '1rem 0' }} />

      {/* Loading Indicator / Status Bar */}
      {isLoadingMore && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '1.5rem 0',
            color: 'var(--primary)',
            fontSize: '0.9rem',
            fontWeight: 600,
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: '18px',
              height: '18px',
              border: '2px solid var(--primary)',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <span>{pg.loadingMore || "Chargement d'autres modèles..."}</span>
        </div>
      )}

      {/* Error State with Retry Button */}
      {fetchError && (
        <div
          style={{
            textAlign: 'center',
            padding: '1.5rem',
            background: 'var(--surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            marginTop: '1.5rem',
          }}
        >
          <p style={{ color: '#ef4444', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
            {fetchError}
          </p>
          <button
            type="button"
            onClick={loadMoreProducts}
            className="btn btn-outline"
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
          >
            {pg.retry || 'Réessayer'}
          </button>
        </div>
      )}

      {/* End of Collection Indicator */}
      {!hasMore && products.length > 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '2.5rem 0 1rem 0',
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'var(--surface)',
              padding: '0.4rem 1rem',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {pg.endOfCollection || '✓ Vous avez vu tous les modèles de cette catégorie'}
          </span>
        </div>
      )}
    </div>
  );
}
