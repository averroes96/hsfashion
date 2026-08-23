import prisma from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDictionary, Locale } from '@/lib/dictionaries';
import PublicHeader from '@/components/PublicHeader';
import CategoryPillSlider from '@/components/CategoryPillSlider';
import InfiniteProductFeed from '@/components/InfiniteProductFeed';

const PRODUCTS_PER_PAGE = 12;

export default async function FamilyPage({ 
  params 
}: { 
  params: Promise<{ catalogSlug: string, familySlug: string, lang: string }>;
}) {
  const { catalogSlug, familySlug, lang } = await params;
  const dict = await getDictionary(lang as Locale);
  
  const [family, catalog, allCatalogFamilies] = await Promise.all([
    prisma.family.findUnique({
      where: { slug: familySlug },
    }),
    prisma.catalog.findUnique({
      where: { slug: catalogSlug },
    }),
    prisma.family.findMany({
      where: {
        products: {
          some: {
            isActive: true,
            catalogs: { some: { slug: catalogSlug } }
          }
        }
      },
      orderBy: { name: 'asc' }
    })
  ]);

  if (!family || !catalog) notFound();

  const whereCondition = {
    isActive: true,
    familyId: family.id,
    catalogs: {
      some: { slug: catalogSlug }
    }
  };

  const [totalProducts, initialProducts] = await Promise.all([
    prisma.product.count({ where: whereCondition }),
    prisma.product.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: PRODUCTS_PER_PAGE,
      include: {
        family: true,
        images: {
          where: { isPrimary: true },
          take: 1
        }
      }
    })
  ]);

  return (
    <>
      <div className="blob-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <PublicHeader lang={lang} dict={dict} />
      
      <main className="fade-in">
        {/* Header Section */}
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
              <Link href={`/${lang}/${catalogSlug}`}>{catalog.name}</Link>
              <span>/</span>
              <span>{family.name}</span>
            </nav>
            
            <h1 className="hero-title">
              {family.name}
            </h1>
            {family.description && (
              <p className="hero-subtitle">
                {family.description}
              </p>
            )}
          </div>
        </section>

        <div className="container" style={{ paddingBottom: 'var(--spacing-xl)' }}>
          {allCatalogFamilies.length > 1 && (
            <CategoryPillSlider
              families={allCatalogFamilies}
              currentSlug={family.slug}
              catalogSlug={catalog.slug}
              lang={lang}
              allLabel={dict?.catalog?.all || (lang === 'ar' ? 'الكل' : 'Tous')}
            />
          )}

          {totalProducts === 0 ? (
            <div className="glass-card fade-in-up" style={{ padding: '3rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)' }}>{dict.family.noProducts}</p>
            </div>
          ) : (
            <InfiniteProductFeed
              initialProducts={initialProducts}
              catalogSlug={catalog.slug}
              familySlug={family.slug}
              lang={lang}
              totalProducts={totalProducts}
              dict={dict}
              limit={PRODUCTS_PER_PAGE}
            />
          )}
        </div>
      </main>
    </>
  );
}
