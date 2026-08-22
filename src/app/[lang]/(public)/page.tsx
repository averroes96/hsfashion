import prisma from '@/lib/prisma';
import Link from 'next/link';
import { getDictionary, Locale } from '@/lib/dictionaries';
import SmartImage from '@/components/SmartImage';
import Pagination from '@/components/Pagination';
import PublicHeader from '@/components/PublicHeader';

const CATALOGS_PER_PAGE = 6;

export default async function Home({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { lang } = await params;
  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || '1', 10) || 1);
  const dict = await getDictionary(lang as Locale);

  const whereCondition = {
    products: {
      some: {
        isActive: true
      }
    }
  };

  const [totalCatalogs, catalogs, settings] = await Promise.all([
    prisma.catalog.count({ where: whereCondition }),
    prisma.catalog.findMany({
      where: whereCondition,
      orderBy: { sortOrder: 'asc' },
      skip: (currentPage - 1) * CATALOGS_PER_PAGE,
      take: CATALOGS_PER_PAGE,
      include: {
        products: {
          where: { isActive: true },
          include: { images: { orderBy: { sortOrder: 'asc' } } }
        }
      }
    }),
    prisma.storeSettings.findUnique({
      where: { id: 'default' }
    })
  ]);

  const totalPages = Math.ceil(totalCatalogs / CATALOGS_PER_PAGE);

  return (
    <>
      {/* Background Blobs */}
      <div className="blob-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <PublicHeader lang={lang} dict={dict} />

      <main className="fade-in">
        {/* Hero Section */}
        <section style={{ padding: 'var(--spacing-xl) 0', textAlign: 'center' }}>
          <div className="container fade-in-up">
            <div className="badge" style={{ marginBottom: '1.5rem' }}>
              {dict.home.collections}
            </div>

            <h1 style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              lineHeight: 1.2,
              marginBottom: '1.5rem',
              fontWeight: 900,
              maxWidth: '800px',
              margin: '0 auto 1.5rem auto'
            }}>
              {dict.home.title}
            </h1>

            <p style={{ 
              color: 'var(--text-muted)', 
              fontSize: '1.125rem', 
              maxWidth: '600px', 
              margin: '0 auto 2.5rem auto' 
            }}>
              {dict.home.subtitle}
            </p>

            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              {settings?.phoneNumber && (
                <div className="glass-card" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                  <span style={{ color: 'var(--primary)' }}>📞</span> <span dir="ltr">{settings.phoneNumber}</span>
                </div>
              )}
              {settings?.email && (
                <div className="glass-card" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                  <span style={{ color: 'var(--primary)' }}>✉️</span> <span>{settings.email}</span>
                </div>
              )}
              {settings?.address && (
                <div className="glass-card" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                  <span style={{ color: 'var(--primary)' }}>📍</span> <span>{settings.address}</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Catalogs Section (Bento Grid) */}
        <section className="container" style={{ paddingBottom: 'var(--spacing-xl)' }}>
          <div className="grid fade-in-up delay-1" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '1.5rem'
          }}>
            {catalogs.map((catalog: any) => {
              let bgImage = null;
              for (const product of catalog.products) {
                if (product.images && product.images.length > 0) {
                  bgImage = product.images.find((img: any) => img.isPrimary) || product.images[0];
                  break;
                }
              }

              return (
                <Link key={catalog.id} href={`/${lang}/${catalog.slug}`} style={{ display: 'block', height: '100%' }}>
                  <div
                    className="glass-card hover-lift"
                    style={{
                      height: '380px',
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                      position: 'relative',
                      border: '1px solid rgba(255,255,255,0.8)'
                    }}
                  >
                    {/* Background Image Container */}
                    <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: 'var(--border-color)' }}>
                      {bgImage && (
                        <SmartImage
                          src={bgImage.mediumUrl || bgImage.thumbnailUrl}
                          alt={catalog.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          wrapperStyle={{ width: '100%', height: '100%' }}
                        />
                      )}
                    </div>

                    {/* Card Content Footer */}
                    <div style={{
                      padding: '1.5rem',
                      background: 'var(--surface)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTop: '1px solid var(--border-color)'
                    }}>
                      <div>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{catalog.name}</h3>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>
                          <span>{catalog.products.length} {dict.home.products}</span>
                          <span>•</span>
                          <span>{new Date(catalog.createdAt).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                      </div>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'var(--primary-light)',
                        color: 'var(--primary-hover)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.25rem'
                      }}>
                        →
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}

            {catalogs.length === 0 && (
              <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', gridColumn: '1 / -1' }}>
                <p style={{ color: 'var(--text-muted)' }}>{dict.home.noCollections}</p>
              </div>
            )}
          </div>

          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            basePath={`/${lang}`}
            dict={dict}
            lang={lang}
          />
        </section>
      </main>
    </>
  );
}
