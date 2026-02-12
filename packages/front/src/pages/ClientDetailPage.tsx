import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { ArrowLeft, Phone, Mail, MapPin, Edit, Trash2 } from 'lucide-react';
import { CLIENT_QUERY, DELETE_CLIENT_MUTATION, MY_CLIENTS_QUERY } from '../graphql/clients';
import ClientForm from '../components/ClientForm';
import NotesSection from '../components/NotesSection';
import PhotosSection from '../components/PhotosSection';
import VisitsSection from '../components/VisitsSection';
import ClientOrdersSection from '../components/ClientOrdersSection';

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
        <h1>Modifier {client.name}</h1>
        <ClientForm 
          client={client} 
          onCancel={() => setIsEditing(false)}
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

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center' }}>
        {client.segmentation && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#6B7280', fontWeight: 500 }}>Segmentation :</span>
            <span style={{
              padding: '0.25rem 0.75rem',
              borderRadius: '15px',
              background: client.segmentation === 'DISTRIBUTEUR' ? '#DBEAFE' : client.segmentation === 'AGENT' ? '#FEF3C7' : '#F3F4F6',
              color: client.segmentation === 'DISTRIBUTEUR' ? '#1E40AF' : client.segmentation === 'AGENT' ? '#92400E' : '#374151',
              border: `1px solid ${client.segmentation === 'DISTRIBUTEUR' ? '#93C5FD' : client.segmentation === 'AGENT' ? '#FCD34D' : '#D1D5DB'}`,
              fontSize: '0.85rem',
            }}>
              {client.segmentation === 'DISTRIBUTEUR' ? 'Distributeur' : client.segmentation === 'AGENT' ? 'Agent' : 'Autres'}
            </span>
          </div>
        )}

        {client.filieres && client.filieres.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#6B7280', fontWeight: 500 }}>Filières :</span>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {client.filieres.map((f: { id: string; name: string }) => {
                const colors: Record<string, { bg: string; border: string; text: string }> = {
                  'Porcine': { bg: '#FFE4E6', border: '#FDA4AF', text: '#BE123C' },
                  'Canine': { bg: '#E0E7FF', border: '#A5B4FC', text: '#4338CA' },
                  'Ovine': { bg: '#D1FAE5', border: '#6EE7B7', text: '#047857' },
                  'Bovine': { bg: '#F5E6D3', border: '#D4A574', text: '#8B4513' },
                  'Apiculture': { bg: '#FEF08A', border: '#FACC15', text: '#854D0E' },
                  'Aviculture': { bg: '#E0F2FE', border: '#7DD3FC', text: '#0369A1' },
                };
                const color = colors[f.name] || { bg: '#F3F4F6', border: '#D1D5DB', text: '#374151' };
                return (
                  <span
                    key={f.id}
                    style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '15px',
                      background: color.bg,
                      color: color.text,
                      border: `1px solid ${color.border}`,
                      fontSize: '0.85rem',
                    }}
                  >
                    {f.name}
                  </span>
                );
              })}
            </div>
          </div>
        )}
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
          {client.addressLine1 && (
            <p><MapPin size={16} /> {client.addressLine1}{client.addressLine2 ? `, ${client.addressLine2}` : ''}, {client.postalCode} {client.city}{client.region ? `, ${client.region}` : ''} - {client.country}</p>
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
        <button className={`tab ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>Commandes</button>
      </div>

      <div className="tab-content">
        {activeTab === 'notes' && id && <NotesSection clientId={id} />}
        {activeTab === 'photos' && id && <PhotosSection clientId={id} />}
        {activeTab === 'visits' && id && <VisitsSection clientId={id} />}
        {activeTab === 'orders' && id && <ClientOrdersSection clientId={id} />}
      </div>
    </div>
  );
}
