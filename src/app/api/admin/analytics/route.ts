import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Fetch KPI Counts & Orders & Products
    const [
      totalProducts,
      activeProducts,
      totalCatalogs,
      totalFamilies,
      allOrders,
      allProductsData,
      allFamiliesData,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.catalog.count(),
      prisma.family.count(),
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      }),
      prisma.product.findMany({
        include: {
          family: true,
          images: { where: { isPrimary: true }, take: 1 },
        },
      }),
      prisma.family.findMany({
        include: {
          products: {
            select: { id: true, views: true },
          },
        },
      }),
    ]);

    // Aggregate KPIs
    const totalOrders = allOrders.length;
    const pendingOrders = allOrders.filter((o) => o.status === 'PENDING').length;
    const completedOrders = allOrders.filter((o) => o.status === 'COMPLETED' || o.status === 'VALIDATED').length;
    const totalCartons = allOrders.reduce((sum, o) => sum + (o.totalCartons || 0), 0);
    const totalViews = allProductsData.reduce((sum, p) => sum + (p.views || 0), 0);
    const avgCartonsPerOrder = totalOrders > 0 ? Math.round((totalCartons / totalOrders) * 10) / 10 : 0;

    // 2. Top 10 Most-Viewed Products
    const topViewedProducts = [...allProductsData]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 10)
      .map((p) => ({
        id: p.id,
        reference: p.reference,
        familyName: p.family?.name || '',
        arabicFamilyName: p.family?.arabicName || null,
        views: p.views || 0,
        thumbnailUrl: p.images[0]?.thumbnailUrl || p.images[0]?.mediumUrl || null,
        sizeAssortment: p.sizeAssortment,
      }));

    // 3. Top 10 Most-Ordered Products
    const orderItemsMap: Record<
      string,
      {
        reference: string;
        familyName: string;
        imageUrl: string | null;
        totalCartons: number;
        orderCount: number;
      }
    > = {};

    allOrders.forEach((order) => {
      order.items.forEach((item) => {
        const ref = item.reference;
        if (!orderItemsMap[ref]) {
          orderItemsMap[ref] = {
            reference: ref,
            familyName: item.familyTitle || '',
            imageUrl: item.imageUrl || null,
            totalCartons: 0,
            orderCount: 0,
          };
        }
        orderItemsMap[ref].totalCartons += item.cartons || 1;
        orderItemsMap[ref].orderCount += 1;
      });
    });

    const topOrderedProducts = Object.values(orderItemsMap)
      .sort((a, b) => b.totalCartons - a.totalCartons)
      .slice(0, 10);

    // 4. Daily Order Trends (Last 30 Days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const dailyTrendsMap: Record<string, { date: string; orders: number; cartons: number }> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      dailyTrendsMap[dateKey] = {
        date: dateKey,
        orders: 0,
        cartons: 0,
      };
    }

    allOrders.forEach((order) => {
      const dateKey = order.createdAt.toISOString().split('T')[0];
      if (dailyTrendsMap[dateKey]) {
        dailyTrendsMap[dateKey].orders += 1;
        dailyTrendsMap[dateKey].cartons += order.totalCartons || 0;
      }
    });

    const dailyTrends = Object.values(dailyTrendsMap);

    // 5. Category / Family Breakdown
    const familyStats = allFamiliesData.map((f) => {
      const productCount = f.products.length;
      const familyViews = f.products.reduce((acc, p) => acc + (p.views || 0), 0);
      const familyCartons = Object.values(orderItemsMap)
        .filter((item) => item.familyName.toLowerCase() === f.name.toLowerCase())
        .reduce((sum, item) => sum + item.totalCartons, 0);

      return {
        id: f.id,
        name: f.name,
        arabicName: f.arabicName,
        productCount,
        views: familyViews,
        cartons: familyCartons,
        viewShare: totalViews > 0 ? Math.round((familyViews / totalViews) * 100) : 0,
      };
    }).sort((a, b) => b.views - a.views);

    // 6. City / Geographic Breakdown
    const cityMap: Record<string, { city: string; orders: number; cartons: number }> = {};
    allOrders.forEach((order) => {
      const rawCity = (order.customerCity || 'Autre / Non spécifié').trim();
      const city = rawCity.charAt(0).toUpperCase() + rawCity.slice(1);
      if (!cityMap[city]) {
        cityMap[city] = { city, orders: 0, cartons: 0 };
      }
      cityMap[city].orders += 1;
      cityMap[city].cartons += order.totalCartons || 0;
    });

    const cityBreakdown = Object.values(cityMap)
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 8);

    return NextResponse.json({
      summary: {
        totalOrders,
        pendingOrders,
        completedOrders,
        totalCartons,
        totalViews,
        totalProducts,
        activeProducts,
        totalCatalogs,
        totalFamilies,
        avgCartonsPerOrder,
      },
      topViewedProducts,
      topOrderedProducts,
      dailyTrends,
      familyStats,
      cityBreakdown,
      rawOrders: allOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerPhone: o.customerPhone,
        customerName: o.customerName,
        customerCity: o.customerCity,
        status: o.status,
        totalCartons: o.totalCartons,
        itemCount: o.items.length,
        itemsSummary: o.items.map((it) => `${it.reference} (${it.cartons} ctn)`).join(', '),
        createdAt: o.createdAt.toISOString(),
      })),
      rawProducts: allProductsData.map((p) => ({
        id: p.id,
        reference: p.reference,
        familyName: p.family?.name || '',
        views: p.views || 0,
        isActive: p.isActive,
        createdAt: p.createdAt.toISOString(),
        orderedCartons: orderItemsMap[p.reference]?.totalCartons || 0,
      })),
    });
  } catch (error) {
    console.error('Analytics API Error:', error);
    return NextResponse.json({ error: 'Failed to compute analytics' }, { status: 500 });
  }
}
