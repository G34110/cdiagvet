import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { MessageSquare, Plus, Trash2, Edit2, X, Save } from 'lucide-react';
import { CLIENT_NOTES_QUERY, CREATE_NOTE_MUTATION, UPDATE_NOTE_MUTATION, DELETE_NOTE_MUTATION } from '../graphql/notes';

interface Note {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface NotesSectionProps {
  clientId: string;
}

export default function NotesSection({ clientId }: NotesSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const { data, loading, refetch } = useQuery(CLIENT_NOTES_QUERY, {
    variables: { clientId },
  });
  const notes: Note[] = data?.clientNotes || [];

  const [createNote, { loading: creating }] = useMutation(CREATE_NOTE_MUTATION, {
    onCompleted: () => {
      setNewNote('');
      setShowForm(false);
      refetch();
    },
  });

  const [updateNote, { loading: updating }] = useMutation(UPDATE_NOTE_MUTATION, {
    onCompleted: () => {
      setEditingId(null);
      setEditContent('');
      refetch();
    },
  });

  const [deleteNote] = useMutation(DELETE_NOTE_MUTATION, {
    onCompleted: () => refetch(),
  });

  const handleCreate = async () => {
    if (!newNote.trim()) return;
    await createNote({
      variables: {
        input: { content: newNote, clientId },
      },
    });
  };

  const handleUpdate = async (id: string) => {
    if (!editContent.trim()) return;
    await updateNote({
      variables: {
        id,
        input: { content: editContent },
      },
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Supprimer cette note ?')) {
      await deleteNote({ variables: { id } });
    }
  };

  const startEdit = (note: Note) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="notes-section">
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <MessageSquare size={20} /> Notes ({notes.length})
        </h3>
        <button className="btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> Nouvelle note
        </button>
      </div>

      {showForm && (
        <div className="note-form" style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Écrire une note..."
            rows={3}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              resize: 'vertical',
              marginBottom: '0.5rem',
            }}
          />
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button className="btn-secondary btn-sm" onClick={() => { setShowForm(false); setNewNote(''); }}>
              <X size={14} /> Annuler
            </button>
            <button className="btn-primary btn-sm" onClick={handleCreate} disabled={creating || !newNote.trim()}>
              <Save size={14} /> {creating ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      )}

      {loading && <div className="loading">Chargement...</div>}

      <div className="notes-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {notes.map((note) => (
          <div
            key={note.id}
            className="note-card"
            style={{
              padding: '1rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
            }}
          >
            {editingId === note.id ? (
              <div>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    resize: 'vertical',
                    marginBottom: '0.5rem',
                  }}
                />
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button className="btn-secondary btn-sm" onClick={() => setEditingId(null)}>
                    <X size={14} /> Annuler
                  </button>
                  <button className="btn-primary btn-sm" onClick={() => handleUpdate(note.id)} disabled={updating}>
                    <Save size={14} /> Sauvegarder
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p style={{ margin: '0 0 0.75rem 0', whiteSpace: 'pre-wrap' }}>{note.content}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <span>
                    {note.author.firstName} {note.author.lastName} • {formatDate(note.createdAt)}
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn-icon"
                      onClick={() => startEdit(note)}
                      style={{ padding: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      className="btn-icon"
                      onClick={() => handleDelete(note.id)}
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

        {!loading && notes.length === 0 && (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>
            Aucune note pour ce client
          </p>
        )}
      </div>
    </div>
  );
}
