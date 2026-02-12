import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMutation, gql } from '@apollo/client';
import { Lock, CheckCircle, AlertCircle } from 'lucide-react';

const VALIDATE_TOKEN_MUTATION = gql`
  mutation ValidateResetToken($input: ValidateResetTokenInput!) {
    validateResetToken(input: $input) {
      valid
      email
    }
  }
`;

const RESET_PASSWORD_MUTATION = gql`
  mutation ResetPassword($input: ResetPasswordInput!) {
    resetPassword(input: $input) {
      success
      message
    }
  }
`;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  const [validateToken] = useMutation(VALIDATE_TOKEN_MUTATION);
  const [resetPassword, { loading }] = useMutation(RESET_PASSWORD_MUTATION);

  useEffect(() => {
    if (token) {
      validateToken({ variables: { input: { token } } })
        .then(({ data }) => {
          if (data?.validateResetToken?.valid) {
            setTokenValid(true);
            setEmail(data.validateResetToken.email || '');
          } else {
            setTokenValid(false);
          }
        })
        .catch(() => {
          setTokenValid(false);
        });
    } else {
      setTokenValid(false);
    }
  }, [token, validateToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      const { data } = await resetPassword({
        variables: {
          input: { token, newPassword, confirmPassword },
        },
      });

      if (data?.resetPassword?.success) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(data?.resetPassword?.message || 'Une erreur est survenue');
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    }
  };

  if (tokenValid === null) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>CDiagVet</h1>
          <p className="subtitle">Vérification du lien...</p>
          <div className="loading">Chargement...</div>
        </div>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>CDiagVet</h1>
          <p className="subtitle">Initialisation du mot de passe</p>
          <div className="error-message" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={20} />
            <span>Ce lien est invalide ou a expiré. Veuillez contacter votre administrateur.</span>
          </div>
          <button className="btn-primary" onClick={() => navigate('/login')} style={{ width: '100%', marginTop: '1rem', justifyContent: 'center' }}>
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>CDiagVet</h1>
          <p className="subtitle">Mot de passe créé</p>
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <CheckCircle size={64} color="#10b981" />
            <p style={{ marginTop: '1rem', color: '#10b981', fontWeight: 500 }}>
              Votre mot de passe a été créé avec succès !
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
      <div className="login-card">
        <h1>CDiagVet</h1>
        <p className="subtitle">Créez votre mot de passe</p>

        {email && (
          <p style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#6b7280' }}>
            Compte : <strong>{email}</strong>
          </p>
        )}

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="newPassword">Nouveau mot de passe</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 caractères"
                required
                minLength={6}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Retapez le mot de passe"
                required
                minLength={6}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Enregistrement...' : 'Créer mon mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
}
