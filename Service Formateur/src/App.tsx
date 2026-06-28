import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router';
import Layout from './components/Layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TrainersPage from './pages/TrainersPage';
import SpecialitiesPage from './pages/SpecialitiesPage';
import SettingsPage from './pages/SettingsPage';
import CoursesPage from './pages/CoursesPage';
import CourseEditorPage from './pages/CourseEditorPage';
import CoursePreviewPage from './pages/CoursePreviewPage';
import CourseStudyPage from './pages/CourseStudyPage';
import CourseStatisticsPage from './pages/CourseStatisticsPage';
import LearnerStatisticsPage from './pages/LearnerStatisticsPage';
import QuizStatisticsPage from './pages/QuizStatisticsPage';
import EnrollmentRequestsPage from './pages/EnrollmentRequestsPage';
import CourseCatalogPage from './pages/CourseCatalogPage';
import LiveCodeTrackerPage from './pages/LiveCodeTrackerPage';
import LiveClassroomPage from './pages/LiveClassroomPage';
import EnrolledCoursesPage from './pages/EnrolledCoursesPage';
import CompletedCoursesPage from './pages/CompletedCoursesPage';
import VerifyCertificatePage from './pages/VerifyCertificatePage';
import CourseBundleCatalogPage from './pages/CourseBundleCatalogPage';
import BundleCoursesPage from './pages/BundleCoursesPage';
import MyEnrolledBundlesPage from './pages/MyEnrolledBundlesPage';
import NotificationsPage from './pages/NotificationsPage';
import EncadrementPage from './pages/EncadrementPage';
import EncadrementStatisticsPage from './pages/EncadrementStatisticsPage';
import SuiviPfePage from './pages/SuiviPfePage';
import ProposerSujetPage from './pages/ProposerSujetPage';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  return token ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
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
          path="/statistics-cours"
          element={
            <PrivateRoute>
              <Layout>
                <CourseStatisticsPage />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/statistics-apprenants"
          element={
            <PrivateRoute>
              <Layout>
                <LearnerStatisticsPage />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/statistics-quiz"
          element={
            <PrivateRoute>
              <Layout>
                <QuizStatisticsPage />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/courses"
          element={
            <PrivateRoute>
              <Layout>
                <CoursesPage />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/catalog"
          element={
            <PrivateRoute>
              <Layout>
                <CourseCatalogPage />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/bundle-catalog"
          element={
            <PrivateRoute>
              <Layout>
                <CourseBundleCatalogPage />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/enrolled-bundles"
          element={
            <PrivateRoute>
              <Layout>
                <MyEnrolledBundlesPage />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/bundle/:id"
          element={
            <PrivateRoute>
              <Layout>
                <BundleCoursesPage />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/courses/new"
          element={
            <PrivateRoute>
              <Layout>
                <CourseEditorPage />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/courses/:id/preview"
          element={
            <PrivateRoute>
              <CoursePreviewPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/courses/:id/study"
          element={
            <PrivateRoute>
              <CourseStudyPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/courses/:id"
          element={
            <PrivateRoute>
              <Layout>
                <CourseEditorPage />
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
          path="/live-code"
          element={
            <PrivateRoute>
              <Layout>
                <LiveCodeTrackerPage />
              </Layout>
            </PrivateRoute>
          }
        />


        <Route
          path="/enrollments"
          element={
            <PrivateRoute>
              <Layout>
                <EnrollmentRequestsPage />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/enrolled-courses"
          element={
            <PrivateRoute>
              <Layout>
                <EnrolledCoursesPage />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/completed-courses"
          element={
            <PrivateRoute>
              <Layout>
                <CompletedCoursesPage />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/verify/:enrollmentId"
          element={<VerifyCertificatePage />}
        />

        <Route
          path="/live-class"
          element={
            <PrivateRoute>
              <Layout>
                <LiveClassroomPage />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <PrivateRoute>
              <Layout>
                <NotificationsPage />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/encadrement"
          element={
            <PrivateRoute>
              <Layout>
                <EncadrementPage />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/encadrement-statistics"
          element={
            <PrivateRoute>
              <Layout>
                <EncadrementStatisticsPage />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/suivi-pfe"
          element={
            <PrivateRoute>
              <Layout>
                <SuiviPfePage />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/proposer-sujet"
          element={
            <PrivateRoute>
              <Layout>
                <ProposerSujetPage />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
