import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        catalogs: true,
      }
    });
    if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Disconnect all catalogs first, then connect the new ones
    // We could optimize this, but for simplicity we reset the relations
    await prisma.product.update({
      where: { id },
      data: {
        catalogs: {
          set: []
        }
      }
    });

    const product = await prisma.product.update({
      where: { id },
      data: {
        reference: body.reference,
        details: body.details,
        description: body.description,
        family: body.familyId ? {
          connect: { id: body.familyId }
        } : undefined,
        sizeAssortment: body.sizeAssortment !== undefined ? body.sizeAssortment : undefined,
        isActive: body.isActive !== undefined ? body.isActive : undefined,
        catalogs: body.catalogIds ? {
          connect: body.catalogIds.map((cId: string) => ({ id: cId }))
        } : undefined,
      }
    });
    
    return NextResponse.json(product);
  } catch (error: any) {
    console.error(error);
    if (error?.code === 'P2002' || error?.message?.includes('Unique constraint failed')) {
      return NextResponse.json(
        { error: 'Un produit avec cette référence existe déjà. Veuillez choisir une référence unique / A product with this SKU already exists.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.product.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
