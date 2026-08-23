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
    const forceRefresh = searchParams.get('refresh') === 'true';

    // 1. Fetch the target product with its primary image
    const targetProduct = await prisma.product.findUnique({
      where: { reference: decodedReference },
      select: {
        id: true,
        reference: true,
        details: true,
        description: true,
        familyId: true,
        family: { select: { name: true, arabicName: true } },
        images: {
          where: { isPrimary: true },
          take: 1,
          select: { thumbnailUrl: true, mediumUrl: true }
        },
        aiSimilarCache: true,
        aiCacheUpdatedAt: true,
      }
    });

    if (!targetProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // 2. CHECK CACHE FIRST (< 5ms response)
    const cacheObj = targetProduct.aiSimilarCache as Record<string, any[]> | null;
    const cachedMatches = cacheObj?.[lang];

    if (!forceRefresh && Array.isArray(cachedMatches) && cachedMatches.length > 0) {
      const cachedProductIds = cachedMatches.map(m => m.productId);

      // Fast indexed fetch for active products and images
      const matchingProducts = await prisma.product.findMany({
        where: {
          id: { in: cachedProductIds },
          isActive: true,
        },
        select: {
          id: true,
          reference: true,
          details: true,
          family: { select: { name: true, arabicName: true } },
          images: {
            where: { isPrimary: true },
            take: 1,
            select: { mediumUrl: true, thumbnailUrl: true }
          }
        }
      });

      const prodMap = new Map(matchingProducts.map(p => [p.id, p]));

      const hydrated = cachedMatches
        .map(m => {
          const prod = prodMap.get(m.productId);
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

      if (hydrated.length > 0) {
        return NextResponse.json(
          { matches: hydrated, fromCache: true },
          { headers: { 'X-Cache': 'HIT' } }
        );
      }
    }

    // 3. Fetch other active products
    const otherProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        id: { not: targetProduct.id }
      },
      select: {
        id: true,
        reference: true,
        familyId: true,
        family: { select: { name: true, arabicName: true } },
        details: true,
        description: true,
        images: {
          where: { isPrimary: true },
          take: 1,
          select: { mediumUrl: true, thumbnailUrl: true }
        }
      }
    });

    if (otherProducts.length === 0) {
      return NextResponse.json({ matches: [] });
    }

    const createFallbackMatches = (prods: typeof otherProducts) => {
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

    // Attempt to download target product image for multimodal inspection
    let targetImageBase64: string | null = null;
    const targetImageUrl = targetProduct.images?.[0]?.thumbnailUrl || targetProduct.images?.[0]?.mediumUrl;
    if (targetImageUrl) {
      try {
        const imgRes = await fetch(targetImageUrl, { signal: AbortSignal.timeout(3500) });
        if (imgRes.ok) {
          const arrayBuf = await imgRes.arrayBuffer();
          targetImageBase64 = Buffer.from(arrayBuf).toString('base64');
        }
      } catch (imgErr) {
        console.warn('Failed to fetch target image for vision similarity:', imgErr);
      }
    }

    // Candidate summary for AI
    const candidateSummary = otherProducts.map(p => ({
      id: p.id,
      reference: p.reference,
      category: p.family?.name || 'Footwear',
      categoryAr: p.family?.arabicName || '',
      details: p.details || '',
      description: p.description || ''
    }));

    const prompt = `You are an expert luxury footwear personal stylist and merchandiser for HS Fashion.
Analyze the target shoe (both the photo if provided and the text info) and select the top 4-6 most stylistically and visually matching models from the candidate list.

Target Shoe:
- Reference: "${targetProduct.reference}"
- Category: "${targetProduct.family?.name || 'Footwear'}" (${targetProduct.family?.arabicName || ''})
- Details: "${targetProduct.details || ''}"
- Description: "${targetProduct.description || ''}"

Candidate Items in Store:
${JSON.stringify(candidateSummary, null, 2)}

CRITICAL STYLING & SILHOUETTE RULES (MANDATORY):
1. STRICT SILHOUETTE COMPATIBILITY:
   - If the target shoe is a FLAT CASUAL LOAFER / MOCCASIN / DRIVER / SLIDE: You MUST NEVER recommend high-heeled stilettos or pumps (escarpins), even if they share an administrative category. Only recommend other loafers, driving shoes, mules, or smart-casual flats.
   - If the target shoe is an EVENING HIGH HEEL / STILETTO PUMP: You MUST NEVER recommend flat casual driving moccasins or running sneakers.
   - If the target shoe is a SNEAKER: Only recommend other sneakers or street-chic platform flats.
2. Rank up to 6 candidate items that a buyer looking at this specific shoe would genuinely love to see as alternatives or matching collection variants.
3. For each match, return:
   - "productId": The candidate ID.
   - "similarityScore": A number between 70 and 98 (only give > 85 to genuinely compatible silhouettes).
   - "matchHighlight": A concise 2-3 word badge in ${lang === 'ar' ? 'Arabic' : 'French'} (e.g. "Semelle Assortie", "Même Style Mocassin", "Finitions Similaires" / "تصميم متناسق", "نعل متطابق", "تفاصيل متقاربة").
   - "matchReason": A concise 1-sentence explanation of the stylistic similarity in ${lang === 'ar' ? 'Arabic' : 'French'}.

Respond ONLY with valid JSON adhering to the specified schema.`;

    const ai = new GoogleGenAI({ apiKey });

    const parts: any[] = [];
    if (targetImageBase64) {
      parts.push({
        inlineData: {
          mimeType: 'image/webp',
          data: targetImageBase64
        }
      });
    }
    parts.push({ text: prompt });

    let responseText = '';
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [{ role: 'user', parts }],
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
      console.warn('Gemini 3.6 Flash failed, falling back to gemini-flash-latest:', primaryErr);
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: [{ role: 'user', parts }],
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
    const rawMatches = parsed.matches || [];

    // Save to Database Cache asynchronously
    if (rawMatches.length > 0) {
      const newCache = {
        ...(typeof targetProduct.aiSimilarCache === 'object' && targetProduct.aiSimilarCache !== null
          ? (targetProduct.aiSimilarCache as Record<string, any>)
          : {}),
        [lang]: rawMatches
      };

      // Asynchronous update without blocking response
      prisma.product.update({
        where: { id: targetProduct.id },
        data: {
          aiSimilarCache: newCache,
          aiCacheUpdatedAt: new Date()
        }
      }).catch(e => console.error('Failed to update product AI cache:', e));
    }

    const productMap = new Map(otherProducts.map(p => [p.id, p]));

    const enrichedMatches = rawMatches
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

    return NextResponse.json(
      { matches: enrichedMatches, fromCache: false },
      { headers: { 'X-Cache': 'MISS' } }
    );
  } catch (error: any) {
    console.error('Similar products recommendation error:', error);
    try {
      const fallbackProducts = await prisma.product.findMany({
        where: { isActive: true },
        take: 6,
        select: {
          id: true,
          reference: true,
          details: true,
          family: { select: { name: true, arabicName: true } },
          images: { where: { isPrimary: true }, take: 1 }
        }
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
