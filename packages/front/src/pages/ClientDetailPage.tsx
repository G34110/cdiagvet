import { useParams, Link } from 'react-router-dom';
import { useQuery, gql } from '@apollo/client';
import { ArrowLeft, Phone, Mail, MapPin, Edit } from 'lucide-react';

const CLIENT_QUERY = gql`
  query Client($id: String!) {
    client(id: $id) {
      id
      name
      address
      city
      postalCode
      country
      phone
      email
      latitude
      longitude
      isActive
      createdAt
    }
  }
`;

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useQuery(CLIENT_QUERY, {
    variables: { id },
    skip: !id,
  });

  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">Erreur: {error.message}</div>;

  const client = data?.client;

  if (!client) return <div className="error">Client non trouvé</div>;

  return (
    <div className="client-detail-page">
      <header className="page-header">
        <Link to="/clients" className="back-link">
          <ArrowLeft size={20} /> Retour
        </Link>
        <button className="btn-secondary">
          <Edit size={16} /> Modifier
        </button>
      </header>

      <div className="client-header">
        <h1>{client.name}</h1>
        <span className={`status-badge ${client.isActive ? 'active' : 'inactive'}`}>
          {client.isActive ? 'Actif' : 'Inactif'}
        </span>
      </div>

      <div className="client-info-grid">
        <div className="info-card">
          <h3>Coordonnées</h3>
          {client.phone && (
            <p><Phone size={16} /> {client.phone}</p>
          )}
          {client.email && (
            <p><Mail size={16} /> {client.email}</p>
          )}
          {client.address && (
            <p><MapPin size={16} /> {client.address}, {client.postalCode} {client.city}</p>
          )}
        </div>

        <div className="info-card">
          <h3>Statistiques</h3>
          <p>CA 12 mois: —</p>
          <p>Dernière commande: —</p>
          <p>Visites ce mois: —</p>
        </div>
      </div>

      <div className="tabs">
        <button className="tab active">Notes</button>
        <button className="tab">Historique</button>
        <button className="tab">Commandes</button>
        <button className="tab">Lots</button>
      </div>

      <div className="tab-content">
        <div className="empty-state">
          <p>Aucune note pour ce client</p>
        </div>
      </div>
    </div>
  );
}
