import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useSetRecoilState, useRecoilValue } from 'recoil';
import { authState } from '../state/auth';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Map,
  LogOut,
  Menu,
  ScanLine,
  FileSearch,
  Target,
  Package,
  ShoppingCart,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/pipeline', icon: Target, label: 'Opportunités' },
  { to: '/commandes', icon: ShoppingCart, label: 'Commandes' },
  { to: '/products', icon: Package, label: 'Catalogue' },
  { to: '/calendar', icon: Calendar, label: 'Calendrier' },
  { to: '/map', icon: Map, label: 'Carte' },
  { to: '/scanner', icon: ScanLine, label: 'Scanner' },
  { to: '/traceability', icon: FileSearch, label: 'Traçabilité' },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const setAuth = useSetRecoilState(authState);
  const auth = useRecoilValue(authState);
  const navigate = useNavigate();
  const isProduction = import.meta.env.PROD;

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setAuth({ isAuthenticated: false, user: null, accessToken: null });
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h1 className="logo">CDiagVet</h1>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="menu-toggle">
            <Menu size={20} />
          </button>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <item.icon size={20} />
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
        <button onClick={handleLogout} className="logout-btn">
          <LogOut size={20} />
          {sidebarOpen && <span>Déconnexion</span>}
        </button>
        {!isProduction && auth.user?.email && (
          <div className="debug-user-info" style={{
            padding: sidebarOpen ? '0.5rem 1rem' : '0.5rem',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            borderTop: '1px solid var(--border)',
            textAlign: 'center',
            wordBreak: 'break-all',
          }}>
            {sidebarOpen ? auth.user.email : auth.user.email.charAt(0).toUpperCase()}
          </div>
        )}
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
