import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage as Login } from './pages/LoginPage';
import { RegisterPage as Register } from './pages/RegisterPage';
import { DashboardPage as Dashboard } from './pages/DashboardPage';
import { DecisionsPage } from './pages/DecisionsPage';
import { DecisionDetailPage } from './pages/DecisionDetailPage';
import { TeamsPage } from './pages/TeamsPage';
import { AdminUsersPage as AdminUsers } from './pages/AdminUsersPage';
import { Unauthorized } from './pages/Unauthorized';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Authentication Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Protected User Dashboard */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              {/* Protected Milestone 2 Routes */}
              <Route
                path="/decisions"
                element={
                  <ProtectedRoute>
                    <DecisionsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/decisions/:id"
                element={
                  <ProtectedRoute>
                    <DecisionDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teams"
                element={
                  <ProtectedRoute>
                    <TeamsPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected Administrator Route */}
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute allowedRoles={['ADMINISTRATOR']}>
                    <AdminUsers />
                  </ProtectedRoute>
                }
              />

              {/* Default Fallback Redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
