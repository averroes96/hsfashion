import { getDictionary, Locale } from '@/lib/dictionaries';
import AdminOrdersClient from './AdminOrdersClient';

export default async function AdminOrdersPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  return <AdminOrdersClient dict={dict} lang={lang} />;
}
