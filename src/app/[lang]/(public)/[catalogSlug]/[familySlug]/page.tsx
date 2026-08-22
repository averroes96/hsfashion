import prisma from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDictionary, Locale } from '@/lib/dictionaries';
import SmartImage from '@/components/SmartImage';
import Pagination from '@/components/Pagination';
import PublicHeader from '@/components/PublicHeader';
import CategoryPillSlider from '@/components/CategoryPillSlider';

const PRODUCTS_PER_PAGE = 12;

export default async function FamilyPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ catalogSlug: string, familySlug: string, lang: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { catalogSlug, familySlug, lang } = await params;
  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || '1', 10) || 1);
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

  const [totalProducts, products] = await Promise.all([
    prisma.product.count({ where: whereCondition }),
    prisma.product.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'desc' },
      skip: (currentPage - 1) * PRODUCTS_PER_PAGE,
      take: PRODUCTS_PER_PAGE,
      include: {
        images: {
          where: { isPrimary: true },
          take: 1
        }
      }
    })
  ]);

  const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);

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

          {products.length === 0 && (
            <div className="glass-card fade-in-up" style={{ padding: '3rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)' }}>{dict.family.noProducts}</p>
            </div>
          )}

          <div className="product-card-grid">
            {products.map((product: any, index: number) => {
              const primaryImage = product.images[0];
              return (
                <Link key={product.id} href={`/${lang}/product/${encodeURIComponent(product.reference)}`} className={`product-card fade-in-up delay-${index % 3 + 1}`}>
                  <div className="product-card-media">
                    {primaryImage ? (
                      <SmartImage 
                        src={primaryImage.mediumUrl || primaryImage.thumbnailUrl} 
                        alt={product.reference} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        wrapperStyle={{ width: '100%', height: '100%' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        No Image
                      </div>
                    )}
                  </div>
                  
                  <div className="product-card-body">
                    <h3 className="product-card-title">{product.reference}</h3>
                    <p className="product-card-subtitle">
                      {product.details || "View details"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath={`/${lang}/${catalogSlug}/${familySlug}`}
            dict={dict}
            lang={lang}
          />
        </div>
      </main>
    </>
  );
}
