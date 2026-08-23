import './admin.css';
import Link from 'next/link';
import { getDictionary, Locale } from '@/lib/dictionaries';

export default async function AdminLayout({ children, params }: { children: React.ReactNode, params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2>HS Fashion Admin</h2>
        <nav>
          <Link href={`/${lang}/admin`}>{dict.admin.dashboard}</Link>
          <Link href={`/${lang}/admin/orders`}>📦 {dict?.orders?.title || 'Commandes'}</Link>
          <Link href={`/${lang}/admin/products`}>{dict.admin.productsList}</Link>
          <Link href={`/${lang}/admin/catalogs`}>{dict.admin.catalogsList}</Link>
          <Link href={`/${lang}/admin/families`}>{dict.admin.familiesList}</Link>
          <Link href={`/${lang}`} target="_blank">{dict.admin.viewLiveSite}</Link>
        </nav>
      </aside>
      <main className="admin-content">
        {children}
      </main>
    </div>
  );
}
