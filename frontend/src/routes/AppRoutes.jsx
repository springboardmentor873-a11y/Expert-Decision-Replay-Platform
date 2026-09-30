import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import Dashboard from "../pages/Dashboard/Dashboard";
import Decisions from "../pages/Decisions/Decisions";
import CreateDecision from "../pages/CreateDecision/CreateDecision";
import DecisionDetails from "../pages/DecisionDetails/DecisionDetails";
import Approvals from "../pages/Approvals/Approvals";
import AuditLogs from "../pages/AuditLogs/AuditLogs";
import Notifications from "../pages/Notifications/Notifications";
import Reports from "../pages/Reports/Reports";
import Teams from "../pages/Teams/Teams";
import TeamDetails from "../pages/TeamDetails/TeamDetails";
import JoinRequests from "../pages/JoinRequests/JoinRequests";
import Knowledge from "../pages/Knowledge/Knowledge";
import KnowledgeDocumentDetail from "../pages/KnowledgeDocumentDetail/KnowledgeDocumentDetail";
import RequireAuth from "./RequireAuth";
import RequireRole from "./RequireRole";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/decisions"
        element={
          <RequireAuth>
            <Decisions />
          </RequireAuth>
        }
      />
      <Route
        path="/decisions/new"
        element={
          <RequireAuth>
            <CreateDecision />
          </RequireAuth>
        }
      />
      <Route
        path="/decisions/:decisionId"
        element={
          <RequireAuth>
            <DecisionDetails />
          </RequireAuth>
        }
      />
      <Route
        path="/approvals"
        element={
          <RequireAuth>
            <Approvals />
          </RequireAuth>
        }
      />
      <Route
        path="/notifications"
        element={
          <RequireAuth>
            <Notifications />
          </RequireAuth>
        }
      />
      <Route
        path="/audit-logs"
        element={
          <RequireRole roles={["manager", "administrator"]}>
            <AuditLogs />
          </RequireRole>
        }
      />
      <Route
        path="/reports"
        element={
          <RequireRole roles={["manager", "administrator"]}>
            <Reports />
          </RequireRole>
        }
      />
      <Route
        path="/teams"
        element={
          <RequireAuth>
            <Teams />
          </RequireAuth>
        }
      />
      <Route
        path="/teams/:teamId"
        element={
          <RequireAuth>
            <TeamDetails />
          </RequireAuth>
        }
      />
      <Route
        path="/knowledge"
        element={
          <RequireAuth>
            <Knowledge />
          </RequireAuth>
        }
      />
      <Route
        path="/knowledge/documents/:documentId"
        element={
          <RequireAuth>
            <KnowledgeDocumentDetail />
          </RequireAuth>
        }
      />
      <Route
        path="/join-requests"
        element={
          <RequireRole roles={["manager", "administrator"]}>
            <JoinRequests />
          </RequireRole>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
