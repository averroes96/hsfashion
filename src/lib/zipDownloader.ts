import JSZip from 'jszip';

export interface ImageToDownload {
  url: string;
  reference: string;
  family?: string;
  index?: number;
}

export interface DownloadProgress {
  current: number;
  total: number;
  percentage: number;
  status: 'fetching' | 'saving' | 'zipping' | 'completed' | 'error';
  currentFile?: string;
  error?: string;
}

/**
 * Checks if the current environment is a mobile device (iPhone, iPad, Android).
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 0 && window.innerWidth <= 820)
  );
}

/**
 * Downloads raw images sequentially as individual .jpg files directly into the browser
 */
export async function downloadPureImagesSequentially({
  images,
  onProgress,
}: {
  images: ImageToDownload[];
  onProgress?: (progress: DownloadProgress) => void;
}): Promise<void> {
  const total = images.length;
  let completed = 0;
  const usedNames = new Map<string, number>();

  for (const item of images) {
    const cleanRef = item.reference.replace(/[/\\?%*:|"<>]/g, '-').trim();
    const count = usedNames.get(cleanRef) || 0;
    usedNames.set(cleanRef, count + 1);

    let ext = 'jpg';
    try {
      const urlObj = new URL(item.url);
      if (urlObj.pathname.endsWith('.png')) ext = 'png';
      else if (urlObj.pathname.endsWith('.webp')) ext = 'webp';
    } catch {}

    const filename = count === 0 ? `${cleanRef}.${ext}` : `${cleanRef}_${count + 1}.${ext}`;

    if (onProgress) {
      onProgress({
        current: completed,
        total,
        percentage: Math.round((completed / total) * 100),
        status: 'saving',
        currentFile: filename,
      });
    }

    try {
      const response = await fetch(item.url, { mode: 'cors' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 1500);

      // Delay between multi downloads to prevent browser blocking
      if (total > 1) {
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
    } catch (err) {
      console.warn(`Failed to download ${filename}:`, err);
    } finally {
      completed++;
      if (onProgress) {
        onProgress({
          current: completed,
          total,
          percentage: Math.round((completed / total) * 100),
          status: completed === total ? 'completed' : 'saving',
          currentFile: filename,
        });
      }
    }
  }
}

/**
 * Downloads a list of image URLs as pure images on mobile (saving to Photos/Gallery via Web Share)
 * or as a structured ZIP file on desktop.
 */
export async function downloadImagesSmartly({
  images,
  title,
  onProgress,
  forceZip = false,
}: {
  images: ImageToDownload[];
  title: string;
  onProgress?: (progress: DownloadProgress) => void;
  forceZip?: boolean;
}): Promise<void> {
  if (!images || images.length === 0) {
    throw new Error('No images to download');
  }

  const isMobile = isMobileDevice();

  // Mobile path: Save directly to Photo Gallery via Web Share API if supported
  if (isMobile && !forceZip) {
    if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
      try {
        const total = images.length;
        let completed = 0;
        const files: File[] = [];
        const usedNames = new Map<string, number>();

        for (const item of images) {
          const cleanRef = item.reference.replace(/[/\\?%*:|"<>]/g, '-').trim();
          const count = usedNames.get(cleanRef) || 0;
          usedNames.set(cleanRef, count + 1);

          let ext = 'jpg';
          try {
            const urlObj = new URL(item.url);
            if (urlObj.pathname.endsWith('.png')) ext = 'png';
            else if (urlObj.pathname.endsWith('.webp')) ext = 'webp';
          } catch {}

          const filename = count === 0 ? `${cleanRef}.${ext}` : `${cleanRef}_${count + 1}.${ext}`;
          const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

          if (onProgress) {
            onProgress({
              current: completed,
              total,
              percentage: Math.round((completed / total) * 90),
              status: 'fetching',
              currentFile: filename,
            });
          }

          try {
            const res = await fetch(item.url, { mode: 'cors' });
            if (res.ok) {
              const blob = await res.blob();
              const file = new File([blob], filename, { type: mimeType });
              files.push(file);
            }
          } catch (e) {
            console.warn(`Fetch failed for ${filename}`, e);
          } finally {
            completed++;
          }
        }

        if (files.length > 0 && navigator.canShare({ files })) {
          if (onProgress) {
            onProgress({
              current: total,
              total,
              percentage: 100,
              status: 'completed',
            });
          }

          await navigator.share({
            files,
            title: title || 'HS Fashion Photos',
          });
          return;
        }
      } catch (shareErr: any) {
        if (shareErr.name === 'AbortError') {
          // User closed the share sheet
          if (onProgress) {
            onProgress({
              current: images.length,
              total: images.length,
              percentage: 100,
              status: 'completed',
            });
          }
          return;
        }
        console.warn('Native share failed, downloading as individual images', shareErr);
      }
    }

    // Fallback on mobile: Download as pure sequential .jpg files directly
    await downloadPureImagesSequentially({ images, onProgress });
    return;
  }

  // Desktop or explicit ZIP request: Bundle in ZIP
  await downloadImagesAsZip({
    images,
    zipFilename: title,
    onProgress,
  });
}

/**
 * Downloads a list of image URLs, bundles them into a ZIP file with clean filenames,
 * and triggers a client-side download in the browser.
 */
export async function downloadImagesAsZip({
  images,
  zipFilename,
  onProgress,
}: {
  images: ImageToDownload[];
  zipFilename: string;
  onProgress?: (progress: DownloadProgress) => void;
}): Promise<void> {
  if (!images || images.length === 0) {
    throw new Error('No images to download');
  }

  const zip = new JSZip();
  const total = images.length;
  let completedCount = 0;

  const usedFilenames = new Map<string, number>();
  const CONCURRENCY = 4;

  for (let i = 0; i < total; i += CONCURRENCY) {
    const chunk = images.slice(i, i + CONCURRENCY);

    await Promise.all(
      chunk.map(async (item) => {
        const cleanRef = item.reference.replace(/[/\\?%*:|"<>]/g, '-').trim();
        const baseKey = item.family 
          ? `${item.family.replace(/[/\\?%*:|"<>]/g, '-').trim()}/${cleanRef}`
          : cleanRef;

        const count = usedFilenames.get(baseKey) || 0;
        usedFilenames.set(baseKey, count + 1);

        let ext = 'jpg';
        try {
          const urlObj = new URL(item.url);
          const pathname = urlObj.pathname;
          if (pathname.endsWith('.png')) ext = 'png';
          else if (pathname.endsWith('.webp')) ext = 'webp';
          else if (pathname.endsWith('.jpeg')) ext = 'jpeg';
        } catch {}

        const finalFilename = count === 0 ? `${baseKey}.${ext}` : `${baseKey}_${count + 1}.${ext}`;

        try {
          if (onProgress) {
            onProgress({
              current: completedCount,
              total,
              percentage: Math.round((completedCount / total) * 85),
              status: 'fetching',
              currentFile: finalFilename,
            });
          }

          const response = await fetch(item.url, { mode: 'cors' });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const blob = await response.blob();

          zip.file(finalFilename, blob);
        } catch (err) {
          console.warn(`Failed to download image: ${item.url}`, err);
        } finally {
          completedCount++;
          if (onProgress) {
            onProgress({
              current: completedCount,
              total,
              percentage: Math.round((completedCount / total) * 85),
              status: 'fetching',
              currentFile: finalFilename,
            });
          }
        }
      })
    );
  }

  // Generate the ZIP blob
  if (onProgress) {
    onProgress({
      current: total,
      total,
      percentage: 90,
      status: 'zipping',
    });
  }

  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      if (onProgress) {
        onProgress({
          current: total,
          total,
          percentage: 90 + Math.round((metadata.percent / 100) * 10),
          status: 'zipping',
        });
      }
    }
  );

  // Trigger browser download
  const downloadUrl = URL.createObjectURL(zipBlob);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  const safeZipName = zipFilename.endsWith('.zip') ? zipFilename : `${zipFilename}.zip`;
  anchor.download = safeZipName.replace(/[/\\?%*:|"<>]/g, '-');
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  setTimeout(() => {
    URL.revokeObjectURL(downloadUrl);
  }, 1000);

  if (onProgress) {
    onProgress({
      current: total,
      total,
      percentage: 100,
      status: 'completed',
    });
  }
}
