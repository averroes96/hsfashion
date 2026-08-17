import AdminNewProductClient from './AdminNewProductClient';
import { getDictionary, Locale } from '@/lib/dictionaries';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import Link from 'next/link';

export default async function AdminNewProductPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <Link href={`/${lang}/admin`} style={{ color: 'var(--secondary)' }}>&larr; Back</Link>
        <LanguageSwitcher currentLang={lang} />
      </div>
      <AdminNewProductClient dict={dict} />
    </div>
  );
}
