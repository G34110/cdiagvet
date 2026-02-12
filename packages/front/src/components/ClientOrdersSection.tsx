import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import { Package, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

const CLIENT_ORDERS_QUERY = gql`
  query ClientOrders($clientId: String!) {
    ordersByClient(clientId: $clientId) {
      id
      reference
      status
      totalHT
      totalTTC
      createdAt
    }
  }
`;

interface Order {
  id: string;
  reference: string;
  status: string;
  totalHT: number;
  totalTTC: number;
  createdAt: string;
}

interface ClientOrdersSectionProps {
  clientId: string;
}

const STATUS_LABELS: Record<string, string> = {
  BROUILLON: 'Brouillon',
  VALIDEE: 'Validée',
  EN_COURS: 'En cours',
  LIVREE: 'Livrée',
  ANNULEE: 'Annulée',
};

const STATUS_COLORS: Record<string, string> = {
  BROUILLON: '#6B7280',
  VALIDEE: '#10B981',
  EN_COURS: '#3B82F6',
  LIVREE: '#8B5CF6',
  ANNULEE: '#EF4444',
};

export default function ClientOrdersSection({ clientId }: ClientOrdersSectionProps) {
  const { data, loading, error } = useQuery(CLIENT_ORDERS_QUERY, {
    variables: { clientId },
    skip: !clientId,
  });

  if (loading) return <div className="loading">Chargement des commandes...</div>;
  if (error) return <div className="error">Erreur: {error.message}</div>;

  const orders: Order[] = data?.ordersByClient || [];

  return (
    <div className="orders-section">
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Package size={20} /> Commandes ({orders.length})
        </h3>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <p>Aucune commande pour ce client</p>
        </div>
      ) : (
        <table className="orders-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #E5E7EB', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem' }}>Référence</th>
              <th style={{ padding: '0.75rem' }}>Date</th>
              <th style={{ padding: '0.75rem' }}>Statut</th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>Montant TTC</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                <td style={{ padding: '0.75rem', fontWeight: 500 }}>{order.reference}</td>
                <td style={{ padding: '0.75rem' }}>
                  {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    background: `${STATUS_COLORS[order.status]}20`,
                    color: STATUS_COLORS[order.status],
                  }}>
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 500 }}>
                  {order.totalTTC.toLocaleString('fr-FR')} €
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                  <Link to={`/commandes/${order.id}`} className="btn-icon" title="Voir détail">
                    <Eye size={18} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
