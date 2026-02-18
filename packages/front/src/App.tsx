import { Routes, Route, Navigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { authState } from './state/auth';
import Layout from './components/Layout';
import PortailLayout from './components/PortailLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClientsPage from './pages/ClientsPage';
import ClientDetailPage from './pages/ClientDetailPage';
import NewClientPage from './pages/NewClientPage';
import CalendarPage from './pages/CalendarPage';
import MapPage from './pages/MapPage';
import ImportClientsPage from './pages/ImportClientsPage';
import ScannerPage from './pages/ScannerPage';
import AssociateLotPage from './pages/AssociateLotPage';
import LotTraceabilityPage from './pages/LotTraceabilityPage';
import PipelinePage from './pages/PipelinePage';
import OpportunityDetailPage from './pages/OpportunityDetailPage';
import ProductsPage from './pages/ProductsPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import PortailCatalogue from './pages/portail/PortailCatalogue';
import PortailPanier from './pages/portail/PortailPanier';
import PortailCommandes from './pages/portail/PortailCommandes';
import PortailCompte from './pages/portail/PortailCompte';
import PortailContacts from './pages/portail/PortailContacts';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ForceChangePasswordPage from './pages/ForceChangePasswordPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const auth = useRecoilValue(authState);
  return auth.isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function CRMRoute({ children }: { children: React.ReactNode }) {
  const auth = useRecoilValue(authState);
  if (!auth.isAuthenticated) return <Navigate to="/login" />;
  // Distributors can only access /portail
  if (auth.user?.role === 'DISTRIBUTEUR') return <Navigate to="/portail" />;
  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/change-password" element={<ForceChangePasswordPage />} />
      <Route
        path="/"
        element={
          <CRMRoute>
            <Layout />
          </CRMRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="clients/new" element={<NewClientPage />} />
        <Route path="clients/import" element={<ImportClientsPage />} />
        <Route path="clients/:id" element={<ClientDetailPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="scanner" element={<ScannerPage />} />
        <Route path="scanner/associate/:lotId" element={<AssociateLotPage />} />
        <Route path="traceability" element={<LotTraceabilityPage />} />
        <Route path="pipeline" element={<PipelinePage />} />
        <Route path="pipeline/:id" element={<OpportunityDetailPage />} />
        <Route path="commandes" element={<OrdersPage />} />
        <Route path="commandes/:id" element={<OrderDetailPage />} />
        <Route path="products" element={<ProductsPage />} />
      </Route>

      {/* Portail Distributeur */}
      <Route
        path="/portail"
        element={
          <PrivateRoute>
            <PortailLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="catalogue" replace />} />
        <Route path="catalogue" element={<PortailCatalogue />} />
        <Route path="panier" element={<PortailPanier />} />
        <Route path="commandes" element={<PortailCommandes />} />
        <Route path="contacts" element={<PortailContacts />} />
        <Route path="compte" element={<PortailCompte />} />
      </Route>
    </Routes>
  );
}

export default App;
