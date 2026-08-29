import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

export interface LookbookProduct {
  id: string;
  reference: string;
  familyName: string;
  details?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  sizeAssortment?: Array<{ size: string; ratio: number }> | null;
}

export interface LookbookGeneratorOptions {
  title: string;
  subtitle?: string;
  products: LookbookProduct[];
  lang?: string;
  dict?: any;
  settings?: {
    phoneNumber?: string | null;
    email?: string | null;
    address?: string | null;
    promoMessage?: string | null;
  } | null;
  onProgress?: (progress: {
    current: number;
    total: number;
    stepName: string;
    percentage: number;
  }) => void;
}

// Helper to clean non-Latin/Emoji characters that break default jsPDF helvetica font
function cleanPdfText(str?: string | null): string {
  if (!str) return '';
  return str
    // Remove emojis
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    // Replace non-ASCII accents with standard Latin
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Format assortment range (e.g. "36/41 (12 paires)") or null if not set
function getAssortmentRange(product: LookbookProduct): string | null {
  if (product.sizeAssortment && Array.isArray(product.sizeAssortment) && product.sizeAssortment.length > 0) {
    const sizes = product.sizeAssortment.map((s) => s.size).filter(Boolean);
    const totalPairs = product.sizeAssortment.reduce((acc, it) => acc + (Number(it.ratio) || 0), 0);
    if (sizes.length > 0) {
      const minSize = sizes[0];
      const maxSize = sizes[sizes.length - 1];
      const range = minSize === maxSize ? minSize : `${minSize}/${maxSize}`;
      return `${range}  (${totalPairs} paires)`;
    }
  }
  return null;
}

// Convert image URL to optimized Base64 JPEG data
async function loadImageAsDataUrl(url: string, maxWidth = 800, maxHeight = 800): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const timeout = setTimeout(() => {
      resolve(null);
    }, 8000);

    img.onload = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }

        // Fill white background for transparent images
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataUrl);
      } catch (err) {
        console.warn('Canvas conversion error for image:', url, err);
        resolve(null);
      }
    };

    img.onerror = () => {
      clearTimeout(timeout);
      resolve(null);
    };

    // If Cloudinary URL, request optimized webp/jpeg thumbnail
    let finalUrl = url;
    if (url.includes('cloudinary.com') && !url.includes('w_800')) {
      finalUrl = url.replace('/image/upload/', '/image/upload/c_fit,w_800,h_800,q_85/');
    }

    img.src = finalUrl;
  });
}

// Generate QR Code data URL
async function generateQrCodeDataUrl(url: string): Promise<string | null> {
  try {
    return await QRCode.toDataURL(url, {
      width: 200,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.warn('QR Code generation error:', err);
    return null;
  }
}

export async function generatePdfLookbook({
  title,
  subtitle,
  products,
  lang = 'fr',
  dict,
  settings,
  onProgress,
}: LookbookGeneratorOptions): Promise<void> {
  const total = products.length;
  if (total === 0) return;

  const t = dict?.lookbook || {};
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://hsfashion.ma';

  // 1. Initialize jsPDF (A4 Portrait: 210mm x 297mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;

  // Clean strings
  const cleanTitle = cleanPdfText(title) || 'CATALOGUE B2B';
  const cleanSubtitle = cleanPdfText(subtitle);

  // -------------------------------------------------------------
  // STEP 1: Pre-fetch all images & generate QR codes with progress
  // -------------------------------------------------------------
  const processedProducts: Array<{
    product: LookbookProduct;
    imageDataUrl: string | null;
    qrDataUrl: string | null;
    productUrl: string;
  }> = [];

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const productUrl = `${origin}/${lang}/product/${encodeURIComponent(product.reference)}`;

    onProgress?.({
      current: i + 1,
      total,
      stepName: `Traitement des photos et QR codes (${i + 1}/${total})...`,
      percentage: Math.min(70, Math.max(5, Math.round(((i + 1) / total) * 70))),
    });

    const [imageDataUrl, qrDataUrl] = await Promise.all([
      product.imageUrl ? loadImageAsDataUrl(product.imageUrl) : Promise.resolve(null),
      generateQrCodeDataUrl(productUrl),
    ]);

    processedProducts.push({
      product,
      imageDataUrl,
      qrDataUrl,
      productUrl,
    });
  }

  onProgress?.({
    current: total,
    total,
    stepName: 'Mise en page de la couverture...',
    percentage: 75,
  });

  // -------------------------------------------------------------
  // STEP 2: Render COVER PAGE (Page 1)
  // -------------------------------------------------------------
  // Gradient/Banner top background
  doc.setFillColor(15, 23, 42); // #0f172a
  doc.rect(0, 0, pageWidth, 125, 'F');

  // Decorative Indigo stripe
  doc.setFillColor(79, 70, 229); // #4f46e5
  doc.rect(0, 125, pageWidth, 5, 'F');

  // Brand Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text('H.S.FASHION', margin, 32);

  // Brand Subtitle
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(199, 210, 254); // #c7d2fe
  doc.text('SHOWROOM DE CHAUSSURES & MAROQUINERIE - VENTE EN GROS', margin, 40);

  // Badge: B2B Wholesale Catalogue
  doc.setFillColor(79, 70, 229);
  doc.roundedRect(margin, 52, 55, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('CATALOGUE B2B 2026', margin + 5, 57.5);

  // Collection Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  const collectionTitleLines = doc.splitTextToSize(cleanTitle.toUpperCase(), pageWidth - margin * 2);
  doc.text(collectionTitleLines, margin, 74);

  // Subtitle / Description
  if (cleanSubtitle) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(226, 232, 240);
    const subLines = doc.splitTextToSize(cleanSubtitle, pageWidth - margin * 2);
    doc.text(subLines, margin, 86);
  }

  // Cover Stats Box (White area)
  const statsY = 145;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, statsY, pageWidth - margin * 2, 45, 4, 4, 'FD');

  // Stat 1: Total Models
  doc.setTextColor(79, 70, 229);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(String(total), margin + 15, statsY + 20);
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Modeles References', margin + 15, statsY + 28);

  // Stat 2: Conditionnement
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Par Carton Complet', margin + 75, statsY + 18);
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Distribution equilibree 12/15/18/24 paires', margin + 75, statsY + 28);

  // Stat 3: Clean Latin Date
  const monthNames = [
    'JANVIER', 'FEVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN',
    'JUILLET', 'AOUT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DECEMBRE',
  ];
  const now = new Date();
  const dateStr = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(dateStr, margin + 140, statsY + 18);
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Edition Showroom', margin + 140, statsY + 28);

  // Contact / Showroom Card
  const contactY = 205;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(79, 70, 229);
  doc.roundedRect(margin, contactY, pageWidth - margin * 2, 60, 4, 4, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('COMMANDES & INFORMATIONS COMMERCIALES', margin + 10, contactY + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);

  let contactRow = contactY + 24;
  if (settings?.phoneNumber) {
    doc.text(`Telephone / WhatsApp : ${cleanPdfText(settings.phoneNumber)}`, margin + 10, contactRow);
    contactRow += 8;
  }
  if (settings?.email) {
    doc.text(`Email : ${cleanPdfText(settings.email)}`, margin + 10, contactRow);
    contactRow += 8;
  }
  if (settings?.address) {
    doc.text(`Showroom & Depot : ${cleanPdfText(settings.address)}`, margin + 10, contactRow);
    contactRow += 8;
  }
  doc.text(`Catalogue en ligne : ${origin}`, margin + 10, contactRow);

  // Footer Cover
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'H.S.Fashion (c) 2026 - Document confidentiel destine aux professionnels et boutiques',
    margin,
    pageHeight - 10
  );

  // -------------------------------------------------------------
  // STEP 3: Render PRODUCT PAGES (Row-Like Line Sheet, 4 items / page)
  // -------------------------------------------------------------
  const itemsPerPage = 4;
  const totalPages = Math.ceil(processedProducts.length / itemsPerPage);

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    doc.addPage('a4', 'portrait');

    const currentPageNum = pageIdx + 2; // +1 for cover

    onProgress?.({
      current: Math.min((pageIdx + 1) * itemsPerPage, total),
      total,
      stepName: `Mise en page du catalogue (Page ${pageIdx + 1}/${totalPages})...`,
      percentage: 75 + Math.round(((pageIdx + 1) / totalPages) * 20),
    });

    // Header bar on product pages
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, pageWidth, 15, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(0, 15, pageWidth, 15);

    doc.setTextColor(79, 70, 229);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('H.S.FASHION - CATALOGUE B2B', margin, 10);

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(cleanTitle.toUpperCase(), pageWidth - margin, 10, { align: 'right' });

    // Render 4 row items
    const pageItems = processedProducts.slice(pageIdx * itemsPerPage, (pageIdx + 1) * itemsPerPage);

    pageItems.forEach((item, slotIdx) => {
      const cardHeight = 60;
      const cardY = 20 + slotIdx * 65; // 65mm spacing between rows

      // Cleaned fields
      const cleanRef = cleanPdfText(item.product.reference);
      const cleanFamily = cleanPdfText(item.product.familyName) || 'CHAUSSURES';
      const rangeText = getAssortmentRange(item.product);

      // Outer Row Card
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, cardY, pageWidth - margin * 2, cardHeight, 3, 3, 'FD');

      // Clickable product link covering the entire row
      doc.link(margin, cardY, pageWidth - margin * 2, cardHeight, { url: item.productUrl });

      // 1. Left: Product Photo (48mm x 48mm)
      const photoX = margin + 6;
      const photoY = cardY + 6;
      const photoSize = 48;

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(photoX, photoY, photoSize, photoSize, 2, 2, 'FD');

      if (item.imageDataUrl) {
        try {
          doc.addImage(item.imageDataUrl, 'JPEG', photoX + 1, photoY + 1, photoSize - 2, photoSize - 2);
        } catch (e) {
          console.warn('Could not add product image to PDF:', e);
        }
      } else {
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(7.5);
        doc.text('Photo non dispo', photoX + photoSize / 2, photoY + photoSize / 2, { align: 'center' });
      }

      // 2. Middle Column: Type + SKU Reference + Assortment Range
      const infoX = photoX + photoSize + 10;

      // Category Pill
      doc.setFillColor(238, 242, 255); // #eef2ff
      doc.setDrawColor(199, 210, 254);
      doc.roundedRect(infoX, cardY + 8, 42, 6, 1.5, 1.5, 'FD');
      doc.setTextColor(79, 70, 229);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text(cleanFamily.toUpperCase(), infoX + 3.5, cardY + 12.2);

      // SKU Reference (Large Bold)
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(cleanRef, infoX, cardY + 25);

      // Assortment Box (Only shown if configured)
      if (rangeText) {
        const boxWidth = 72;
        const boxHeight = 20;
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(infoX, cardY + 31, boxWidth, boxHeight, 2, 2, 'FD');

        doc.setTextColor(100, 116, 139);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.text('POINTURES / ASSORTIMENT :', infoX + 4, cardY + 37);

        doc.setTextColor(79, 70, 229);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(rangeText, infoX + 4, cardY + 46);
      }

      // 3. Right: Scannable QR Code (38mm x 38mm)
      const qrSize = 36;
      const qrX = pageWidth - margin - qrSize - 8;
      const qrY = cardY + 7;

      if (item.qrDataUrl) {
        try {
          doc.addImage(item.qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
          doc.setTextColor(100, 116, 139);
          doc.setFontSize(6.5);
          doc.setFont('helvetica', 'normal');
          doc.text('Scanner pour commander', qrX + qrSize / 2, qrY + qrSize + 4.5, { align: 'center' });
        } catch (e) {}
      }
    });

    // Page Footer
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('H.S.Fashion B2B Showroom', margin, pageHeight - 8);
    doc.text(
      `Page ${currentPageNum} sur ${totalPages + 1}`,
      pageWidth - margin,
      pageHeight - 8,
      { align: 'right' }
    );
  }

  // -------------------------------------------------------------
  // STEP 4: Save & Download PDF
  // -------------------------------------------------------------
  onProgress?.({
    current: total,
    total,
    stepName: 'Lookbook pret ! Telechargement en cours...',
    percentage: 100,
  });

  const filenameClean = `${cleanTitle.replace(/[^a-zA-Z0-9_]/g, '_')}_HS_Fashion_Lookbook.pdf`;
  doc.save(filenameClean);
}
