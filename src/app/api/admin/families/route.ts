import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const families = await prisma.family.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json(families);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch families' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const family = await prisma.family.create({
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description,
        sortOrder: body.sortOrder || 0,
      },
    });
    return NextResponse.json(family);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create family' }, { status: 500 });
  }
}
