import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerPhone, customerName, customerCity, notes, items } = body;

    if (!customerPhone || typeof customerPhone !== 'string' || !customerPhone.trim()) {
      return NextResponse.json(
        { error: 'Phone number is required / Le numéro de téléphone est obligatoire.' },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty / Votre panier est vide.' },
        { status: 400 }
      );
    }

    // Clean & compute totals
    const sanitizedPhone = customerPhone.trim();
    const sanitizedName = customerName?.trim() || null;
    const sanitizedCity = customerCity?.trim() || null;
    const sanitizedNotes = notes?.trim() || null;

    const validItems = items.map((item: any) => ({
      productId: item.productId || null,
      reference: item.reference || 'SKU',
      cartons: Math.max(1, parseInt(item.cartons, 10) || 1),
      familyTitle: item.familyName || item.familyTitle || null,
      imageUrl: item.imageUrl || null,
    }));

    const totalCartons = validItems.reduce((sum, item) => sum + item.cartons, 0);

    // Generate readable order number: CMD-YYMMDD-XXX
    const now = new Date();
    const datePart = now.toISOString().slice(2, 10).replace(/-/g, '');
    const randPart = Math.floor(100 + Math.random() * 900);
    const orderNumber = `CMD-${datePart}-${randPart}`;

    // Create Order with Items
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerPhone: sanitizedPhone,
        customerName: sanitizedName,
        customerCity: sanitizedCity,
        notes: sanitizedNotes,
        totalCartons,
        items: {
          create: validItems.map((i) => ({
            productId: i.productId,
            reference: i.reference,
            cartons: i.cartons,
            familyTitle: i.familyTitle,
            imageUrl: i.imageUrl,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // Get store WhatsApp hotline
    const settings = await prisma.storeSettings.findUnique({
      where: { id: 'default' },
    });

    // Build WhatsApp relay URL
    let whatsappUrl: string | null = null;
    if (settings?.phoneNumber) {
      const cleanStorePhone = settings.phoneNumber.replace(/[^0-9]/g, '');
      const itemsList = order.items
        .map((i) => `• ${i.reference} (${i.familyTitle || 'Modèle'}): ${i.cartons} Carton(s)`)
        .join('\n');

      const msg = `*Nouvelle Commande de Gros - HS Fashion*\n` +
        `📦 *N° Commande:* ${order.orderNumber}\n` +
        `📞 *Client:* ${order.customerPhone}${order.customerName ? ` (${order.customerName})` : ''}\n` +
        (order.customerCity ? `📍 *Ville:* ${order.customerCity}\n` : '') +
        `📊 *Total:* ${order.totalCartons} Cartons (${order.items.length} modèles)\n\n` +
        `*Détails des Articles:*\n${itemsList}` +
        (order.notes ? `\n\n📝 *Notes:* ${order.notes}` : '');

      whatsappUrl = `https://wa.me/${cleanStorePhone}?text=${encodeURIComponent(msg)}`;
    }

    return NextResponse.json({
      success: true,
      order,
      whatsappUrl,
    });
  } catch (error: any) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to place order' },
      { status: 500 }
    );
  }
}
