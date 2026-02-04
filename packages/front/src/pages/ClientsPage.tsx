import { useQuery } from '@apollo/client';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { MY_CLIENTS_QUERY, CLIENT_STATS_QUERY } from '../graphql/clients';

interface Client {
  id: string;
  name: string;
  city?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  filiere?: { id: string; name: string };
}

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const { data, loading, error } = useQuery(MY_CLIENTS_QUERY, {
    variables: { filter: search ? { search } : null },
  });
  const { data: statsData } = useQuery(CLIENT_STATS_QUERY);

  const clients: Client[] = data?.myClients || [];
  const stats = statsData?.clientStats;

  return (
    <div className="clients-page">
      {stats && (
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.active}</span>
            <span className="stat-label">Actifs</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.inactive}</span>
            <span className="stat-label">Inactifs</span>
          </div>
        </div>
      )}

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
        {clients.map((client) => (
          <Link key={client.id} to={`/clients/${client.id}`} className="client-card">
            <div className="client-info">
              <h3>{client.name}</h3>
              <p>{client.city || 'Ville non renseignée'}</p>
              {client.filiere && (
                <span className="filiere-badge">{client.filiere.name}</span>
              )}
            </div>
            <div className="client-contact">
              {client.phone && <span>{client.phone}</span>}
              <span className={`status-dot ${client.isActive ? 'active' : 'inactive'}`} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
