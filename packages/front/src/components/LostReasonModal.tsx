import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import './LostReasonModal.css';

const LOST_REASONS = [
  { value: 'PRIX_TROP_ELEVE', label: 'Prix trop élevé' },
  { value: 'CONCURRENT', label: 'Concurrent sélectionné' },
  { value: 'TIMING_BUDGET', label: 'Timing / Budget reporté' },
  { value: 'BESOIN_ANNULE', label: 'Besoin annulé par le client' },
  { value: 'PAS_DE_REPONSE', label: 'Pas de réponse du client' },
  { value: 'AUTRE', label: 'Autre' },
];

interface LostReasonModalProps {
  opportunityTitle: string;
  clientName: string;
  onConfirm: (reason: string, comment: string, competitorName?: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function LostReasonModal({
  opportunityTitle,
  clientName,
  onConfirm,
  onCancel,
  isLoading = false,
}: LostReasonModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [comment, setComment] = useState('');
  const [competitorName, setCompetitorName] = useState('');

  const isValid = () => {
    if (!selectedReason) return false;
    if (selectedReason === 'AUTRE' && !comment.trim()) return false;
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid()) return;
    onConfirm(selectedReason, comment, competitorName || undefined);
  };

  return (
    <div className="modal-overlay">
      <div className="lost-reason-modal">
        <div className="modal-header">
          <h3>
            <AlertCircle size={20} className="icon-warning" />
            Marquer comme perdue
          </h3>
          <button className="btn-close" onClick={onCancel} disabled={isLoading}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <p className="opportunity-info">
            <strong>{opportunityTitle}</strong> — {clientName}
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Motif de perte <span className="required">*</span></label>
              <div className="reason-options">
                {LOST_REASONS.map((reason) => (
                  <label
                    key={reason.value}
                    className={`reason-option ${selectedReason === reason.value ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="lostReason"
                      value={reason.value}
                      checked={selectedReason === reason.value}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      disabled={isLoading}
                    />
                    <span>{reason.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {selectedReason === 'CONCURRENT' && (
              <div className="form-group">
                <label>Nom du concurrent</label>
                <input
                  type="text"
                  value={competitorName}
                  onChange={(e) => setCompetitorName(e.target.value)}
                  placeholder="Nom du concurrent sélectionné"
                  disabled={isLoading}
                />
              </div>
            )}

            <div className="form-group">
              <label>
                Commentaire
                {selectedReason === 'AUTRE' && <span className="required"> *</span>}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={selectedReason === 'AUTRE' 
                  ? 'Veuillez préciser le motif...' 
                  : 'Informations complémentaires (optionnel)'}
                rows={3}
                disabled={isLoading}
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={onCancel}
                disabled={isLoading}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn-danger"
                disabled={!isValid() || isLoading}
              >
                {isLoading ? 'Enregistrement...' : 'Marquer comme perdue'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
