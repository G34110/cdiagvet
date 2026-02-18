import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Users, Plus, Trash2, Edit2, X, Save, Phone, Mail, Star } from 'lucide-react';
import {
  CLIENT_CONTACTS_QUERY,
  CREATE_CONTACT_MUTATION,
  UPDATE_CONTACT_MUTATION,
  DELETE_CONTACT_MUTATION,
} from '../graphql/contacts';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  isPrimary: boolean;
  clientId: string;
}

interface ContactFormData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  isPrimary: boolean;
}

interface ContactsSectionProps {
  clientId: string;
}

const emptyForm: ContactFormData = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  isPrimary: false,
};

export default function ContactsSection({ clientId }: ContactsSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ContactFormData>(emptyForm);

  const { data, loading, refetch } = useQuery(CLIENT_CONTACTS_QUERY, {
    variables: { clientId },
  });
  const contacts: Contact[] = data?.clientContacts || [];

  const [createContact, { loading: creating }] = useMutation(CREATE_CONTACT_MUTATION, {
    onCompleted: () => {
      setFormData(emptyForm);
      setShowForm(false);
      refetch();
    },
  });

  const [updateContact, { loading: updating }] = useMutation(UPDATE_CONTACT_MUTATION, {
    onCompleted: () => {
      setEditingId(null);
      setFormData(emptyForm);
      refetch();
    },
  });

  const [deleteContact] = useMutation(DELETE_CONTACT_MUTATION, {
    onCompleted: () => refetch(),
  });

  const handleCreate = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) return;
    await createContact({
      variables: {
        input: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || null,
          email: formData.email || null,
          isPrimary: formData.isPrimary,
          clientId,
        },
      },
    });
  };

  const handleUpdate = async (id: string) => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) return;
    await updateContact({
      variables: {
        id,
        input: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || null,
          email: formData.email || null,
          isPrimary: formData.isPrimary,
        },
      },
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Supprimer ce contact ?')) {
      await deleteContact({ variables: { id } });
    }
  };

  const startEdit = (contact: Contact) => {
    setEditingId(contact.id);
    setFormData({
      firstName: contact.firstName,
      lastName: contact.lastName,
      phone: contact.phone || '',
      email: contact.email || '',
      isPrimary: contact.isPrimary,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData(emptyForm);
  };

  const renderForm = (isEdit: boolean, contactId?: string) => (
    <div style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 500 }}>Prénom *</label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            placeholder="Prénom"
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              border: '1px solid var(--border)',
              borderRadius: '0.375rem',
              fontSize: '0.9rem',
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 500 }}>Nom *</label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            placeholder="Nom"
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              border: '1px solid var(--border)',
              borderRadius: '0.375rem',
              fontSize: '0.9rem',
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 500 }}>Téléphone</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="06 12 34 56 78"
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              border: '1px solid var(--border)',
              borderRadius: '0.375rem',
              fontSize: '0.9rem',
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 500 }}>Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="contact@exemple.fr"
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              border: '1px solid var(--border)',
              borderRadius: '0.375rem',
              fontSize: '0.9rem',
            }}
          />
        </div>
      </div>
      <div style={{ marginBottom: '0.75rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
          <input
            type="checkbox"
            checked={formData.isPrimary}
            onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
            style={{ width: '16px', height: '16px' }}
          />
          <Star size={16} style={{ color: '#d97706' }} />
          Contact principal
        </label>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        <button
          className="btn-secondary btn-sm"
          onClick={() => isEdit ? cancelEdit() : (setShowForm(false), setFormData(emptyForm))}
        >
          <X size={14} /> Annuler
        </button>
        <button
          className="btn-primary btn-sm"
          onClick={() => isEdit && contactId ? handleUpdate(contactId) : handleCreate()}
          disabled={creating || updating || !formData.firstName.trim() || !formData.lastName.trim()}
        >
          <Save size={14} /> {creating || updating ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="contacts-section">
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <Users size={20} /> Contacts ({contacts.length})
        </h3>
        <button className="btn-primary btn-sm" onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData(emptyForm); }}>
          <Plus size={16} /> Nouveau contact
        </button>
      </div>

      {showForm && !editingId && renderForm(false)}

      {loading && <div className="loading">Chargement...</div>}

      <div className="contacts-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {contacts.map((contact) => (
          <div
            key={contact.id}
            style={{
              padding: '1rem',
              background: 'var(--bg-card)',
              border: contact.isPrimary ? '2px solid #1e40af' : '1px solid var(--border)',
              borderRadius: '0.5rem',
            }}
          >
            {editingId === contact.id ? (
              renderForm(true, contact.id)
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    {contact.isPrimary && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.125rem 0.5rem',
                        background: '#eff6ff',
                        color: '#1e40af',
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        marginBottom: '0.5rem',
                      }}>
                        <Star size={12} /> Principal
                      </span>
                    )}
                    <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, fontSize: '1rem' }}>
                      {contact.firstName} {contact.lastName}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {contact.phone && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Phone size={14} />
                          <a href={`tel:${contact.phone}`} style={{ color: '#1e40af', textDecoration: 'none' }}>{contact.phone}</a>
                        </span>
                      )}
                      {contact.email && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Mail size={14} />
                          <a href={`mailto:${contact.email}`} style={{ color: '#1e40af', textDecoration: 'none' }}>{contact.email}</a>
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn-icon"
                      onClick={() => startEdit(contact)}
                      style={{ padding: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      className="btn-icon"
                      onClick={() => handleDelete(contact.id)}
                      style={{ padding: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}

        {!loading && contacts.length === 0 && (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>
            Aucun contact pour ce client
          </p>
        )}
      </div>
    </div>
  );
}
