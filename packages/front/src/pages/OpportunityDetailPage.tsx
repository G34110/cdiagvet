import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { ArrowLeft, Edit2, Save, X, Target, User, Calendar, Euro, TrendingUp, Trash2 } from 'lucide-react';
import { OPPORTUNITY_QUERY, UPDATE_OPPORTUNITY_MUTATION, ASSIGN_OPPORTUNITY_MUTATION, COMMERCIALS_FOR_ASSIGNMENT_QUERY, DELETE_OPPORTUNITY_MUTATION } from '../graphql/opportunities';
import { useRecoilValue } from 'recoil';
import { authState } from '../state/auth';
import './OpportunityDetailPage.css';

interface Opportunity {
  id: string;
  title: string;
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  source: string;
  amount: number;
  probability: number;
  expectedCloseDate: string;
  status: string;
  lostReason?: string;
  lostComment?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  weightedAmount: number;
  client: {
    id: string;
    name: string;
    organization?: string;
  };
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface Commercial {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const SOURCE_LABELS: Record<string, string> = {
  SALON: 'Salon',
  APPEL_ENTRANT: 'Appel entrant',
  RECOMMANDATION: 'Recommandation',
  SITE_WEB: 'Site web',
  AUTRE: 'Autre',
};

const STATUS_LABELS: Record<string, string> = {
  NOUVEAU: 'Nouveau',
  QUALIFICATION: 'Qualification',
  PROPOSITION: 'Proposition',
  NEGOCIATION: 'Négociation',
  GAGNE: 'Gagné',
  PERDU: 'Perdu',
};

const STATUS_COLORS: Record<string, string> = {
  NOUVEAU: '#6b7280',
  QUALIFICATION: '#3b82f6',
  PROPOSITION: '#8b5cf6',
  NEGOCIATION: '#f59e0b',
  GAGNE: '#10b981',
  PERDU: '#ef4444',
};

export default function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Opportunity>>({});

  const { data, loading, refetch } = useQuery<{ opportunity: Opportunity }>(OPPORTUNITY_QUERY, {
    variables: { id },
    skip: !id,
  });

  const [updateOpportunity, { loading: updating }] = useMutation(UPDATE_OPPORTUNITY_MUTATION);
  const [assignOpportunity, { loading: assigning }] = useMutation(ASSIGN_OPPORTUNITY_MUTATION);
  const [deleteOpportunity, { loading: deleting }] = useMutation(DELETE_OPPORTUNITY_MUTATION);

  const auth = useRecoilValue(authState);
  const canAssign = auth.user?.role === 'ADMIN' || auth.user?.role === 'RESPONSABLE_FILIERE';
  const canDelete = auth.user?.role === 'ADMIN' || auth.user?.role === 'RESPONSABLE_FILIERE';

  const { data: commercialsData } = useQuery<{ commercialsForAssignment: Commercial[] }>(
    COMMERCIALS_FOR_ASSIGNMENT_QUERY,
    { skip: !canAssign }
  );
  const commercials = commercialsData?.commercialsForAssignment || [];

  const opportunity = data?.opportunity;

  const startEditing = () => {
    if (opportunity) {
      setFormData({
        title: opportunity.title,
        contactName: opportunity.contactName,
        contactEmail: opportunity.contactEmail || '',
        contactPhone: opportunity.contactPhone || '',
        amount: opportunity.amount,
        probability: opportunity.probability,
        expectedCloseDate: opportunity.expectedCloseDate.split('T')[0],
        notes: opportunity.notes || '',
      });
      setIsEditing(true);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setFormData({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSave = async () => {
    if (!id) return;

    try {
      const input: any = { id };
      if (formData.title) input.title = formData.title;
      if (formData.contactName) input.contactName = formData.contactName;
      if (formData.contactEmail) input.contactEmail = formData.contactEmail;
      if (formData.contactPhone) input.contactPhone = formData.contactPhone;
      if (formData.amount !== undefined) input.amount = formData.amount;
      if (formData.probability !== undefined) input.probability = formData.probability;
      if (formData.expectedCloseDate) input.expectedCloseDate = formData.expectedCloseDate;
      if (formData.notes !== undefined) input.notes = formData.notes;

      await updateOpportunity({ variables: { input } });
      setIsEditing(false);
      refetch();
    } catch (error: any) {
      console.error('Erreur modification:', error);
      alert(`Erreur: ${error?.message || 'Erreur lors de la modification'}`);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  if (!opportunity) {
    return <div className="error">Opportunité non trouvée</div>;
  }

  return (
    <div className="opportunity-detail-page">
      <header className="page-header">
        <button className="btn-back" onClick={() => navigate('/pipeline')}>
          <ArrowLeft size={20} />
          Retour aux opportunités
        </button>
        <div className="header-actions">
          {isEditing ? (
            <>
              <button className="btn-secondary" onClick={cancelEditing}>
                <X size={18} />
                Annuler
              </button>
              <button className="btn-primary" onClick={handleSave} disabled={updating}>
                <Save size={18} />
                {updating ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </>
          ) : (
            <>
              <button className="btn-primary" onClick={startEditing}>
                <Edit2 size={18} />
                Modifier
              </button>
              {canDelete && (
                <button
                  className="btn-danger"
                  onClick={async () => {
                    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette opportunité ?')) {
                      try {
                        await deleteOpportunity({ variables: { id: opportunity.id } });
                        navigate('/pipeline');
                      } catch (error: any) {
                        alert(`Erreur: ${error?.message || 'Erreur lors de la suppression'}`);
                      }
                    }
                  }}
                  disabled={deleting}
                >
                  <Trash2 size={18} />
                  {deleting ? 'Suppression...' : 'Supprimer'}
                </button>
              )}
            </>
          )}
        </div>
      </header>

      <div className="opportunity-header">
        <div className="opportunity-title-section">
          <span
            className="status-badge"
            style={{ background: STATUS_COLORS[opportunity.status] }}
          >
            {STATUS_LABELS[opportunity.status]}
          </span>
          {isEditing ? (
            <input
              type="text"
              name="title"
              value={formData.title || ''}
              onChange={handleChange}
              className="edit-title"
            />
          ) : (
            <h1>{opportunity.title}</h1>
          )}
          <p className="client-name">
            <Target size={16} />
            {opportunity.client.name}
            {opportunity.client.organization && ` (${opportunity.client.organization})`}
          </p>
        </div>

        <div className="opportunity-stats">
          <div className="stat">
            <Euro size={20} />
            {isEditing ? (
              <input
                type="number"
                name="amount"
                value={formData.amount || 0}
                onChange={handleChange}
                className="edit-amount"
              />
            ) : (
              <span className="stat-value">{formatCurrency(opportunity.amount)}</span>
            )}
            <span className="stat-label">Montant</span>
          </div>
          <div className="stat">
            <TrendingUp size={20} />
            {isEditing ? (
              <input
                type="number"
                name="probability"
                value={formData.probability || 0}
                onChange={handleChange}
                min="0"
                max="100"
                className="edit-probability"
              />
            ) : (
              <span className="stat-value">{opportunity.probability}%</span>
            )}
            <span className="stat-label">Probabilité</span>
          </div>
          <div className="stat">
            <Euro size={20} style={{ opacity: 0.5 }} />
            <span className="stat-value">{formatCurrency(opportunity.weightedAmount)}</span>
            <span className="stat-label">Pondéré</span>
          </div>
        </div>
      </div>

      <div className="opportunity-content">
        <section className="info-section">
          <h2>Informations</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Contact principal</label>
              {isEditing ? (
                <input
                  type="text"
                  name="contactName"
                  value={formData.contactName || ''}
                  onChange={handleChange}
                />
              ) : (
                <span>{opportunity.contactName}</span>
              )}
            </div>
            <div className="info-item">
              <label>Email</label>
              {isEditing ? (
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail || ''}
                  onChange={handleChange}
                />
              ) : (
                <span>{opportunity.contactEmail || '—'}</span>
              )}
            </div>
            <div className="info-item">
              <label>Téléphone</label>
              {isEditing ? (
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone || ''}
                  onChange={handleChange}
                />
              ) : (
                <span>{opportunity.contactPhone || '—'}</span>
              )}
            </div>
            <div className="info-item">
              <label>Source</label>
              <span>{SOURCE_LABELS[opportunity.source] || opportunity.source}</span>
            </div>
            <div className="info-item">
              <label>Date de clôture prévue</label>
              {isEditing ? (
                <input
                  type="date"
                  name="expectedCloseDate"
                  value={formData.expectedCloseDate || ''}
                  onChange={handleChange}
                />
              ) : (
                <span>
                  <Calendar size={14} style={{ marginRight: '0.5rem' }} />
                  {formatDate(opportunity.expectedCloseDate)}
                </span>
              )}
            </div>
            <div className="info-item">
              <label>Propriétaire</label>
              {isEditing && canAssign ? (
                <div className="owner-select-wrapper">
                  <User size={14} />
                  <select
                    value={opportunity.owner.id}
                    onChange={async (e) => {
                      try {
                        await assignOpportunity({
                          variables: {
                            opportunityId: opportunity.id,
                            newOwnerId: e.target.value,
                          },
                        });
                        refetch();
                      } catch (error: any) {
                        alert(`Erreur: ${error?.message || 'Erreur lors de la réassignation'}`);
                      }
                    }}
                    disabled={assigning}
                    className="owner-select"
                  >
                    {commercials.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.firstName} {c.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <span>
                  <User size={14} style={{ marginRight: '0.5rem' }} />
                  {opportunity.owner.firstName} {opportunity.owner.lastName}
                </span>
              )}
            </div>
          </div>
        </section>

        <section className="notes-section">
          <h2>Notes</h2>
          {isEditing ? (
            <textarea
              name="notes"
              value={formData.notes || ''}
              onChange={handleChange}
              rows={6}
              placeholder="Ajouter des notes..."
            />
          ) : (
            <p className="notes-content">{opportunity.notes || 'Aucune note'}</p>
          )}
        </section>

        {opportunity.status === 'PERDU' && opportunity.lostReason && (
          <section className="lost-section">
            <h2>Motif de perte</h2>
            <p><strong>Raison:</strong> {opportunity.lostReason}</p>
            {opportunity.lostComment && <p>{opportunity.lostComment}</p>}
          </section>
        )}

        <section className="meta-section">
          <p>Créée le {formatDate(opportunity.createdAt)}</p>
          <p>Modifiée le {formatDate(opportunity.updatedAt)}</p>
        </section>
      </div>
    </div>
  );
}
