import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TrainersPage from './pages/TrainersPage';
import LearnersPage from './pages/LearnersPage';
import SpecialitiesPage from './pages/SpecialitiesPage';
import SettingsPage from './pages/SettingsPage';
import CertificatePage from './pages/CertificatePage';
import CertificationsListPage from './pages/CertificationsListPage';
import AnalyticsPage from './pages/AnalyticsPage';
import TrainersStatsPage from './pages/TrainersStatsPage';
import LearnersStatsPage from './pages/LearnersStatsPage';
import CertificationsStatsPage from './pages/CertificationsStatsPage';
import CyclesPage from './pages/CyclesPage';
import FormationsPage from './pages/FormationsPage';
import AdminBundleEnrollmentPage from './pages/AdminBundleEnrollmentPage';
import AdminBundleManagementPage from './pages/AdminBundleManagementPage';
import BundleStatsPage from './pages/BundleStatsPage';
import CoordinateursPage from './pages/CoordinateursPage';
import api from './api/api-client';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  return isAdmin ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get('/auth/me');
        const user = response.data;
        localStorage.setItem('isAdmin', 'true');
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('adminNom', user.nom);
        localStorage.setItem('adminPrenom', user.prenom);
      } catch (err) {
        console.log('Not authenticated');
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('user');
        localStorage.removeItem('adminNom');
        localStorage.removeItem('adminPrenom');
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
          path="/trainers"
          element={
            <PrivateRoute>
              <Layout>
                <TrainersPage />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/trainers-stats"
          element={
            <PrivateRoute>
              <Layout>
                <TrainersStatsPage />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/learners"
          element={
            <PrivateRoute>
              <Layout>
                <LearnersPage />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/learners-stats"
          element={
            <PrivateRoute>
              <Layout>
                <LearnersStatsPage />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/cycles"
          element={
            <PrivateRoute>
              <Layout>
                <CyclesPage />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/specialities"
          element={
            <PrivateRoute>
              <Layout>
                <SpecialitiesPage />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/formations"
          element={
            <PrivateRoute>
              <Layout>
                <FormationsPage />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/coordinateurs"
          element={
            <PrivateRoute>
              <Layout>
                <CoordinateursPage />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/bundle-enrollments"
          element={
            <PrivateRoute>
              <Layout>
                <AdminBundleEnrollmentPage />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin-bundles"
          element={
            <PrivateRoute>
              <Layout>
                <AdminBundleManagementPage />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/bundles-stats"
          element={
            <PrivateRoute>
              <Layout>
                <BundleStatsPage />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/certificates"
          element={
            <PrivateRoute>
              <Layout>
                <CertificatePage />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/certifications-stats"
          element={
            <PrivateRoute>
              <Layout>
                <CertificationsStatsPage />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/certifications-list"
          element={
            <PrivateRoute>
              <Layout>
                <CertificationsListPage />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/analytics"
          element={
            <PrivateRoute>
              <Layout>
                <AnalyticsPage />
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

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
