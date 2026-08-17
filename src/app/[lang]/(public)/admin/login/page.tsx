import AdminLoginClient from './AdminLoginClient';
import { getDictionary, Locale } from '@/lib/dictionaries';

export default async function AdminLoginPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  return <AdminLoginClient dict={dict} />;
}
