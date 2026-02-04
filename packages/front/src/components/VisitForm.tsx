import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { Save, X } from 'lucide-react';
import { CREATE_VISIT_MUTATION, UPDATE_VISIT_MUTATION, MY_VISITS_QUERY } from '../graphql/visits';
import { MY_CLIENTS_QUERY } from '../graphql/clients';

interface VisitFormProps {
  visit?: {
    id: string;
    date: string;
    subject?: string;
    notes?: string;
    clientId: string;
  };
  clientId?: string;
  onCancel?: () => void;
  onSuccess?: () => void;
}

interface Client {
  id: string;
  name: string;
  city?: string;
}

export default function VisitForm({ visit, clientId, onCancel, onSuccess }: VisitFormProps) {
  const navigate = useNavigate();
  const isEditing = !!visit?.id;

  const { data: clientsData } = useQuery(MY_CLIENTS_QUERY);
  const clients: Client[] = clientsData?.myClients || [];

  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [form, setForm] = useState({
    date: visit?.date ? formatDateForInput(visit.date) : '',
    subject: visit?.subject || '',
    notes: visit?.notes || '',
    clientId: visit?.clientId || clientId || '',
  });

  const [createVisit, { loading: creating }] = useMutation(CREATE_VISIT_MUTATION, {
    refetchQueries: [{ query: MY_VISITS_QUERY }],
  });

  const [updateVisit, { loading: updating }] = useMutation(UPDATE_VISIT_MUTATION);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const input: Record<string, unknown> = {
      date: new Date(form.date).toISOString(),
      clientId: form.clientId,
    };

    if (form.subject) input.subject = form.subject;
    if (form.notes) input.notes = form.notes;

    try {
      if (isEditing) {
        await updateVisit({
          variables: {
            id: visit.id,
            input,
          },
        });
      } else {
        await createVisit({
          variables: { input },
        });
      }

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/calendar');
      }
    } catch (err) {
      console.error('Error saving visit:', err);
    }
  };

  const loading = creating || updating;

  return (
    <form className="client-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="clientId">Client *</label>
        <select
          id="clientId"
          name="clientId"
          value={form.clientId}
          onChange={handleChange}
          required
          disabled={!!clientId}
          style={{ 
            width: '100%', 
            padding: '0.75rem', 
            border: '1px solid var(--border)', 
            borderRadius: '0.5rem',
            fontSize: '1rem'
          }}
        >
          <option value="">Sélectionner un client</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name} {client.city ? `- ${client.city}` : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="date">Date et heure *</label>
        <input
          type="datetime-local"
          id="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="subject">Objet</label>
        <input
          type="text"
          id="subject"
          name="subject"
          value={form.subject}
          onChange={handleChange}
          placeholder="Objet de la visite"
        />
      </div>

      <div className="form-group">
        <label htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          name="notes"
          value={form.notes}
          onChange={(e) => handleChange(e)}
          placeholder="Notes de la visite"
          rows={4}
          style={{ 
            width: '100%', 
            padding: '0.75rem', 
            border: '1px solid var(--border)', 
            borderRadius: '0.5rem',
            fontSize: '1rem',
            resize: 'vertical'
          }}
        />
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="btn-secondary"
          onClick={onCancel || (() => navigate('/calendar'))}
          disabled={loading}
        >
          <X size={16} /> Annuler
        </button>
        <button type="submit" className="btn-primary" disabled={loading || !form.clientId || !form.date}>
          <Save size={16} /> {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </form>
  );
}
