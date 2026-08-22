import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const familyId = searchParams.get('familyId');

  try {
    const products = await prisma.product.findMany({
      where: familyId ? { familyId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { 
        family: true,
        catalogs: true,
        images: { orderBy: { sortOrder: 'asc' } }
      }
    });
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // We expect body to have product fields AND an array of images
    const { reference, details, description, familyId, images, catalogIds } = body;

    const product = await prisma.product.create({
      data: {
        reference,
        details,
        description,
        familyId,
        catalogs: catalogIds?.length ? {
          connect: catalogIds.map((id: string) => ({ id }))
        } : undefined,
        images: {
          create: images.map((img: any, index: number) => ({
            originalUrl: img.originalUrl,
            thumbnailUrl: img.thumbnailUrl,
            mediumUrl: img.mediumUrl,
            fullUrl: img.fullUrl,
            isPrimary: index === 0, // First image is primary by default
            sortOrder: index
          }))
        }
      },
      include: { images: true, catalogs: true }
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
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
