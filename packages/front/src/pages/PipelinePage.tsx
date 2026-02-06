import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { Plus, Target, Euro, Calendar, User } from 'lucide-react';
import { OPPORTUNITIES_QUERY, CREATE_OPPORTUNITY_MUTATION } from '../graphql/opportunities';
import OpportunityForm from '../components/OpportunityForm';
import './PipelinePage.css';

interface Opportunity {
  id: string;
  title: string;
  contactName: string;
  source: string;
  amount: number;
  probability: number;
  expectedCloseDate: string;
  status: string;
  weightedAmount: number;
  client: {
    id: string;
    name: string;
  };
  owner: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

const STATUSES = [
  { key: 'NOUVEAU', label: 'Nouveau', color: '#6b7280', probability: 10 },
  { key: 'QUALIFICATION', label: 'Qualification', color: '#3b82f6', probability: 25 },
  { key: 'PROPOSITION', label: 'Proposition', color: '#8b5cf6', probability: 50 },
  { key: 'NEGOCIATION', label: 'Négociation', color: '#f59e0b', probability: 75 },
  { key: 'GAGNE', label: 'Gagné', color: '#10b981', probability: 100 },
  { key: 'PERDU', label: 'Perdu', color: '#ef4444', probability: 0 },
];

export default function PipelinePage() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);

  const { data, loading, refetch } = useQuery<{ opportunities: Opportunity[] }>(OPPORTUNITIES_QUERY);
  const [createOpportunity, { loading: creating }] = useMutation(CREATE_OPPORTUNITY_MUTATION);

  const opportunities = data?.opportunities || [];

  const getOpportunitiesByStatus = (status: string) => 
    opportunities.filter(opp => opp.status === status);

  const getStatusTotal = (status: string) => 
    getOpportunitiesByStatus(status).reduce((sum, opp) => sum + opp.amount, 0);

  const handleCreateOpportunity = async (formData: any) => {
    try {
      // Filter out empty strings for optional fields
      const input: any = {
        clientId: formData.clientId,
        title: formData.title,
        contactName: formData.contactName,
        source: formData.source,
        amount: parseFloat(formData.amount),
        expectedCloseDate: formData.expectedCloseDate,
      };
      if (formData.contactEmail) input.contactEmail = formData.contactEmail;
      if (formData.contactPhone) input.contactPhone = formData.contactPhone;
      if (formData.notes) input.notes = formData.notes;

      await createOpportunity({
        variables: { input },
      });
      setShowForm(false);
      refetch();
    } catch (error: any) {
      console.error('Erreur création opportunité:', error);
      console.error('GraphQL errors:', error?.graphQLErrors);
      console.error('Network error:', error?.networkError);
      alert(`Erreur: ${error?.message || 'Erreur lors de la création'}`);
    }
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

  const formatDate = (dateStr: string) => 
    new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

  if (loading) {
    return <div className="loading">Chargement des opportunités...</div>;
  }

  return (
    <div className="pipeline-page">
      <header className="page-header">
        <div>
          <h1><Target size={28} /> Opportunités</h1>
          <p>{opportunities.length} opportunité{opportunities.length > 1 ? 's' : ''} en cours</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={20} />
          Nouvelle opportunité
        </button>
      </header>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Nouvelle opportunité</h2>
            <OpportunityForm
              onSubmit={handleCreateOpportunity}
              onCancel={() => setShowForm(false)}
              isLoading={creating}
            />
          </div>
        </div>
      )}

      <div className="pipeline-board">
        {STATUSES.filter(s => s.key !== 'PERDU').map(status => {
          const statusOpps = getOpportunitiesByStatus(status.key);
          const total = getStatusTotal(status.key);

          return (
            <div key={status.key} className="pipeline-column">
              <div className="column-header" style={{ borderTopColor: status.color }}>
                <div className="column-title">
                  <span className="status-dot" style={{ background: status.color }} />
                  {status.label}
                  <span className="count">{statusOpps.length}</span>
                </div>
                <div className="column-total">{formatCurrency(total)}</div>
              </div>

              <div className="column-cards">
                {statusOpps.map(opp => (
                  <div
                    key={opp.id}
                    className="opportunity-card"
                    onClick={() => navigate(`/pipeline/${opp.id}`)}
                  >
                    <div className="card-client">{opp.client.name}</div>
                    <div className="card-title">{opp.title}</div>
                    <div className="card-meta">
                      <span className="card-amount">
                        <Euro size={14} />
                        {formatCurrency(opp.amount)}
                      </span>
                      <span className="card-probability">
                        {opp.probability}%
                      </span>
                      <span className="card-date">
                        <Calendar size={14} />
                        {formatDate(opp.expectedCloseDate)}
                      </span>
                    </div>
                    <div className="card-owner">
                      <User size={14} />
                      {opp.owner.firstName} {opp.owner.lastName}
                    </div>
                  </div>
                ))}

                {statusOpps.length === 0 && (
                  <div className="empty-column">Aucune opportunité</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="pipeline-lost">
        <h3>Perdues ({getOpportunitiesByStatus('PERDU').length})</h3>
        <div className="lost-list">
          {getOpportunitiesByStatus('PERDU').map(opp => (
            <div key={opp.id} className="lost-item" onClick={() => navigate(`/pipeline/${opp.id}`)}>
              <span className="lost-client">{opp.client.name}</span>
              <span className="lost-title">{opp.title}</span>
              <span className="lost-amount">{formatCurrency(opp.amount)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
