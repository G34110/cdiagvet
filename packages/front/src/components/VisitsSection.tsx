import { useQuery } from '@apollo/client';
import { Calendar, Clock } from 'lucide-react';
import { CLIENT_VISITS_QUERY } from '../graphql/visits';

interface Visit {
  id: string;
  date: string;
  subject?: string;
  notes?: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface VisitsSectionProps {
  clientId: string;
}

export default function VisitsSection({ clientId }: VisitsSectionProps) {
  const { data, loading } = useQuery(CLIENT_VISITS_QUERY, {
    variables: { clientId },
  });
  const visits: Visit[] = data?.clientVisits || [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="visits-section">
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <Calendar size={20} /> Historique des visites ({visits.length})
        </h3>
      </div>

      {loading && <div className="loading">Chargement...</div>}

      <div className="visits-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {visits.map((visit) => (
          <div
            key={visit.id}
            className="visit-card"
            style={{
              padding: '1rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <div>
                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                  {visit.subject || 'Visite'}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={14} /> {formatDate(visit.date)}
                  <Clock size={14} style={{ marginLeft: '0.5rem' }} /> {formatTime(visit.date)}
                </div>
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {visit.user.firstName} {visit.user.lastName}
              </span>
            </div>
            {visit.notes && (
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                {visit.notes}
              </p>
            )}
          </div>
        ))}
      </div>

      {!loading && visits.length === 0 && (
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>
          Aucune visite enregistrée pour ce client
        </p>
      )}
    </div>
  );
}
