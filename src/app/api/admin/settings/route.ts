import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let settings = await prisma.storeSettings.findUnique({
      where: { id: 'default' }
    });
    
    if (!settings) {
      settings = await prisma.storeSettings.create({
        data: { id: 'default' }
      });
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const settings = await prisma.storeSettings.upsert({
      where: { id: 'default' },
      update: {
        phoneNumber: body.phoneNumber || null,
        email: body.email || null,
        address: body.address || null,
        promoMessage: body.promoMessage || null,
      },
      create: {
        id: 'default',
        phoneNumber: body.phoneNumber || null,
        email: body.email || null,
        address: body.address || null,
        promoMessage: body.promoMessage || null,
      }
    });
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
