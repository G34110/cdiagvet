import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface DashboardStats {
  totalClients: number;
  activeClients: number;
  totalVisits: number;
  visitsThisMonth: number;
  totalLots: number;
  totalRevenue: number;
  revenueThisMonth: number;
}

interface RevenueByMonth {
  month: string;
  revenue: number;
}

interface ReportData {
  stats: DashboardStats;
  revenueByMonth: RevenueByMonth[];
  periodLabel: string;
  generatedAt: Date;
  userName: string;
}

export function generatePDFReport(data: ReportData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(59, 130, 246); // Blue
  doc.text('Rapport Dashboard', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(`Période: ${data.periodLabel}`, pageWidth / 2, 30, { align: 'center' });
  doc.text(`Généré le: ${data.generatedAt.toLocaleDateString('fr-FR')} à ${data.generatedAt.toLocaleTimeString('fr-FR')}`, pageWidth / 2, 37, { align: 'center' });
  doc.text(`Par: ${data.userName}`, pageWidth / 2, 44, { align: 'center' });

  // KPIs Section
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('Indicateurs Clés (KPIs)', 14, 60);

  const kpiData = [
    ['Clients actifs', `${data.stats.activeClients} / ${data.stats.totalClients}`],
    ['Visites (période)', `${data.stats.visitsThisMonth} / ${data.stats.totalVisits} total`],
    ['CA (période)', `${data.stats.revenueThisMonth.toLocaleString('fr-FR')} €`],
    ['CA Total', `${data.stats.totalRevenue.toLocaleString('fr-FR')} €`],
    ['Lots livrés', `${data.stats.totalLots}`],
  ];

  autoTable(doc, {
    startY: 65,
    head: [['Indicateur', 'Valeur']],
    body: kpiData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    margin: { left: 14, right: 14 },
  });

  // Revenue by Month Section
  const finalY = (doc as any).lastAutoTable.finalY || 120;
  
  doc.setFontSize(14);
  doc.text('Évolution du Chiffre d\'Affaires', 14, finalY + 15);

  const revenueData = data.revenueByMonth.map(item => [
    item.month,
    `${item.revenue.toLocaleString('fr-FR')} €`,
  ]);

  autoTable(doc, {
    startY: finalY + 20,
    head: [['Mois', 'CA']],
    body: revenueData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    margin: { left: 14, right: 14 },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(
      `Page ${i} / ${pageCount} - CRM Diagnostics Vétérinaires`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save
  const fileName = `rapport-dashboard-${data.periodLabel.replace(/\s+/g, '-')}-${data.generatedAt.toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

export function generateExcelReport(data: ReportData): void {
  // Create workbook
  const wb = XLSX.utils.book_new();

  // KPIs Sheet
  const kpiSheet = XLSX.utils.aoa_to_sheet([
    ['Rapport Dashboard'],
    [`Période: ${data.periodLabel}`],
    [`Généré le: ${data.generatedAt.toLocaleDateString('fr-FR')} ${data.generatedAt.toLocaleTimeString('fr-FR')}`],
    [`Par: ${data.userName}`],
    [],
    ['Indicateurs Clés (KPIs)'],
    ['Indicateur', 'Valeur'],
    ['Clients actifs', data.stats.activeClients],
    ['Clients total', data.stats.totalClients],
    ['Visites (période)', data.stats.visitsThisMonth],
    ['Visites total', data.stats.totalVisits],
    ['CA (période)', data.stats.revenueThisMonth],
    ['CA Total', data.stats.totalRevenue],
    ['Lots livrés', data.stats.totalLots],
  ]);

  // Set column widths
  kpiSheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, kpiSheet, 'KPIs');

  // Revenue by Month Sheet
  const revenueSheetData = [
    ['Évolution du Chiffre d\'Affaires'],
    [],
    ['Mois', 'CA (€)'],
    ...data.revenueByMonth.map(item => [item.month, item.revenue]),
  ];
  
  const revenueSheet = XLSX.utils.aoa_to_sheet(revenueSheetData);
  revenueSheet['!cols'] = [{ wch: 15 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, revenueSheet, 'CA par Mois');

  // Generate file
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const fileName = `rapport-dashboard-${data.periodLabel.replace(/\s+/g, '-')}-${data.generatedAt.toISOString().split('T')[0]}.xlsx`;
  
  saveAs(new Blob([wbout], { type: 'application/octet-stream' }), fileName);
}
