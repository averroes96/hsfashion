import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
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
    const { imageBase64, mimeType = 'image/jpeg', lang = 'fr' } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'imageBase64 payload is required.' },
        { status: 400 }
      );
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

    // Fetch active products with lightweight projection
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        reference: true,
        details: true,
        description: true,
        family: { select: { name: true, arabicName: true } },
        images: {
          where: { isPrimary: true },
          take: 1,
          select: { mediumUrl: true, thumbnailUrl: true }
        }
      }
    });

    if (products.length === 0) {
      return NextResponse.json({
        matches: [],
        detectedAttributes: { style: 'unknown', color: 'unknown' }
      });
    }

    // Build catalog context for Gemini
    const catalogSummary = products.map((p, index) => ({
      index,
      id: p.id,
      reference: p.reference,
      category: p.family?.name || 'Footwear',
      categoryAr: p.family?.arabicName || '',
      details: p.details || '',
      description: p.description || ''
    }));

    const prompt = `You are an expert AI visual search engine for a luxury footwear showroom called HS Fashion.
Look at the user-submitted shoe photo (query image).

Your goal:
1. Analyze the query shoe image: category (sneaker, sandal, loafer, heel, boot, mule, etc.), silhouette, color palette, sole design (chunky, flat, platform, lugged), materials (leather, suede, mesh, metallic, canvas), and design accents.
2. Compare the query shoe against the available store catalog items listed below.
3. Identify and rank the top matching footwear products (maximum 6 matches) that are visually and stylistically most similar to the query image.
4. For each match, provide:
   - "productId": The exact ID of the matching product.
   - "similarityScore": A percentage number between 60 and 100.
   - "matchHighlight": A short 2-3 word badge in ${lang === 'ar' ? 'Arabic' : 'French'} (e.g., "Meilleure Correspondance", "Semelle Similaire", "Même Silhouette", "Même Coloris", "Style Équivalent").
   - "matchReason": A concise 1-sentence explanation of the visual similarity in ${lang === 'ar' ? 'Arabic' : 'French'}.
5. Provide "detectedAttributes" with "category", "color", "soleType", and "style".

Store Catalog Items:
${JSON.stringify(catalogSummary, null, 2)}

Respond ONLY with valid JSON adhering to the specified schema.`;

    const ai = new GoogleGenAI({ apiKey });

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
              detectedAttributes: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  color: { type: Type.STRING },
                  soleType: { type: Type.STRING },
                  style: { type: Type.STRING },
                },
                required: ['category', 'color'],
              },
              matches: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    productId: { type: Type.STRING },
                    similarityScore: { type: Type.NUMBER },
                    matchHighlight: { type: Type.STRING },
                    matchReason: { type: Type.STRING },
                  },
                  required: ['productId', 'similarityScore', 'matchHighlight', 'matchReason'],
                },
              },
            },
            required: ['matches', 'detectedAttributes'],
          },
        },
      });
      responseText = response.text || '';
    } catch (err) {
      console.warn('Gemini 3.6 Flash failed for visual search, falling back to gemini-flash-latest:', err);
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
              detectedAttributes: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  color: { type: Type.STRING },
                  soleType: { type: Type.STRING },
                  style: { type: Type.STRING },
                },
                required: ['category', 'color'],
              },
              matches: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    productId: { type: Type.STRING },
                    similarityScore: { type: Type.NUMBER },
                    matchHighlight: { type: Type.STRING },
                    matchReason: { type: Type.STRING },
                  },
                  required: ['productId', 'similarityScore', 'matchHighlight', 'matchReason'],
                },
              },
            },
            required: ['matches', 'detectedAttributes'],
          },
        },
      });
      responseText = fallbackResponse.text || '';
    }

    const parsed = JSON.parse(responseText);

    // Map matched IDs back to full product records
    const productMap = new Map(products.map(p => [p.id, p]));

    const enrichedMatches = (parsed.matches || [])
      .map((match: any) => {
        const product = productMap.get(match.productId);
        if (!product) return null;
        return {
          ...match,
          product: {
            id: product.id,
            reference: product.reference,
            details: product.details,
            family: product.family,
            image: product.images[0] || null,
          }
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      detectedAttributes: parsed.detectedAttributes,
      matches: enrichedMatches
    });
  } catch (error: any) {
    console.error('Visual search error:', error);
    return NextResponse.json(
      { error: error?.message || 'Visual search failed' },
      { status: 500 }
    );
  }
}
