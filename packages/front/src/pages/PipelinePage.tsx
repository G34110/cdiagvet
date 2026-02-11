import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, Target, Euro, Calendar, User } from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  OPPORTUNITIES_QUERY, 
  CREATE_OPPORTUNITY_MUTATION, 
  UPDATE_OPPORTUNITY_STATUS_MUTATION,
  ADD_PRODUCT_TO_OPPORTUNITY,
  ADD_KIT_TO_OPPORTUNITY
} from '../graphql/opportunities';
import type { OpportunityFormData } from '../components/OpportunityForm';
import OpportunityForm from '../components/OpportunityForm';
import LostReasonModal from '../components/LostReasonModal';
import './PipelinePage.css';

interface OpportunityLine {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

const LOST_REASON_LABELS: Record<string, string> = {
  PRIX_TROP_ELEVE: 'Prix trop élevé',
  CONCURRENT: 'Concurrent',
  TIMING_BUDGET: 'Timing/Budget',
  BESOIN_ANNULE: 'Besoin annulé',
  PAS_DE_REPONSE: 'Pas de réponse',
  AUTRE: 'Autre',
};

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
  lostReason?: string;
  lostComment?: string;
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

const getOpportunityAmount = (opp: Opportunity) => opp.amount;

const STATUSES = [
  { key: 'NOUVEAU', label: 'Nouveau', color: '#6b7280', probability: 10 },
  { key: 'QUALIFICATION', label: 'Qualification', color: '#3b82f6', probability: 25 },
  { key: 'PROPOSITION', label: 'Proposition', color: '#8b5cf6', probability: 50 },
  { key: 'NEGOCIATION', label: 'Négociation', color: '#f59e0b', probability: 75 },
  { key: 'GAGNE', label: 'Gagné', color: '#10b981', probability: 100 },
  { key: 'PERDU', label: 'Perdu', color: '#ef4444', probability: 0 },
];

interface PendingLostOpportunity {
  id: string;
  title: string;
  clientName: string;
}

export default function PipelinePage() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [pendingLostOpportunity, setPendingLostOpportunity] = useState<PendingLostOpportunity | null>(null);
  const [isUpdatingLost, setIsUpdatingLost] = useState(false);

  const { data, loading, refetch } = useQuery<{ opportunities: Opportunity[] }>(OPPORTUNITIES_QUERY);
  const [createOpportunity, { loading: creating }] = useMutation(CREATE_OPPORTUNITY_MUTATION);
  const [updateStatus] = useMutation(UPDATE_OPPORTUNITY_STATUS_MUTATION);
  const [addProductToOpportunity] = useMutation(ADD_PRODUCT_TO_OPPORTUNITY);
  const [addKitToOpportunity] = useMutation(ADD_KIT_TO_OPPORTUNITY);
  const [isAddingLines, setIsAddingLines] = useState(false);

  // Filtrer les opportunités converties (elles sont devenues des commandes)
  const opportunities = (data?.opportunities || []).filter(opp => opp.status !== 'CONVERTI');

  const getOpportunitiesByStatus = (status: string) => 
    opportunities.filter(opp => opp.status === status);

  const getStatusTotal = (status: string) => 
    getOpportunitiesByStatus(status).reduce((sum, opp) => sum + getOpportunityAmount(opp), 0);

  const handleCreateOpportunity = async (formData: OpportunityFormData) => {
    try {
      // Calculate total: manual amount + all pending lines
      const linesTotal = formData.pendingLines.reduce(
        (sum, line) => sum + line.quantity * line.unitPrice, 
        0
      );
      const totalAmount = formData.amount + linesTotal;
      
      // Filter out empty strings for optional fields
      const input: any = {
        clientId: formData.clientId,
        title: formData.title,
        contactName: formData.contactName,
        source: formData.source,
        amount: totalAmount,
        manualAmount: formData.amount,
        expectedCloseDate: formData.expectedCloseDate,
      };
      if (formData.contactEmail) input.contactEmail = formData.contactEmail;
      if (formData.contactPhone) input.contactPhone = formData.contactPhone;
      if (formData.notes) input.notes = formData.notes;

      const { data: createData } = await createOpportunity({
        variables: { input },
      });

      const newOpportunityId = createData?.createOpportunity?.id;

      // Add pending lines if any
      if (newOpportunityId && formData.pendingLines.length > 0) {
        setIsAddingLines(true);
        try {
          for (const line of formData.pendingLines) {
            if (line.type === 'product') {
              await addProductToOpportunity({
                variables: {
                  opportunityId: newOpportunityId,
                  productId: line.itemId,
                  quantity: line.quantity,
                },
              });
            } else {
              await addKitToOpportunity({
                variables: {
                  opportunityId: newOpportunityId,
                  kitId: line.itemId,
                  quantity: line.quantity,
                },
              });
            }
          }
        } finally {
          setIsAddingLines(false);
        }
      }

      setShowForm(false);
      refetch();
    } catch (error: any) {
      console.error('Erreur création opportunité:', error);
      console.error('GraphQL errors:', error?.graphQLErrors);
      console.error('Network error:', error?.networkError);
      alert(`Erreur: ${error?.message || 'Erreur lors de la création'}`);
      setIsAddingLines(false);
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

    // Si on passe à PERDU, afficher la modal pour demander le motif
    if (newStatus === 'PERDU') {
      const opp = opportunities.find(o => o.id === draggableId);
      if (opp) {
        setPendingLostOpportunity({
          id: opp.id,
          title: opp.title,
          clientName: opp.client.name,
        });
      }
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

  const handleConfirmLost = async (reason: string, comment: string, competitorName?: string) => {
    if (!pendingLostOpportunity) return;

    setIsUpdatingLost(true);
    try {
      // Construire le commentaire complet
      let fullComment = comment;
      if (competitorName) {
        fullComment = `Concurrent: ${competitorName}${comment ? '\n' + comment : ''}`;
      }

      await updateStatus({
        variables: {
          id: pendingLostOpportunity.id,
          status: 'PERDU',
          lostReason: reason,
          lostComment: fullComment || null,
        },
      });

      setPendingLostOpportunity(null);
      refetch();
    } catch (error: any) {
      console.error('Erreur marquage perdue:', error);
      alert(`Erreur: ${error?.message || 'Erreur lors du marquage'}`);
    } finally {
      setIsUpdatingLost(false);
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
              isLoading={creating || isAddingLines}
            />
          </div>
        </div>
      )}

      {pendingLostOpportunity && (
        <LostReasonModal
          opportunityTitle={pendingLostOpportunity.title}
          clientName={pendingLostOpportunity.clientName}
          onConfirm={handleConfirmLost}
          onCancel={() => setPendingLostOpportunity(null)}
          isLoading={isUpdatingLost}
        />
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
                        {opp.lostReason && (
                          <span className="lost-reason">{LOST_REASON_LABELS[opp.lostReason] || opp.lostReason}</span>
                        )}
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
