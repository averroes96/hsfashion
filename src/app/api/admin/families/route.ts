import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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
    
    if (Array.isArray(body)) {
      // Bulk creation
      const created = await prisma.$transaction(
        body.map((item: any) => prisma.family.create({
          data: {
            name: item.name,
            arabicName: item.arabicName,
            slug: item.slug,
            description: item.description,
            sortOrder: item.sortOrder || 0,
          }
        }))
      );
      return NextResponse.json(created);
    } else {
      // Single creation (fallback)
      const family = await prisma.family.create({
        data: {
          name: body.name,
          arabicName: body.arabicName,
          slug: body.slug,
          description: body.description,
          sortOrder: body.sortOrder || 0,
        },
      });
      return NextResponse.json(family);
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create family' }, { status: 500 });
  }
}
