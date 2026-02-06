import { useState } from 'react';
import { FileText, FileSpreadsheet, Download, ChevronDown } from 'lucide-react';
import { generatePDFReport, generateExcelReport } from '../utils/reportGenerator';

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

interface ReportExportButtonProps {
  stats: DashboardStats | null;
  revenueByMonth: RevenueByMonth[];
  periodLabel: string;
  userName: string;
}

export default function ReportExportButton({
  stats,
  revenueByMonth,
  periodLabel,
  userName,
}: ReportExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExport = async (format: 'pdf' | 'excel') => {
    if (!stats) return;

    setIsGenerating(true);
    setIsOpen(false);

    try {
      const reportData = {
        stats,
        revenueByMonth,
        periodLabel,
        generatedAt: new Date(),
        userName,
      };

      if (format === 'pdf') {
        generatePDFReport(reportData);
      } else {
        generateExcelReport(reportData);
      }
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error);
      alert('Erreur lors de la génération du rapport');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={!stats || isGenerating}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          border: '1px solid var(--primary)',
          borderRadius: '0.5rem',
          background: 'var(--primary)',
          color: 'white',
          cursor: stats ? 'pointer' : 'not-allowed',
          fontSize: '0.875rem',
          fontWeight: 500,
          opacity: stats ? 1 : 0.5,
        }}
      >
        <Download size={16} />
        {isGenerating ? 'Génération...' : 'Exporter rapport'}
        <ChevronDown size={16} />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '0.25rem',
            background: 'white',
            border: '1px solid var(--border)',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 100,
            minWidth: '180px',
            overflow: 'hidden',
          }}
        >
          <button
            type="button"
            onClick={() => handleExport('pdf')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              width: '100%',
              padding: '0.75rem 1rem',
              border: 'none',
              background: 'transparent',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            <FileText size={18} style={{ color: '#ef4444' }} />
            Télécharger PDF
          </button>
          <button
            type="button"
            onClick={() => handleExport('excel')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              width: '100%',
              padding: '0.75rem 1rem',
              border: 'none',
              background: 'transparent',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            <FileSpreadsheet size={18} style={{ color: '#22c55e' }} />
            Télécharger Excel
          </button>
        </div>
      )}
    </div>
  );
}
