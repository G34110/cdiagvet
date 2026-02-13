import { useState, useMemo } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { Save, X } from 'lucide-react';
import { CREATE_CLIENT_MUTATION, UPDATE_CLIENT_MUTATION, MY_CLIENTS_QUERY, ALL_FILIERES_QUERY } from '../graphql/clients';
import { countries, getCountryConfig, getRegionList } from '../config/countries';

const SEGMENTATION_OPTIONS = [
  { value: 'DISTRIBUTEUR', label: 'Distributeur' },
  { value: 'AGENT', label: 'Agent' },
  { value: 'AUTRES', label: 'Autres' },
];

interface ClientFormProps {
  client?: {
    id: string;
    name: string;
    organization?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    country?: string;
    phone?: string;
    email?: string;
    filieres?: { id: string; name: string }[];
    isActive?: boolean;
    segmentation?: string;
  };
  onCancel?: () => void;
  onSuccess?: () => void;
}

export default function ClientForm({ client, onCancel, onSuccess }: ClientFormProps) {
  const navigate = useNavigate();
  const isEditing = !!client?.id;

  const [form, setForm] = useState({
    name: client?.name || '',
    organization: client?.organization || '',
    addressLine1: client?.addressLine1 || '',
    addressLine2: client?.addressLine2 || '',
    city: client?.city || '',
    region: client?.region || '',
    postalCode: client?.postalCode || '',
    country: client?.country || 'FR',
    phone: client?.phone || '',
    email: client?.email || '',
    filiereIds: client?.filieres?.map(f => f.id) || [] as string[],
    isActive: client?.isActive ?? true,
    segmentation: client?.segmentation || 'AUTRES',
  });

  const countryConfig = useMemo(() => getCountryConfig(form.country), [form.country]);
  const regionList = useMemo(() => getRegionList(form.country), [form.country]);

  const { data: filieresData } = useQuery(ALL_FILIERES_QUERY);
  const filieres = filieresData?.allFilieres || [];

  const [createClient, { loading: creating }] = useMutation(CREATE_CLIENT_MUTATION, {
    refetchQueries: [{ query: MY_CLIENTS_QUERY }],
  });

  const [updateClient, { loading: updating }] = useMutation(UPDATE_CLIENT_MUTATION);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountry = e.target.value;
    setForm(prev => ({
      ...prev,
      country: newCountry,
      region: '', // Reset region when country changes
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate filières for new clients
    if (!isEditing && form.filiereIds.length === 0) {
      alert('Veuillez sélectionner au moins une filière');
      return;
    }

    // Validate email required
    if (!form.email) {
      alert('L\'email est obligatoire');
      return;
    }

    // Build input - only include non-empty fields
    const cleanedInput: Record<string, unknown> = {
      name: form.name,
      country: form.country,
    };

    if (form.organization) cleanedInput.organization = form.organization;
    if (form.addressLine1) cleanedInput.addressLine1 = form.addressLine1;
    if (form.addressLine2) cleanedInput.addressLine2 = form.addressLine2;
    if (form.city) cleanedInput.city = form.city;
    if (form.region) cleanedInput.region = form.region;
    if (form.postalCode) cleanedInput.postalCode = form.postalCode;
    if (form.phone) cleanedInput.phone = form.phone;
    cleanedInput.email = form.email;
    cleanedInput.filiereIds = form.filiereIds;
    cleanedInput.segmentation = form.segmentation;

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
      <div className="form-row">
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
        <div className="form-group">
          <label>Filières {!isEditing && '*'}</label>
          <div className="checkbox-group" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.5rem' }}>
            {filieres.map((f: { id: string; name: string }) => (
              <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.filiereIds.includes(f.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setForm(prev => ({ ...prev, filiereIds: [...prev.filiereIds, f.id] }));
                    } else {
                      setForm(prev => ({ ...prev, filiereIds: prev.filiereIds.filter(id => id !== f.id) }));
                    }
                  }}
                />
                {f.name}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="segmentation">Segmentation *</label>
          <select
            id="segmentation"
            name="segmentation"
            value={form.segmentation}
            onChange={handleChange}
            required
          >
            {SEGMENTATION_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="organization">Organisation</label>
          <input
            type="text"
            id="organization"
            name="organization"
            value={form.organization}
            onChange={handleChange}
            placeholder="Organisation (optionnel)"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="addressLine1">{countryConfig.labels.addressLine1}</label>
          <input
            type="text"
            id="addressLine1"
            name="addressLine1"
            value={form.addressLine1}
            onChange={handleChange}
            placeholder={countryConfig.labels.addressLine1}
          />
        </div>
        <div className="form-group">
          <label htmlFor="addressLine2">{countryConfig.labels.addressLine2}</label>
          <input
            type="text"
            id="addressLine2"
            name="addressLine2"
            value={form.addressLine2}
            onChange={handleChange}
            placeholder={countryConfig.labels.addressLine2}
          />
        </div>
      </div>

      <div className="form-row three-cols">
        <div className="form-group">
          <label htmlFor="postalCode">
            {countryConfig.labels.postalCode}
            {countryConfig.required.postalCode && ' *'}
          </label>
          <input
            type="text"
            id="postalCode"
            name="postalCode"
            value={form.postalCode}
            onChange={handleChange}
            placeholder={countryConfig.postalCodePlaceholder}
            pattern={countryConfig.postalCodePattern}
            required={countryConfig.required.postalCode}
          />
        </div>
        <div className="form-group">
          <label htmlFor="city">{countryConfig.labels.city}</label>
          <input
            type="text"
            id="city"
            name="city"
            value={form.city}
            onChange={handleChange}
            placeholder={countryConfig.labels.city}
          />
        </div>
        <div className="form-group">
          <label htmlFor="country">Pays *</label>
          <select
            id="country"
            name="country"
            value={form.country}
            onChange={handleCountryChange}
            required
          >
            {countries.map(c => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {(countryConfig.required.region || regionList) && (
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="region">
              {countryConfig.labels.region}
              {countryConfig.required.region && ' *'}
            </label>
            {regionList ? (
              <select
                id="region"
                name="region"
                value={form.region}
                onChange={handleChange}
                required={countryConfig.required.region}
              >
                <option value="">-- Sélectionner --</option>
                {regionList.map(r => (
                  <option key={r.code} value={r.code}>{r.name}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                id="region"
                name="region"
                value={form.region}
                onChange={handleChange}
                placeholder={countryConfig.labels.region}
                required={countryConfig.required.region}
              />
            )}
          </div>
        </div>
      )}

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
          <label htmlFor="email">Email *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            required
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
