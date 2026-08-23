import AdminBulkUploadClient from './AdminBulkUploadClient';
import { getDictionary, Locale } from '@/lib/dictionaries';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import Link from 'next/link';

export default async function AdminBulkUploadPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        <Link href={`/${lang}/admin/products`} style={{ color: 'var(--secondary)' }}>
          &larr; {dict?.admin?.productsList || 'Back to Products'}
        </Link>
        <LanguageSwitcher currentLang={lang} />
      </div>
      <AdminBulkUploadClient dict={dict} />
    </div>
  );
}
