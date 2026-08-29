// Utility to export clean, Excel-compatible CSV files with UTF-8 BOM support

function escapeCsvCell(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

function triggerCsvDownload(csvString: string, filename: string) {
  // Prepend UTF-8 BOM (\uFEFF) so Excel on Windows & Mac opens accents/Arabic perfectly
  const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// 1. Export Orders List to CSV
export function exportOrdersToCsv(orders: any[]) {
  if (!orders || orders.length === 0) return;

  const headers = [
    'N° Commande',
    'Date',
    'Nom Client',
    'Telephone',
    'Ville',
    'Statut',
    'Total Cartons',
    'Nombre Articles',
    'Resume Modeles',
  ];

  const rows = orders.map((o) => {
    const formattedDate = new Date(o.createdAt).toLocaleString('fr-FR');
    return [
      escapeCsvCell(o.orderNumber),
      escapeCsvCell(formattedDate),
      escapeCsvCell(o.customerName || ''),
      escapeCsvCell(o.customerPhone || ''),
      escapeCsvCell(o.customerCity || ''),
      escapeCsvCell(o.status),
      escapeCsvCell(o.totalCartons || 0),
      escapeCsvCell(o.itemCount || (o.items?.length || 0)),
      escapeCsvCell(o.itemsSummary || o.items?.map((it: any) => `${it.reference} (${it.cartons} ctn)`).join(', ') || ''),
    ].join(';');
  });

  const csvContent = [headers.map(escapeCsvCell).join(';'), ...rows].join('\r\n');
  const filename = `HS_Fashion_Commandes_${new Date().toISOString().split('T')[0]}.csv`;
  triggerCsvDownload(csvContent, filename);
}

// 2. Export Products & Performance to CSV
export function exportProductsPerformanceToCsv(products: any[]) {
  if (!products || products.length === 0) return;

  const headers = [
    'Reference',
    'Categorie',
    'Statut',
    'Vues Catalogue',
    'Cartons Commandes',
    'Date Ajout',
  ];

  const rows = products.map((p) => {
    const formattedDate = new Date(p.createdAt).toLocaleDateString('fr-FR');
    return [
      escapeCsvCell(p.reference),
      escapeCsvCell(p.familyName || p.family?.name || ''),
      escapeCsvCell(p.isActive ? 'Actif' : 'Inactif'),
      escapeCsvCell(p.views || 0),
      escapeCsvCell(p.orderedCartons || 0),
      escapeCsvCell(formattedDate),
    ].join(';');
  });

  const csvContent = [headers.map(escapeCsvCell).join(';'), ...rows].join('\r\n');
  const filename = `HS_Fashion_Performances_Produits_${new Date().toISOString().split('T')[0]}.csv`;
  triggerCsvDownload(csvContent, filename);
}

// 3. Export Comprehensive Executive Summary
export function exportAnalyticsSummaryToCsv(analytics: any) {
  if (!analytics) return;

  const lines: string[] = [];

  // Title
  lines.push(escapeCsvCell('RAPPORT ANALYTIQUE B2B - H.S.FASHION'));
  lines.push(escapeCsvCell(`Genere le : ${new Date().toLocaleString('fr-FR')}`));
  lines.push('');

  // KPIs
  lines.push(escapeCsvCell('--- INDICATEURS CLES DE PERFORMANCE ---'));
  lines.push([escapeCsvCell('Indicateur'), escapeCsvCell('Valeur')].join(';'));
  lines.push([escapeCsvCell('Total Commandes'), escapeCsvCell(analytics.summary.totalOrders)].join(';'));
  lines.push([escapeCsvCell('Commandes en Attente'), escapeCsvCell(analytics.summary.pendingOrders)].join(';'));
  lines.push([escapeCsvCell('Total Cartons Commandes'), escapeCsvCell(analytics.summary.totalCartons)].join(';'));
  lines.push([escapeCsvCell('Vues Totales Catalogue'), escapeCsvCell(analytics.summary.totalViews)].join(';'));
  lines.push([escapeCsvCell('Moyenne Cartons / Commande'), escapeCsvCell(analytics.summary.avgCartonsPerOrder)].join(';'));
  lines.push([escapeCsvCell('Total Modeles Actifs'), escapeCsvCell(analytics.summary.activeProducts)].join(';'));
  lines.push('');

  // Top 10 Viewed
  lines.push(escapeCsvCell('--- TOP 10 MODELES LES PLUS VUS ---'));
  lines.push([escapeCsvCell('Rang'), escapeCsvCell('Reference'), escapeCsvCell('Categorie'), escapeCsvCell('Vues')].join(';'));
  (analytics.topViewedProducts || []).forEach((p: any, idx: number) => {
    lines.push([escapeCsvCell(idx + 1), escapeCsvCell(p.reference), escapeCsvCell(p.familyName), escapeCsvCell(p.views)].join(';'));
  });
  lines.push('');

  // Top 10 Ordered
  lines.push(escapeCsvCell('--- TOP 10 MODELES LES PLUS COMMANDES ---'));
  lines.push([escapeCsvCell('Rang'), escapeCsvCell('Reference'), escapeCsvCell('Categorie'), escapeCsvCell('Cartons Commandes'), escapeCsvCell('Nombre Commandes')].join(';'));
  (analytics.topOrderedProducts || []).forEach((p: any, idx: number) => {
    lines.push([escapeCsvCell(idx + 1), escapeCsvCell(p.reference), escapeCsvCell(p.familyName), escapeCsvCell(p.totalCartons), escapeCsvCell(p.orderCount)].join(';'));
  });
  lines.push('');

  // Category Breakdown
  lines.push(escapeCsvCell('--- REPARTITION PAR FAMILLE / CATEGORIE ---'));
  lines.push([escapeCsvCell('Famille'), escapeCsvCell('Modeles'), escapeCsvCell('Vues'), escapeCsvCell('Part Vues (%)')].join(';'));
  (analytics.familyStats || []).forEach((f: any) => {
    lines.push([escapeCsvCell(f.name), escapeCsvCell(f.productCount), escapeCsvCell(f.views), escapeCsvCell(`${f.viewShare}%`)].join(';'));
  });

  const csvContent = lines.join('\r\n');
  const filename = `HS_Fashion_Rapport_Analytique_${new Date().toISOString().split('T')[0]}.csv`;
  triggerCsvDownload(csvContent, filename);
}
