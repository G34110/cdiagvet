import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Users, Plus, Edit2, Trash2, Phone, Mail, Star, X, Save } from 'lucide-react';
import {
  MY_CONTACTS_QUERY,
  CREATE_CONTACT_MUTATION,
  UPDATE_CONTACT_MUTATION,
  DELETE_CONTACT_MUTATION,
} from '../../graphql/contacts';
import './PortailContacts.css';

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

const emptyForm: ContactFormData = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  isPrimary: false,
};

export default function PortailContacts() {
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState<ContactFormData>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data, loading, refetch } = useQuery<{ myContacts: Contact[] }>(MY_CONTACTS_QUERY);
  const [createContact, { loading: creating }] = useMutation(CREATE_CONTACT_MUTATION);
  const [updateContact, { loading: updating }] = useMutation(UPDATE_CONTACT_MUTATION);
  const [deleteContact, { loading: deleting }] = useMutation(DELETE_CONTACT_MUTATION);

  const contacts = data?.myContacts || [];

  const handleOpenCreate = () => {
    setEditingContact(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const handleOpenEdit = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      firstName: contact.firstName,
      lastName: contact.lastName,
      phone: contact.phone || '',
      email: contact.email || '',
      isPrimary: contact.isPrimary,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingContact) {
        await updateContact({
          variables: {
            id: editingContact.id,
            input: {
              firstName: formData.firstName,
              lastName: formData.lastName,
              phone: formData.phone || null,
              email: formData.email || null,
              isPrimary: formData.isPrimary,
            },
          },
        });
      } else {
        await createContact({
          variables: {
            input: {
              firstName: formData.firstName,
              lastName: formData.lastName,
              phone: formData.phone || null,
              email: formData.email || null,
              isPrimary: formData.isPrimary,
              clientId: contacts[0]?.clientId || '',
            },
          },
        });
      }
      setShowModal(false);
      refetch();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteContact({ variables: { id } });
      setDeleteConfirm(null);
      refetch();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  if (loading) {
    return (
      <div className="portail-contacts">
        <div className="loading-state">Chargement des contacts...</div>
      </div>
    );
  }

  return (
    <div className="portail-contacts">
      <header className="contacts-header">
        <div>
          <h1><Users size={28} /> Mes contacts</h1>
          <p>Gérez les contacts de votre entreprise</p>
        </div>
        <button className="btn-add" onClick={handleOpenCreate}>
          <Plus size={18} />
          Ajouter un contact
        </button>
      </header>

      {contacts.length === 0 ? (
        <div className="empty-state">
          <Users size={48} />
          <h3>Aucun contact</h3>
          <p>Ajoutez vos premiers contacts pour faciliter la communication.</p>
          <button className="btn-add" onClick={handleOpenCreate}>
            <Plus size={18} />
            Ajouter un contact
          </button>
        </div>
      ) : (
        <div className="contacts-grid">
          {contacts.map(contact => (
            <div key={contact.id} className={`contact-card ${contact.isPrimary ? 'primary' : ''}`}>
              {contact.isPrimary && (
                <div className="primary-badge">
                  <Star size={14} />
                  Contact principal
                </div>
              )}
              <div className="contact-name">
                {contact.firstName} {contact.lastName}
              </div>
              {contact.phone && (
                <div className="contact-info">
                  <Phone size={16} />
                  <a href={`tel:${contact.phone}`}>{contact.phone}</a>
                </div>
              )}
              {contact.email && (
                <div className="contact-info">
                  <Mail size={16} />
                  <a href={`mailto:${contact.email}`}>{contact.email}</a>
                </div>
              )}
              <div className="contact-actions">
                <button className="btn-icon" onClick={() => handleOpenEdit(contact)} title="Modifier">
                  <Edit2 size={16} />
                </button>
                <button
                  className="btn-icon danger"
                  onClick={() => setDeleteConfirm(contact.id)}
                  title="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {deleteConfirm === contact.id && (
                <div className="delete-confirm">
                  <p>Supprimer ce contact ?</p>
                  <div className="confirm-actions">
                    <button onClick={() => setDeleteConfirm(null)}>Annuler</button>
                    <button
                      className="danger"
                      onClick={() => handleDelete(contact.id)}
                      disabled={deleting}
                    >
                      {deleting ? 'Suppression...' : 'Supprimer'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingContact ? 'Modifier le contact' : 'Nouveau contact'}</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Prénom *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Nom *</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Téléphone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="06 12 34 56 78"
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@exemple.fr"
                  />
                </div>
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isPrimary}
                    onChange={e => setFormData({ ...formData, isPrimary: e.target.checked })}
                  />
                  <Star size={16} />
                  Définir comme contact principal
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-save" disabled={creating || updating}>
                  <Save size={18} />
                  {creating || updating ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
