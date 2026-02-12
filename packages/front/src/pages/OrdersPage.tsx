import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { Package, Search, Filter, Calendar, Euro, User, Building2, ChevronDown } from 'lucide-react';
import { ORDERS_QUERY } from '../graphql/orders';
import './OrdersPage.css';

interface OrderLine {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Filiere {
  id: string;
  name: string;
}

interface Order {
  id: string;
  reference: string;
  status: string;
  totalHT: number;
  totalTTC: number;
  expectedDelivery?: string;
  createdAt: string;
  validatedAt?: string;
  client: {
    id: string;
    name: string;
    city?: string;
    segmentation?: string;
    filieres?: Filiere[];
  };
  owner: {
    id: string;
    firstName: string;
    lastName: string;
  };
  lines: OrderLine[];
}

const SEGMENTATION_OPTIONS = [
  { value: 'DISTRIBUTEUR', label: 'Distributeur', bg: '#DBEAFE', border: '#93C5FD', text: '#1E40AF' },
  { value: 'AGENT', label: 'Agent', bg: '#FEF3C7', border: '#FCD34D', text: '#92400E' },
  { value: 'AUTRES', label: 'Autres', bg: '#F3F4F6', border: '#D1D5DB', text: '#374151' },
];

const FILIERE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'Porcine': { bg: '#FFE4E6', border: '#FDA4AF', text: '#BE123C' },
  'Canine': { bg: '#E0E7FF', border: '#A5B4FC', text: '#4338CA' },
  'Ovine': { bg: '#D1FAE5', border: '#6EE7B7', text: '#047857' },
  'Bovine': { bg: '#F5E6D3', border: '#D4A574', text: '#8B4513' },
  'Apiculture': { bg: '#FEF08A', border: '#FACC15', text: '#854D0E' },
  'Aviculture': { bg: '#E0F2FE', border: '#7DD3FC', text: '#0369A1' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  BROUILLON: { label: 'Brouillon', color: '#6b7280' },
  VALIDEE: { label: 'Validée', color: '#3b82f6' },
  PREPARATION: { label: 'En préparation', color: '#8b5cf6' },
  EXPEDIEE: { label: 'Expédiée', color: '#f59e0b' },
  LIVREE: { label: 'Livrée', color: '#10b981' },
  ANNULEE: { label: 'Annulée', color: '#ef4444' },
};

export default function OrdersPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedSegmentations, setSelectedSegmentations] = useState<string[]>([]);
  const [selectedFilieres, setSelectedFilieres] = useState<string[]>([]);
  const [periodFilter, setPeriodFilter] = useState<string>('');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);

  const { data, loading } = useQuery<{ orders: Order[] }>(ORDERS_QUERY);
  const orders = data?.orders || [];

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

  // Extract unique filières from all orders
  const filieresMap: Record<string, Filiere> = {};
  orders.forEach(order => {
    order.client.filieres?.forEach(f => {
      if (!filieresMap[f.id]) filieresMap[f.id] = f;
    });
  });
  const filieres: Filiere[] = Object.values(filieresMap);

  // Compute counts
  const segmentationCounts: Record<string, number> = {};
  const filiereCounts: Record<string, number> = {};
  orders.forEach(order => {
    if (order.client.segmentation) {
      segmentationCounts[order.client.segmentation] = (segmentationCounts[order.client.segmentation] || 0) + 1;
    }
    order.client.filieres?.forEach(f => {
      filiereCounts[f.id] = (filiereCounts[f.id] || 0) + 1;
    });
  });

  const getFiliereColor = (name: string) => {
    return FILIERE_COLORS[name] || { bg: '#F3F4F6', border: '#D1D5DB', text: '#374151' };
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || order.status === statusFilter;
    
    // Segmentation filter
    const matchesSegmentation = selectedSegmentations.length === 0 || 
      (order.client.segmentation && selectedSegmentations.includes(order.client.segmentation));
    
    // Filière filter
    const matchesFiliere = selectedFilieres.length === 0 || 
      order.client.filieres?.some(f => selectedFilieres.includes(f.id));
    
    // Date filter on createdAt
    let matchesDate = true;
    const orderDate = new Date(order.createdAt);
    
    // Period filter
    if (periodFilter) {
      const now = new Date();
      let periodStart: Date;
      let periodEnd: Date;
      
      switch (periodFilter) {
        case 'current_month':
          periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
          periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          break;
        case 'previous_month':
          periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          periodEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
          break;
        case 'previous_quarter':
          const currentQuarter = Math.floor(now.getMonth() / 3);
          const prevQuarterStart = currentQuarter === 0 ? 9 : (currentQuarter - 1) * 3;
          const prevQuarterYear = currentQuarter === 0 ? now.getFullYear() - 1 : now.getFullYear();
          periodStart = new Date(prevQuarterYear, prevQuarterStart, 1);
          periodEnd = new Date(prevQuarterYear, prevQuarterStart + 3, 0, 23, 59, 59, 999);
          break;
        case 'previous_year':
          periodStart = new Date(now.getFullYear() - 1, 0, 1);
          periodEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
          break;
        default:
          periodStart = new Date(0);
          periodEnd = new Date();
      }
      matchesDate = orderDate >= periodStart && orderDate <= periodEnd;
    } else if (startDate || endDate) {
      if (startDate) {
        const filterStart = new Date(startDate);
        filterStart.setHours(0, 0, 0, 0);
        matchesDate = matchesDate && orderDate >= filterStart;
      }
      if (endDate) {
        const filterEnd = new Date(endDate);
        filterEnd.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && orderDate <= filterEnd;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate && matchesSegmentation && matchesFiliere;
  });

  // Orders filtered by period only (for stats cards)
  const ordersForStats = orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    
    if (periodFilter) {
      const now = new Date();
      let periodStart: Date;
      let periodEnd: Date;
      
      switch (periodFilter) {
        case 'current_month':
          periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
          periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          break;
        case 'previous_month':
          periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          periodEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
          break;
        case 'previous_quarter':
          const currentQuarter = Math.floor(now.getMonth() / 3);
          const prevQuarterStart = currentQuarter === 0 ? 9 : (currentQuarter - 1) * 3;
          const prevQuarterYear = currentQuarter === 0 ? now.getFullYear() - 1 : now.getFullYear();
          periodStart = new Date(prevQuarterYear, prevQuarterStart, 1);
          periodEnd = new Date(prevQuarterYear, prevQuarterStart + 3, 0, 23, 59, 59, 999);
          break;
        case 'previous_year':
          periodStart = new Date(now.getFullYear() - 1, 0, 1);
          periodEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
          break;
        default:
          return true;
      }
      return orderDate >= periodStart && orderDate <= periodEnd;
    } else if (startDate || endDate) {
      let matchesDate = true;
      if (startDate) {
        const filterStart = new Date(startDate);
        filterStart.setHours(0, 0, 0, 0);
        matchesDate = matchesDate && orderDate >= filterStart;
      }
      if (endDate) {
        const filterEnd = new Date(endDate);
        filterEnd.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && orderDate <= filterEnd;
      }
      return matchesDate;
    }
    return true;
  });

  const getStatusStats = () => {
    const stats: Record<string, { count: number; total: number }> = {};
    ordersForStats.forEach(order => {
      if (!stats[order.status]) {
        stats[order.status] = { count: 0, total: 0 };
      }
      stats[order.status].count++;
      stats[order.status].total += order.totalHT;
    });
    return stats;
  };

  const statusStats = getStatusStats();

  if (loading) {
    return <div className="loading">Chargement des commandes...</div>;
  }

  return (
    <div className="orders-page">
      <header className="page-header">
        <div>
          <h1><Package size={28} /> Commandes</h1>
          <p>{orders.length} commande{orders.length > 1 ? 's' : ''}</p>
        </div>
      </header>

      <div className="orders-stats">
        {Object.entries(STATUS_CONFIG).map(([status, config]) => (
          <div
            key={status}
            className={`stat-card ${statusFilter === status ? 'active' : ''}`}
            onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
            style={{ borderColor: config.color }}
          >
            <div className="stat-header">
              <span className="stat-badge" style={{ backgroundColor: config.color }}>
                {statusStats[status]?.count || 0}
              </span>
              <span className="stat-label">{config.label}</span>
            </div>
            <div className="stat-value" style={{ color: config.color }}>
              {formatCurrency(statusStats[status]?.total || 0)}
            </div>
          </div>
        ))}
      </div>

      <div className="orders-toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Rechercher par référence ou client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="period-filter-container" style={{ position: 'relative' }}>
          <button
            className={`btn-month-filter ${periodFilter ? 'active' : ''}`}
            onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
          >
            <Calendar size={16} />
            {periodFilter === 'current_month' ? 'Ce mois' :
             periodFilter === 'previous_month' ? 'Mois précédent' :
             periodFilter === 'previous_quarter' ? 'Trimestre précédent' :
             periodFilter === 'previous_year' ? 'Année précédente' :
             'Période'}
            <ChevronDown size={14} />
          </button>
          {showPeriodDropdown && (
            <div className="period-dropdown" style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '0.25rem',
              background: 'white',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 100,
              minWidth: '180px',
              overflow: 'hidden'
            }}>
              <button
                className="period-option"
                style={{
                  width: '100%',
                  padding: '0.6rem 1rem',
                  border: 'none',
                  background: periodFilter === 'current_month' ? '#EBF5FF' : 'white',
                  color: periodFilter === 'current_month' ? '#2563eb' : '#374151',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
                onClick={() => { setPeriodFilter('current_month'); setShowPeriodDropdown(false); setStartDate(''); setEndDate(''); }}
              >Ce mois</button>
              <button
                className="period-option"
                style={{
                  width: '100%',
                  padding: '0.6rem 1rem',
                  border: 'none',
                  background: periodFilter === 'previous_month' ? '#EBF5FF' : 'white',
                  color: periodFilter === 'previous_month' ? '#2563eb' : '#374151',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
                onClick={() => { setPeriodFilter('previous_month'); setShowPeriodDropdown(false); setStartDate(''); setEndDate(''); }}
              >Mois précédent</button>
              <button
                className="period-option"
                style={{
                  width: '100%',
                  padding: '0.6rem 1rem',
                  border: 'none',
                  background: periodFilter === 'previous_quarter' ? '#EBF5FF' : 'white',
                  color: periodFilter === 'previous_quarter' ? '#2563eb' : '#374151',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
                onClick={() => { setPeriodFilter('previous_quarter'); setShowPeriodDropdown(false); setStartDate(''); setEndDate(''); }}
              >Trimestre précédent</button>
              <button
                className="period-option"
                style={{
                  width: '100%',
                  padding: '0.6rem 1rem',
                  border: 'none',
                  background: periodFilter === 'previous_year' ? '#EBF5FF' : 'white',
                  color: periodFilter === 'previous_year' ? '#2563eb' : '#374151',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
                onClick={() => { setPeriodFilter('previous_year'); setShowPeriodDropdown(false); setStartDate(''); setEndDate(''); }}
              >Année précédente</button>
              <div style={{ borderTop: '1px solid #e5e7eb' }} />
              <button
                className="period-option"
                style={{
                  width: '100%',
                  padding: '0.6rem 1rem',
                  border: 'none',
                  background: !periodFilter ? '#EBF5FF' : 'white',
                  color: !periodFilter ? '#2563eb' : '#374151',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
                onClick={() => { setPeriodFilter(''); setShowPeriodDropdown(false); }}
              >Personnalisé</button>
            </div>
          )}
        </div>
        <div className="date-filters">
          <div className="date-filter">
            <Calendar size={16} />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              title="Date de début"
            />
          </div>
          <span className="date-separator">→</span>
          <div className="date-filter">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              title="Date de fin"
            />
          </div>
        </div>
        {(searchTerm || startDate || endDate || periodFilter) && (
          <button className="btn-clear-filter" onClick={() => { setSearchTerm(''); setStartDate(''); setEndDate(''); setPeriodFilter(''); }}>
            <Filter size={16} />
            Effacer les filtres
          </button>
        )}
      </div>

      {/* Segmentation and Filière filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
        {/* Segmentation filters */}
        {SEGMENTATION_OPTIONS.filter(seg => (segmentationCounts[seg.value] || 0) > 0).length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', color: '#6B7280', fontWeight: 500 }}>Segmentation :</span>
          {SEGMENTATION_OPTIONS.filter(seg => (segmentationCounts[seg.value] || 0) > 0).map(seg => (
            <button
              key={seg.value}
              type="button"
              onClick={() => setSelectedSegmentations(prev => 
                prev.includes(seg.value) ? prev.filter(s => s !== seg.value) : [...prev, seg.value]
              )}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '20px',
                border: `2px solid ${selectedSegmentations.includes(seg.value) ? seg.text : seg.border}`,
                background: seg.bg,
                color: seg.text,
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: selectedSegmentations.includes(seg.value) ? 600 : 500,
                transition: 'all 0.2s',
                boxShadow: selectedSegmentations.includes(seg.value) ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              {seg.label}
              <span style={{ marginLeft: '0.4rem', opacity: 0.8 }}>({segmentationCounts[seg.value] || 0})</span>
            </button>
          ))}
        </div>
        )}

        {/* Filière filters */}
        {filieres.filter(f => (filiereCounts[f.id] || 0) > 0).length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', color: '#6B7280', fontWeight: 500 }}>Filières :</span>
          {filieres.filter(f => (filiereCounts[f.id] || 0) > 0).map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSelectedFilieres(prev => 
                prev.includes(f.id) ? prev.filter(id => id !== f.id) : [...prev, f.id]
              )}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '20px',
                border: `2px solid ${selectedFilieres.includes(f.id) ? getFiliereColor(f.name).text : getFiliereColor(f.name).border}`,
                background: getFiliereColor(f.name).bg,
                color: getFiliereColor(f.name).text,
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: selectedFilieres.includes(f.id) ? 600 : 500,
                transition: 'all 0.2s',
                boxShadow: selectedFilieres.includes(f.id) ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              {f.name}
              <span style={{ marginLeft: '0.4rem', opacity: 0.8 }}>({filiereCounts[f.id] || 0})</span>
            </button>
          ))}
        </div>
        )}
      </div>

      <div className="orders-table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Référence</th>
              <th>Client</th>
              <th>Statut</th>
              <th>Montant TTC</th>
              <th>Date création</th>
              <th>Livraison prévue</th>
              <th>Commercial</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="no-data">Aucune commande trouvée</td>
              </tr>
            ) : (
              filteredOrders.map(order => (
                <tr key={order.id} onClick={() => navigate(`/commandes/${order.id}`)}>
                  <td className="ref-cell">
                    <Package size={16} />
                    {order.reference}
                  </td>
                  <td className="client-cell">
                    <Building2 size={14} />
                    <span className="client-info">
                      <span className="client-name">{order.client.name}</span>
                      {order.client.city && <span className="client-city">{order.client.city}</span>}
                    </span>
                  </td>
                  <td>
                    <span
                      className="status-badge"
                      style={{ backgroundColor: STATUS_CONFIG[order.status]?.color }}
                    >
                      {STATUS_CONFIG[order.status]?.label || order.status}
                    </span>
                  </td>
                  <td className="amount-cell">
                    <Euro size={14} />
                    {formatCurrency(order.totalTTC)}
                  </td>
                  <td className="date-cell">
                    <Calendar size={14} />
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="date-cell">
                    {order.expectedDelivery ? (
                      <>
                        <Calendar size={14} />
                        {formatDate(order.expectedDelivery)}
                      </>
                    ) : (
                      <span className="no-date">—</span>
                    )}
                  </td>
                  <td className="owner-cell">
                    <User size={14} />
                    {order.owner.firstName} {order.owner.lastName}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
