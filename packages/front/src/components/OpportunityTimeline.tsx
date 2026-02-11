import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Clock, MessageSquare, ArrowRightLeft, DollarSign, Package, Plus, Send, User, FileText, Calendar, Mail, Filter } from 'lucide-react';
import { OPPORTUNITY_TIMELINE_QUERY, ADD_OPPORTUNITY_NOTE } from '../graphql/opportunities';
import './OpportunityTimeline.css';

interface TimelineEvent {
  id: string;
  type: string;
  description?: string;
  metadata?: string;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface TimelineNote {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface TimelineData {
  opportunityTimeline: {
    events: TimelineEvent[];
    notes: TimelineNote[];
  };
}

interface OpportunityTimelineProps {
  opportunityId: string;
}

const EVENT_ICONS: Record<string, typeof Clock> = {
  STATUS_CHANGE: ArrowRightLeft,
  NOTE_ADDED: MessageSquare,
  OWNER_CHANGE: User,
  AMOUNT_CHANGE: DollarSign,
  LINE_ADDED: Package,
  LINE_REMOVED: Package,
  LINE_UPDATED: Package,
  DOCUMENT_ATTACHED: FileText,
  RDV_SCHEDULED: Calendar,
  EMAIL_SENT: Mail,
  CREATED: Plus,
};

const EVENT_LABELS: Record<string, string> = {
  STATUS_CHANGE: 'Changement de statut',
  NOTE_ADDED: 'Note ajoutée',
  OWNER_CHANGE: 'Changement de propriétaire',
  AMOUNT_CHANGE: 'Modification du montant',
  LINE_ADDED: 'Ligne ajoutée',
  LINE_REMOVED: 'Ligne supprimée',
  LINE_UPDATED: 'Ligne modifiée',
  DOCUMENT_ATTACHED: 'Document attaché',
  RDV_SCHEDULED: 'RDV planifié',
  EMAIL_SENT: 'Email envoyé',
  CREATED: 'Création',
};

const EVENT_COLORS: Record<string, string> = {
  STATUS_CHANGE: '#3b82f6',
  NOTE_ADDED: '#10b981',
  OWNER_CHANGE: '#8b5cf6',
  AMOUNT_CHANGE: '#f59e0b',
  LINE_ADDED: '#06b6d4',
  LINE_REMOVED: '#ef4444',
  LINE_UPDATED: '#6366f1',
  DOCUMENT_ATTACHED: '#64748b',
  RDV_SCHEDULED: '#ec4899',
  EMAIL_SENT: '#14b8a6',
  CREATED: '#22c55e',
};

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
  
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatFullDate(dateString: string): string {
  return new Date(dateString).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface TimelineItem {
  id: string;
  type: 'event' | 'note';
  eventType?: string;
  content: string;
  createdAt: string;
  user?: { firstName: string; lastName: string };
  metadata?: string;
}

export default function OpportunityTimeline({ opportunityId }: OpportunityTimelineProps) {
  const [newNote, setNewNote] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const { data, loading, error, refetch } = useQuery<TimelineData>(OPPORTUNITY_TIMELINE_QUERY, {
    variables: { opportunityId },
    fetchPolicy: 'cache-and-network',
  });

  const [addNote, { loading: addingNote }] = useMutation(ADD_OPPORTUNITY_NOTE, {
    onCompleted: () => {
      setNewNote('');
      refetch();
    },
  });

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    try {
      await addNote({
        variables: {
          input: {
            opportunityId,
            content: newNote.trim(),
          },
        },
      });
    } catch (err) {
      console.error('Error adding note:', err);
    }
  };

  if (loading && !data) {
    return <div className="timeline-loading">Chargement de l'historique...</div>;
  }

  if (error) {
    return <div className="timeline-error">Erreur lors du chargement de l'historique</div>;
  }

  const timeline = data?.opportunityTimeline;
  if (!timeline) return null;

  // Combine events and notes into a single timeline
  const items: TimelineItem[] = [
    ...timeline.events.map((e) => ({
      id: e.id,
      type: 'event' as const,
      eventType: e.type,
      content: e.description || EVENT_LABELS[e.type] || e.type,
      createdAt: e.createdAt,
      user: e.user,
      metadata: e.metadata,
    })),
    ...timeline.notes.map((n) => ({
      id: n.id,
      type: 'note' as const,
      eventType: 'NOTE_ADDED',
      content: n.content,
      createdAt: n.createdAt,
      user: n.author,
    })),
  ];

  // Sort by date (most recent first)
  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Filter items
  const filteredItems = filterType === 'all' 
    ? items 
    : filterType === 'notes' 
      ? items.filter(i => i.type === 'note')
      : items.filter(i => i.eventType === filterType);

  const eventTypes = [...new Set(timeline.events.map(e => e.type))];

  return (
    <div className="opportunity-timeline">
      <div className="timeline-header">
        <h3><Clock size={18} /> Historique</h3>
        <button 
          className={`btn-filter ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={16} />
        </button>
      </div>

      {showFilters && (
        <div className="timeline-filters">
          <button 
            className={`filter-chip ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            Tout
          </button>
          <button 
            className={`filter-chip ${filterType === 'notes' ? 'active' : ''}`}
            onClick={() => setFilterType('notes')}
          >
            Notes
          </button>
          {eventTypes.map(type => (
            <button 
              key={type}
              className={`filter-chip ${filterType === type ? 'active' : ''}`}
              onClick={() => setFilterType(type)}
              style={{ '--chip-color': EVENT_COLORS[type] } as React.CSSProperties}
            >
              {EVENT_LABELS[type] || type}
            </button>
          ))}
        </div>
      )}

      <div className="timeline-add-note">
        <textarea
          placeholder="Ajouter une note..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          rows={2}
        />
        <button 
          className="btn btn-primary btn-sm"
          onClick={handleAddNote}
          disabled={!newNote.trim() || addingNote}
        >
          <Send size={14} />
          {addingNote ? 'Envoi...' : 'Ajouter'}
        </button>
      </div>

      <div className="timeline-items">
        {filteredItems.length === 0 ? (
          <div className="timeline-empty">Aucun élément dans l'historique</div>
        ) : (
          filteredItems.map((item) => {
            const IconComponent = EVENT_ICONS[item.eventType || 'CREATED'] || Clock;
            const color = EVENT_COLORS[item.eventType || 'CREATED'] || '#64748b';

            return (
              <div key={item.id} className="timeline-item">
                <div className="timeline-icon" style={{ backgroundColor: color }}>
                  <IconComponent size={14} />
                </div>
                <div className="timeline-content">
                  <div className="timeline-item-header">
                    <span className="timeline-type">
                      {item.type === 'note' ? 'Note' : EVENT_LABELS[item.eventType || ''] || item.eventType}
                    </span>
                    <span className="timeline-date" title={formatFullDate(item.createdAt)}>
                      {formatRelativeDate(item.createdAt)}
                    </span>
                  </div>
                  <p className="timeline-description">{item.content}</p>
                  {item.user && (
                    <span className="timeline-author">
                      <User size={12} /> {item.user.firstName} {item.user.lastName}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
