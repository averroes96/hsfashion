import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const limit = Math.min(24, Math.max(1, parseInt(searchParams.get('limit') || '8', 10) || 8));

  try {
    const whereCondition = {
      products: {
        some: {
          isActive: true,
        },
      },
    };

    const [total, rawCatalogs] = await Promise.all([
      prisma.catalog.count({ where: whereCondition }),
      prisma.catalog.findMany({
        where: whereCondition,
        orderBy: [
          { createdAt: 'desc' },
          { sortOrder: 'asc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
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
    ]);

    // Format catalogs with thumbnail and count
    const catalogs = await Promise.all(
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

    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    return NextResponse.json({
      catalogs,
      total,
      page,
      totalPages,
      hasMore,
    });
  } catch (error) {
    console.error('Error in /api/catalogs:', error);
    return NextResponse.json({ error: 'Failed to fetch catalogs' }, { status: 500 });
  }
}
