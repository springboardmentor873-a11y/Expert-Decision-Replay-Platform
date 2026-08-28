import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';

import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { DecisionsListPage } from './pages/decisions/DecisionsListPage';
import { DecisionCreatePage } from './pages/decisions/DecisionCreatePage';
import { DecisionDetailsPage } from './pages/decisions/DecisionDetailsPage';
import { DecisionEditPage } from './pages/decisions/DecisionEditPage';
import { ReviewsPage } from './pages/ReviewsPage';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { RepositoryPage } from './pages/RepositoryPage';
import { ReportsPage } from './pages/ReportsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminTeamsPage } from './pages/admin/AdminTeamsPage';
import { AdminAuditPage } from './pages/admin/AdminAuditPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="decisions" element={<DecisionsListPage />} />
            <Route path="decisions/new" element={<DecisionCreatePage />} />
            <Route path="decisions/:id" element={<DecisionDetailsPage />} />
            <Route path="decisions/:id/edit" element={<DecisionEditPage />} />
            <Route path="reviews" element={<ReviewsPage />} />
            <Route path="approvals" element={<ApprovalsPage />} />
            <Route path="repository" element={<RepositoryPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="admin/users" element={<AdminUsersPage />} />
            <Route path="admin/teams" element={<AdminTeamsPage />} />
            <Route path="admin/audit" element={<AdminAuditPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
