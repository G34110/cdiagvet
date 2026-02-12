import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { ClipboardList, Package, Truck, CheckCircle, Clock, XCircle, Eye, Search, Filter, Calendar, ChevronDown, X } from 'lucide-react';
import { ORDERS_QUERY } from '../../graphql/orders';
import './PortailCommandes.css';

interface OrderLine {
  id: string;
  productName: string;
  productCode: string;
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
  manualAmount?: number;
  expectedDelivery: string | null;
  deliveredAt: string | null;
  trackingNumber: string | null;
  createdAt: string;
  lines: OrderLine[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  BROUILLON: { label: 'Brouillon', color: '#94a3b8', icon: <Clock size={16} /> },
  VALIDEE: { label: 'Validée', color: '#3b82f6', icon: <CheckCircle size={16} /> },
  EN_PREPARATION: { label: 'En préparation', color: '#f59e0b', icon: <Package size={16} /> },
  EXPEDIEE: { label: 'Expédiée', color: '#8b5cf6', icon: <Truck size={16} /> },
  LIVREE: { label: 'Livrée', color: '#10b981', icon: <CheckCircle size={16} /> },
  ANNULEE: { label: 'Annulée', color: '#ef4444', icon: <XCircle size={16} /> },
};

export default function PortailCommandes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [dateStart, setDateStart] = useState<string>('');
  const [dateEnd, setDateEnd] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [periodFilter, setPeriodFilter] = useState<string>('');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);

  const PERIOD_OPTIONS = [
    { value: '', label: 'Toutes les périodes' },
    { value: 'current_month', label: 'Ce mois' },
    { value: 'previous_month', label: 'Mois précédent' },
    { value: 'previous_quarter', label: 'Trimestre précédent' },
    { value: 'previous_year', label: 'Année précédente' },
  ];

  const { data, loading, error } = useQuery<{ orders: Order[] }>(ORDERS_QUERY);

  const orders = data?.orders || [];

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilters.length === 0 || statusFilters.includes(order.status);
    const orderDate = new Date(order.createdAt);
    
    // Period filter
    let matchesDate = true;
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
    } else if (dateStart || dateEnd) {
      const matchesDateStart = !dateStart || orderDate >= new Date(dateStart);
      const matchesDateEnd = !dateEnd || orderDate <= new Date(dateEnd + 'T23:59:59');
      matchesDate = matchesDateStart && matchesDateEnd;
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const toggleStatus = (status: string) => {
    setStatusFilters(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  if (loading) {
    return <div className="loading">Chargement des commandes...</div>;
  }

  if (error) {
    return (
      <div className="error-message">
        <XCircle size={20} />
        Erreur lors du chargement des commandes
      </div>
    );
  }

  return (
    <div className="portail-commandes">
      <header className="commandes-header">
        <h1><ClipboardList size={28} /> Mes commandes</h1>
        <p>{orders.length} commande{orders.length > 1 ? 's' : ''}</p>
      </header>

      <div className="commandes-filters">
        <div className="filters-row">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Rechercher par référence..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="period-dropdown-container">
            <button
              className={`btn-period-filter ${periodFilter ? 'active' : ''}`}
              onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
            >
              <Calendar size={16} />
              {PERIOD_OPTIONS.find(o => o.value === periodFilter)?.label || 'Période'}
              <ChevronDown size={16} />
            </button>
            {showPeriodDropdown && (
              <div className="period-dropdown">
                {PERIOD_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    className={`period-option ${periodFilter === option.value ? 'active' : ''}`}
                    onClick={() => {
                      setPeriodFilter(option.value);
                      setShowPeriodDropdown(false);
                      if (option.value) {
                        setDateStart('');
                        setDateEnd('');
                      }
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {!periodFilter && (
            <div className="filter-group date-filter">
              <label>Du</label>
              <input
                type="date"
                value={dateStart}
                onChange={(e) => setDateStart(e.target.value)}
              />
              <label>au</label>
              <input
                type="date"
                value={dateEnd}
                onChange={(e) => setDateEnd(e.target.value)}
              />
            </div>
          )}

          {(periodFilter || dateStart || dateEnd || searchTerm) && (
            <button
              className="btn-clear-filters"
              onClick={() => {
                setPeriodFilter('');
                setDateStart('');
                setDateEnd('');
                setSearchTerm('');
              }}
            >
              <X size={16} />
              Effacer
            </button>
          )}
        </div>

        <div className="status-filters">
          <Filter size={18} />
          <div className="status-chips">
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <button
                key={key}
                className={`status-chip ${statusFilters.includes(key) ? 'active' : ''}`}
                style={{
                  background: statusFilters.includes(key) ? config.color : `${config.color}15`,
                  color: statusFilters.includes(key) ? 'white' : config.color,
                  borderColor: 'transparent',
                }}
                onClick={() => toggleStatus(key)}
              >
                {config.icon}
                {config.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="empty-state">
          <ClipboardList size={48} />
          <h3>Aucune commande</h3>
          <p>Vos commandes apparaîtront ici</p>
        </div>
      ) : (
        <div className="orders-list">
          {filteredOrders.map(order => {
            const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.BROUILLON;
            return (
              <div key={order.id} className="order-card">
                <div className="order-main">
                  <div className="order-info">
                    <h3 className="order-reference">{order.reference}</h3>
                    <span className="order-date">{formatDate(order.createdAt)}</span>
                  </div>
                  <div
                    className="order-status"
                    style={{ background: `${statusConfig.color}15`, color: statusConfig.color }}
                  >
                    {statusConfig.icon}
                    {statusConfig.label}
                  </div>
                </div>

                <div className="order-details">
                  <div className="order-items">
                    {order.lines.slice(0, 2).map(line => (
                      <span key={line.id} className="order-item">
                        {line.quantity}x {line.productName}
                      </span>
                    ))}
                    {order.lines.length > 2 && (
                      <span className="order-more">+{order.lines.length - 2} autres</span>
                    )}
                  </div>
                  <div className="order-total">
                    <span className="total-label">Total TTC</span>
                    <span className="total-value">{formatCurrency(order.totalTTC)}</span>
                  </div>
                </div>

                {order.trackingNumber && (
                  <div className="order-tracking">
                    <Truck size={14} />
                    <span>Suivi : {order.trackingNumber}</span>
                  </div>
                )}

                {order.expectedDelivery && order.status !== 'LIVREE' && order.status !== 'ANNULEE' && (
                  <div className="order-delivery">
                    <Clock size={14} />
                    <span>Livraison prévue : {formatDate(order.expectedDelivery)}</span>
                  </div>
                )}

                <button
                  className="btn-view-order"
                  onClick={() => setSelectedOrder(order)}
                >
                  <Eye size={16} />
                  Voir le détail
                </button>
              </div>
            );
          })}
        </div>
      )}

      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Commande {selectedOrder.reference}</h2>
              <button className="btn-close" onClick={() => setSelectedOrder(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-status">
                {(() => {
                  const config = STATUS_CONFIG[selectedOrder.status] || STATUS_CONFIG.BROUILLON;
                  return (
                    <span style={{ background: `${config.color}15`, color: config.color }}>
                      {config.icon} {config.label}
                    </span>
                  );
                })()}
                <span className="detail-date">Créée le {formatDate(selectedOrder.createdAt)}</span>
              </div>

              <h3>Articles commandés</h3>
              <table className="lines-table">
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th>Qté</th>
                    <th>Prix unit.</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.lines.map(line => (
                    <tr key={line.id}>
                      <td>
                        <div className="line-product">
                          <span className="line-name">{line.productName}</span>
                          <span className="line-code">{line.productCode}</span>
                        </div>
                      </td>
                      <td>{line.quantity}</td>
                      <td>{formatCurrency(line.unitPrice)}</td>
                      <td>{formatCurrency(line.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="detail-totals">
                {(() => {
                  const linesTotal = selectedOrder.lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
                  const additionalAmount = selectedOrder.manualAmount ?? (selectedOrder.totalHT - linesTotal);
                  const showAdditional = additionalAmount > 0.01;
                  return (
                    <>
                      {showAdditional && (
                        <div className="total-row">
                          <span>Sous-total lignes</span>
                          <span>{formatCurrency(linesTotal)}</span>
                        </div>
                      )}
                      {showAdditional && (
                        <div className="total-row">
                          <span>Montant additionnel</span>
                          <span>{formatCurrency(additionalAmount)}</span>
                        </div>
                      )}
                    </>
                  );
                })()}
                <div className="total-row">
                  <span>Total HT</span>
                  <span>{formatCurrency(selectedOrder.totalHT)}</span>
                </div>
                <div className="total-row">
                  <span>TVA (20%)</span>
                  <span>{formatCurrency(selectedOrder.totalTTC - selectedOrder.totalHT)}</span>
                </div>
                <div className="total-row total-final">
                  <span>Total TTC</span>
                  <span>{formatCurrency(selectedOrder.totalTTC)}</span>
                </div>
              </div>

              {selectedOrder.trackingNumber && (
                <div className="detail-tracking">
                  <Truck size={18} />
                  <div>
                    <strong>Numéro de suivi</strong>
                    <span>{selectedOrder.trackingNumber}</span>
                  </div>
                </div>
              )}

              {selectedOrder.expectedDelivery && (
                <div className="detail-delivery">
                  <Clock size={18} />
                  <div>
                    <strong>Date de livraison prévue</strong>
                    <span>{formatDate(selectedOrder.expectedDelivery)}</span>
                  </div>
                </div>
              )}

              {selectedOrder.deliveredAt && (
                <div className="detail-delivered">
                  <CheckCircle size={18} />
                  <div>
                    <strong>Livrée le</strong>
                    <span>{formatDate(selectedOrder.deliveredAt)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
