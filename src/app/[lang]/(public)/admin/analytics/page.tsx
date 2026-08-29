import AdminAnalyticsClient from './AdminAnalyticsClient';
import { getDictionary, Locale } from '@/lib/dictionaries';

export default async function AdminAnalyticsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <AdminAnalyticsClient dict={dict} lang={lang} />
    </div>
  );
}
