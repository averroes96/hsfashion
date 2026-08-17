import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const catalogs = await prisma.catalog.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json(catalogs);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch catalogs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const catalog = await prisma.catalog.create({
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description,
        sortOrder: body.sortOrder || 0,
      },
    });
    return NextResponse.json(catalog);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create catalog' }, { status: 500 });
  }
}
