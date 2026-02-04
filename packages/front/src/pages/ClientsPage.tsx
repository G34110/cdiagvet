import { useQuery, gql } from '@apollo/client';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { useState } from 'react';

const MY_CLIENTS_QUERY = gql`
  query MyClients {
    myClients {
      id
      name
      city
      phone
      email
      isActive
    }
  }
`;

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const { data, loading, error } = useQuery(MY_CLIENTS_QUERY);

  const clients = data?.myClients?.filter((client: { name: string }) =>
    client.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="clients-page">
      <header className="page-header">
        <h1>Mes Clients</h1>
        <Link to="/clients/new" className="btn-primary">
          <Plus size={20} /> Nouveau client
        </Link>
      </header>

      <div className="search-bar">
        <Search size={20} />
        <input
          type="text"
          placeholder="Rechercher un client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && <div className="loading">Chargement...</div>}
      {error && <div className="error">Erreur: {error.message}</div>}

      <div className="clients-list">
        {clients.length === 0 && !loading && (
          <div className="empty-state">
            <p>Aucun client trouvé</p>
          </div>
        )}
        {clients.map((client: { id: string; name: string; city?: string; phone?: string }) => (
          <Link key={client.id} to={`/clients/${client.id}`} className="client-card">
            <div className="client-info">
              <h3>{client.name}</h3>
              <p>{client.city || 'Ville non renseignée'}</p>
            </div>
            <div className="client-contact">
              {client.phone && <span>{client.phone}</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
