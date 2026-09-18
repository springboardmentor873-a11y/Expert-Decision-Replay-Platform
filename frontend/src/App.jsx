import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Home } from './pages/Home';
import { Decisions } from './pages/Decisions';
import { CreateDecision } from './pages/CreateDecision';
import { DecisionDetails } from './pages/DecisionDetails';
import { EditDecision } from './pages/EditDecision';
import PendingApprovals from './pages/PendingApprovals';
import Notifications from './pages/Notifications';
import AuditLogs from './pages/AuditLogs';
import Reports from './pages/Reports';
import { Teams } from './pages/Teams';
import { TeamWorkspace } from './pages/TeamWorkspace';
import { KnowledgeRepository } from './pages/KnowledgeRepository';
import { Settings } from './pages/Settings';
import './App.css';

// Public Route Guard (Redirects to /dashboard if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Layout wrapper for authenticated views with enterprise Sidebar & Top Header
const AuthenticatedLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout enterprise-dashboard-shell">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-main-wrapper">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* Protected Routes inside Authenticated Layout */}
      <Route
        element={
          <ProtectedRoute>
            <AuthenticatedLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/home" element={<Dashboard />} />
        <Route path="/decisions" element={<Decisions />} />
        <Route path="/decisions/new" element={<CreateDecision />} />
        <Route path="/decisions/:id" element={<DecisionDetails />} />
        <Route path="/decisions/:id/edit" element={<EditDecision />} />
        <Route path="/approvals/pending" element={<PendingApprovals />} />
        <Route path="/knowledge-repository" element={<KnowledgeRepository />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/teams/:teamId" element={<TeamWorkspace />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/audit-logs" element={<AuditLogs />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/analytics" element={<Navigate to="/reports" replace />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;