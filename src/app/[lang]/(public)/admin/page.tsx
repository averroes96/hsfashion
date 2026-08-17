import AdminDashboardClient from './AdminDashboardClient';
import { getDictionary, Locale } from '@/lib/dictionaries';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default async function AdminPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <LanguageSwitcher currentLang={lang} />
      </div>
      <AdminDashboardClient dict={dict} />
    </div>
  );
}
