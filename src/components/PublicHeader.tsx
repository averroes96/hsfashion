import Link from 'next/link';
import LanguageSwitcher from './LanguageSwitcher';
import SearchBar from './SearchBar';

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
        <Link href={`/${lang}`} className="logo">
          <span style={{ color: 'var(--primary)', fontSize: '2rem' }}>•</span>
          <span>HS Fashion</span>
        </Link>

        {/* Search & Language Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <SearchBar dict={dict} lang={lang} />
          <LanguageSwitcher currentLang={lang} />
        </div>
      </div>
    </header>
  );
}
