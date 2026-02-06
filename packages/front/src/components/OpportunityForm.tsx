import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { MY_CLIENTS_QUERY } from '../graphql/clients';

interface Client {
  id: string;
  name: string;
  organization?: string;
}

interface MyClientsData {
  myClients: Client[];
}

interface OpportunityFormData {
  clientId: string;
  title: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  source: string;
  amount: number;
  probability?: number;
  expectedCloseDate: string;
  notes: string;
}

interface OpportunityFormProps {
  initialData?: Partial<OpportunityFormData>;
  onSubmit: (data: OpportunityFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const SOURCES = [
  { value: 'SALON', label: 'Salon' },
  { value: 'APPEL_ENTRANT', label: 'Appel entrant' },
  { value: 'RECOMMANDATION', label: 'Recommandation' },
  { value: 'SITE_WEB', label: 'Site web' },
  { value: 'AUTRE', label: 'Autre' },
];

export default function OpportunityForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: OpportunityFormProps) {
  const [formData, setFormData] = useState<OpportunityFormData>({
    clientId: initialData?.clientId || '',
    title: initialData?.title || '',
    contactName: initialData?.contactName || '',
    contactEmail: initialData?.contactEmail || '',
    contactPhone: initialData?.contactPhone || '',
    source: initialData?.source || 'SALON',
    amount: initialData?.amount || 0,
    probability: initialData?.probability,
    expectedCloseDate: initialData?.expectedCloseDate || '',
    notes: initialData?.notes || '',
  });

  const { data: clientsData } = useQuery<MyClientsData>(MY_CLIENTS_QUERY);
  const clients = clientsData?.myClients || [];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="opportunity-form">
      <div className="form-grid">
        <div className="form-group full-width">
          <label htmlFor="clientId">Client *</label>
          <select
            id="clientId"
            name="clientId"
            value={formData.clientId}
            onChange={handleChange}
            required
          >
            <option value="">Sélectionner un client</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.name} {client.organization ? `(${client.organization})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group full-width">
          <label htmlFor="title">Titre de l'opportunité *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="Ex: Renouvellement contrat annuel"
          />
        </div>

        <div className="form-group">
          <label htmlFor="contactName">Contact principal *</label>
          <input
            type="text"
            id="contactName"
            name="contactName"
            value={formData.contactName}
            onChange={handleChange}
            required
            placeholder="Nom du contact"
          />
        </div>

        <div className="form-group">
          <label htmlFor="contactEmail">Email du contact</label>
          <input
            type="email"
            id="contactEmail"
            name="contactEmail"
            value={formData.contactEmail}
            onChange={handleChange}
            placeholder="email@exemple.com"
          />
        </div>

        <div className="form-group">
          <label htmlFor="contactPhone">Téléphone du contact</label>
          <input
            type="tel"
            id="contactPhone"
            name="contactPhone"
            value={formData.contactPhone}
            onChange={handleChange}
            placeholder="+33 6 00 00 00 00"
          />
        </div>

        <div className="form-group">
          <label htmlFor="source">Source *</label>
          <select
            id="source"
            name="source"
            value={formData.source}
            onChange={handleChange}
            required
          >
            {SOURCES.map(source => (
              <option key={source.value} value={source.value}>
                {source.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="amount">Montant estimé (€) *</label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount || ''}
            onChange={(e) => {
              const val = e.target.value;
              setFormData(prev => ({
                ...prev,
                amount: val === '' ? 0 : parseFloat(val),
              }));
            }}
            required
            min="0"
            step="0.01"
            placeholder="0"
          />
        </div>

        <div className="form-group">
          <label htmlFor="expectedCloseDate">Date de clôture prévue *</label>
          <input
            type="date"
            id="expectedCloseDate"
            name="expectedCloseDate"
            value={formData.expectedCloseDate}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group full-width">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={4}
            placeholder="Notes ou commentaires..."
          />
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Annuler
        </button>
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>

      <style>{`
        .opportunity-form {
          padding: 1.5rem;
        }
        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .form-group.full-width {
          grid-column: 1 / -1;
        }
        .form-group label {
          font-weight: 500;
          color: var(--text-primary);
        }
        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 0.75rem;
          border: 1px solid var(--border);
          border-radius: 0.5rem;
          font-size: 1rem;
        }
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border);
        }
        .btn-primary,
        .btn-secondary {
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-primary {
          background: var(--primary);
          color: white;
          border: none;
        }
        .btn-primary:hover:not(:disabled) {
          background: var(--primary-dark);
        }
        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .btn-secondary {
          background: white;
          color: var(--text-primary);
          border: 1px solid var(--border);
        }
        .btn-secondary:hover {
          background: var(--bg-secondary);
        }
      `}</style>
    </form>
  );
}
