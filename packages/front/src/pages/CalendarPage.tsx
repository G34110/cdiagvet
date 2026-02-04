import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Plus, X, Trash2 } from 'lucide-react';
import { MY_VISITS_QUERY, DELETE_VISIT_MUTATION } from '../graphql/visits';
import VisitForm from '../components/VisitForm';

interface Visit {
  id: string;
  date: string;
  subject?: string;
  notes?: string;
  clientId: string;
  client: {
    id: string;
    name: string;
    city?: string;
  };
}

export default function CalendarPage() {
  const [showForm, setShowForm] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);

  const { data, loading, refetch } = useQuery(MY_VISITS_QUERY);
  const visits: Visit[] = data?.myVisits || [];

  const [deleteVisit] = useMutation(DELETE_VISIT_MUTATION, {
    refetchQueries: [{ query: MY_VISITS_QUERY }],
  });

  const events = visits.map((visit) => ({
    id: visit.id,
    title: `${visit.client.name}${visit.subject ? ` - ${visit.subject}` : ''}`,
    start: visit.date,
    extendedProps: { visit },
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDateClick = (_info: any) => {
    setSelectedVisit(null);
    setShowForm(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEventClick = (info: any) => {
    const visit = info.event.extendedProps?.visit as Visit;
    if (visit) {
      setSelectedVisit(visit);
      setShowForm(true);
    }
  };

  const handleDelete = async () => {
    if (!selectedVisit) return;
    if (confirm('Supprimer ce RDV ?')) {
      await deleteVisit({ variables: { id: selectedVisit.id } });
      setSelectedVisit(null);
      setShowForm(false);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedVisit(null);
    refetch();
  };

  return (
    <div className="calendar-page">
      <header className="page-header">
        <h1>Calendrier</h1>
        <button className="btn-primary" onClick={() => { setSelectedVisit(null); setShowForm(true); }}>
          <Plus size={20} /> Nouveau RDV
        </button>
      </header>

      {showForm && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div className="modal-content" style={{
            background: 'white',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2>{selectedVisit ? 'Modifier le RDV' : 'Nouveau RDV'}</h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {selectedVisit && (
                  <button className="btn-secondary" style={{ color: 'var(--danger)' }} onClick={handleDelete}>
                    <Trash2 size={16} />
                  </button>
                )}
                <button className="btn-secondary" onClick={() => setShowForm(false)}>
                  <X size={16} />
                </button>
              </div>
            </div>
            <VisitForm
              visit={selectedVisit ? {
                id: selectedVisit.id,
                date: selectedVisit.date,
                subject: selectedVisit.subject,
                notes: selectedVisit.notes,
                clientId: selectedVisit.clientId,
              } : undefined}
              onCancel={() => setShowForm(false)}
              onSuccess={handleFormSuccess}
            />
          </div>
        </div>
      )}

      {loading && <div className="loading">Chargement...</div>}

      <div className="calendar-container">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          locale="fr"
          firstDay={1}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          events={events}
          height="auto"
          eventColor="var(--primary)"
        />
      </div>
    </div>
  );
}
