import { useQuery } from '@apollo/client';
import { Package, Calendar, Hash } from 'lucide-react';
import { CLIENT_LOTS_QUERY } from '../graphql/lots';

interface LotClient {
  id: string;
  quantity: number;
  deliveryDate: string;
  lot: {
    id: string;
    lotNumber: string;
    expirationDate?: string;
    product: {
      id: string;
      gtin: string;
      name: string;
    };
  };
}

interface Props {
  clientId: string;
}

export default function LotsSection({ clientId }: Props) {
  const { data, loading, error } = useQuery(CLIENT_LOTS_QUERY, {
    variables: { clientId },
  });

  if (loading) return <div className="loading">Chargement des lots...</div>;
  if (error) return <div className="error">Erreur: {error.message}</div>;

  const lots: LotClient[] = data?.clientLots || [];

  if (lots.length === 0) {
    return (
      <div className="empty-state">
        <Package size={48} strokeWidth={1} />
        <p>Aucun lot associé à ce client</p>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Utilisez le scanner pour associer des lots à ce client
        </p>
      </div>
    );
  }

  return (
    <div className="lots-section">
      <div className="lots-list">
        {lots.map((lotClient) => (
          <div key={lotClient.id} className="lot-card" style={{
            background: 'var(--bg-secondary)',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '0.75rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Package size={18} />
                  {lotClient.lot.product.name}
                </h4>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <p style={{ margin: '0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Hash size={14} />
                    Lot: <span style={{ fontFamily: 'monospace' }}>{lotClient.lot.lotNumber}</span>
                  </p>
                  <p style={{ margin: '0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    GTIN: <span style={{ fontFamily: 'monospace' }}>{lotClient.lot.product.gtin}</span>
                  </p>
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
                <div style={{ 
                  background: 'var(--primary)', 
                  color: 'white', 
                  padding: '0.25rem 0.5rem', 
                  borderRadius: '4px',
                  marginBottom: '0.5rem'
                }}>
                  Qté: {lotClient.quantity}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)' }}>
                  <Calendar size={14} />
                  {new Date(lotClient.deliveryDate).toLocaleDateString('fr-FR')}
                </div>
                {lotClient.lot.expirationDate && (
                  <div style={{ 
                    marginTop: '0.25rem',
                    color: new Date(lotClient.lot.expirationDate) < new Date() ? '#DC2626' : 'var(--text-secondary)'
                  }}>
                    Exp: {new Date(lotClient.lot.expirationDate).toLocaleDateString('fr-FR')}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
