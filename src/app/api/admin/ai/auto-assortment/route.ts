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
    const {
      imageBase64,
      imageUrl,
      mimeType = 'image/jpeg',
      categoryName = '',
      reference = '',
      details = '',
      description = '',
      lang = 'fr',
    } = body;

    let cleanBase64 = '';
    if (imageBase64) {
      cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
    } else if (imageUrl) {
      try {
        const imgRes = await fetch(imageUrl);
        if (imgRes.ok) {
          const arrayBuffer = await imgRes.arrayBuffer();
          cleanBase64 = Buffer.from(arrayBuffer).toString('base64');
        }
      } catch (err) {
        console.warn('Failed to fetch imageUrl for AI assortment:', err);
      }
    }

    const prompt = `You are a senior wholesale footwear & fashion packaging specialist for H.S. Fashion.
Your task is to analyze the product photo and metadata to determine the optimal factory carton size assortment and packaging breakdown for B2B wholesale buyers.

Product Information:
- SKU Reference: "${reference}"
- Category: "${categoryName}"
- Details: "${details}"
- Description: "${description}"

Rules for Wholesale Footwear Assortments:
1. Standard footwear assortments are typically packaged in cartons of 12, 15, 18, or 24 pairs.
2. For adult women footwear (heels, sandals, sneakers, boots, mules, slippers), the standard European size run is usually 36 to 41.
   - Example 12 pairs: [36:2, 37:2, 38:2, 39:2, 40:2, 41:2]
   - Example 15 pairs: [36:3, 37:3, 38:3, 39:3, 40:3]
   - Example 18 pairs: [36:3, 37:3, 38:3, 39:3, 40:3, 41:3]
   - Example 24 pairs: [36:4, 37:4, 38:4, 39:4, 40:4, 41:4]
3. For handbags / accessories / maroquinerie, provide a unit assortment (e.g. size: "Assortiment", ratio: 6 or 12).
4. For kids or specialized footwear, adjust the size run appropriately (e.g. 25 to 35).

Tasks:
1. Classify the item silhouette and type.
2. Choose the best matching assortment distribution array where each item has "size" (string, e.g. "36") and "ratio" (number, quantity per carton).
3. Provide a brief explanation in ${lang === 'ar' ? 'Arabic' : 'French'} for "reasoning".

Respond ONLY with valid JSON adhering to the specified schema.`;

    const ai = new GoogleGenAI({ apiKey });

    const contents: any[] = [];
    const parts: any[] = [];

    if (cleanBase64) {
      parts.push({
        inlineData: {
          mimeType,
          data: cleanBase64,
        },
      });
    }

    parts.push({ text: prompt });
    contents.push({ role: 'user', parts });

    const schema = {
      type: Type.OBJECT,
      properties: {
        detectedProductType: { type: Type.STRING },
        reasoning: { type: Type.STRING },
        sizeAssortment: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              size: { type: Type.STRING },
              ratio: { type: Type.INTEGER },
            },
            required: ['size', 'ratio'],
          },
        },
      },
      required: ['detectedProductType', 'reasoning', 'sizeAssortment'],
    };

    let responseText = '';
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents,
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema,
        },
      });
      responseText = response.text || '';
    } catch (primaryError) {
      console.warn('Gemini 3.6 Flash failed for assortment, falling back to gemini-flash-latest:', primaryError);
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents,
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema,
        },
      });
      responseText = fallbackResponse.text || '';
    }

    const parsed = JSON.parse(responseText);
    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error('AI Auto-Assortment error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to detect assortment with AI' },
      { status: 500 }
    );
  }
}
