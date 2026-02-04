import { Routes, Route, Navigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { authState } from './state/auth';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClientsPage from './pages/ClientsPage';
import ClientDetailPage from './pages/ClientDetailPage';
import NewClientPage from './pages/NewClientPage';
import CalendarPage from './pages/CalendarPage';
import MapPage from './pages/MapPage';
import ImportClientsPage from './pages/ImportClientsPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const auth = useRecoilValue(authState);
  return auth.isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
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
      </Route>
    </Routes>
  );
}

export default App;
