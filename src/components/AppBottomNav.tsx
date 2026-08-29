'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { track } from '@vercel/analytics';
import SkuSearchModal from './SkuSearchModal';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';

interface AppBottomNavProps {
  lang: string;
  dict: any;
  phoneNumber?: string | null;
}

export default function AppBottomNav({ lang, dict, phoneNumber }: AppBottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const { openCart, totalCartons, totalItems } = useCart();
  const { totalFavoritesCount, setIsFavoritesOpen } = useFavorites();

  // Hide bottom nav on admin routes
  if (pathname?.includes('/admin')) {
    return null;
  }

  const isHome = pathname === `/${lang}` || pathname === `/${lang}/`;
  const isArabic = lang === 'ar';

  const handleOpenSearch = () => {
    setIsSearchModalOpen(true);
    try {
      track('sku_search_opened', { source: 'bottom_nav_fab', lang });
    } catch {}
  };

  const whatsappHref = phoneNumber
    ? `https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
        isArabic ? 'مرحبا، أود الاستفسار عن أسعار الجملة للتشكيلات الحالية.' : 'Bonjour, je souhaite me renseigner sur les prix de gros de vos collections.'
      )}`
    : '#';

  return (
    <>
      <nav className="app-bottom-nav" aria-label="Mobile Navigation">
        {/* Tab 1: Home / Collections */}
        <Link
          href={`/${lang}`}
          className="app-tap-target"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            color: isHome ? 'var(--primary)' : 'var(--text-muted)',
            fontSize: '0.72rem',
            fontWeight: isHome ? 700 : 500,
            textDecoration: 'none',
            minWidth: '50px',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.4rem' }}>
            grid_view
          </span>
          <span>{isArabic ? 'الرئيسية' : 'Catalogue'}</span>
        </Link>

        {/* Tab 2: Search (SKU Reference Lookup) */}
        <button
          type="button"
          onClick={handleOpenSearch}
          className="app-tap-target"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            background: 'transparent',
            border: 'none',
            color: isSearchModalOpen ? 'var(--primary)' : 'var(--text-muted)',
            fontSize: '0.72rem',
            fontWeight: 600,
            cursor: 'pointer',
            padding: 0,
            minWidth: '50px',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.4rem', color: 'var(--primary)' }}>
            search
          </span>
          <span>{isArabic ? 'بحث' : 'Recherche'}</span>
        </button>

        {/* Center Tab: Cart & Order Drawer (Prominent Action) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '-12px' }}>
          <button
            type="button"
            onClick={openCart}
            className="ai-camera-fab app-tap-target"
            aria-label="Panier de commande"
            title="Panier de commande"
            style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.45)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: 'white' }}>
              shopping_bag
            </span>
            {totalItems > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-2px',
                  right: isArabic ? 'auto' : '-4px',
                  left: isArabic ? '-4px' : 'auto',
                  background: '#ef4444',
                  color: 'white',
                  borderRadius: '999px',
                  fontSize: '0.68rem',
                  fontWeight: 900,
                  padding: '1px 5px',
                  minWidth: '18px',
                  textAlign: 'center',
                  lineHeight: 1.2,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                  border: '2px solid white',
                }}
              >
                {totalCartons}
              </span>
            )}
          </button>
          <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--primary)', marginTop: '3px' }}>
            {isArabic ? 'الطلبية' : 'Commande'}
          </span>
        </div>

        {/* Tab 4: Favoris / Wishlist */}
        <button
          type="button"
          onClick={() => setIsFavoritesOpen(true)}
          className="app-tap-target"
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            background: 'transparent',
            border: 'none',
            color: totalFavoritesCount > 0 ? '#e11d48' : 'var(--text-muted)',
            fontSize: '0.72rem',
            fontWeight: 600,
            cursor: 'pointer',
            padding: 0,
            minWidth: '50px',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: '1.4rem',
              fontVariationSettings: totalFavoritesCount > 0 ? "'FILL' 1, 'wght' 700" : "'FILL' 0, 'wght' 500",
            }}
          >
            favorite
          </span>
          {totalFavoritesCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-2px',
                right: isArabic ? 'auto' : '10px',
                left: isArabic ? '10px' : 'auto',
                background: '#e11d48',
                color: 'white',
                borderRadius: '999px',
                padding: '0 4px',
                fontSize: '0.65rem',
                fontWeight: 900,
                lineHeight: 1.2,
              }}
            >
              {totalFavoritesCount}
            </span>
          )}
          <span>{isArabic ? 'المفضلة' : 'Favoris'}</span>
        </button>

        {/* Tab 5: WhatsApp Wholesale Hotline */}
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="app-tap-target"
          onClick={() => {
            try {
              track('whatsapp_inquiry', { source: 'bottom_nav' });
            } catch {}
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            color: '#10b981',
            fontSize: '0.72rem',
            fontWeight: 600,
            textDecoration: 'none',
            minWidth: '50px',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.4rem' }}>
            chat
          </span>
          <span>{isArabic ? 'واتساب' : 'WhatsApp'}</span>
        </a>
      </nav>

      {/* SKU Reference Search Modal */}
      <SkuSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        dict={dict}
        lang={lang}
      />
    </>
  );
}
