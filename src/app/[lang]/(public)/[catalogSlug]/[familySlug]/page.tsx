import prisma from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDictionary, Locale } from '@/lib/dictionaries';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import SmartImage from '@/components/SmartImage';
import Pagination from '@/components/Pagination';

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
  
  const [family, catalog] = await Promise.all([
    prisma.family.findUnique({
      where: { slug: familySlug },
    }),
    prisma.catalog.findUnique({
      where: { slug: catalogSlug },
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

      <header className="main-header">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href={`/${lang}`} className="logo">
            <span style={{ color: 'var(--primary)', fontSize: '2rem' }}>•</span>
            HS Fashion
          </Link>
          <LanguageSwitcher currentLang={lang} />
        </div>
      </header>
      
      <main className="fade-in">
        {/* Header Section */}
        <section style={{ padding: '4rem 0', textAlign: 'center' }}>
          <div className="container fade-in-up">
            <nav style={{ 
              marginBottom: '1.5rem', 
              color: 'var(--primary)', 
              fontSize: '0.875rem', 
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
            
            <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
              {family.name}
            </h1>
            {family.description && (
              <p style={{ fontSize: '1.125rem', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>
                {family.description}
              </p>
            )}
          </div>
        </section>

        <div className="container" style={{ paddingBottom: 'var(--spacing-xl)' }}>
          {products.length === 0 && (
            <div className="glass-card fade-in-up" style={{ padding: '3rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)' }}>{dict.family.noProducts}</p>
            </div>
          )}

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
            gap: '1.5rem' 
          }}>
            {products.map((product: any, index: number) => {
              return (
                <Link key={product.id} href={`/${lang}/product/${encodeURIComponent(product.reference)}`} className={`fade-in-up delay-${index % 3 + 1}`}>
                  <div className="glass-card hover-lift" style={{ overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ height: '240px', overflow: 'hidden' }}>
                      {product.images[0] ? (
                        <SmartImage 
                          src={product.images[0].mediumUrl} 
                          alt={product.reference} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          wrapperStyle={{ width: '100%', height: '100%' }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                          No Image
                        </div>
                      )}
                    </div>
                    
                    <div style={{ padding: '1rem', background: 'var(--surface)' }}>
                      <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem', fontWeight: 600 }}>{product.reference}</h3>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {product.details || "View details"}
                      </p>
                    </div>
                  </div>
                </Link>
              )
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
