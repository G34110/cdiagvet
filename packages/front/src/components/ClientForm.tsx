import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { Save, X } from 'lucide-react';
import { CREATE_CLIENT_MUTATION, UPDATE_CLIENT_MUTATION, MY_CLIENTS_QUERY } from '../graphql/clients';

interface ClientFormProps {
  client?: {
    id: string;
    name: string;
    address?: string;
    city?: string;
    postalCode?: string;
    phone?: string;
    email?: string;
    filiereId?: string;
    isActive?: boolean;
  };
  onCancel?: () => void;
  onSuccess?: () => void;
}

export default function ClientForm({ client, onCancel, onSuccess }: ClientFormProps) {
  const navigate = useNavigate();
  const isEditing = !!client?.id;

  const [form, setForm] = useState({
    name: client?.name || '',
    address: client?.address || '',
    city: client?.city || '',
    postalCode: client?.postalCode || '',
    phone: client?.phone || '',
    email: client?.email || '',
    isActive: client?.isActive ?? true,
  });

  const [createClient, { loading: creating }] = useMutation(CREATE_CLIENT_MUTATION, {
    refetchQueries: [{ query: MY_CLIENTS_QUERY }],
  });

  const [updateClient, { loading: updating }] = useMutation(UPDATE_CLIENT_MUTATION);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Build input - only include non-empty fields
    const cleanedInput: Record<string, unknown> = {
      name: form.name,
    };

    if (form.address) cleanedInput.address = form.address;
    if (form.city) cleanedInput.city = form.city;
    if (form.postalCode) cleanedInput.postalCode = form.postalCode;
    if (form.phone) cleanedInput.phone = form.phone;
    if (form.email) cleanedInput.email = form.email;

    // Only include isActive for updates (not creation)
    if (isEditing) {
      cleanedInput.isActive = form.isActive;
    }

    try {
      if (isEditing) {
        await updateClient({
          variables: {
            id: client.id,
            input: cleanedInput,
          },
        });
      } else {
        await createClient({
          variables: {
            input: cleanedInput,
          },
        });
      }

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/clients');
      }
    } catch (err) {
      console.error('Error saving client:', err);
    }
  };

  const loading = creating || updating;

  return (
    <form className="client-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="name">Nom *</label>
        <input
          type="text"
          id="name"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          placeholder="Nom du client"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="address">Adresse</label>
          <input
            type="text"
            id="address"
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Adresse"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="postalCode">Code postal</label>
          <input
            type="text"
            id="postalCode"
            name="postalCode"
            value={form.postalCode}
            onChange={handleChange}
            placeholder="Code postal"
          />
        </div>
        <div className="form-group">
          <label htmlFor="city">Ville</label>
          <input
            type="text"
            id="city"
            name="city"
            value={form.city}
            onChange={handleChange}
            placeholder="Ville"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="phone">Téléphone</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Téléphone"
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
          />
        </div>
      </div>

      {isEditing && (
        <div className="form-group" style={{ marginTop: '1rem' }}>
          <label>Statut</label>
          <div className="status-toggle" style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="isActive"
                checked={form.isActive === true}
                onChange={() => setForm((prev) => ({ ...prev, isActive: true }))}
              />
              <span className="status-badge active">Actif</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="isActive"
                checked={form.isActive === false}
                onChange={() => setForm((prev) => ({ ...prev, isActive: false }))}
              />
              <span className="status-badge inactive">Inactif</span>
            </label>
          </div>
        </div>
      )}

      <div className="form-actions">
        <button
          type="button"
          className="btn-secondary"
          onClick={onCancel || (() => navigate('/clients'))}
          disabled={loading}
        >
          <X size={16} /> Annuler
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          <Save size={16} /> {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </form>
  );
}
