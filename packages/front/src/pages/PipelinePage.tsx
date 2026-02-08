import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, Target, Euro, Calendar, User } from 'lucide-react';
import confetti from 'canvas-confetti';
import { OPPORTUNITIES_QUERY, CREATE_OPPORTUNITY_MUTATION, UPDATE_OPPORTUNITY_STATUS_MUTATION } from '../graphql/opportunities';
import OpportunityForm from '../components/OpportunityForm';
import './PipelinePage.css';

interface OpportunityLine {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

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
  lines: OpportunityLine[];
}

const getOpportunityAmount = (opp: Opportunity) => 
  opp.lines && opp.lines.length > 0 
    ? opp.lines.reduce((sum, l) => sum + l.total, 0) 
    : opp.amount;

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
  const [updateStatus] = useMutation(UPDATE_OPPORTUNITY_STATUS_MUTATION);

  // Filtrer les opportunités converties (elles sont devenues des commandes)
  const opportunities = (data?.opportunities || []).filter(opp => opp.status !== 'CONVERTI');

  const getOpportunitiesByStatus = (status: string) => 
    opportunities.filter(opp => opp.status === status);

  const getStatusTotal = (status: string) => 
    getOpportunitiesByStatus(status).reduce((sum, opp) => sum + getOpportunityAmount(opp), 0);

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

  const triggerConfetti = () => {
    // Tir de confettis festif 🎉
    const duration = 3000;
    const end = Date.now() + duration;

    const colors = ['#10b981', '#34d399', '#6ee7b7', '#fbbf24', '#f59e0b'];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Dropped outside a valid area
    if (!destination) return;

    // Dropped in same position
    if (destination.droppableId === source.droppableId) return;

    const newStatus = destination.droppableId;
    const oldStatus = source.droppableId;

    console.log('Drag end:', { oldStatus, newStatus, draggableId });

    // Règle: Une opportunité GAGNE ne peut pas passer à PERDU
    if (oldStatus === 'GAGNE' && newStatus === 'PERDU') {
      alert('Une opportunité gagnée ne peut pas être marquée comme perdue.');
      return;
    }
    
    try {
      console.log('Calling updateStatus with:', { id: draggableId, status: newStatus });
      await updateStatus({
        variables: {
          id: draggableId,
          status: newStatus,
        },
      });
      console.log('updateStatus success');
      
      // 🎉 Confettis si l'opportunité est gagnée !
      if (newStatus === 'GAGNE') {
        triggerConfetti();
      }
      
      refetch();
    } catch (error: any) {
      console.error('Erreur changement statut:', error);
      alert(`Erreur: ${error?.message || 'Erreur lors du changement de statut'}`);
    }
  };

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

      <DragDropContext onDragEnd={handleDragEnd}>
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

                <Droppable droppableId={status.key}>
                  {(provided, snapshot) => (
                    <div
                      className={`column-cards ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                    >
                      {statusOpps.map((opp, index) => (
                        <Draggable key={opp.id} draggableId={opp.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`opportunity-card ${snapshot.isDragging ? 'dragging' : ''}`}
                              onClick={() => navigate(`/pipeline/${opp.id}`)}
                            >
                              <div className="card-client">{opp.client.name}</div>
                              <div className="card-title">{opp.title}</div>
                              <div className="card-meta">
                                <span className="card-amount">
                                  <Euro size={14} />
                                  {formatCurrency(getOpportunityAmount(opp))}
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
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      {statusOpps.length === 0 && !snapshot.isDraggingOver && (
                        <div className="empty-column">Aucune opportunité</div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>

        <Droppable droppableId="PERDU">
          {(provided, snapshot) => (
            <div 
              className={`pipeline-lost ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              <h3>Perdues ({getOpportunitiesByStatus('PERDU').length})</h3>
              <div className="lost-list">
                {getOpportunitiesByStatus('PERDU').map((opp, index) => (
                  <Draggable key={opp.id} draggableId={opp.id} index={index}>
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`lost-item ${snapshot.isDragging ? 'dragging' : ''}`}
                        onClick={() => navigate(`/pipeline/${opp.id}`)}
                      >
                        <span className="lost-client">{opp.client.name}</span>
                        <span className="lost-title">{opp.title}</span>
                        <span className="lost-amount">{formatCurrency(getOpportunityAmount(opp))}</span>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
              {snapshot.isDraggingOver && (
                <div className="drop-hint">Déposer ici pour marquer comme perdue</div>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
