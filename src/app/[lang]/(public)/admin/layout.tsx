import './admin.css';
import Link from 'next/link';
import { getDictionary, Locale } from '@/lib/dictionaries';

export default async function AdminLayout({ children, params }: { children: React.ReactNode, params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: 'var(--spacing-lg)', padding: '0 0.5rem' }}>
          <img src="/favicon.png" alt="HS Fashion" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
          <h2 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-main)', fontWeight: 800 }}>
            HS Fashion Admin
          </h2>
        </div>

        <nav>
          <Link href={`/${lang}/admin`}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>
              dashboard
            </span>
            <span>{dict.admin.dashboard}</span>
          </Link>

          <Link href={`/${lang}/admin/analytics`}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', color: '#6366f1' }}>
              insights
            </span>
            <span>{lang === 'ar' ? 'الإحصائيات والتحليلات' : 'Statistiques & Insights'}</span>
          </Link>

          <Link href={`/${lang}/admin/orders`}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', color: '#16a34a' }}>
              shopping_bag
            </span>
            <span>{dict?.orders?.title || (lang === 'ar' ? 'إدارة الطلبيات' : 'Commandes')}</span>
          </Link>

          <Link href={`/${lang}/admin/products`}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', color: '#0284c7' }}>
              inventory_2
            </span>
            <span>{dict.admin.productsList}</span>
          </Link>

          <Link href={`/${lang}/admin/catalogs`}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', color: '#8b5cf6' }}>
              auto_stories
            </span>
            <span>{dict.admin.catalogsList}</span>
          </Link>

          <Link href={`/${lang}/admin/families`}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', color: '#f59e0b' }}>
              category
            </span>
            <span>{dict.admin.familiesList}</span>
          </Link>

          <div style={{ margin: '0.75rem 0', height: '1px', background: 'var(--border-color)' }} />

          <Link href={`/${lang}`} target="_blank">
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>
              open_in_new
            </span>
            <span>{dict.admin.viewLiveSite}</span>
          </Link>
        </nav>
      </aside>
      <main className="admin-content">
        {children}
      </main>
    </div>
  );
}
