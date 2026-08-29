import prisma from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDictionary, Locale } from '@/lib/dictionaries';
import PublicHeader from '@/components/PublicHeader';
import CatalogClientView from '@/components/CatalogClientView';

export default async function CatalogPage({ params }: { params: Promise<{ catalogSlug: string, lang: string }> }) {
  const { catalogSlug, lang } = await params;
  const dict = await getDictionary(lang as Locale);
  
  const catalog = await prisma.catalog.findUnique({
    where: { slug: catalogSlug },
    include: {
      products: {
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        include: {
          family: true,
          images: {
            orderBy: { sortOrder: 'asc' },
            select: {
              id: true,
              thumbnailUrl: true,
              mediumUrl: true,
              fullUrl: true,
              isPrimary: true,
            },
          },
        },
      },
    },
  });

  if (!catalog) notFound();

  // Group products by family
  const groupedProducts: Record<string, { family: any, products: any[] }> = {};
  for (const p of catalog.products) {
    if (!groupedProducts[p.familyId]) {
      groupedProducts[p.familyId] = { family: p.family, products: [] };
    }
    groupedProducts[p.familyId].products.push(p);
  }

  // Sort families by sortOrder
  const sortedFamilies = Object.values(groupedProducts).sort((a, b) => a.family.sortOrder - b.family.sortOrder);

  return (
    <>
      <div className="blob-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <PublicHeader lang={lang} dict={dict} />
      
      <main className="fade-in">
        {/* Hero Section for Catalog */}
        <section className="hero-section">
          <div className="container fade-in-up">
            <nav style={{ 
              marginBottom: '1rem', 
              color: 'var(--primary)', 
              fontSize: '0.85rem', 
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'var(--primary-light)',
              padding: '0.25rem 1rem',
              borderRadius: 'var(--radius-full)'
            }}>
              <Link href={`/${lang}`}>{dict.nav.collections}</Link>
              <span>/</span>
              <span>{catalog.name}</span>
            </nav>
            
            <h1 className="hero-title">
              {catalog.name}
            </h1>
            {catalog.description && (
              <p className="hero-subtitle">
                {catalog.description}
              </p>
            )}
          </div>
        </section>

        <div className="container" style={{ paddingBottom: 'var(--spacing-xl)' }}>
          <CatalogClientView
            catalog={{
              id: catalog.id,
              name: catalog.name,
              slug: catalog.slug,
              description: catalog.description,
            }}
            sortedFamilies={sortedFamilies}
            lang={lang}
            dict={dict}
          />
        </div>
      </main>
    </>
  );
}
