import { useState, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { useSetRecoilState } from 'recoil';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Package, Truck, CheckCircle, Clock, XCircle, Eye, Search, Filter, Calendar, ChevronDown, X, RefreshCw, TrendingUp, AlertTriangle, ShoppingCart } from 'lucide-react';
import { ORDERS_QUERY } from '../../graphql/orders';
import { PRODUCTS_QUERY, PRODUCT_KITS_QUERY } from '../../graphql/products';
import { cartState, CartItem } from '../../state/cart';
import './PortailCommandes.css';

interface OrderLine {
  id: string;
  productName: string;
  productCode: string;
  quantity: number;
  unitPrice: number;
  total: number;
  productId: string | null;
  kitId: string | null;
}

interface Product {
  id: string;
  code: string;
  name: string;
  unitPrice: number;
  isActive: boolean;
}

interface ProductKit {
  id: string;
  code: string;
  name: string;
  price: number;
  isActive: boolean;
}

interface RenewalWarning {
  productName: string;
  type: 'unavailable' | 'price_changed';
  oldPrice?: number;
  newPrice?: number;
}

interface Owner {
  id: string;
  firstName: string;
  lastName: string;
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
  validatedAt?: string | null;
  updatedAt?: string;
  lines: OrderLine[];
  owner?: Owner;
}

const TIMELINE_STEPS = [
  { status: 'BROUILLON', label: 'Brouillon', icon: Clock },
  { status: 'VALIDEE', label: 'Validée', icon: CheckCircle },
  { status: 'EN_PREPARATION', label: 'En préparation', icon: Package },
  { status: 'EXPEDIEE', label: 'Expédiée', icon: Truck },
  { status: 'LIVREE', label: 'Livrée', icon: CheckCircle },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  BROUILLON: { label: 'Brouillon', color: '#94a3b8', icon: <Clock size={16} /> },
  VALIDEE: { label: 'Validée', color: '#3b82f6', icon: <CheckCircle size={16} /> },
  EN_PREPARATION: { label: 'En préparation', color: '#f59e0b', icon: <Package size={16} /> },
  EXPEDIEE: { label: 'Expédiée', color: '#8b5cf6', icon: <Truck size={16} /> },
  LIVREE: { label: 'Livrée', color: '#10b981', icon: <CheckCircle size={16} /> },
  ANNULEE: { label: 'Annulée', color: '#ef4444', icon: <XCircle size={16} /> },
};

export default function PortailCommandes() {
  const navigate = useNavigate();
  const setCart = useSetRecoilState(cartState);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [dateStart, setDateStart] = useState<string>('');
  const [dateEnd, setDateEnd] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [periodFilter, setPeriodFilter] = useState<string>('');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [contributorFilter, setContributorFilter] = useState<string>('');
  const [renewalWarnings, setRenewalWarnings] = useState<RenewalWarning[]>([]);
  const [showRenewalModal, setShowRenewalModal] = useState(false);

  const PERIOD_OPTIONS = [
    { value: '', label: 'Toutes les périodes' },
    { value: 'current_month', label: 'Ce mois' },
    { value: 'previous_month', label: 'Mois précédent' },
    { value: 'previous_quarter', label: 'Trimestre précédent' },
    { value: 'previous_year', label: 'Année précédente' },
  ];

  const { data, loading, error } = useQuery<{ orders: Order[] }>(ORDERS_QUERY);
  const { data: productsData } = useQuery<{ products: Product[] }>(PRODUCTS_QUERY, { variables: { includeInactive: true } });
  const { data: kitsData } = useQuery<{ productKits: ProductKit[] }>(PRODUCT_KITS_QUERY, { variables: { includeInactive: true } });

  const getTimelineStatus = (order: Order, stepStatus: string): 'completed' | 'current' | 'pending' | 'cancelled' => {
    if (order.status === 'ANNULEE') return 'cancelled';
    
    const statusOrder = ['BROUILLON', 'VALIDEE', 'EN_PREPARATION', 'EXPEDIEE', 'LIVREE'];
    const currentIndex = statusOrder.indexOf(order.status);
    const stepIndex = statusOrder.indexOf(stepStatus);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  const getStepDate = (order: Order, stepStatus: string): string | null => {
    switch (stepStatus) {
      case 'BROUILLON':
        return order.createdAt;
      case 'VALIDEE':
        return order.validatedAt || null;
      case 'LIVREE':
        return order.deliveredAt || null;
      default:
        return null;
    }
  };

  const products = productsData?.products || [];
  const kits = kitsData?.productKits || [];
  const orders = data?.orders || [];

  // Statistics calculation
  const statistics = useMemo(() => {
    const validOrders = orders.filter(o => o.status !== 'ANNULEE' && o.status !== 'BROUILLON');
    const totalAmount = validOrders.reduce((sum, o) => sum + o.totalHT, 0);
    
    // Calculate top 5 products
    const productCounts: Record<string, { name: string; code: string; count: number; total: number }> = {};
    validOrders.forEach(order => {
      order.lines.forEach(line => {
        const key = line.productCode;
        if (!productCounts[key]) {
          productCounts[key] = { name: line.productName, code: line.productCode, count: 0, total: 0 };
        }
        productCounts[key].count += line.quantity;
        productCounts[key].total += line.total;
      });
    });
    
    const topProducts = Object.values(productCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    return { totalAmount, orderCount: validOrders.length, topProducts };
  }, [orders]);

  // Renewal function
  const handleRenewOrder = (order: Order) => {
    const warnings: RenewalWarning[] = [];
    const cartItems: CartItem[] = [];

    order.lines.forEach(line => {
      if (line.productId) {
        const currentProduct = products.find(p => p.id === line.productId);
        if (!currentProduct || !currentProduct.isActive) {
          warnings.push({ productName: line.productName, type: 'unavailable' });
        } else {
          if (Math.abs(currentProduct.unitPrice - line.unitPrice) > 0.01) {
            warnings.push({
              productName: line.productName,
              type: 'price_changed',
              oldPrice: line.unitPrice,
              newPrice: currentProduct.unitPrice,
            });
          }
          cartItems.push({
            id: line.productId,
            type: 'product',
            code: currentProduct.code,
            name: currentProduct.name,
            unitPrice: currentProduct.unitPrice,
            quantity: line.quantity,
          });
        }
      } else if (line.kitId) {
        const currentKit = kits.find(k => k.id === line.kitId);
        if (!currentKit || !currentKit.isActive) {
          warnings.push({ productName: line.productName, type: 'unavailable' });
        } else {
          if (Math.abs(currentKit.price - line.unitPrice) > 0.01) {
            warnings.push({
              productName: line.productName,
              type: 'price_changed',
              oldPrice: line.unitPrice,
              newPrice: currentKit.price,
            });
          }
          cartItems.push({
            id: line.kitId,
            type: 'kit',
            code: currentKit.code,
            name: currentKit.name,
            unitPrice: currentKit.price,
            quantity: line.quantity,
          });
        }
      }
    });

    if (warnings.length > 0) {
      setRenewalWarnings(warnings);
      setShowRenewalModal(true);
    }

    if (cartItems.length > 0) {
      setCart(prev => {
        const newCart = [...prev];
        cartItems.forEach(newItem => {
          const existing = newCart.find(c => c.id === newItem.id && c.type === newItem.type);
          if (existing) {
            existing.quantity += newItem.quantity;
          } else {
            newCart.push(newItem);
          }
        });
        return newCart;
      });

      if (warnings.length === 0) {
        setSelectedOrder(null);
        navigate('/portail/panier');
      }
    }
  };

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
    
    const matchesContributor = !contributorFilter || order.owner?.id === contributorFilter;
    return matchesSearch && matchesStatus && matchesDate && matchesContributor;
  });

  // Get unique contributors for filter
  const contributors = orders.reduce((acc, order) => {
    if (order.owner && !acc.find(c => c.id === order.owner!.id)) {
      acc.push(order.owner);
    }
    return acc;
  }, [] as Owner[]);

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

      {/* Statistics Section */}
      <div className="commandes-stats">
        <div className="stat-card">
          <TrendingUp size={24} />
          <div className="stat-content">
            <span className="stat-value">{formatCurrency(statistics.totalAmount)}</span>
            <span className="stat-label">Total commandé</span>
          </div>
        </div>
        <div className="stat-card">
          <ShoppingCart size={24} />
          <div className="stat-content">
            <span className="stat-value">{statistics.orderCount}</span>
            <span className="stat-label">Commandes validées</span>
          </div>
        </div>
        {statistics.topProducts.length > 0 && (
          <div className="stat-card top-products">
            <Package size={24} />
            <div className="stat-content">
              <span className="stat-label">Produits les plus commandés</span>
              <ul className="top-products-list">
                {statistics.topProducts.map((p, i) => (
                  <li key={p.code}>
                    <span className="rank">#{i + 1}</span>
                    <span className="name">{p.name}</span>
                    <span className="count">{p.count} unités</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

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

          {contributors.length > 0 && (
            <select
              className="contributor-filter"
              value={contributorFilter}
              onChange={(e) => setContributorFilter(e.target.value)}
            >
              <option value="">Tous les contributeurs</option>
              {contributors.map(c => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}
                </option>
              ))}
            </select>
          )}

          {(periodFilter || dateStart || dateEnd || searchTerm || contributorFilter) && (
            <button
              className="btn-clear-filters"
              onClick={() => {
                setPeriodFilter('');
                setDateStart('');
                setDateEnd('');
                setSearchTerm('');
                setContributorFilter('');
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
                    {order.owner && (
                      <span className="order-contributor">
                        Contributeur : {order.owner.firstName} {order.owner.lastName}
                      </span>
                    )}
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
              {/* Timeline des étapes */}
              {selectedOrder.status !== 'ANNULEE' ? (
                <div className="order-timeline">
                  {TIMELINE_STEPS.map((step, index) => {
                    const timelineStatus = getTimelineStatus(selectedOrder, step.status);
                    const stepDate = getStepDate(selectedOrder, step.status);
                    const IconComponent = step.icon;
                    return (
                      <div key={step.status} className={`timeline-step ${timelineStatus}`}>
                        <div className="timeline-icon">
                          <IconComponent size={18} />
                        </div>
                        {index < TIMELINE_STEPS.length - 1 && (
                          <div className={`timeline-connector ${timelineStatus === 'completed' ? 'completed' : ''}`} />
                        )}
                        <div className="timeline-content">
                          <span className="timeline-label">{step.label}</span>
                          {stepDate && timelineStatus !== 'pending' && (
                            <span className="timeline-date">{formatDate(stepDate)}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="order-cancelled-banner">
                  <XCircle size={20} />
                  <span>Cette commande a été annulée</span>
                </div>
              )}

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

              {/* Renewal button - only for non-draft and non-cancelled orders */}
              {selectedOrder.status !== 'ANNULEE' && selectedOrder.status !== 'BROUILLON' && selectedOrder.lines.length > 0 && (
                <div className="modal-actions">
                  <button
                    className="btn-renew"
                    onClick={() => handleRenewOrder(selectedOrder)}
                  >
                    <RefreshCw size={18} />
                    Renouveler cette commande
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Renewal Warning Modal */}
      {showRenewalModal && renewalWarnings.length > 0 && (
        <div className="modal-overlay" onClick={() => setShowRenewalModal(false)}>
          <div className="modal-content renewal-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header warning-header">
              <h2><AlertTriangle size={24} /> Attention</h2>
              <button className="btn-close" onClick={() => setShowRenewalModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p className="renewal-intro">
                Certains produits ont changé depuis votre dernière commande :
              </p>
              <ul className="renewal-warnings-list">
                {renewalWarnings.map((warning, index) => (
                  <li key={index} className={`warning-item ${warning.type}`}>
                    {warning.type === 'unavailable' ? (
                      <>
                        <XCircle size={16} />
                        <span><strong>{warning.productName}</strong> n'est plus disponible</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={16} />
                        <span>
                          <strong>{warning.productName}</strong> : prix modifié de {formatCurrency(warning.oldPrice || 0)} à {formatCurrency(warning.newPrice || 0)}
                        </span>
                      </>
                    )}
                  </li>
                ))}
              </ul>
              <p className="renewal-note">
                Les produits disponibles ont été ajoutés à votre panier avec les prix actuels.
              </p>
              <div className="renewal-actions">
                <button
                  className="btn-secondary"
                  onClick={() => setShowRenewalModal(false)}
                >
                  Fermer
                </button>
                <button
                  className="btn-primary"
                  onClick={() => {
                    setShowRenewalModal(false);
                    setSelectedOrder(null);
                    navigate('/portail/panier');
                  }}
                >
                  <ShoppingCart size={16} />
                  Voir le panier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
