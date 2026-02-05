import { useRecoilValue } from 'recoil';
import { useQuery } from '@apollo/client';
import { Link } from 'react-router-dom';
import { authState } from '../state/auth';
import { Users, TrendingUp, AlertCircle, Package, Eye, ArrowRight } from 'lucide-react';
import { DASHBOARD_DATA_QUERY } from '../graphql/dashboard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DashboardStats {
  totalClients: number;
  activeClients: number;
  totalVisits: number;
  visitsThisMonth: number;
  totalLots: number;
  totalRevenue: number;
  revenueThisMonth: number;
}

interface ClientAlert {
  clientId: string;
  clientName: string;
  alertType: string;
  message: string;
  createdAt: string;
}

interface RevenueByMonth {
  month: string;
  revenue: number;
}

interface DashboardData {
  stats: DashboardStats;
  alerts: ClientAlert[];
  revenueByMonth: RevenueByMonth[];
}

export default function DashboardPage() {
  const auth = useRecoilValue(authState);

  const { data, loading } = useQuery<{ dashboardData: DashboardData }>(DASHBOARD_DATA_QUERY);

  const dashboardData = data?.dashboardData;
  const stats = dashboardData?.stats;

  const statCards = [
    { 
      label: 'Clients actifs', 
      value: stats?.activeClients ?? '—', 
      total: stats?.totalClients,
      icon: Users, 
      color: '#3b82f6' 
    },
    { 
      label: 'Visites ce mois', 
      value: stats?.visitsThisMonth ?? '—', 
      total: stats?.totalVisits,
      icon: Eye, 
      color: '#10b981' 
    },
    { 
      label: 'CA du mois', 
      value: stats ? `${stats.revenueThisMonth.toLocaleString('fr-FR')} €` : '—', 
      icon: TrendingUp, 
      color: '#8b5cf6' 
    },
    { 
      label: 'Lots livrés', 
      value: stats?.totalLots ?? '—', 
      icon: Package, 
      color: '#f59e0b' 
    },
  ];

  const alerts = dashboardData?.alerts || [];

  return (
    <div className="dashboard-page">
      <header className="page-header">
        <h1>Bonjour, {auth.user?.firstName} 👋</h1>
        <p>Voici votre tableau de bord</p>
      </header>

      {loading ? (
        <div className="loading">Chargement des données...</div>
      ) : (
        <>
          <div className="stats-grid">
            {statCards.map((stat) => (
              <div key={stat.label} className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: stat.color + '20', color: stat.color }}>
                  <stat.icon size={24} />
                </div>
                <div className="stat-content">
                  <p className="stat-value">{stat.value}</p>
                  <p className="stat-label">{stat.label}</p>
                  {stat.total !== undefined && (
                    <p className="stat-sublabel">sur {stat.total} total</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="dashboard-grid">
            <section className="dashboard-section">
              <h2>
                <TrendingUp size={20} />
                Évolution du CA (6 derniers mois)
              </h2>
              {dashboardData?.revenueByMonth && dashboardData.revenueByMonth.length > 0 ? (
                <div style={{ width: '100%', height: 250 }}>
                  <ResponsiveContainer>
                    <BarChart data={dashboardData.revenueByMonth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => [`${value.toLocaleString('fr-FR')} €`, 'CA']}
                      />
                      <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="empty-state">
                  <TrendingUp size={48} />
                  <p>Aucune donnée de CA disponible</p>
                </div>
              )}
            </section>

            <section className="dashboard-section">
              <h2>
                <AlertCircle size={20} />
                Alertes ({alerts.length})
              </h2>
              {alerts.length > 0 ? (
                <div className="alerts-list">
                  {alerts.map((alert, index) => (
                    <Link 
                      key={index} 
                      to={`/clients/${alert.clientId}`}
                      className="alert-item"
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem',
                        background: alert.alertType === 'EXPIRING_LOT' ? '#FEF3C7' : '#FEE2E2',
                        borderRadius: '8px',
                        marginBottom: '0.5rem',
                        textDecoration: 'none',
                        color: 'inherit',
                      }}
                    >
                      <div>
                        <strong>{alert.clientName}</strong>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {alert.message}
                        </div>
                      </div>
                      <ArrowRight size={16} />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <AlertCircle size={48} />
                  <p>Aucune alerte</p>
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
