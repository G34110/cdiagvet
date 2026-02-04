import { useRecoilValue } from 'recoil';
import { authState } from '../state/auth';
import { Users, Calendar, TrendingUp, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const auth = useRecoilValue(authState);

  const stats = [
    { label: 'Clients actifs', value: '—', icon: Users, color: '#3b82f6' },
    { label: 'RDV cette semaine', value: '—', icon: Calendar, color: '#10b981' },
    { label: 'CA du mois', value: '—', icon: TrendingUp, color: '#8b5cf6' },
    { label: 'Alertes', value: '—', icon: AlertCircle, color: '#ef4444' },
  ];

  return (
    <div className="dashboard-page">
      <header className="page-header">
        <h1>Bonjour, {auth.user?.firstName} 👋</h1>
        <p>Voici votre tableau de bord</p>
      </header>

      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: stat.color + '20', color: stat.color }}>
              <stat.icon size={24} />
            </div>
            <div className="stat-content">
              <p className="stat-value">{stat.value}</p>
              <p className="stat-label">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <section className="dashboard-section">
        <h2>RDV du jour</h2>
        <div className="empty-state">
          <Calendar size={48} />
          <p>Aucun RDV prévu aujourd'hui</p>
        </div>
      </section>
    </div>
  );
}
