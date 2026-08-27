import prisma from '@/lib/prisma';
import { getDictionary, Locale } from '@/lib/dictionaries';
import PublicHeader from '@/components/PublicHeader';
import InfiniteCatalogFeed, { FeedCatalog } from '@/components/InfiniteCatalogFeed';

const INITIAL_CATALOGS_COUNT = 8;

export default async function Home({ 
  params, 
}: { 
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  const whereCondition = {
    products: {
      some: {
        isActive: true
      }
    }
  };

  const [totalCatalogs, rawCatalogs, settings] = await Promise.all([
    prisma.catalog.count({ where: whereCondition }),
    prisma.catalog.findMany({
      where: whereCondition,
      orderBy: [
        { createdAt: 'desc' },
        { sortOrder: 'asc' },
      ],
      take: INITIAL_CATALOGS_COUNT,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        createdAt: true,
        products: {
          where: { isActive: true },
          take: 1,
          select: {
            id: true,
            images: {
              where: { isPrimary: true },
              take: 1,
              select: {
                thumbnailUrl: true,
                mediumUrl: true,
                fullUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            products: {
              where: { isActive: true },
            },
          },
        },
      },
    }),
    prisma.storeSettings.findUnique({
      where: { id: 'default' }
    })
  ]);

  const initialCatalogs: FeedCatalog[] = await Promise.all(
    rawCatalogs.map(async (cat) => {
      let bgImage: { thumbnailUrl: string; mediumUrl: string; fullUrl?: string } | null =
        cat.products[0]?.images[0] || null;
      if (!bgImage) {
        const fallback = await prisma.productImage.findFirst({
          where: {
            product: {
              catalogs: { some: { id: cat.id } },
              isActive: true,
            },
          },
          orderBy: { sortOrder: 'asc' },
          select: {
            thumbnailUrl: true,
            mediumUrl: true,
            fullUrl: true,
          },
        });
        bgImage = fallback;
      }

      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        createdAt: cat.createdAt.toISOString(),
        productCount: cat._count.products,
        thumbnail: bgImage?.mediumUrl || bgImage?.thumbnailUrl || null,
      };
    })
  );

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
        <section className="hero-section">
          <div className="container fade-in-up">
            <div className="badge" style={{ marginBottom: '1rem' }}>
              {dict.home.collections}
            </div>

            <h1 className="hero-title">
              {dict.home.title}
            </h1>

            <p className="hero-subtitle" style={{ marginBottom: '1.75rem' }}>
              {dict.home.subtitle}
            </p>

            <div style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              {settings?.phoneNumber && (
                <div className="glass-card" style={{ padding: '0.4rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--primary)' }}>📞</span> <span dir="ltr">{settings.phoneNumber}</span>
                </div>
              )}
              {settings?.email && (
                <div className="glass-card" style={{ padding: '0.4rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--primary)' }}>✉️</span> <span>{settings.email}</span>
                </div>
              )}
              {settings?.address && (
                <div className="glass-card" style={{ padding: '0.4rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--primary)' }}>📍</span> <span>{settings.address}</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Catalogs Section (Month-Grouped Infinite Feed) */}
        <section className="container" style={{ paddingBottom: 'var(--spacing-xl)' }}>
          <InfiniteCatalogFeed
            initialCatalogs={initialCatalogs}
            totalCatalogs={totalCatalogs}
            lang={lang}
            dict={dict}
            limit={INITIAL_CATALOGS_COUNT}
          />
        </section>
      </main>
    </>
  );
}
