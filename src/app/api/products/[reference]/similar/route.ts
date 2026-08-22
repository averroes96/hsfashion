import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { GoogleGenAI, Type } from '@google/genai';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    const decodedReference = decodeURIComponent(reference);

    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang') || 'fr';

    // Fetch the target product
    const targetProduct = await prisma.product.findUnique({
      where: { reference: decodedReference },
      include: {
        family: true,
        catalogs: true,
        images: { orderBy: { sortOrder: 'asc' }, take: 1 }
      }
    });

    if (!targetProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Fetch other active products
    const otherProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        id: { not: targetProduct.id }
      },
      include: {
        family: true,
        catalogs: true,
        images: { orderBy: { sortOrder: 'asc' }, take: 1 }
      }
    });

    if (otherProducts.length === 0) {
      return NextResponse.json({ matches: [] });
    }

    // Default fallback formatter
    const createFallbackMatches = (prods: typeof otherProducts) => {
      // Prioritize same family, then others
      const sorted = [...prods].sort((a, b) => {
        const aSame = a.familyId === targetProduct.familyId ? 1 : 0;
        const bSame = b.familyId === targetProduct.familyId ? 1 : 0;
        return bSame - aSame;
      });

      return sorted.slice(0, 6).map((p, idx) => ({
        productId: p.id,
        similarityScore: Math.max(70, 95 - idx * 4),
        matchHighlight: lang === 'ar' ? 'تشكيلة متناسقة' : 'Style Assorti',
        matchReason: lang === 'ar'
          ? `موديل مكمل من فئة ${p.family?.arabicName || p.family?.name || 'الأحذية'}`
          : `Modèle complémentaire dans la catégorie ${p.family?.name || 'Chaussures'}`,
        product: {
          id: p.id,
          reference: p.reference,
          details: p.details,
          family: p.family,
          image: p.images[0] || null
        }
      }));
    };

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ matches: createFallbackMatches(otherProducts) });
    }

    const candidateSummary = otherProducts.map(p => ({
      id: p.id,
      reference: p.reference,
      category: p.family?.name || 'Footwear',
      categoryAr: p.family?.arabicName || '',
      details: p.details || '',
      description: p.description || ''
    }));

    const prompt = `You are a luxury footwear personal stylist and merchandising expert for HS Fashion.
Analyze the target shoe and find the top 4-6 most stylistically, aesthetically, or functionally similar models from the candidate items list.

Target Shoe:
- Reference: "${targetProduct.reference}"
- Category: "${targetProduct.family?.name || 'Footwear'}" (${targetProduct.family?.arabicName || ''})
- Details: "${targetProduct.details || ''}"
- Description: "${targetProduct.description || ''}"

Candidate Items:
${JSON.stringify(candidateSummary, null, 2)}

Tasks:
1. Rank up to 6 candidate items from most similar to least (considering silhouette, sole structure, occasion, material, and vibe).
2. For each match, return:
   - "productId": The exact candidate ID.
   - "similarityScore": A number between 70 and 98.
   - "matchHighlight": A concise 2-3 word badge in ${lang === 'ar' ? 'Arabic' : 'French'} (e.g. "Silhouette Similaire", "Semelle Équivalente", "Même Ambiance", "Style Assorti").
   - "matchReason": A concise 1-sentence explanation of the similarity in ${lang === 'ar' ? 'Arabic' : 'French'}.

Respond ONLY with valid JSON adhering to the specified schema.`;

    const ai = new GoogleGenAI({ apiKey });

    let responseText = '';
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              matches: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    productId: { type: Type.STRING },
                    similarityScore: { type: Type.NUMBER },
                    matchHighlight: { type: Type.STRING },
                    matchReason: { type: Type.STRING }
                  },
                  required: ['productId', 'similarityScore', 'matchHighlight', 'matchReason']
                }
              }
            },
            required: ['matches']
          }
        }
      });
      responseText = response.text || '';
    } catch (primaryErr) {
      console.warn('Gemini 3.6 Flash failed for recommendations, trying fallback model:', primaryErr);
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              matches: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    productId: { type: Type.STRING },
                    similarityScore: { type: Type.NUMBER },
                    matchHighlight: { type: Type.STRING },
                    matchReason: { type: Type.STRING }
                  },
                  required: ['productId', 'similarityScore', 'matchHighlight', 'matchReason']
                }
              }
            },
            required: ['matches']
          }
        }
      });
      responseText = fallbackResponse.text || '';
    }

    const parsed = JSON.parse(responseText);
    const productMap = new Map(otherProducts.map(p => [p.id, p]));

    const enrichedMatches = (parsed.matches || [])
      .map((m: any) => {
        const prod = productMap.get(m.productId);
        if (!prod) return null;
        return {
          ...m,
          product: {
            id: prod.id,
            reference: prod.reference,
            details: prod.details,
            family: prod.family,
            image: prod.images[0] || null
          }
        };
      })
      .filter(Boolean);

    if (enrichedMatches.length === 0) {
      return NextResponse.json({ matches: createFallbackMatches(otherProducts) });
    }

    return NextResponse.json({ matches: enrichedMatches });
  } catch (error: any) {
    console.error('Similar products recommendation error:', error);
    // Even if everything fails, query active products and return graceful fallback
    try {
      const fallbackProducts = await prisma.product.findMany({
        where: { isActive: true },
        take: 6,
        include: { family: true, images: { take: 1 } }
      });
      const matches = fallbackProducts.map(p => ({
        productId: p.id,
        similarityScore: 85,
        matchHighlight: 'Recommandé',
        matchReason: 'Modèle populaire de notre collection',
        product: {
          id: p.id,
          reference: p.reference,
          details: p.details,
          family: p.family,
          image: p.images[0] || null
        }
      }));
      return NextResponse.json({ matches });
    } catch {
      return NextResponse.json({ matches: [] });
    }
  }
}
