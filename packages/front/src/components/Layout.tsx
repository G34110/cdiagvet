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
import { usePlan } from '../contexts/PlanContext';
import PlanSelector from './PlanSelector';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', menuId: 'dashboard' },
  { to: '/clients', icon: Users, label: 'Clients', menuId: 'clients' },
  { to: '/pipeline', icon: Target, label: 'Opportunités', menuId: 'opportunities' },
  { to: '/commandes', icon: ShoppingCart, label: 'Commandes', menuId: 'orders' },
  { to: '/products', icon: Package, label: 'Catalogue', menuId: 'products' },
  { to: '/calendar', icon: Calendar, label: 'Calendrier', menuId: 'visits' },
  { to: '/map', icon: Map, label: 'Carte', menuId: 'clients' },
  { to: '/scanner', icon: ScanLine, label: 'Scanner', menuId: 'lots' },
  { to: '/traceability', icon: FileSearch, label: 'Traçabilité', menuId: 'lots' },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const setAuth = useSetRecoilState(authState);
  const auth = useRecoilValue(authState);
  const navigate = useNavigate();
  const isProduction = import.meta.env.PROD;
  const { isMenuVisible } = usePlan();

  const visibleNavItems = navItems.filter(item => isMenuVisible(item.menuId));

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
          <div className="logo-container">
            <h1 className="logo">CDiagVet</h1>
            {sidebarOpen && (
              <span className="app-version">v{__APP_VERSION__}</span>
            )}
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="menu-toggle">
            <Menu size={20} />
          </button>
        </div>
        {auth.user?.role === 'ADMIN' && sidebarOpen && (
          <div className="plan-selector-container">
            <PlanSelector userRole={auth.user?.role} />
          </div>
        )}
        <nav className="sidebar-nav">
          {visibleNavItems.map((item) => (
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
