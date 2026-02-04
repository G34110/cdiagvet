import { useQuery } from '@apollo/client';
import { Link } from 'react-router-dom';
import { Plus, Search, Upload } from 'lucide-react';
import { useState } from 'react';
import { MY_CLIENTS_QUERY, CLIENT_STATS_QUERY, FILIERES_QUERY } from '../graphql/clients';

interface Filiere {
  id: string;
  name: string;
}

interface Client {
  id: string;
  name: string;
  city?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  filieres?: Filiere[];
}

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const [selectedFilieres, setSelectedFilieres] = useState<string[]>([]);
  
  const filter: Record<string, unknown> = {};
  if (search) filter.search = search;
  if (selectedFilieres.length > 0) filter.filiereIds = selectedFilieres;
  
  const { data, loading, error } = useQuery(MY_CLIENTS_QUERY, {
    variables: { filter: Object.keys(filter).length > 0 ? filter : null },
  });
  const { data: statsData } = useQuery(CLIENT_STATS_QUERY);
  const { data: filieresData } = useQuery(FILIERES_QUERY);

  const clients: Client[] = data?.myClients || [];
  const stats = statsData?.clientStats;
  const filieres: Filiere[] = filieresData?.filieres || [];
  
  // Compute filière counts from current client list
  const filiereCounts: Record<string, number> = {};
  clients.forEach(client => {
    client.filieres?.forEach(f => {
      filiereCounts[f.id] = (filiereCounts[f.id] || 0) + 1;
    });
  });

  // Couleurs pastel pour chaque filière
  const filiereColors: Record<string, { bg: string; border: string; text: string }> = {
    'Porcine': { bg: '#FFE4E6', border: '#FDA4AF', text: '#BE123C' },
    'Canine': { bg: '#E0E7FF', border: '#A5B4FC', text: '#4338CA' },
    'Ovine': { bg: '#D1FAE5', border: '#6EE7B7', text: '#047857' },
    'Bovine': { bg: '#F5E6D3', border: '#D4A574', text: '#8B4513' },
    'Apiculture': { bg: '#FEF08A', border: '#FACC15', text: '#854D0E' },
    'Aviculture': { bg: '#E0F2FE', border: '#7DD3FC', text: '#0369A1' },
  };

  const getFiliereColor = (name: string) => {
    return filiereColors[name] || { bg: '#F3F4F6', border: '#D1D5DB', text: '#374151' };
  };

  const toggleFiliere = (filiereId: string) => {
    setSelectedFilieres(prev => 
      prev.includes(filiereId) 
        ? prev.filter(id => id !== filiereId)
        : [...prev, filiereId]
    );
  };

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
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to="/clients/import" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Upload size={18} /> Importer
          </Link>
          <Link to="/clients/new" className="btn-primary">
            <Plus size={20} /> Nouveau client
          </Link>
        </div>
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

      {filieres.length > 0 && (
        <div className="filiere-filters" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
          {filieres.map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => toggleFiliere(f.id)}
              className={`filiere-filter-btn ${selectedFilieres.includes(f.id) ? 'active' : ''}`}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '20px',
                border: `2px solid ${selectedFilieres.includes(f.id) ? getFiliereColor(f.name).text : getFiliereColor(f.name).border}`,
                background: getFiliereColor(f.name).bg,
                color: getFiliereColor(f.name).text,
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: selectedFilieres.includes(f.id) ? 600 : 500,
                transition: 'all 0.2s',
                boxShadow: selectedFilieres.includes(f.id) ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              {f.name}
              <span style={{ marginLeft: '0.4rem', opacity: 0.8 }}>
                ({filiereCounts[f.id] || 0})
              </span>
            </button>
          ))}
          {selectedFilieres.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedFilieres([])}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '20px',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                textDecoration: 'underline',
              }}
            >
              Réinitialiser
            </button>
          )}
        </div>
      )}

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
              {client.filieres && client.filieres.length > 0 && (
                <div className="filieres-badges" style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                  {client.filieres.map(f => (
                    <span 
                      key={f.id} 
                      className="filiere-badge" 
                      style={{ 
                        fontSize: '0.7rem', 
                        padding: '0.15rem 0.4rem',
                        borderRadius: '10px',
                        background: getFiliereColor(f.name).bg,
                        color: getFiliereColor(f.name).text,
                        border: `1px solid ${getFiliereColor(f.name).border}`,
                      }}
                    >
                      {f.name}
                    </span>
                  ))}
                </div>
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
