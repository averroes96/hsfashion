import { NextResponse } from 'next/server';
import { processAndSaveImage } from '@/lib/imageProcessor';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const processedImages = await processAndSaveImage(buffer, file.name);

    return NextResponse.json(processedImages);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
  }
}
