import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import ConfigSujetsPage from './pages/ConfigSujetsPage';
import AffectationPage from './pages/AffectationPage';
import SujetsPage from './pages/SujetsPage';
import JuryPage from './pages/JuryPage';
import DeadlinesPage from './pages/DeadlinesPage';
import DepotsPage from './pages/DepotsPage';
import MesAffectationsPage from './pages/MesAffectationsPage';
import api from './api/api-client';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const isCoordinateur = localStorage.getItem('isCoordinateur') === 'true';
  return isCoordinateur ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get('/auth/me');
        const user = response.data;
        localStorage.setItem('isCoordinateur', 'true');
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('coordinateurNom', user.nom);
        localStorage.setItem('coordinateurPrenom', user.prenom);
      } catch (err) {
        console.log('Not authenticated');
        localStorage.removeItem('isCoordinateur');
        localStorage.removeItem('user');
        localStorage.removeItem('coordinateurNom');
        localStorage.removeItem('coordinateurPrenom');
      } finally {
        setIsInitializing(false);
      }
    };

    checkAuth();
  }, []);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <Layout>
                <SettingsPage />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/config-sujets"
          element={
            <PrivateRoute>
              <Layout>
                <ConfigSujetsPage />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/affectations"
          element={
            <PrivateRoute>
              <Layout>
                <AffectationPage />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/sujets"
          element={
            <PrivateRoute>
              <Layout>
                <SujetsPage />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/jury"
          element={
            <PrivateRoute>
              <Layout>
                <JuryPage />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/deadlines"
          element={
            <PrivateRoute>
              <Layout>
                <DeadlinesPage />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/depots"
          element={
            <PrivateRoute>
              <Layout>
                <DepotsPage />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/mes-affectations"
          element={
            <PrivateRoute>
              <Layout>
                <MesAffectationsPage />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
