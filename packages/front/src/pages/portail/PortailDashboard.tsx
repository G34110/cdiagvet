import { useQuery } from '@apollo/client';
import { useRecoilValue } from 'recoil';
import { Home, Package, ShoppingCart, ClipboardList, TrendingUp, Clock, CheckCircle, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ORDERS_QUERY } from '../../graphql/orders';
import { cartState } from '../../state/cart';
import { authState } from '../../state/auth';
import './PortailDashboard.css';

interface Order {
  id: string;
  reference: string;
  status: string;
  totalTTC: number;
  createdAt: string;
}

export default function PortailDashboard() {
  const navigate = useNavigate();
  const auth = useRecoilValue(authState);
  const cart = useRecoilValue(cartState);
  const { data } = useQuery<{ orders: Order[] }>(ORDERS_QUERY);

  const orders = data?.orders || [];
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const stats = {
    total: orders.length,
    enCours: orders.filter(o => ['VALIDEE', 'EN_PREPARATION', 'EXPEDIEE'].includes(o.status)).length,
    livrees: orders.filter(o => o.status === 'LIVREE').length,
    montantTotal: orders.reduce((sum, o) => sum + o.totalTTC, 0),
  };

  const recentOrders = orders.slice(0, 3);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

  return (
    <div className="portail-dashboard">
      <header className="dashboard-header">
        <div>
          <h1><Home size={28} /> Bonjour, {auth.user?.firstName || 'Distributeur'}</h1>
          <p className="subtitle">Bienvenue sur votre portail de commandes</p>
        </div>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#eff6ff', color: '#1e40af' }}>
            <ClipboardList size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Commandes totales</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.enCours}</span>
            <span className="stat-label">En cours</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#d1fae5', color: '#059669' }}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.livrees}</span>
            <span className="stat-label">Livrées</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ede9fe', color: '#7c3aed' }}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{formatCurrency(stats.montantTotal)}</span>
            <span className="stat-label">Volume d'achats</span>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <div className="action-card" onClick={() => navigate('/portail/catalogue')}>
          <Package size={32} />
          <h3>Catalogue</h3>
          <p>Parcourir nos produits et kits</p>
        </div>
        <div className="action-card" onClick={() => navigate('/portail/panier')}>
          <ShoppingCart size={32} />
          <h3>Panier</h3>
          <p>{cartCount > 0 ? `${cartCount} article${cartCount > 1 ? 's' : ''}` : 'Votre panier est vide'}</p>
        </div>
        <div className="action-card" onClick={() => navigate('/portail/commandes')}>
          <ClipboardList size={32} />
          <h3>Mes commandes</h3>
          <p>Consulter toutes vos commandes</p>
        </div>
      </div>

      {recentOrders.length > 0 && (
        <div className="recent-orders">
          <h2>3 dernières commandes</h2>
          <div className="orders-preview">
            {recentOrders.map(order => (
              <div key={order.id} className="order-preview-card" onClick={() => navigate('/portail/commandes')}>
                <div className="order-preview-info">
                  <span className="order-ref">{order.reference}</span>
                  <span className="order-date">{formatDate(order.createdAt)}</span>
                </div>
                <div className="order-preview-status">
                  {order.status === 'LIVREE' ? <CheckCircle size={16} /> : <Truck size={16} />}
                  <span>{order.status === 'LIVREE' ? 'Livrée' : 'En cours'}</span>
                </div>
                <span className="order-preview-amount">{formatCurrency(order.totalTTC)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
