import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { Package, Search, Filter, Calendar, Euro, User, Building2 } from 'lucide-react';
import { ORDERS_QUERY } from '../graphql/orders';
import './OrdersPage.css';

interface OrderLine {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
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
  };
  owner: {
    id: string;
    firstName: string;
    lastName: string;
  };
  lines: OrderLine[];
}

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

  const { data, loading } = useQuery<{ orders: Order[] }>(ORDERS_QUERY);
  const orders = data?.orders || [];

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || order.status === statusFilter;
    
    // Date filter on createdAt
    let matchesDate = true;
    if (startDate) {
      const orderDate = new Date(order.createdAt);
      const filterStart = new Date(startDate);
      filterStart.setHours(0, 0, 0, 0);
      matchesDate = matchesDate && orderDate >= filterStart;
    }
    if (endDate) {
      const orderDate = new Date(order.createdAt);
      const filterEnd = new Date(endDate);
      filterEnd.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && orderDate <= filterEnd;
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusStats = () => {
    const stats: Record<string, { count: number; total: number }> = {};
    orders.forEach(order => {
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
        {(statusFilter || startDate || endDate) && (
          <button className="btn-clear-filter" onClick={() => { setStatusFilter(''); setStartDate(''); setEndDate(''); }}>
            <Filter size={16} />
            Effacer les filtres
          </button>
        )}
      </div>

      <div className="orders-table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Référence</th>
              <th>Client</th>
              <th>Statut</th>
              <th>Montant HT</th>
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
                    {formatCurrency(order.totalHT)}
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
