import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const catalogSlug = searchParams.get('catalogSlug');
  const familySlug = searchParams.get('familySlug');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const limit = Math.min(48, Math.max(1, parseInt(searchParams.get('limit') || '12', 10) || 12));

  try {
    const whereCondition: any = {
      isActive: true,
    };

    if (familySlug) {
      whereCondition.family = { slug: familySlug };
    }

    if (catalogSlug) {
      whereCondition.catalogs = {
        some: { slug: catalogSlug },
      };
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where: whereCondition }),
      prisma.product.findMany({
        where: whereCondition,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          reference: true,
          details: true,
          description: true,
          createdAt: true,
          family: {
            select: {
              id: true,
              name: true,
              arabicName: true,
              slug: true,
            },
          },
          images: {
            where: { isPrimary: true },
            take: 1,
            select: {
              id: true,
              thumbnailUrl: true,
              mediumUrl: true,
              fullUrl: true,
            },
          },
        },
      }),
    ]);

    // Fallback image if primary was not found
    const productsWithFallback = await Promise.all(
      products.map(async (p) => {
        if (p.images.length === 0) {
          const fallback = await prisma.productImage.findFirst({
            where: { productId: p.id },
            orderBy: { sortOrder: 'asc' },
            select: {
              id: true,
              thumbnailUrl: true,
              mediumUrl: true,
              fullUrl: true,
            },
          });
          return { ...p, images: fallback ? [fallback] : [] };
        }
        return p;
      })
    );

    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;
    const nextPage = hasMore ? page + 1 : null;

    return NextResponse.json({
      products: productsWithFallback,
      total,
      page,
      totalPages,
      hasMore,
      nextPage,
    });
  } catch (error) {
    console.error('Error in /api/products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
