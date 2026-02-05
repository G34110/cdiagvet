import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { ArrowLeft, Phone, Mail, MapPin, Edit, Trash2, X } from 'lucide-react';
import { CLIENT_QUERY, DELETE_CLIENT_MUTATION, MY_CLIENTS_QUERY } from '../graphql/clients';
import ClientForm from '../components/ClientForm';
import NotesSection from '../components/NotesSection';
import PhotosSection from '../components/PhotosSection';
import VisitsSection from '../components/VisitsSection';
import LotsSection from '../components/LotsSection';

type TabType = 'notes' | 'photos' | 'visits' | 'lots' | 'orders';

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('notes');

  const { data, loading, error, refetch } = useQuery(CLIENT_QUERY, {
    variables: { id },
    skip: !id,
  });

  const [deleteClient, { loading: deleting }] = useMutation(DELETE_CLIENT_MUTATION, {
    refetchQueries: [{ query: MY_CLIENTS_QUERY }],
    onCompleted: () => navigate('/clients'),
  });

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteClient({ variables: { id } });
    } catch (err) {
      console.error('Error deleting client:', err);
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">Erreur: {error.message}</div>;

  const client = data?.client;

  if (!client) return <div className="error">Client non trouvé</div>;

  if (isEditing) {
    return (
      <div className="client-detail-page">
        <header className="page-header">
          <button className="back-link" onClick={() => setIsEditing(false)}>
            <X size={20} /> Annuler
          </button>
        </header>
        <h1>Modifier {client.name}</h1>
        <ClientForm 
          client={client} 
          onSuccess={() => {
            setIsEditing(false);
            refetch();
          }} 
        />
      </div>
    );
  }

  return (
    <div className="client-detail-page">
      <header className="page-header">
        <Link to="/clients" className="back-link">
          <ArrowLeft size={20} /> Retour
        </Link>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-secondary" onClick={() => setIsEditing(true)}>
            <Edit size={16} /> Modifier
          </button>
          <button className="btn-secondary" style={{ color: 'var(--danger)' }} onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 size={16} /> Supprimer
          </button>
        </div>
      </header>

      {showDeleteConfirm && (
        <div className="confirm-dialog" style={{ 
          background: '#fef2f2', 
          padding: '1rem', 
          borderRadius: '0.5rem', 
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>Supprimer ce client ?</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Annuler</button>
            <button 
              className="btn-primary" 
              style={{ background: 'var(--danger)' }} 
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Suppression...' : 'Confirmer'}
            </button>
          </div>
        </div>
      )}

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
        <button className={`tab ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}>Notes</button>
        <button className={`tab ${activeTab === 'photos' ? 'active' : ''}`} onClick={() => setActiveTab('photos')}>Photos</button>
        <button className={`tab ${activeTab === 'visits' ? 'active' : ''}`} onClick={() => setActiveTab('visits')}>Visites</button>
        <button className={`tab ${activeTab === 'lots' ? 'active' : ''}`} onClick={() => setActiveTab('lots')}>Lots</button>
        <button className={`tab ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>Commandes</button>
      </div>

      <div className="tab-content">
        {activeTab === 'notes' && id && <NotesSection clientId={id} />}
        {activeTab === 'photos' && id && <PhotosSection clientId={id} />}
        {activeTab === 'visits' && id && <VisitsSection clientId={id} />}
        {activeTab === 'lots' && id && <LotsSection clientId={id} />}
        {activeTab === 'orders' && (
          <div className="empty-state">
            <p>Module commandes à venir</p>
          </div>
        )}
      </div>
    </div>
  );
}
