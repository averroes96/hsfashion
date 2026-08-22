'use client';
import { usePathname, useRouter } from 'next/navigation';
import { track } from '@vercel/analytics';

export default function LanguageSwitcher({ currentLang }: { currentLang: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const switchLanguage = (lang: string) => {
    if (lang === currentLang) return;
    try {
      track('language_switched', { from: currentLang, to: lang });
    } catch {}
    // Replace the current locale in the pathname with the new locale
    const newPath = pathname.replace(`/${currentLang}`, `/${lang}`);
    router.push(newPath);
  };

  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      <button 
        onClick={() => switchLanguage('ar')}
        style={{
          background: 'none', 
          border: 'none', 
          cursor: 'pointer',
          fontWeight: currentLang === 'ar' ? 'bold' : 'normal',
          opacity: currentLang === 'ar' ? 1 : 0.6,
          fontFamily: 'var(--primary-font)'
        }}
      >
        AR
      </button>
      <span style={{ opacity: 0.3 }}>|</span>
      <button 
        onClick={() => switchLanguage('fr')}
        style={{
          background: 'none', 
          border: 'none', 
          cursor: 'pointer',
          fontWeight: currentLang === 'fr' ? 'bold' : 'normal',
          opacity: currentLang === 'fr' ? 1 : 0.6,
          fontFamily: 'var(--primary-font)'
        }}
      >
        FR
      </button>
    </div>
  );
}
