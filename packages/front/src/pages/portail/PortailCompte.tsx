import { useState } from 'react';
import { useRecoilValue } from 'recoil';
import { User, Mail, Phone, MapPin, Building2, Lock, Save, CheckCircle } from 'lucide-react';
import { authState } from '../../state/auth';
import './PortailCompte.css';

export default function PortailCompte() {
  const auth = useRecoilValue(authState);
  const [activeTab, setActiveTab] = useState<'info' | 'password'>('info');
  const [saved, setSaved] = useState(false);

  const [formData, setFormData] = useState({
    firstName: auth.user?.firstName || '',
    lastName: auth.user?.lastName || '',
    email: auth.user?.email || '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }
    setSaved(true);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="portail-compte">
      <header className="compte-header">
        <h1><User size={28} /> Mon compte</h1>
        <p>Gérez vos informations personnelles</p>
      </header>

      <div className="compte-tabs">
        <button
          className={activeTab === 'info' ? 'active' : ''}
          onClick={() => setActiveTab('info')}
        >
          <User size={18} />
          Informations
        </button>
        <button
          className={activeTab === 'password' ? 'active' : ''}
          onClick={() => setActiveTab('password')}
        >
          <Lock size={18} />
          Mot de passe
        </button>
      </div>

      {saved && (
        <div className="success-message">
          <CheckCircle size={18} />
          Modifications enregistrées
        </div>
      )}

      {activeTab === 'info' && (
        <form className="compte-form" onSubmit={handleSaveInfo}>
          <div className="form-section">
            <h3>Informations personnelles</h3>
            <div className="form-row">
              <div className="form-group">
                <label><User size={16} /> Prénom</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label><User size={16} /> Nom</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label><Mail size={16} /> Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  disabled
                />
                <span className="form-hint">L'email ne peut pas être modifié</span>
              </div>
              <div className="form-group">
                <label><Phone size={16} /> Téléphone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="06 12 34 56 78"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Adresse de livraison</h3>
            <div className="form-group full-width">
              <label><MapPin size={16} /> Adresse</label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Rue de la Ferme"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label><Building2 size={16} /> Ville</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Paris"
                />
              </div>
              <div className="form-group">
                <label>Code postal</label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={e => setFormData({ ...formData, postalCode: e.target.value })}
                  placeholder="75000"
                />
              </div>
            </div>
          </div>

          <button type="submit" className="btn-save">
            <Save size={18} />
            Enregistrer les modifications
          </button>
        </form>
      )}

      {activeTab === 'password' && (
        <form className="compte-form" onSubmit={handleChangePassword}>
          <div className="form-section">
            <h3>Changer le mot de passe</h3>
            <div className="form-group full-width">
              <label><Lock size={16} /> Mot de passe actuel</label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                required
              />
            </div>
            <div className="form-group full-width">
              <label><Lock size={16} /> Nouveau mot de passe</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                required
                minLength={8}
              />
              <span className="form-hint">Minimum 8 caractères</span>
            </div>
            <div className="form-group full-width">
              <label><Lock size={16} /> Confirmer le nouveau mot de passe</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-save">
            <Lock size={18} />
            Modifier le mot de passe
          </button>
        </form>
      )}
    </div>
  );
}
