import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const [totalProducts, activeProducts, totalCatalogs, totalFamilies] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.catalog.count(),
      prisma.family.count()
    ]);

    return NextResponse.json({
      totalProducts,
      activeProducts,
      totalCatalogs,
      totalFamilies
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
