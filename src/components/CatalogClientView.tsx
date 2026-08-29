'use client';
import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import SmartImage from './SmartImage';
import CategoryPillSlider from './CategoryPillSlider';
import BulkDownloadModal from './BulkDownloadModal';
import FavoriteButton from './FavoriteButton';
import PdfLookbookModal, { PdfProgressState } from './PdfLookbookModal';
import { downloadImagesSmartly, ImageToDownload, DownloadProgress } from '@/lib/zipDownloader';
import { generatePdfLookbook } from '@/lib/pdfLookbookGenerator';
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
  familyId: string;
  family: {
    id: string;
    name: string;
    arabicName?: string | null;
    slug: string;
    sortOrder: number;
  };
  images: ProductImage[];
}

interface FamilyGroup {
  family: {
    id: string;
    name: string;
    arabicName?: string | null;
    slug: string;
    sortOrder: number;
  };
  products: Product[];
}

interface CatalogClientViewProps {
  catalog: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
  };
  sortedFamilies: FamilyGroup[];
  lang: string;
  dict: any;
}

export default function CatalogClientView({
  catalog,
  sortedFamilies,
  lang,
  dict,
}: CatalogClientViewProps) {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [pdfProgress, setPdfProgress] = useState<PdfProgressState>({
    isOpen: false,
    isGenerating: false,
    isComplete: false,
    current: 0,
    total: 0,
    stepName: '',
    percentage: 0,
  });

  const isArabic = lang === 'ar';

  // All products across all families in this catalog
  const allProducts = useMemo(() => {
    return sortedFamilies.flatMap((g) => g.products);
  }, [sortedFamilies]);

  // Total images in entire catalog
  const totalCatalogImagesCount = useMemo(() => {
    return allProducts.reduce((acc, p) => acc + (p.images?.length || 0), 0);
  }, [allProducts]);

  // Selected products & images count
  const selectedProducts = useMemo(() => {
    return allProducts.filter((p) => selectedProductIds.has(p.id));
  }, [allProducts, selectedProductIds]);

  const selectedImagesCount = useMemo(() => {
    return selectedProducts.reduce((acc, p) => acc + (p.images?.length || 0), 0);
  }, [selectedProducts]);

  // Toggle single product selection
  const handleToggleProduct = (productId: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  // Select all / Deselect all
  const handleSelectAll = () => {
    if (selectedProductIds.size === allProducts.length) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(allProducts.map((p) => p.id)));
    }
  };

  // Helper to trigger ZIP download
  const startZipDownload = useCallback(
    async (productsToDownload: Product[], zipName: string) => {
      const images: ImageToDownload[] = [];

      for (const p of productsToDownload) {
        const familyName = isArabic && p.family.arabicName ? p.family.arabicName : p.family.name;
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
          catalog: catalog.slug,
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
    [catalog.slug, isArabic, lang]
  );

  // Download entire catalog
  const handleDownloadAll = () => {
    startZipDownload(
      allProducts,
      `Catalogue_${catalog.name.replace(/\s+/g, '_')}_Photos`
    );
  };

  // Download specific family
  const handleDownloadFamily = (group: FamilyGroup) => {
    const familyName = isArabic && group.family.arabicName ? group.family.arabicName : group.family.name;
    startZipDownload(
      group.products,
      `${catalog.name}_${familyName}_Photos`
    );
  };

  // Download selected products
  const handleDownloadSelected = () => {
    if (selectedProducts.length === 0) return;
    startZipDownload(
      selectedProducts,
      `${catalog.name}_Selection_${selectedProducts.length}_modeles`
    );
  };

  // Generate Lookbook PDF
  const handleDownloadPdf = async (productsToExport: Product[], customTitle?: string) => {
    if (productsToExport.length === 0) return;

    setPdfProgress({
      isOpen: true,
      isGenerating: true,
      isComplete: false,
      current: 0,
      total: productsToExport.length,
      stepName: 'Initialisation du Lookbook...',
      percentage: 5,
    });

    try {
      track('lookbook_pdf_download', {
        catalog: catalog.name,
        modelCount: productsToExport.length,
      });

      const lookbookItems = productsToExport.map((p) => {
        const familyName = isArabic && p.family?.arabicName ? p.family.arabicName : (p.family?.name || '');
        const primaryImage = p.images?.find((img) => img.isPrimary) || p.images?.[0];
        return {
          id: p.id,
          reference: p.reference,
          familyName,
          details: p.details,
          description: (p as any).description,
          imageUrl: primaryImage?.mediumUrl || primaryImage?.thumbnailUrl || null,
          sizeAssortment: (p as any).sizeAssortment || null,
        };
      });

      await generatePdfLookbook({
        title: customTitle || catalog.name,
        subtitle: catalog.description || undefined,
        products: lookbookItems,
        lang,
        dict,
        onProgress: (prog) => {
          setPdfProgress((prev) => ({
            ...prev,
            ...prog,
          }));
        },
      });

      setPdfProgress((prev) => ({
        ...prev,
        isGenerating: false,
        isComplete: true,
        percentage: 100,
      }));
    } catch (err: any) {
      console.error('PDF Generation Error:', err);
      setPdfProgress((prev) => ({
        ...prev,
        isGenerating: false,
        error: err?.message || 'Erreur lors de la création du document PDF.',
      }));
    }
  };

  return (
    <>
      <BulkDownloadModal
        isOpen={isModalOpen}
        progress={downloadProgress}
        onClose={() => setIsModalOpen(false)}
        lang={lang}
      />

      <PdfLookbookModal
        progress={pdfProgress}
        onClose={() => setPdfProgress((prev) => ({ ...prev, isOpen: false }))}
        onRetry={() => handleDownloadPdf(selectedProducts.length > 0 ? selectedProducts : allProducts)}
        dict={dict}
        lang={lang}
      />

      {/* Catalogue Actions Toolbar */}
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
            {allProducts.length} {dict?.home?.products || 'produits'} ({totalCatalogImagesCount} {isArabic ? 'صورة' : 'photos'})
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {/* PDF Lookbook Download Button */}
          <button
            type="button"
            onClick={() => handleDownloadPdf(allProducts)}
            className="btn hover-lift"
            title={isArabic ? 'تنزيل كتالوج PDF عالي الدقة' : 'Télécharger le Lookbook PDF haute résolution'}
            style={{
              padding: '0.45rem 1rem',
              fontSize: '0.85rem',
              fontWeight: 800,
              gap: '0.4rem',
              display: 'inline-flex',
              alignItems: 'center',
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              boxShadow: '0 3px 10px rgba(79, 70, 229, 0.3)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.15rem' }}>
              picture_as_pdf
            </span>
            <span>{dict?.lookbook?.downloadPdf || (isArabic ? 'كتالوج PDF' : 'Catalogue PDF')}</span>
          </button>

          {/* Download Entire Catalog Button */}
          <button
            type="button"
            onClick={handleDownloadAll}
            className="btn btn-outline hover-lift"
            title={isArabic ? 'تنزيل جميع صور الكتالوج' : 'Télécharger toutes les photos du catalogue'}
            style={{
              padding: '0.45rem 1rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              gap: '0.4rem',
              display: 'inline-flex',
              alignItems: 'center',
              borderRadius: 'var(--radius-full)',
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
              borderRadius: 'var(--radius-full)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.15rem' }}>
              {isSelectionMode ? 'check_box' : 'checklist'}
            </span>
            <span>{isSelectionMode ? (isArabic ? 'إلغاء التحديد' : 'Quitter sélection') : (isArabic ? 'تحديد موديلات' : 'Sélectionner')}</span>
          </button>
        </div>
      </div>

      {/* Category Pills Navigation Slider */}
      {sortedFamilies.length > 1 && (
        <CategoryPillSlider
          families={sortedFamilies.map((g) => g.family)}
          catalogSlug={catalog.slug}
          lang={lang}
          allLabel={dict?.catalog?.all || (isArabic ? 'الكل' : 'Tous')}
        />
      )}

      {sortedFamilies.length === 0 && (
        <div className="glass-card fade-in-up" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>{dict?.catalog?.noProducts || 'Aucun produit dans ce catalogue'}</p>
        </div>
      )}

      {/* Families & Product Grids */}
      {sortedFamilies.map((group, index) => {
        const familyName = isArabic && group.family.arabicName ? group.family.arabicName : group.family.name;
        const familyImagesCount = group.products.reduce((acc, p) => acc + (p.images?.length || 0), 0);

        return (
          <section
            id={`family-${group.family.id}`}
            key={group.family.id}
            style={{ marginBottom: '3rem' }}
            className={`fade-in-up delay-${(index % 3) + 1}`}
          >
            {/* Sticky Header with Category Download Action */}
            <div
              style={{
                position: 'sticky',
                top: '60px',
                zIndex: 90,
                background: 'rgba(248, 250, 252, 0.92)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                padding: '0.75rem 1.25rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
                boxShadow: 'var(--shadow-sm)',
                gap: '0.5rem',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: 'clamp(1.1rem, 3vw, 1.4rem)', margin: 0, fontWeight: 800 }}>
                  {familyName}
                </h2>
                <span className="badge" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                  {group.products.length}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {/* 1-Click Family Download */}
                <button
                  type="button"
                  onClick={() => handleDownloadFamily(group)}
                  className="btn btn-outline"
                  title={isArabic ? `تنزيل صور ${familyName} (${familyImagesCount} صورة)` : `Télécharger les photos ${familyName} (${familyImagesCount} photos)`}
                  style={{
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.78rem',
                    minHeight: '34px',
                    fontWeight: 700,
                    gap: '0.35rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    background: 'var(--surface)',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1.05rem', color: 'var(--primary)' }}>
                    download
                  </span>
                  <span>{dict?.catalog?.downloadFamily || (isArabic ? 'تحميل الصور' : 'Télécharger')}</span>
                </button>

                <Link
                  href={`/${lang}/${catalog.slug}/${group.family.slug}`}
                  className="btn btn-outline"
                  style={{
                    padding: '0.35rem 0.85rem',
                    fontSize: '0.8rem',
                    minHeight: '34px',
                    fontWeight: 600,
                  }}
                >
                  {dict?.catalog?.viewAll || 'Voir tout'} →
                </Link>
              </div>
            </div>

            {/* Product Cards Grid */}
            <div className="product-card-grid">
              {group.products.map((product) => {
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
                          familyName: isArabic && product.family.arabicName ? product.family.arabicName : product.family.name,
                          imageUrl: primaryImage?.thumbnailUrl || primaryImage?.mediumUrl,
                        }}
                        size="sm"
                        dict={dict}
                        lang={lang}
                      />
                    )}

                    {/* Image Thumbnail */}
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
                          : (dict?.catalog?.viewDetails || (isArabic ? 'عرض التفاصيل' : 'Voir détails'))}
                      </p>
                    </div>
                  </>
                );

                if (isSelectionMode) {
                  return (
                    <div
                      key={product.id}
                      onClick={() => handleToggleProduct(product.id)}
                      className={`product-card ${isSelected ? 'selected-card' : ''}`}
                      style={{
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
                    target="_blank"
                    rel="noopener noreferrer"
                    className="product-card hover-lift"
                    style={{
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
            </div>
          </section>
        );
      })}

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
              {selectedProductIds.size === allProducts.length
                ? (isArabic ? 'إلغاء الكل' : 'Désélect.')
                : (isArabic ? 'تحديد الكل' : 'Tout sélect.')}
            </button>

            <button
              type="button"
              onClick={() => handleDownloadPdf(selectedProducts, `${catalog.name} - Sélection`)}
              disabled={selectedProducts.length === 0}
              className="btn hover-lift"
              style={{
                padding: '0.4rem 0.85rem',
                fontSize: '0.82rem',
                fontWeight: 800,
                borderRadius: 'var(--radius-full)',
                opacity: selectedProducts.length === 0 ? 0.5 : 1,
                cursor: selectedProducts.length === 0 ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                color: 'white',
                border: 'none',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>
                picture_as_pdf
              </span>
              <span>{isArabic ? 'PDF المحدد' : 'PDF'}</span>
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
    </>
  );
}
