'use client';

const IMAGE_CACHE = 'hsfashion-images-v2';
const DATA_CACHE = 'hsfashion-data-v2';
const STORAGE_KEY_PRODUCTS = 'hsfashion_offline_products';
const STORAGE_KEY_CATALOGS = 'hsfashion_offline_catalogs';
const STORAGE_KEY_META = 'hsfashion_offline_meta';

export interface OfflineSyncProgress {
  current: number;
  total: number;
  percentage: number;
  stepName: string;
}

export interface OfflineShowroomStatus {
  isSynced: boolean;
  productCount: number;
  storageMb: number;
  lastSyncDate: string | null;
}

/**
 * Pre-fetches the entire active footwear catalog and all primary product photos into CacheStorage
 */
export async function syncEntireCatalogOffline(
  onProgress?: (prog: OfflineSyncProgress) => void
): Promise<{ success: boolean; count: number }> {
  try {
    // 1. Fetch products and catalogs
    onProgress?.({
      current: 0,
      total: 100,
      percentage: 5,
      stepName: 'Récupération des fiches produits...',
    });

    const [productsRes, catalogsRes] = await Promise.all([
      fetch('/api/products?limit=1000'),
      fetch('/api/catalogs'),
    ]);

    if (!productsRes.ok || !catalogsRes.ok) {
      throw new Error('Impossible de charger les données du catalogue depuis le serveur.');
    }

    const products = await productsRes.json();
    const catalogs = await catalogsRes.json();

    const productList = Array.isArray(products) ? products : products.products || [];

    // Store in LocalStorage / Cache
    try {
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(productList));
      localStorage.setItem(STORAGE_KEY_CATALOGS, JSON.stringify(catalogs));
    } catch (e) {
      console.warn('LocalStorage quota reached for JSON, falling back to CacheStorage only', e);
    }

    // Cache the API responses in Service Worker Data Cache
    if ('caches' in window) {
      try {
        const dataCache = await caches.open(DATA_CACHE);
        await dataCache.put('/api/products?limit=1000', new Response(JSON.stringify(productList)));
        await dataCache.put('/api/catalogs', new Response(JSON.stringify(catalogs)));
      } catch (err) {
        console.warn('Error caching API response in data cache:', err);
      }
    }

    const totalProducts = productList.length;
    if (totalProducts === 0) {
      onProgress?.({
        current: 0,
        total: 0,
        percentage: 100,
        stepName: 'Catalogue vide.',
      });
      return { success: true, count: 0 };
    }

    // 2. Collect image URLs to cache
    const imageUrls: string[] = [];
    for (const prod of productList) {
      if (prod.images && Array.isArray(prod.images)) {
        for (const img of prod.images) {
          const url = img.mediumUrl || img.thumbnailUrl || img.originalUrl;
          if (url && !imageUrls.includes(url)) {
            imageUrls.push(url);
          }
        }
      }
    }

    const totalImages = imageUrls.length;
    onProgress?.({
      current: 0,
      total: totalImages,
      percentage: 10,
      stepName: `Téléchargement des photos (${totalImages} photos)...`,
    });

    // 3. Batch cache images into CacheStorage
    let imageCache: Cache | null = null;
    if ('caches' in window) {
      imageCache = await caches.open(IMAGE_CACHE);
    }

    const concurrency = 4;
    let completed = 0;

    for (let i = 0; i < totalImages; i += concurrency) {
      const chunk = imageUrls.slice(i, i + concurrency);

      await Promise.all(
        chunk.map(async (url) => {
          try {
            if (imageCache) {
              const match = await imageCache.match(url);
              if (!match) {
                const response = await fetch(url, { mode: 'cors' });
                if (response && response.status === 200) {
                  await imageCache.put(url, response);
                }
              }
            }
          } catch (err) {
            console.warn('Failed to pre-cache image:', url, err);
          } finally {
            completed++;
            const pct = 10 + Math.round((completed / totalImages) * 85);
            onProgress?.({
              current: completed,
              total: totalImages,
              percentage: Math.min(95, pct),
              stepName: `Photos enregistrées (${completed}/${totalImages})...`,
            });
          }
        })
      );
    }

    // 4. Save metadata
    const meta = {
      isSynced: true,
      productCount: totalProducts,
      lastSyncDate: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY_META, JSON.stringify(meta));

    onProgress?.({
      current: totalImages,
      total: totalImages,
      percentage: 100,
      stepName: 'Showroom hors-ligne synchronisé avec succès !',
    });

    return { success: true, count: totalProducts };
  } catch (err: any) {
    console.error('Offline Showroom Sync Failed:', err);
    throw err;
  }
}

/**
 * Returns the current status of the offline showroom cache
 */
export async function getOfflineShowroomStatus(): Promise<OfflineShowroomStatus> {
  if (typeof window === 'undefined') {
    return { isSynced: false, productCount: 0, storageMb: 0, lastSyncDate: null };
  }

  let isSynced = false;
  let productCount = 0;
  let lastSyncDate: string | null = null;

  try {
    const metaRaw = localStorage.getItem(STORAGE_KEY_META);
    if (metaRaw) {
      const meta = JSON.parse(metaRaw);
      isSynced = Boolean(meta.isSynced);
      productCount = meta.productCount || 0;
      lastSyncDate = meta.lastSyncDate || null;
    }
  } catch {}

  let storageMb = 0;
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const est = await navigator.storage.estimate();
      if (est.usage) {
        storageMb = Math.round((est.usage / (1024 * 1024)) * 10) / 10;
      }
    } catch {}
  }

  return {
    isSynced,
    productCount,
    storageMb,
    lastSyncDate,
  };
}

/**
 * Clears all cached offline showroom data
 */
export async function clearOfflineShowroomCache(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY_PRODUCTS);
    localStorage.removeItem(STORAGE_KEY_CATALOGS);
    localStorage.removeItem(STORAGE_KEY_META);

    if ('caches' in window) {
      await caches.delete(IMAGE_CACHE);
      await caches.delete(DATA_CACHE);
    }
  } catch (err) {
    console.warn('Error clearing offline cache:', err);
  }
}
