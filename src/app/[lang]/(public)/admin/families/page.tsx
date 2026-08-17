import AdminFamiliesClient from './AdminFamiliesClient';
import { getDictionary, Locale } from '@/lib/dictionaries';

export default async function AdminFamiliesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  return (
    <div style={{ padding: '2rem 0' }}>
      <AdminFamiliesClient dict={dict} />
    </div>
  );
}
