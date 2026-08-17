import AdminProductsClient from './AdminProductsClient';
import { getDictionary, Locale } from '@/lib/dictionaries';

export default async function AdminProductsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  return (
    <div style={{ padding: '2rem 0' }}>
      <AdminProductsClient dict={dict} />
    </div>
  );
}
