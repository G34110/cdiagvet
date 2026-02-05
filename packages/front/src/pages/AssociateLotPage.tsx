import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { Check, Package, User, Calendar } from 'lucide-react';
import { MY_CLIENTS_QUERY } from '../graphql/clients';
import { ASSOCIATE_LOT_CLIENT_MUTATION } from '../graphql/lots';
import { gql } from '@apollo/client';

const LOT_QUERY = gql`
  query Lot($id: ID!) {
    lot(id: $id) {
      id
      lotNumber
      expirationDate
      product {
        id
        gtin
        name
      }
    }
  }
`;

interface Client {
  id: string;
  name: string;
  city?: string;
}

export default function AssociateLotPage() {
  const { lotId } = useParams<{ lotId: string }>();
  const navigate = useNavigate();
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [success, setSuccess] = useState(false);

  const { data: lotData, loading: lotLoading } = useQuery(LOT_QUERY, {
    variables: { id: lotId },
    skip: !lotId,
  });

  const { data: clientsData, loading: clientsLoading } = useQuery(MY_CLIENTS_QUERY);

  const [associateLot, { loading: associating }] = useMutation(ASSOCIATE_LOT_CLIENT_MUTATION, {
    onCompleted: () => {
      setSuccess(true);
      setTimeout(() => {
        navigate('/scanner');
      }, 2000);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !lotId) return;

    await associateLot({
      variables: {
        input: {
          lotId,
          clientId: selectedClientId,
          quantity,
          deliveryDate: new Date(deliveryDate),
        },
      },
    });
  };

  const lot = lotData?.lot;
  const clients: Client[] = clientsData?.myClients || [];

  if (lotLoading || clientsLoading) {
    return <div className="loading">Chargement...</div>;
  }

  if (!lot) {
    return <div className="error">Lot non trouvé</div>;
  }

  if (success) {
    return (
      <div className="success-page" style={{ 
        textAlign: 'center', 
        padding: '3rem',
        background: '#D1FAE5',
        borderRadius: '8px',
        margin: '2rem'
      }}>
        <Check size={64} color="#059669" />
        <h2 style={{ marginTop: '1rem' }}>Association réussie !</h2>
        <p>Le lot a été associé au client.</p>
        <p style={{ color: 'var(--text-secondary)' }}>Redirection en cours...</p>
      </div>
    );
  }

  return (
    <div className="associate-lot-page">
      <header className="page-header">
        <h1>Associer le lot à un client</h1>
      </header>

      <div className="lot-info" style={{ 
        background: '#F3F4F6', 
        padding: '1rem', 
        borderRadius: '8px',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Package size={20} />
          <strong>{lot.product.name}</strong>
        </div>
        <table style={{ fontSize: '0.9rem' }}>
          <tbody>
            <tr>
              <td style={{ padding: '0.2rem 1rem 0.2rem 0', color: 'var(--text-secondary)' }}>GTIN:</td>
              <td style={{ fontFamily: 'monospace' }}>{lot.product.gtin}</td>
            </tr>
            <tr>
              <td style={{ padding: '0.2rem 1rem 0.2rem 0', color: 'var(--text-secondary)' }}>N° Lot:</td>
              <td style={{ fontFamily: 'monospace' }}>{lot.lotNumber}</td>
            </tr>
            {lot.expirationDate && (
              <tr>
                <td style={{ padding: '0.2rem 1rem 0.2rem 0', color: 'var(--text-secondary)' }}>Expiration:</td>
                <td>{new Date(lot.expirationDate).toLocaleDateString('fr-FR')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={18} /> Client
          </label>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            required
          >
            <option value="">Sélectionner un client</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.name} {client.city ? `(${client.city})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Quantité</label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            required
          />
        </div>

        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={18} /> Date de livraison
          </label>
          <input
            type="date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            required
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
          <button type="submit" className="btn-primary" disabled={associating || !selectedClientId}>
            {associating ? 'Association...' : 'Confirmer l\'association'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate('/scanner')}>
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
