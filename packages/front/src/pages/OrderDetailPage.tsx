import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import {
  ArrowLeft,
  Package,
  Building2,
  User,
  Calendar,
  Euro,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  ExternalLink,
} from 'lucide-react';
import {
  ORDER_QUERY,
  VALIDATE_ORDER_MUTATION,
  CANCEL_ORDER_MUTATION,
  UPDATE_ORDER_STATUS_MUTATION,
} from '../graphql/orders';
import './OrderDetailPage.css';

interface OrderLine {
  id: string;
  productName: string;
  productCode?: string;
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
  taxRate: number;
  manualAmount?: number;
  expectedDelivery?: string;
  deliveredAt?: string;
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  validatedAt?: string;
  opportunityId?: string;
  client: {
    id: string;
    name: string;
    organization?: string;
    email?: string;
    phone?: string;
    addressLine1?: string;
    city?: string;
    postalCode?: string;
  };
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  lines: OrderLine[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  BROUILLON: { label: 'Brouillon', color: '#6b7280', icon: FileText },
  VALIDEE: { label: 'Validée', color: '#3b82f6', icon: CheckCircle },
  PREPARATION: { label: 'En préparation', color: '#8b5cf6', icon: Clock },
  EXPEDIEE: { label: 'Expédiée', color: '#f59e0b', icon: Truck },
  LIVREE: { label: 'Livrée', color: '#10b981', icon: CheckCircle },
  ANNULEE: { label: 'Annulée', color: '#ef4444', icon: XCircle },
};

const NEXT_STATUS: Record<string, string> = {
  BROUILLON: 'VALIDEE',
  VALIDEE: 'PREPARATION',
  PREPARATION: 'EXPEDIEE',
  EXPEDIEE: 'LIVREE',
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const { data, loading, error, refetch } = useQuery<{ order: Order }>(ORDER_QUERY, {
    variables: { id },
    skip: !id,
  });

  console.log('OrderDetailPage - id:', id, 'loading:', loading, 'error:', error, 'data:', data);

  const [validateOrder, { loading: validating }] = useMutation(VALIDATE_ORDER_MUTATION);
  const [cancelOrder, { loading: cancelling }] = useMutation(CANCEL_ORDER_MUTATION);
  const [updateStatus, { loading: updatingStatus }] = useMutation(UPDATE_ORDER_STATUS_MUTATION);

  const order = data?.order;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  const formatDateTime = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const handleValidate = async () => {
    if (!id) return;
    try {
      await validateOrder({ variables: { id } });
      refetch();
    } catch (error: any) {
      alert(`Erreur: ${error.message}`);
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    try {
      await cancelOrder({ variables: { id } });
      setShowCancelConfirm(false);
      refetch();
    } catch (error: any) {
      alert(`Erreur: ${error.message}`);
    }
  };

  const handleNextStatus = async () => {
    if (!id || !order) return;
    const nextStatus = NEXT_STATUS[order.status];
    if (!nextStatus) return;

    try {
      await updateStatus({
        variables: {
          input: { id, status: nextStatus },
        },
      });
      refetch();
    } catch (error: any) {
      alert(`Erreur: ${error.message}`);
    }
  };

  if (loading) {
    return <div className="loading">Chargement de la commande...</div>;
  }

  if (error) {
    return <div className="not-found">Erreur: {error.message}</div>;
  }

  if (!order) {
    return <div className="not-found">Commande non trouvée (ID: {id})</div>;
  }

  const StatusIcon = STATUS_CONFIG[order.status]?.icon || Package;
  const canValidate = order.status === 'BROUILLON';
  const canAdvance = NEXT_STATUS[order.status] !== undefined;
  const canCancel = order.status !== 'LIVREE' && order.status !== 'ANNULEE';

  return (
    <div className="order-detail-page">
      <header className="page-header">
        <button className="btn-back" onClick={() => navigate('/commandes')}>
          <ArrowLeft size={20} />
          Retour
        </button>
        <div className="header-actions">
          {canCancel && (
            <button
              className="btn-danger"
              onClick={() => setShowCancelConfirm(true)}
              disabled={cancelling}
            >
              <XCircle size={18} />
              Annuler
            </button>
          )}
          {canValidate && (
            <button
              className="btn-primary"
              onClick={handleValidate}
              disabled={validating}
            >
              <CheckCircle size={18} />
              Valider la commande
            </button>
          )}
          {canAdvance && order.status !== 'BROUILLON' && (
            <button
              className="btn-primary"
              onClick={handleNextStatus}
              disabled={updatingStatus}
            >
              <Truck size={18} />
              Passer à {STATUS_CONFIG[NEXT_STATUS[order.status]]?.label}
            </button>
          )}
        </div>
      </header>

      <div className="order-header">
        <div className="order-title">
          <Package size={32} />
          <div>
            <h1>{order.reference}</h1>
            <p className="client-name">
              <Building2 size={16} />
              {order.client.name}
              {order.client.organization && ` (${order.client.organization})`}
            </p>
          </div>
        </div>

        <div className="order-stats">
          <div className="stat">
            <StatusIcon size={20} style={{ color: STATUS_CONFIG[order.status]?.color }} />
            <span
              className="status-badge"
              style={{ backgroundColor: STATUS_CONFIG[order.status]?.color }}
            >
              {STATUS_CONFIG[order.status]?.label || order.status}
            </span>
          </div>
          <div className="stat">
            <Euro size={20} />
            <span className="stat-value">{formatCurrency(order.totalHT)}</span>
            <span className="stat-label">HT</span>
          </div>
          <div className="stat">
            <Euro size={20} style={{ opacity: 0.5 }} />
            <span className="stat-value">{formatCurrency(order.totalTTC)}</span>
            <span className="stat-label">TTC</span>
          </div>
          <div className="stat">
            <Calendar size={20} />
            <span className="stat-value">{formatDate(order.createdAt)}</span>
            <span className="stat-label">Créée le</span>
          </div>
        </div>
      </div>

      <div className="order-content">
        <section className="info-section">
          <h2>Informations</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Client</label>
              <span>{order.client.name}</span>
            </div>
            <div className="info-item">
              <label>Email</label>
              <span>{order.client.email || '—'}</span>
            </div>
            <div className="info-item">
              <label>Téléphone</label>
              <span>{order.client.phone || '—'}</span>
            </div>
            <div className="info-item">
              <label>Adresse</label>
              <span>
                {order.client.addressLine1
                  ? `${order.client.addressLine1}, ${order.client.postalCode} ${order.client.city}`
                  : '—'}
              </span>
            </div>
            <div className="info-item">
              <label>Contributeur</label>
              <span>
                <User size={14} />
                {order.owner.firstName} {order.owner.lastName}
              </span>
            </div>
            <div className="info-item">
              <label>Livraison prévue</label>
              <span>
                {order.expectedDelivery ? formatDate(order.expectedDelivery) : '—'}
              </span>
            </div>
            {order.trackingNumber && (
              <div className="info-item">
                <label>N° de suivi</label>
                <span>{order.trackingNumber}</span>
              </div>
            )}
            {order.opportunityId && (
              <div className="info-item">
                <label>Opportunité source</label>
                <button
                  className="link-btn"
                  onClick={() => navigate(`/pipeline/${order.opportunityId}`)}
                >
                  <ExternalLink size={14} />
                  Voir l'opportunité
                </button>
              </div>
            )}
          </div>
          {order.notes && (
            <div className="notes-section">
              <label>Notes</label>
              <p>{order.notes}</p>
            </div>
          )}
        </section>

        <section className="lines-section">
          <h2>Lignes de commande</h2>
          <table className="lines-table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Code</th>
                <th>Qté</th>
                <th>Prix unitaire</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.lines.map(line => (
                <tr key={line.id}>
                  <td>{line.productName}</td>
                  <td>{line.productCode || '—'}</td>
                  <td className="qty-cell">{line.quantity}</td>
                  <td className="price-cell">{formatCurrency(line.unitPrice)}</td>
                  <td className="total-cell">{formatCurrency(line.quantity * line.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              {(() => {
                const linesTotal = order.lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
                const additionalAmount = order.manualAmount ?? (order.totalHT - linesTotal);
                const showAdditional = additionalAmount > 0.01;
                return (
                  <>
                    {showAdditional && (
                      <tr>
                        <td colSpan={4} className="total-label">Sous-total lignes</td>
                        <td className="total-value">{formatCurrency(linesTotal)}</td>
                      </tr>
                    )}
                    {showAdditional && (
                      <tr>
                        <td colSpan={4} className="total-label">Montant additionnel</td>
                        <td className="total-value">{formatCurrency(additionalAmount)}</td>
                      </tr>
                    )}
                    <tr>
                      <td colSpan={4} className="total-label">Total HT</td>
                      <td className="total-value">{formatCurrency(order.totalHT)}</td>
                    </tr>
                  </>
                );
              })()}
              <tr>
                <td colSpan={4} className="total-label">TVA ({order.taxRate}%)</td>
                <td className="total-value">{formatCurrency(order.totalTTC - order.totalHT)}</td>
              </tr>
              <tr className="grand-total">
                <td colSpan={4} className="total-label">Total TTC</td>
                <td className="total-value">{formatCurrency(order.totalTTC)}</td>
              </tr>
            </tfoot>
          </table>
        </section>

        <section className="timeline-section">
          <h2>Historique</h2>
          <div className="timeline">
            <div className="timeline-item">
              <div className="timeline-dot" style={{ backgroundColor: '#6b7280' }}></div>
              <div className="timeline-content">
                <span className="timeline-date">{formatDateTime(order.createdAt)}</span>
                <span className="timeline-text">Commande créée</span>
              </div>
            </div>
            {order.validatedAt && (
              <div className="timeline-item">
                <div className="timeline-dot" style={{ backgroundColor: '#3b82f6' }}></div>
                <div className="timeline-content">
                  <span className="timeline-date">{formatDateTime(order.validatedAt)}</span>
                  <span className="timeline-text">Commande validée</span>
                </div>
              </div>
            )}
            {order.deliveredAt && (
              <div className="timeline-item">
                <div className="timeline-dot" style={{ backgroundColor: '#10b981' }}></div>
                <div className="timeline-content">
                  <span className="timeline-date">{formatDateTime(order.deliveredAt)}</span>
                  <span className="timeline-text">Commande livrée</span>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {showCancelConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Annuler la commande ?</h3>
            <p>Cette action est irréversible. La commande sera définitivement annulée.</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowCancelConfirm(false)}>
                Non, garder
              </button>
              <button className="btn-danger" onClick={handleCancel} disabled={cancelling}>
                Oui, annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
