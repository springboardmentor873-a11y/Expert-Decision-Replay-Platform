import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./lib/auth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { Decisions } from "./pages/Decisions";
import { DecisionCreate } from "./pages/DecisionCreate";
import { DecisionDetail } from "./pages/DecisionDetail";
import { Reports } from "./pages/Reports";
import { AuditLogs } from "./pages/AuditLogs";
import { ActivityPage } from "./pages/Activity";
import { Users } from "./pages/Users";
import { Profile } from "./pages/Profile";
import { Teams } from "./pages/Teams";
import { Documents } from "./pages/Documents";
import { KnowledgeGraph } from "./pages/KnowledgeGraph";

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/decisions"
            element={
              <ProtectedRoute>
                <Decisions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/decisions/new"
            element={
              <ProtectedRoute>
                <DecisionCreate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/decisions/:id"
            element={
              <ProtectedRoute>
                <DecisionDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teams"
            element={
              <ProtectedRoute>
                <Teams />
              </ProtectedRoute>
            }
          />
          <Route
            path="/knowledge-graph"
            element={
              <ProtectedRoute>
                <KnowledgeGraph />
              </ProtectedRoute>
            }
          />
          <Route
            path="/documents"
            element={
              <ProtectedRoute>
                <Documents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/audit-logs"
            element={
              <ProtectedRoute roles={["Administrator", "Manager"]}>
                <AuditLogs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/activity"
            element={
              <ProtectedRoute>
                <ActivityPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute roles={["Administrator"]}>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
