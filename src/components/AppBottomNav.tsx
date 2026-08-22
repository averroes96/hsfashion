'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { track } from '@vercel/analytics';
import VisualSearchModal from './VisualSearchModal';

interface AppBottomNavProps {
  lang: string;
  dict: any;
  phoneNumber?: string | null;
}

export default function AppBottomNav({ lang, dict, phoneNumber }: AppBottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

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
        <button
          type="button"
          onClick={handleOpenAi}
          className="ai-camera-fab"
          aria-label="Recherche Photo AI"
          title="Search by Photo AI"
        >
          <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>📷</span>
          <span style={{ fontSize: '0.55rem', fontWeight: 900, letterSpacing: '0.04em' }}>AI</span>
        </button>

        {/* Tab 4: Language Switcher */}
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

        {/* Tab 5: Admin Portal Link */}
        <Link
          href={`/${lang}/admin`}
          className="app-tap-target"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            color: 'var(--text-muted)',
            fontSize: '0.72rem',
            fontWeight: 500,
            textDecoration: 'none',
            minWidth: '54px',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.4rem' }}>
            lock
          </span>
          <span>{isArabic ? 'الإدارة' : 'Admin'}</span>
        </Link>
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
