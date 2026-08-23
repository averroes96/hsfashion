import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, notes } = body;

    const dataToUpdate: any = {};

    if (status && Object.values(OrderStatus).includes(status as OrderStatus)) {
      dataToUpdate.status = status as OrderStatus;
    }

    if (notes !== undefined) {
      dataToUpdate.notes = notes;
    }

    const updated = await prisma.order.update({
      where: { id },
      data: dataToUpdate,
      include: {
        items: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Order update error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update order' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.order.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Order deletion error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete order' },
      { status: 500 }
    );
  }
}
