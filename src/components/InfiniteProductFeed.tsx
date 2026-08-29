'use client';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import SmartImage from './SmartImage';
import BulkDownloadModal from './BulkDownloadModal';
import FavoriteButton from './FavoriteButton';
import { downloadImagesSmartly, ImageToDownload, DownloadProgress } from '@/lib/zipDownloader';
import { track } from '@vercel/analytics';

interface ProductImage {
  id: string;
  thumbnailUrl: string;
  mediumUrl: string;
  fullUrl?: string;
  isPrimary?: boolean;
}

interface Product {
  id: string;
  reference: string;
  details?: string | null;
  family?: {
    id: string;
    name: string;
    arabicName?: string | null;
    slug: string;
  };
  images: ProductImage[];
}

interface InfiniteProductFeedProps {
  initialProducts: Product[];
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
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialProducts.length < totalProducts);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Selection & Bulk Download State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isFetchingRef = useRef(false);

  const isArabic = lang === 'ar';
  const pg = dict?.pagination || {};

  // Sync if initialProducts changes
  useEffect(() => {
    setProducts(initialProducts);
    setPage(1);
    setHasMore(initialProducts.length < totalProducts);
    setIsLoadingMore(false);
    setFetchError(null);
    setSelectedProductIds(new Set());
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
      const newItems: Product[] = data.products || [];

      setProducts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const filteredNew = newItems.filter((p) => !existingIds.has(p.id));
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
        rootMargin: '300px',
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

  // Total loaded photos
  const totalLoadedImagesCount = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.images?.length || 0), 0);
  }, [products]);

  // Selected products & images
  const selectedProducts = useMemo(() => {
    return products.filter((p) => selectedProductIds.has(p.id));
  }, [products, selectedProductIds]);

  const selectedImagesCount = useMemo(() => {
    return selectedProducts.reduce((acc, p) => acc + (p.images?.length || 0), 0);
  }, [selectedProducts]);

  const handleToggleProduct = (productId: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedProductIds.size === products.length) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(products.map((p) => p.id)));
    }
  };

  const startZipDownload = useCallback(
    async (productsToDownload: Product[], zipName: string) => {
      const images: ImageToDownload[] = [];

      for (const p of productsToDownload) {
        const familyName = isArabic && p.family?.arabicName ? p.family.arabicName : p.family?.name;
        if (p.images && p.images.length > 0) {
          p.images.forEach((img, idx) => {
            const url = img.fullUrl || img.mediumUrl || img.thumbnailUrl;
            if (url) {
              images.push({
                url,
                reference: p.reference,
                family: familyName,
                index: idx + 1,
              });
            }
          });
        }
      }

      if (images.length === 0) {
        alert(isArabic ? 'لا توجد صور متاحة للتنزيل.' : 'Aucune image disponible à télécharger.');
        return;
      }

      setIsModalOpen(true);
      setDownloadProgress({
        current: 0,
        total: images.length,
        percentage: 0,
        status: 'fetching',
      });

      try {
        track('bulk_download_started', {
          catalog: catalogSlug,
          family: familySlug,
          productsCount: productsToDownload.length,
          imagesCount: images.length,
          lang,
        });

        await downloadImagesSmartly({
          images,
          title: zipName,
          onProgress: (progress) => {
            setDownloadProgress(progress);
          },
        });
      } catch (err: any) {
        console.error('Error creating ZIP:', err);
        setDownloadProgress({
          current: 0,
          total: images.length,
          percentage: 0,
          status: 'error',
          error: err.message,
        });
      }
    },
    [catalogSlug, familySlug, isArabic, lang]
  );

  const handleDownloadAll = () => {
    startZipDownload(
      products,
      `${catalogSlug}_${familySlug || 'collection'}_Photos`
    );
  };

  const handleDownloadSelected = () => {
    if (selectedProducts.length === 0) return;
    startZipDownload(
      selectedProducts,
      `${catalogSlug}_Selection_${selectedProducts.length}_modeles`
    );
  };

  return (
    <div>
      <BulkDownloadModal
        isOpen={isModalOpen}
        progress={downloadProgress}
        onClose={() => setIsModalOpen(false)}
        lang={lang}
      />

      {/* Action Toolbar */}
      <div
        className="glass-card fade-in"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          padding: '0.85rem 1.25rem',
          marginBottom: '1.5rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          background: 'var(--surface)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-muted)', fontSize: '0.88rem', fontWeight: 600 }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '1.35rem' }}>
            photo_library
          </span>
          <span>
            {totalProducts} {dict?.home?.products || 'produits'} ({totalLoadedImagesCount} {isArabic ? 'صورة' : 'photos'})
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {/* Download All Button */}
          <button
            type="button"
            onClick={handleDownloadAll}
            className="btn btn-outline hover-lift"
            title={isArabic ? 'تنزيل جميع صور هذه الفئة دفعة واحدة' : 'Télécharger toutes les photos de cette catégorie'}
            style={{
              padding: '0.45rem 1rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              gap: '0.4rem',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.15rem', color: 'var(--primary)' }}>
              cloud_download
            </span>
            <span>{dict?.catalog?.downloadAll || (isArabic ? 'تحميل كل الصور' : 'Télécharger les photos')}</span>
          </button>

          {/* Toggle Selection Mode Button */}
          <button
            type="button"
            onClick={() => {
              setIsSelectionMode((prev) => !prev);
              if (isSelectionMode) setSelectedProductIds(new Set());
            }}
            className={`btn ${isSelectionMode ? 'btn-primary' : 'btn-outline'} hover-lift`}
            style={{
              padding: '0.45rem 1rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              gap: '0.4rem',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.15rem' }}>
              {isSelectionMode ? 'check_box' : 'checklist'}
            </span>
            <span>{isSelectionMode ? (isArabic ? 'إلغاء التحديد' : 'Quitter sélection') : (isArabic ? 'تحديد موديلات' : 'Sélectionner')}</span>
          </button>
        </div>
      </div>

      {/* Product Grid */}
      <div className="product-card-grid">
        {products.map((product, index) => {
          const primaryImage = product.images?.[0];
          const isSelected = selectedProductIds.has(product.id);
          const productHref = `/${lang}/product/${encodeURIComponent(product.reference)}`;

          const cardContent = (
            <>
              {/* Selection Checkbox Overlay */}
              {isSelectionMode && (
                <div
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: isArabic ? 'auto' : '10px',
                    left: isArabic ? '10px' : 'auto',
                    zIndex: 10,
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: isSelected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.9)',
                    border: isSelected ? '2px solid white' : '2px solid #cbd5e1',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isSelected && (
                    <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', fontWeight: 900 }}>
                      check
                    </span>
                  )}
                </div>
              )}

              {/* Favorite Heart Button (Only when not in selection mode) */}
              {!isSelectionMode && (
                <FavoriteButton
                  product={{
                    id: product.id,
                    reference: product.reference,
                    familyName: isArabic && product.family?.arabicName ? product.family.arabicName : (product.family?.name || ''),
                    imageUrl: primaryImage?.thumbnailUrl || primaryImage?.mediumUrl,
                  }}
                  size="sm"
                />
              )}

              {/* Media Thumbnail */}
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

                {/* Photo Count Badge */}
                {product.images && product.images.length > 1 && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      right: isArabic ? 'auto' : '8px',
                      left: isArabic ? '8px' : 'auto',
                      background: 'rgba(15, 23, 42, 0.75)',
                      color: 'white',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-sm)',
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    📷 {product.images.length}
                  </span>
                )}
              </div>

              {/* Body */}
              <div className="product-card-body">
                <h3 className="product-card-title">{product.reference}</h3>
                <p
                  className="product-card-subtitle hover-underline"
                  style={{
                    color: isSelectionMode && isSelected ? 'var(--primary)' : 'var(--text-muted)',
                    fontWeight: isSelectionMode && isSelected ? 700 : 500,
                  }}
                >
                  {isSelectionMode
                    ? isSelected
                      ? (isArabic ? '✓ تم التحديد' : '✓ Sélectionné')
                      : (isArabic ? 'انقر للتحديد' : 'Cliquer pour sélectionner')
                    : (dict?.product?.viewDetails || dict?.catalog?.viewDetails || (isArabic ? 'عرض التفاصيل' : 'Voir détails'))}
                </p>
              </div>
            </>
          );

          if (isSelectionMode) {
            return (
              <div
                key={product.id}
                onClick={() => handleToggleProduct(product.id)}
                className={`product-card fade-in-up ${isSelected ? 'selected-card' : ''}`}
                style={{
                  animationDelay: `${(index % 4) * 0.05}s`,
                  position: 'relative',
                  cursor: 'pointer',
                  border: isSelected ? '2px solid var(--primary)' : undefined,
                  transform: isSelected ? 'translateY(-2px)' : undefined,
                  boxShadow: isSelected ? '0 10px 25px -5px rgba(79, 70, 229, 0.25)' : undefined,
                  transition: 'all 0.2s ease',
                  userSelect: 'none',
                }}
              >
                {cardContent}
              </div>
            );
          }

          return (
            <Link
              key={product.id}
              href={productHref}
              className="product-card fade-in-up hover-lift"
              style={{
                animationDelay: `${(index % 4) * 0.05}s`,
                position: 'relative',
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
              }}
            >
              {cardContent}
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

      {/* Floating Bottom Selection Tray (Appears during Selection Mode) */}
      {isSelectionMode && (
        <div className="floating-selection-bar fade-in-up">
          {/* Status & Counter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span
              style={{
                background: 'var(--primary)',
                color: 'white',
                borderRadius: '999px',
                padding: '2px 8px',
                fontSize: '0.8rem',
                fontWeight: 900,
              }}
            >
              {selectedProducts.length}
            </span>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {isArabic
                ? `${selectedProducts.length} محدد (${selectedImagesCount} صورة)`
                : `${selectedProducts.length} sélect. (${selectedImagesCount} photos)`}
            </span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              type="button"
              onClick={handleSelectAll}
              className="btn btn-outline"
              style={{
                padding: '0.35rem 0.65rem',
                fontSize: '0.78rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-full)',
              }}
            >
              {selectedProductIds.size === products.length
                ? (isArabic ? 'إلغاء الكل' : 'Désélect.')
                : (isArabic ? 'تحديد الكل' : 'Tout sélect.')}
            </button>

            <button
              type="button"
              onClick={handleDownloadSelected}
              disabled={selectedProducts.length === 0}
              className="btn btn-primary hover-lift"
              style={{
                padding: '0.4rem 0.95rem',
                fontSize: '0.82rem',
                fontWeight: 800,
                borderRadius: 'var(--radius-full)',
                opacity: selectedProducts.length === 0 ? 0.5 : 1,
                cursor: selectedProducts.length === 0 ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>
                download
              </span>
              <span>{dict?.catalog?.downloadSelection || (isArabic ? 'تحميل' : 'Télécharger')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsSelectionMode(false);
                setSelectedProductIds(new Set());
              }}
              style={{
                background: 'rgba(100, 116, 139, 0.15)',
                border: 'none',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                fontSize: '0.9rem',
                flexShrink: 0,
              }}
              title={isArabic ? 'إغلاق وضع التحديد' : 'Fermer le mode sélection'}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
