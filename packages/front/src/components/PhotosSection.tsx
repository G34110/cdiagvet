import { useState, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Image, Trash2, X, Upload } from 'lucide-react';
import { CLIENT_PHOTOS_QUERY, DELETE_PHOTO_MUTATION, CREATE_PHOTO_MUTATION } from '../graphql/photos';
import { CLIENT_VISITS_QUERY } from '../graphql/visits';

interface Photo {
  id: string;
  url: string;
  caption?: string;
  createdAt: string;
  visitId: string;
}

interface Visit {
  id: string;
  date: string;
  subject?: string;
}

interface PhotosSectionProps {
  clientId: string;
}

export default function PhotosSection({ clientId }: PhotosSectionProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, loading, refetch } = useQuery(CLIENT_PHOTOS_QUERY, {
    variables: { clientId },
  });
  const photos: Photo[] = data?.clientPhotos || [];

  const { data: visitsData } = useQuery(CLIENT_VISITS_QUERY, {
    variables: { clientId },
  });
  const visits: Visit[] = visitsData?.clientVisits || [];

  const [createPhoto] = useMutation(CREATE_PHOTO_MUTATION, {
    onCompleted: () => {
      refetch();
      setShowUploadForm(false);
      setSelectedVisitId('');
    },
  });

  const [deletePhoto] = useMutation(DELETE_PHOTO_MUTATION, {
    onCompleted: () => refetch(),
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedVisitId) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:3000/uploads', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const { url } = await response.json();

      await createPhoto({
        variables: {
          input: {
            url: `http://localhost:3000${url}`,
            visitId: selectedVisitId,
          },
        },
      });
    } catch (err) {
      console.error('Error uploading photo:', err);
      alert('Erreur lors de l\'upload de la photo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Supprimer cette photo ?')) {
      await deletePhoto({ variables: { id } });
      if (selectedPhoto?.id === id) {
        setSelectedPhoto(null);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatVisitDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="photos-section">
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <Image size={20} /> Photos ({photos.length})
        </h3>
        <button className="btn-primary btn-sm" onClick={() => setShowUploadForm(!showUploadForm)}>
          <Upload size={16} /> Ajouter photo
        </button>
      </div>

      {showUploadForm && (
        <div style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
          <div className="form-group" style={{ marginBottom: '0.75rem' }}>
            <label>Visite associée *</label>
            <select
              value={selectedVisitId}
              onChange={(e) => setSelectedVisitId(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                fontSize: '1rem',
              }}
            >
              <option value="">Sélectionner une visite</option>
              {visits.map((visit) => (
                <option key={visit.id} value={visit.id}>
                  {formatVisitDate(visit.date)} {visit.subject ? `- ${visit.subject}` : ''}
                </option>
              ))}
            </select>
          </div>
          {visits.length === 0 && (
            <p style={{ color: 'var(--danger)', fontSize: '0.9rem', margin: '0.5rem 0' }}>
              Aucune visite enregistrée. Créez d'abord une visite pour pouvoir ajouter des photos.
            </p>
          )}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={!selectedVisitId || uploading}
              style={{ flex: 1 }}
            />
            <button className="btn-secondary btn-sm" onClick={() => setShowUploadForm(false)}>
              <X size={14} /> Annuler
            </button>
          </div>
          {uploading && <p style={{ margin: '0.5rem 0', color: 'var(--primary)' }}>Upload en cours...</p>}
        </div>
      )}

      {loading && <div className="loading">Chargement...</div>}

      {selectedPhoto && (
        <div
          className="photo-modal"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
            }}
            onClick={() => setSelectedPhoto(null)}
          >
            <X size={32} />
          </button>
          <img
            src={selectedPhoto.url}
            alt={selectedPhoto.caption || 'Photo'}
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              objectFit: 'contain',
            }}
            onClick={(e) => e.stopPropagation()}
          />
          {selectedPhoto.caption && (
            <p style={{ position: 'absolute', bottom: '2rem', color: 'white', textAlign: 'center' }}>
              {selectedPhoto.caption}
            </p>
          )}
        </div>
      )}

      <div
        className="photos-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '0.75rem',
        }}
      >
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="photo-card"
            style={{
              position: 'relative',
              paddingBottom: '100%',
              background: 'var(--bg-secondary)',
              borderRadius: '0.5rem',
              overflow: 'hidden',
              cursor: 'pointer',
            }}
            onClick={() => setSelectedPhoto(photo)}
          >
            <img
              src={photo.url}
              alt={photo.caption || 'Photo'}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            <button
              className="photo-delete"
              onClick={(e) => handleDelete(photo.id, e)}
              style={{
                position: 'absolute',
                top: '0.5rem',
                right: '0.5rem',
                padding: '0.25rem',
                background: 'rgba(0,0,0,0.6)',
                border: 'none',
                borderRadius: '0.25rem',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              <Trash2 size={14} />
            </button>
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '0.5rem',
                background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                color: 'white',
                fontSize: '0.75rem',
              }}
            >
              {formatDate(photo.createdAt)}
            </div>
          </div>
        ))}
      </div>

      {!loading && photos.length === 0 && (
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>
          Aucune photo pour ce client. Ajoutez des photos depuis les visites.
        </p>
      )}
    </div>
  );
}
