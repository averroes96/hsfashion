import Link from 'next/link';
import LanguageSwitcher from './LanguageSwitcher';
import SearchBar from './SearchBar';
import CartButton from './CartButton';
import FavoritesButton from './FavoritesButton';
import OfflineSyncButton from './OfflineSyncButton';

interface PublicHeaderProps {
  lang: string;
  dict: any;
}

export default function PublicHeader({ lang, dict }: PublicHeaderProps) {
  return (
    <header className="main-header">
      <div
        className="container"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        {/* Logo */}
        <Link
          href={`/${lang}`}
          className="logo"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            textDecoration: 'none',
          }}
        >
          <img
            src="/logo.png"
            alt="H.S.Fashion Logo"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              objectFit: 'cover',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            }}
          />
          <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-main)', letterSpacing: '0.02em' }}>
            H.S.Fashion
          </span>
        </Link>

        {/* Search, Favorites, Cart, Offline Sync & Language Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <SearchBar dict={dict} lang={lang} />
          <OfflineSyncButton lang={lang} dict={dict} />
          <FavoritesButton lang={lang} dict={dict} />
          <CartButton lang={lang} dict={dict} />
          <LanguageSwitcher currentLang={lang} />
        </div>
      </div>
    </header>
  );
}
