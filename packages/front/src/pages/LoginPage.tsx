import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSetRecoilState } from 'recoil';
import { useMutation, gql } from '@apollo/client';
import { authState } from '../state/auth';

const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      user {
        id
        email
        firstName
        lastName
        role
      }
    }
  }
`;

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setAuth = useSetRecoilState(authState);

  const [login, { loading }] = useMutation(LOGIN_MUTATION, {
    onCompleted: (data) => {
      const { accessToken, user } = data.login;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('user', JSON.stringify(user));
      setAuth({ isAuthenticated: true, user, accessToken });
      navigate('/dashboard');
    },
    onError: (err) => {
      setError(err.message || 'Identifiants incorrects');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    login({ variables: { input: { email, password } } });
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>CDiagVet</h1>
        <p className="subtitle">CRM Diagnostics Vétérinaires</p>

        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
