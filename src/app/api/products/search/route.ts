import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() || '';

  if (!q || q.length < 1) {
    return NextResponse.json({ products: [] });
  }

  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { reference: { contains: q, mode: 'insensitive' } },
          { details: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { family: { name: { contains: q, mode: 'insensitive' } } },
          { family: { arabicName: { contains: q, mode: 'insensitive' } } },
        ],
      },
      take: 10,
      orderBy: { views: 'desc' },
      select: {
        id: true,
        reference: true,
        details: true,
        family: {
          select: {
            id: true,
            name: true,
            arabicName: true,
            slug: true,
          },
        },
        images: {
          orderBy: { sortOrder: 'asc' },
          take: 1,
          select: {
            thumbnailUrl: true,
            mediumUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Error in /api/products/search:', error);
    return NextResponse.json({ error: 'Failed to search products' }, { status: 500 });
  }
}
