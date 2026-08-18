import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const [totalProducts, activeProducts, totalCatalogs, totalFamilies, topProducts] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.catalog.count(),
      prisma.family.count(),
      prisma.product.findMany({
        orderBy: { views: 'desc' },
        take: 5,
        include: { family: true, images: { take: 1, where: { isPrimary: true } } }
      })
    ]);

    return NextResponse.json({
      totalProducts,
      activeProducts,
      totalCatalogs,
      totalFamilies,
      topProducts
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
