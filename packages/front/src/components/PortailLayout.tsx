import { useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { authState } from '../state/auth';
import { cartState } from '../state/cart';
import { 
  Package, 
  ShoppingCart, 
  ClipboardList, 
  User, 
  Users,
  LogOut
} from 'lucide-react';
import './PortailLayout.css';

export default function PortailLayout() {
  const auth = useRecoilValue(authState);
  const setAuth = useSetRecoilState(authState);
  const cart = useRecoilValue(cartState);
  const navigate = useNavigate();
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Redirect to change password page if mustChangePassword is true
  useEffect(() => {
    if (auth.user?.mustChangePassword) {
      navigate('/change-password');
    }
  }, [auth.user?.mustChangePassword, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setAuth({ isAuthenticated: false, user: null, accessToken: null });
    navigate('/login');
  };

  return (
    <div className="portail-layout">
      <header className="portail-header">
        <div className="portail-logo">
          <Package size={24} />
          <span>Portail Distributeur</span>
        </div>
        <nav className="portail-nav">
          <NavLink to="/portail/catalogue" className={({ isActive }) => isActive ? 'active' : ''}>
            <Package size={18} />
            Catalogue
          </NavLink>
          <NavLink to="/portail/commandes" className={({ isActive }) => isActive ? 'active' : ''}>
            <ClipboardList size={18} />
            Mes commandes
          </NavLink>
          <NavLink to="/portail/contacts" className={({ isActive }) => isActive ? 'active' : ''}>
            <Users size={18} />
            Contacts
          </NavLink>
          <NavLink to="/portail/compte" className={({ isActive }) => isActive ? 'active' : ''}>
            <User size={18} />
            Mon compte
          </NavLink>
        </nav>
        <div className="portail-user">
          <button 
            className="btn-cart" 
            onClick={() => navigate('/portail/panier')} 
            title="Mon panier"
          >
            <ShoppingCart size={20} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
          <span className="user-name">{auth.user?.firstName} {auth.user?.lastName}</span>
          <button className="btn-logout" onClick={handleLogout} title="Déconnexion">
            <LogOut size={18} />
          </button>
        </div>
      </header>
      <main className="portail-main">
        <Outlet />
      </main>
    </div>
  );
}
