import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TrainersPage from './pages/TrainersPage';
import LearnersPage from './pages/LearnersPage';
import SpecialitiesPage from './pages/SpecialitiesPage';
import SettingsPage from './pages/SettingsPage';
import CoursesPage from './pages/CoursesPage';
import CourseEditorPage from './pages/CourseEditorPage';
import CoursePreviewPage from './pages/CoursePreviewPage';
import CourseStatisticsPage from './pages/CourseStatisticsPage';
import LearnerStatisticsPage from './pages/LearnerStatisticsPage';
import QuizStatisticsPage from './pages/QuizStatisticsPage';
import TrainerCoursesPage from './pages/TrainerCoursesPage';
import CompletedCoursesPage from './pages/CompletedCoursesPage';
import EnrolledCoursesPage from './pages/EnrolledCoursesPage';
import VerifyCertificatePage from './pages/VerifyCertificatePage';
import NotificationsPage from './pages/NotificationsPage';


const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem('token') !== null;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
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
          path="/trainer/:name"
          element={
            <PrivateRoute>
              <Layout>
                <TrainerCoursesPage />
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
          path="/notifications"
          element={
            <PrivateRoute>
              <Layout>
                <NotificationsPage />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route path="/verify/:enrollmentId" element={<VerifyCertificatePage />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
