'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { track } from '@vercel/analytics';
import VisualSearchModal from './VisualSearchModal';
import { useCart } from '@/context/CartContext';

interface AppBottomNavProps {
  lang: string;
  dict: any;
  phoneNumber?: string | null;
}

export default function AppBottomNav({ lang, dict, phoneNumber }: AppBottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const { openCart, totalCartons, totalItems } = useCart();

  // Hide bottom nav on admin routes
  if (pathname?.includes('/admin')) {
    return null;
  }

  const isHome = pathname === `/${lang}` || pathname === `/${lang}/`;
  const isArabic = lang === 'ar';

  const handleOpenAi = () => {
    setIsAiModalOpen(true);
    try {
      track('visual_search_modal_opened', { source: 'bottom_nav_fab', lang });
    } catch {}
  };

  const handleSwitchLanguage = () => {
    const targetLang = isArabic ? 'fr' : 'ar';
    try {
      track('language_switched', { from: lang, to: targetLang, source: 'bottom_nav' });
    } catch {}
    const newPath = pathname.replace(`/${lang}`, `/${targetLang}`);
    router.push(newPath);
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
            minWidth: '54px',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.4rem' }}>
            grid_view
          </span>
          <span>{isArabic ? 'الرئيسية' : 'Catalogue'}</span>
        </Link>

        {/* Tab 2: WhatsApp Wholesale Hotline */}
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
            minWidth: '54px',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.4rem' }}>
            chat
          </span>
          <span>{isArabic ? 'واتساب' : 'WhatsApp'}</span>
        </a>

        {/* Center Tab: Floating AI Photo Search Button */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '-12px' }}>
          <button
            type="button"
            onClick={handleOpenAi}
            className="ai-camera-fab app-tap-target"
            aria-label="Recherche Photo AI"
            title="Search by Photo AI"
          >
            <span style={{ fontSize: '1.35rem', lineHeight: 1 }}>📷</span>
            <span style={{ fontSize: '0.55rem', fontWeight: 900, letterSpacing: '0.04em', lineHeight: 1 }}>AI</span>
          </button>
          <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--primary)', marginTop: '3px' }}>
            {isArabic ? 'بحث بالصورة' : 'IA Photo'}
          </span>
        </div>

        {/* Tab 4: Cart & Order Drawer */}
        <button
          type="button"
          onClick={openCart}
          className="app-tap-target"
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            background: 'transparent',
            border: 'none',
            color: totalItems > 0 ? 'var(--primary)' : 'var(--text-muted)',
            fontSize: '0.72rem',
            fontWeight: totalItems > 0 ? 700 : 500,
            cursor: 'pointer',
            padding: 0,
            minWidth: '54px',
          }}
        >
          <div style={{ position: 'relative' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.4rem' }}>
              shopping_bag
            </span>
            {totalItems > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: isArabic ? 'auto' : '-8px',
                  left: isArabic ? '-8px' : 'auto',
                  background: 'var(--primary)',
                  color: 'white',
                  borderRadius: '999px',
                  fontSize: '0.65rem',
                  fontWeight: 900,
                  padding: '1px 4px',
                  minWidth: '16px',
                  textAlign: 'center',
                  lineHeight: 1.2,
                  boxShadow: '0 2px 4px rgba(79, 70, 229, 0.4)',
                }}
              >
                {totalCartons}
              </span>
            )}
          </div>
          <span>{isArabic ? 'الطلبية' : 'Commande'}</span>
        </button>

        {/* Tab 5: Language Switcher */}
        <button
          type="button"
          onClick={handleSwitchLanguage}
          className="app-tap-target"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '0.72rem',
            fontWeight: 600,
            cursor: 'pointer',
            padding: 0,
            minWidth: '54px',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.4rem' }}>
            translate
          </span>
          <span>{isArabic ? 'Français' : 'العربية'}</span>
        </button>
      </nav>

      {/* AI Visual Search Modal Triggered From Center FAB */}
      <VisualSearchModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        dict={dict}
        lang={lang}
      />
    </>
  );
}
