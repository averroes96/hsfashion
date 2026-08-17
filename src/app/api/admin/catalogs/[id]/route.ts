import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const catalog = await prisma.catalog.update({
      where: { id },
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description,
        sortOrder: body.sortOrder,
      }
    });
    
    return NextResponse.json(catalog);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update catalog' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.catalog.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete catalog' }, { status: 500 });
  }
}
