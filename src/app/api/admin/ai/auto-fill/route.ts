import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured in environment variables.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { imageBase64, mimeType = 'image/jpeg', families = [], lang = 'fr' } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'imageBase64 payload is required.' },
        { status: 400 }
      );
    }

    // Clean base64 string if it contains prefix (e.g. data:image/png;base64,...)
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

    const familiesListText = families
      .map((f: any) => `- ID: "${f.id}", French Name: "${f.name}", Arabic Name: "${f.arabicName || ''}"`)
      .join('\n');

    const prompt = `You are a professional luxury and wholesale footwear catalog curator for HS Fashion.
Analyze the provided shoe photo thoroughly.

Available Store Family Categories:
${familiesListText}

Tasks:
1. Identify the closest matching Family Category from the provided list. Return the exact "familyId" matching that category. If none match specifically, pick the closest one or "Other".
2. Return "matchedCategoryName" indicating why or what type of footwear this is.
3. Write concise "details" (1-2 sentences or bullet-style highlights, e.g. "Semelle ergonomique crantée, tige en cuir synthétique respirant, fermeture à lacets") in ${lang === 'ar' ? 'Arabic' : 'French'}.
4. Write a professional, appealing wholesale "description" (2-3 sentences highlighting style, comfort, durability, and retail appeal) in ${lang === 'ar' ? 'Arabic' : 'French'}.
5. If there is a visible label, box, or stamped SKU/reference in the image (e.g. "HS-...", "ART-...", etc.), extract it into "detectedSku". If not found, return an empty string "".

Respond ONLY with valid JSON adhering to the specified schema.`;

    const ai = new GoogleGenAI({ apiKey });

    // Primary model: gemini-3.6-flash, fallback: gemini-flash-latest
    let responseText = '';
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: cleanBase64,
                },
              },
              {
                text: prompt,
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              familyId: { type: Type.STRING },
              matchedCategoryName: { type: Type.STRING },
              details: { type: Type.STRING },
              description: { type: Type.STRING },
              detectedSku: { type: Type.STRING },
            },
            required: ['familyId', 'details', 'description'],
          },
        },
      });
      responseText = response.text || '';
    } catch (primaryError) {
      console.warn('Gemini 3.6 Flash failed, falling back to gemini-flash-latest:', primaryError);
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: cleanBase64,
                },
              },
              {
                text: prompt,
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              familyId: { type: Type.STRING },
              matchedCategoryName: { type: Type.STRING },
              details: { type: Type.STRING },
              description: { type: Type.STRING },
              detectedSku: { type: Type.STRING },
            },
            required: ['familyId', 'details', 'description'],
          },
        },
      });
      responseText = fallbackResponse.text || '';
    }

    const parsed = JSON.parse(responseText);
    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error('Gemini auto-fill error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process image with Gemini AI' },
      { status: 500 }
    );
  }
}
