import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import ConfigSujetsPage from './pages/ConfigSujetsPage';
import ConfigSelectionSujetsPage from './pages/ConfigSelectionSujetsPage';
import MembresExternesPage from './pages/MembresExternesPage';
import AffectationPage from './pages/AffectationPage';
import SujetsPage from './pages/SujetsPage';
import JuryPage from './pages/JuryPage';
import DeadlinesPage from './pages/DeadlinesPage';
import DepotsPage from './pages/DepotsPage';
import MesAffectationsPage from './pages/MesAffectationsPage';
import TiragePage from './pages/TiragePage';
import RapportsPage from './pages/RapportsPage';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const isCoordinateur = localStorage.getItem('isCoordinateur') === 'true';
  return isCoordinateur ? <>{children}</> : <Navigate to="/login" />;
};

function App() {

  return (
    <Router basename="/coordinateur">
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
          path="/config-selection-sujets"
          element={
            <PrivateRoute>
              <Layout>
                <ConfigSelectionSujetsPage />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/membres-externes"
          element={
            <PrivateRoute>
              <Layout>
                <MembresExternesPage />
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
          path="/rapports"
          element={
            <PrivateRoute>
              <Layout>
                <RapportsPage />
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

        <Route
          path="/tirage"
          element={
            <PrivateRoute>
              <Layout>
                <TiragePage />
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
