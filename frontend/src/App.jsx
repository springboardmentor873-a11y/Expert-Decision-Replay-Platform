import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DashboardLayout from './components/DashboardLayout';
import Decisions from './pages/Decisions';
import DecisionDetail from './pages/DecisionDetail';
import Notifications from './pages/Notifications';
import AuditLogs from './pages/AuditLogs';
import Reports from './pages/Reports';
import Teams from './pages/Teams';
import TeamDecisions from './pages/TeamDecisions';
import KnowledgeRepository from './pages/KnowledgeRepository';
import Discussions from './pages/Discussions';
import Search from './pages/Search';
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes with generic Layout */}
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/login" element={<Layout><Login /></Layout>} />
          <Route path="/register" element={<Layout><Register /></Layout>} />
          
          {/* Authenticated Routes with DashboardLayout */}
          <Route path="/dashboard" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
          <Route path="/decisions" element={<DashboardLayout><Decisions /></DashboardLayout>} />
          <Route path="/decisions/:id" element={<DashboardLayout><DecisionDetail /></DashboardLayout>} />
          <Route path="/notifications" element={<DashboardLayout><Notifications /></DashboardLayout>} />
          <Route path="/audit-logs" element={<DashboardLayout><AuditLogs /></DashboardLayout>} />
          <Route path="/reports" element={<DashboardLayout><Reports /></DashboardLayout>} />
          <Route path="/teams" element={<DashboardLayout><Teams /></DashboardLayout>} />
          <Route path="/my-decisions" element={<DashboardLayout><Decisions /></DashboardLayout>} />
          <Route path="/team-decisions" element={<DashboardLayout><TeamDecisions /></DashboardLayout>} />
          <Route path="/knowledge" element={<DashboardLayout><KnowledgeRepository /></DashboardLayout>} />
          <Route path="/discussions" element={<DashboardLayout><Discussions /></DashboardLayout>} />
          <Route path="/search" element={<DashboardLayout><Search /></DashboardLayout>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
