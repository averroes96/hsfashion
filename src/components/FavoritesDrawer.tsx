'use client';
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import SmartImage from './SmartImage';
import BulkDownloadModal from './BulkDownloadModal';
import PdfLookbookModal, { PdfProgressState } from './PdfLookbookModal';
import { useFavorites } from '@/context/FavoritesContext';
import { useCart } from '@/context/CartContext';
import { downloadImagesSmartly, ImageToDownload, DownloadProgress } from '@/lib/zipDownloader';
import { generatePdfLookbook } from '@/lib/pdfLookbookGenerator';

interface FavoritesDrawerProps {
  lang: string;
  dict?: any;
  phoneNumber?: string | null;
}

export default function FavoritesDrawer({ lang, dict, phoneNumber }: FavoritesDrawerProps) {
  const { favorites, isFavoritesOpen, setIsFavoritesOpen, removeFavorite, clearFavorites } = useFavorites();
  const { addToCart, setIsCartOpen } = useCart();
  const isArabic = lang === 'ar';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress>({
    current: 0,
    total: 0,
    percentage: 0,
    status: 'fetching',
  });

  const [pdfProgress, setPdfProgress] = useState<PdfProgressState>({
    isOpen: false,
    isGenerating: false,
    isComplete: false,
    current: 0,
    total: 0,
    stepName: '',
    percentage: 0,
  });

  const t = dict?.favorites || {};

  // 1-Click PDF Lookbook Generation for Favorites
  const handleDownloadLookbookPdf = async () => {
    if (favorites.length === 0) return;

    setPdfProgress({
      isOpen: true,
      isGenerating: true,
      isComplete: false,
      current: 0,
      total: favorites.length,
      stepName: 'Initialisation du Lookbook...',
      percentage: 5,
    });

    try {
      const lookbookItems = favorites.map((f) => ({
        id: f.id,
        reference: f.reference,
        familyName: f.familyName,
        imageUrl: f.imageUrl || null,
      }));

      await generatePdfLookbook({
        title: isArabic ? 'مفضلاتي' : 'Mes Favoris',
        subtitle: isArabic ? 'تشكيلة الموديلات المفضلة المختارة' : 'Sélection personnalisée de modèles de gros',
        products: lookbookItems,
        lang,
        dict,
        settings: { phoneNumber },
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

  // 1-Click WhatsApp Inquiry
  const handleWhatsAppInquiry = () => {
    if (favorites.length === 0) return;

    const storePhone = (phoneNumber || '212600000000').replace(/\D/g, '');
    const refsList = favorites.map((f, i) => `${i + 1}. *${f.reference}* (${f.familyName})`).join('\n');

    const message = isArabic
      ? `مرحباً، أود الاستفسار عن توفر وطلبيات الجملة للموديلات التالية من المفضلة الخاصة بي:\n\n${refsList}\n\nشكراً لكم.`
      : `Bonjour, je souhaite me renseigner sur la disponibilité et les conditions de gros pour les modèles suivants :\n\n${refsList}\n\nMerci.`;

    const url = `https://wa.me/${storePhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // 1-Click Transfer all favorites to Cart
  const handleAddAllToCart = () => {
    if (favorites.length === 0) return;

    favorites.forEach((item) => {
      addToCart({
        productId: item.id,
        reference: item.reference,
        familyName: item.familyName,
        imageUrl: item.imageUrl,
        cartons: 1,
      });
    });

    setIsFavoritesOpen(false);
    setIsCartOpen(true);
  };

  // 1-Click Download all favorite images
  const handleDownloadPhotos = async () => {
    if (favorites.length === 0) return;

    const imagesToDownload: ImageToDownload[] = [];
    favorites.forEach((item) => {
      if (item.imageUrl) {
        imagesToDownload.push({
          url: item.imageUrl,
          reference: item.reference,
          family: item.familyName,
        });
      }
    });

    if (imagesToDownload.length === 0) {
      alert(isArabic ? 'لا توجد صور متاحة للتنزيل.' : 'Aucune image disponible à télécharger.');
      return;
    }

    setIsModalOpen(true);
    setDownloadProgress({
      current: 0,
      total: imagesToDownload.length,
      percentage: 0,
      status: 'fetching',
    });

    try {
      await downloadImagesSmartly({
        images: imagesToDownload,
        title: `HS_Fashion_Favoris_${Date.now()}`,
        onProgress: (prog) => setDownloadProgress(prog),
      });
    } catch (err: any) {
      console.error('Download error:', err);
      setDownloadProgress({
        current: 0,
        total: imagesToDownload.length,
        percentage: 0,
        status: 'error',
        error: err.message,
      });
    }
  };

  if (!isFavoritesOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setIsFavoritesOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          zIndex: 2000,
          animation: 'fadeIn 0.2s ease-out',
        }}
      />

      {/* Slide-over Drawer Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          right: isArabic ? 'auto' : 0,
          left: isArabic ? 0 : 'auto',
          width: '100%',
          maxWidth: '440px',
          backgroundColor: 'var(--surface)',
          zIndex: 2001,
          boxShadow: isArabic ? '10px 0 30px rgba(0,0,0,0.25)' : '-10px 0 30px rgba(0,0,0,0.25)',
          display: 'flex',
          flexDirection: 'column',
          animation: isArabic ? 'slideInLeft 0.3s ease-out' : 'slideInRight 0.3s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span
              className="material-symbols-outlined"
              style={{
                color: '#e11d48',
                fontSize: '1.65rem',
                fontVariationSettings: "'FILL' 1, 'wght' 700",
              }}
            >
              favorite
            </span>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                {t.title || (isArabic ? 'المفضلة' : 'Mes Favoris')}
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {favorites.length}{' '}
                {isArabic ? 'موديل تم حفظه' : favorites.length > 1 ? 'modèles sauvegardés' : 'modèle sauvegardé'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsFavoritesOpen(false)}
            style={{
              background: 'rgba(100, 116, 139, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              fontSize: '1.1rem',
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
          }}
        >
          {favorites.length === 0 ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '2rem',
                color: 'var(--text-muted)',
              }}
            >
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: '#ffe4e6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: '2.5rem', color: '#f43f5e' }}
                >
                  favorite_border
                </span>
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>
                {t.emptyTitle || (isArabic ? 'لا توجد موديلات في المفضلة' : 'Aucun modèle favori')}
              </h3>
              <p style={{ fontSize: '0.85rem', lineHeight: 1.5, margin: 0, maxWidth: '280px' }}>
                {t.emptyDesc ||
                  (isArabic
                    ? 'انقر على رمز القلب لحفظ الموديلات التي تعجبك والرجوع إليها بسهولة في أي وقت.'
                    : 'Cliquez sur le cœur pour sauvegarder vos modèles préférés et les retrouver facilement ici.')}
              </p>
            </div>
          ) : (
            favorites.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-color)',
                  border: '1px solid var(--border-color)',
                }}
              >
                {/* Thumbnail */}
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    flexShrink: 0,
                    background: 'var(--surface)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  {item.imageUrl ? (
                    <SmartImage
                      src={item.imageUrl}
                      alt={item.reference}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      No Photo
                    </div>
                  )}
                </div>

                {/* Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link
                    href={`/${lang}/product/${encodeURIComponent(item.reference)}`}
                    onClick={() => setIsFavoritesOpen(false)}
                    style={{
                      textDecoration: 'none',
                      color: 'var(--text-main)',
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.reference}
                  </Link>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {item.familyName}
                  </span>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeFavorite(item.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '0.4rem',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title={isArabic ? 'حذف من المفضلة' : 'Retirer des favoris'}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>
                    delete_outline
                  </span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        {favorites.length > 0 && (
          <div
            style={{
              padding: '1.25rem',
              borderTop: '1px solid var(--border-color)',
              background: 'var(--surface)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
            }}
          >
            {/* Download Lookbook PDF Button */}
            <button
              type="button"
              onClick={handleDownloadLookbookPdf}
              className="btn hover-lift"
              style={{
                width: '100%',
                padding: '0.65rem',
                fontSize: '0.9rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                color: 'white',
                border: 'none',
                boxShadow: '0 3px 10px rgba(79, 70, 229, 0.3)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>
                picture_as_pdf
              </span>
              <span>{dict?.lookbook?.downloadSelectionPdf || (isArabic ? 'تصدير المفضلة إلى كتالوج PDF' : 'Exporter la sélection en PDF')}</span>
            </button>

            {/* Download All Photos Button */}
            <button
              type="button"
              onClick={handleDownloadPhotos}
              className="btn btn-outline hover-lift"
              style={{
                width: '100%',
                padding: '0.65rem',
                fontSize: '0.9rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>
                cloud_download
              </span>
              <span>{t.downloadAll || (isArabic ? 'تحميل صور المفضلة' : 'Télécharger les photos')}</span>
            </button>

            {/* WhatsApp Inquiry Button */}
            <button
              type="button"
              onClick={handleWhatsAppInquiry}
              className="btn hover-lift"
              style={{
                width: '100%',
                padding: '0.65rem',
                fontSize: '0.9rem',
                fontWeight: 700,
                background: '#25D366',
                color: 'white',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>
                chat
              </span>
              <span>{t.inquireWhatsapp || (isArabic ? 'استفسار عبر واتساب' : 'Demander sur WhatsApp')}</span>
            </button>

            {/* Add All to Cart */}
            <button
              type="button"
              onClick={handleAddAllToCart}
              className="btn btn-primary hover-lift"
              style={{
                width: '100%',
                padding: '0.65rem',
                fontSize: '0.9rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>
                shopping_cart
              </span>
              <span>{t.addAllToCart || (isArabic ? 'إضافة الكل إلى الطلبية' : 'Tout ajouter à la commande')}</span>
            </button>

            {/* Clear all */}
            <button
              type="button"
              onClick={clearFavorites}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.78rem',
                padding: '0.25rem',
                cursor: 'pointer',
                textAlign: 'center',
                marginTop: '0.25rem',
              }}
            >
              {t.clearAll || (isArabic ? 'إفراغ المفضلة' : 'Vider les favoris')}
            </button>
          </div>
        )}
      </div>

      {/* Lookbook PDF Modal */}
      <PdfLookbookModal
        progress={pdfProgress}
        onClose={() => setPdfProgress((prev) => ({ ...prev, isOpen: false }))}
        onRetry={handleDownloadLookbookPdf}
        dict={dict}
        lang={lang}
      />

      {/* Download Progress Modal */}
      <BulkDownloadModal
        isOpen={isModalOpen}
        progress={downloadProgress}
        onClose={() => setIsModalOpen(false)}
        lang={lang}
      />
    </>
  );
}
