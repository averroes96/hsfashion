import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: any = {};

    if (status && status !== 'ALL' && Object.values(OrderStatus).includes(status as OrderStatus)) {
      where.status = status as OrderStatus;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { orderNumber: { contains: q, mode: 'insensitive' } },
        { customerPhone: { contains: q, mode: 'insensitive' } },
        { customerName: { contains: q, mode: 'insensitive' } },
        { customerCity: { contains: q, mode: 'insensitive' } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                reference: true,
                family: { select: { name: true, arabicName: true } },
                images: { where: { isPrimary: true }, take: 1, select: { thumbnailUrl: true, mediumUrl: true } }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    // Also count by status for badges
    const statusCounts = await prisma.order.groupBy({
      by: ['status'],
      _count: { id: true }
    });

    const counts: Record<string, number> = {
      ALL: 0,
      PENDING: 0,
      VALIDATED: 0,
      PROCESSING: 0,
      COMPLETED: 0,
      CANCELLED: 0
    };

    let total = 0;
    statusCounts.forEach((sc) => {
      counts[sc.status] = sc._count.id;
      total += sc._count.id;
    });
    counts.ALL = total;

    return NextResponse.json({ orders, counts });
  } catch (error: any) {
    console.error('Admin orders fetch error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
