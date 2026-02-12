import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, gql } from '@apollo/client';
import { useSetRecoilState } from 'recoil';
import { authState } from '../state/auth';
import { Lock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

const CHANGE_PASSWORD_MUTATION = gql`
  mutation ChangePassword($input: ChangePasswordInput!) {
    changePassword(input: $input) {
      success
      message
    }
  }
`;

function calculateEntropy(password: string): number {
  let charsetSize = 0;
  if (/[a-z]/.test(password)) charsetSize += 26;
  if (/[A-Z]/.test(password)) charsetSize += 26;
  if (/[0-9]/.test(password)) charsetSize += 10;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) charsetSize += 32;
  if (charsetSize === 0) return 0;
  return Math.floor(password.length * Math.log2(charsetSize));
}

function getPasswordStrength(entropy: number): { label: string; color: string; width: string } {
  if (entropy < 30) return { label: 'Très faible', color: '#ef4444', width: '20%' };
  if (entropy < 40) return { label: 'Faible', color: '#f97316', width: '40%' };
  if (entropy < 50) return { label: 'Moyen', color: '#eab308', width: '60%' };
  if (entropy < 60) return { label: 'Fort', color: '#22c55e', width: '80%' };
  return { label: 'Très fort', color: '#10b981', width: '100%' };
}

export default function ForceChangePasswordPage() {
  const navigate = useNavigate();
  const setAuth = useSetRecoilState(authState);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [changePassword, { loading }] = useMutation(CHANGE_PASSWORD_MUTATION);

  const entropy = calculateEntropy(newPassword);
  const strength = getPasswordStrength(entropy);
  const isValid = entropy >= 50 && newPassword === confirmPassword && newPassword.length >= 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (entropy < 50) {
      setError('Le mot de passe n\'est pas assez fort (entropie minimum: 50)');
      return;
    }

    try {
      const { data } = await changePassword({
        variables: {
          input: { newPassword, confirmPassword },
        },
      });

      if (data?.changePassword?.success) {
        setSuccess(true);
        // Clear auth state to force re-login
        setTimeout(() => {
          setAuth({ isAuthenticated: false, user: null, token: null });
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        }, 2000);
      } else {
        setError(data?.changePassword?.message || 'Une erreur est survenue');
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    }
  };

  if (success) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>CDiagVet</h1>
          <p className="subtitle">Mot de passe modifié</p>
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <CheckCircle size={64} color="#10b981" />
            <p style={{ marginTop: '1rem', color: '#10b981', fontWeight: 500 }}>
              Votre mot de passe a été modifié avec succès !
            </p>
            <p style={{ marginTop: '0.5rem', color: '#6b7280' }}>
              Redirection vers la page de connexion...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: '450px' }}>
        <h1>CDiagVet</h1>
        <p className="subtitle">Changement de mot de passe obligatoire</p>

        <div style={{ 
          background: '#fef3c7', 
          border: '1px solid #f59e0b', 
          borderRadius: '0.5rem', 
          padding: '1rem', 
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem'
        }}>
          <AlertCircle size={20} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.875rem', color: '#92400e' }}>
            <strong>Première connexion détectée.</strong><br />
            Pour des raisons de sécurité, vous devez créer un nouveau mot de passe fort avant d'accéder au portail.
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="newPassword">Nouveau mot de passe</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 caractères"
                required
                minLength={8}
                style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ 
                  position: 'absolute', 
                  right: '0.75rem', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {newPassword && (
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Force du mot de passe</span>
                  <span style={{ fontSize: '0.75rem', color: strength.color, fontWeight: 500 }}>
                    {strength.label} (entropie: {entropy})
                  </span>
                </div>
                <div style={{ 
                  height: '4px', 
                  background: '#e5e7eb', 
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    height: '100%', 
                    width: strength.width, 
                    background: strength.color,
                    transition: 'all 0.3s ease'
                  }} />
                </div>
                {entropy < 50 && (
                  <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem' }}>
                    L'entropie doit être ≥ 50. Ajoutez des majuscules, chiffres ou caractères spéciaux.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
              <input
                type={showConfirm ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Retapez le mot de passe"
                required
                minLength={8}
                style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                style={{ 
                  position: 'absolute', 
                  right: '0.75rem', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem' }}>
                Les mots de passe ne correspondent pas
              </p>
            )}
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading || !isValid}
            style={{ opacity: isValid ? 1 : 0.6 }}
          >
            {loading ? 'Enregistrement...' : 'Valider mon nouveau mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
}
