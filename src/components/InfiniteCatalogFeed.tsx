'use client';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import SmartImage from './SmartImage';

export interface FeedCatalog {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  createdAt: string;
  productCount: number;
  thumbnail?: string | null;
}

interface InfiniteCatalogFeedProps {
  initialCatalogs: FeedCatalog[];
  totalCatalogs: number;
  lang: string;
  dict: any;
  limit?: number;
}

interface MonthGroup {
  monthKey: string;
  monthLabel: string;
  catalogs: FeedCatalog[];
}

export default function InfiniteCatalogFeed({
  initialCatalogs,
  totalCatalogs,
  lang,
  dict,
  limit = 8,
}: InfiniteCatalogFeedProps) {
  const [catalogs, setCatalogs] = useState<FeedCatalog[]>(initialCatalogs);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialCatalogs.length < totalCatalogs);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isFetchingRef = useRef(false);

  const isArabic = lang === 'ar';
  const pg = dict?.pagination || {};

  // Helper to format localized month and year
  const getMonthData = useCallback(
    (dateStr: string) => {
      try {
        const d = new Date(dateStr);
        const year = d.getFullYear();
        const monthIndex = d.getMonth();
        const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
        const monthLabel = d.toLocaleDateString(isArabic ? 'ar-DZ' : 'fr-FR', {
          month: 'long',
          year: 'numeric',
        });
        // Capitalize first letter in French
        const formattedLabel = isArabic
          ? monthLabel
          : monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

        return { monthKey, monthLabel: formattedLabel };
      } catch {
        return { monthKey: 'other', monthLabel: isArabic ? 'التشكيلات' : 'Collections' };
      }
    },
    [isArabic]
  );

  // Group catalogs dynamically into monthly buckets
  const monthGroups = useMemo(() => {
    const groupsMap = new Map<string, MonthGroup>();

    for (const catalog of catalogs) {
      const { monthKey, monthLabel } = getMonthData(catalog.createdAt);
      if (!groupsMap.has(monthKey)) {
        groupsMap.set(monthKey, {
          monthKey,
          monthLabel,
          catalogs: [],
        });
      }
      groupsMap.get(monthKey)!.catalogs.push(catalog);
    }

    return Array.from(groupsMap.values());
  }, [catalogs, getMonthData]);

  // Load next page of catalogs on scroll
  const loadMoreCatalogs = useCallback(async () => {
    if (isFetchingRef.current || !hasMore) return;

    isFetchingRef.current = true;
    setIsLoadingMore(true);
    setFetchError(null);

    const nextPage = page + 1;
    const queryParams = new URLSearchParams({
      page: nextPage.toString(),
      limit: limit.toString(),
    });

    try {
      const res = await fetch(`/api/catalogs?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch next catalogs');

      const data = await res.json();
      const newItems: FeedCatalog[] = data.catalogs || [];

      setCatalogs((prev) => {
        const existingIds = new Set(prev.map((c) => c.id));
        const filtered = newItems.filter((c) => !existingIds.has(c.id));
        return [...prev, ...filtered];
      });

      setPage(nextPage);
      setHasMore(data.hasMore === true);
    } catch (err: any) {
      console.error('Error loading more catalogs:', err);
      setFetchError(err.message || 'Error loading more catalogs');
    } finally {
      setIsLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [page, hasMore, limit]);

  // Set up IntersectionObserver on sentinel
  useEffect(() => {
    if (!hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && !isFetchingRef.current) {
          loadMoreCatalogs();
        }
      },
      {
        rootMargin: '350px',
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
  }, [hasMore, loadMoreCatalogs]);

  const formatCardDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(isArabic ? 'ar-DZ' : 'fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div>
      {monthGroups.map((group, groupIdx) => (
        <div key={group.monthKey} style={{ marginBottom: '3rem' }}>
          {/* Sticky / Modern Month Header Divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
              marginBottom: '1.25rem',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'var(--primary-light)',
                color: 'var(--primary-hover)',
                padding: '0.4rem 1.1rem',
                borderRadius: 'var(--radius-full)',
                fontWeight: 800,
                fontSize: '0.95rem',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid rgba(79, 70, 229, 0.15)',
              }}
            >
              <span>📅</span>
              <span>{group.monthLabel}</span>
              <span
                style={{
                  background: 'var(--primary)',
                  color: 'white',
                  borderRadius: '999px',
                  padding: '1px 7px',
                  fontSize: '0.72rem',
                  fontWeight: 900,
                }}
              >
                {group.catalogs.length}
              </span>
            </div>
            <div
              style={{
                flex: 1,
                height: '1px',
                background: 'linear-gradient(90deg, var(--border-color) 0%, transparent 100%)',
              }}
            />
          </div>

          {/* Grid of Catalogs for this Month */}
          <div className="catalog-card-grid">
            {group.catalogs.map((catalog, cIdx) => (
              <Link
                key={catalog.id}
                href={`/${lang}/${catalog.slug}`}
                style={{ display: 'block', height: '100%', textDecoration: 'none' }}
                className="fade-in-up"
              >
                <div
                  className="glass-card hover-lift"
                  style={{
                    height: 'clamp(280px, 45vw, 380px)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    position: 'relative',
                    border: '1px solid rgba(255, 255, 255, 0.8)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  {/* Thumbnail Image */}
                  <div
                    style={{
                      flex: 1,
                      position: 'relative',
                      overflow: 'hidden',
                      background: 'var(--bg-color)',
                    }}
                  >
                    {catalog.thumbnail ? (
                      <SmartImage
                        src={catalog.thumbnail}
                        alt={catalog.name}
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
                          fontSize: '2.5rem',
                          color: 'var(--text-muted)',
                        }}
                      >
                        📁
                      </div>
                    )}
                  </div>

                  {/* Card Content Footer */}
                  <div
                    style={{
                      padding: '1.25rem 1.5rem',
                      background: 'var(--surface)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTop: '1px solid var(--border-color)',
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          fontSize: '1.2rem',
                          fontWeight: 800,
                          margin: '0 0 0.3rem 0',
                          color: 'var(--text-main)',
                        }}
                      >
                        {catalog.name}
                      </h3>
                      <div
                        style={{
                          display: 'flex',
                          gap: '0.6rem',
                          alignItems: 'center',
                          color: 'var(--text-muted)',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          flexWrap: 'wrap',
                        }}
                      >
                        <span>
                          {catalog.productCount} {dict?.home?.products || 'produits'}
                        </span>
                        <span>•</span>
                        <span>{formatCardDate(catalog.createdAt)}</span>
                      </div>
                    </div>

                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'var(--primary-light)',
                        color: 'var(--primary-hover)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.25rem',
                        transform: isArabic ? 'rotate(180deg)' : 'none',
                        flexShrink: 0,
                      }}
                    >
                      →
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {/* Shimmer Skeleton Placeholder Effect While Fetching Next Batch */}
      {isLoadingMore && (
        <div className="catalog-card-grid" style={{ marginBottom: '2rem' }}>
          {Array.from({ length: 2 }).map((_, idx) => (
            <div
              key={`catalog-skeleton-${idx}`}
              className="glass-card fade-in"
              style={{
                height: 'clamp(280px, 45vw, 380px)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <div style={{ flex: 1 }} className="skeleton-bg" />
              <div
                style={{
                  padding: '1.25rem 1.5rem',
                  background: 'var(--surface)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid var(--border-color)',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '60%' }}>
                  <div className="skeleton-bg" style={{ height: '20px', width: '80%', borderRadius: '4px' }} />
                  <div className="skeleton-bg" style={{ height: '14px', width: '50%', borderRadius: '4px' }} />
                </div>
                <div className="skeleton-bg" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invisible Sentinel to Trigger Next Page */}
      <div ref={sentinelRef} style={{ height: '20px', margin: '1rem 0' }} />

      {/* Loading Indicator */}
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
          <span>{pg.loadingMore || 'Chargement des collections suivantes...'}</span>
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
            onClick={loadMoreCatalogs}
            className="btn btn-outline"
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
          >
            {pg.retry || 'Réessayer'}
          </button>
        </div>
      )}

      {/* End of Collections Indicator */}
      {!hasMore && catalogs.length > 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '2rem 0 1rem 0',
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'var(--surface)',
              padding: '0.4rem 1.1rem',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {isArabic
              ? '✓ لقد اطلعت على جميع التشكيلات والكتالوجات'
              : '✓ Vous avez vu toutes les collections et catalogues'}
          </span>
        </div>
      )}

      {/* Empty State */}
      {catalogs.length === 0 && !isLoadingMore && (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>
            {dict?.home?.noCollections || 'Aucune collection disponible pour le moment.'}
          </p>
        </div>
      )}
    </div>
  );
}
