import AdminEditProductClient from './AdminEditProductClient';
import { getDictionary, Locale } from '@/lib/dictionaries';
import Link from 'next/link';

export default async function AdminEditProductPage({ params }: { params: Promise<{ lang: string, id: string }> }) {
  const { lang, id } = await params;
  const dict = await getDictionary(lang as Locale);

  return (
    <div style={{ padding: '2rem 0' }}>
      <div style={{ marginBottom: '1rem' }}>
        <Link href={`/${lang}/admin/products`} style={{ color: 'var(--secondary)' }}>&larr; Back to Products</Link>
      </div>
      <AdminEditProductClient dict={dict} productId={id} />
    </div>
  );
}
