import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useSetRecoilState } from 'recoil';
import { authState } from '../state/auth';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Map,
  LogOut,
  Menu,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/calendar', icon: Calendar, label: 'Calendrier' },
  { to: '/map', icon: Map, label: 'Carte' },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const setAuth = useSetRecoilState(authState);
  const navigate = useNavigate();

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
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
