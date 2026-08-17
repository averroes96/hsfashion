import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const family = await prisma.family.update({
      where: { id },
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description,
        sortOrder: body.sortOrder,
      }
    });
    
    return NextResponse.json(family);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update family' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.family.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete family' }, { status: 500 });
  }
}
