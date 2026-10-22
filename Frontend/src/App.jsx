import { useEffect } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import { applyTheme } from "./theme";
import { getAccessToken, getCurrentUser } from "./api";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import DecisionForm from "./pages/DecisionForm";
import DecisionDetail from "./pages/DecisionDetail";
import ModulePage from "./pages/ModulePage";
import Approvals from "./pages/Approvals";
import MyDecisions from "./pages/MyDecisions";
import AuditLogs from "./pages/AuditLogs";

const MANAGER_ROLES = ["manager", "admin", "administrator"];

export function isManagerUser(user) {
  return MANAGER_ROLES.includes((user?.role || "employee").toLowerCase());
}

/**
 * Blocks workspace routes for signed-out visitors and for employees trying to
 * open manager-only screens. The backend enforces the same rules; this only
 * avoids showing a screen the user cannot use.
 */
function RequireAuth({ children, managerOnly = false }) {
  const location = useLocation();
  const user = getCurrentUser();

  // A stored user without an access token is a half-finished session: the
  // token is the actual credential, so send them back to sign in again.
  if (!user?.id || !getAccessToken()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (managerOnly && !isManagerUser(user)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function App() {
  useEffect(() => {
    applyTheme();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* =====================================================
            PUBLIC
            ===================================================== */}

        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* =====================================================
            WORKSPACE
            ===================================================== */}

        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />

        <Route
          path="/my-decisions"
          element={
            <RequireAuth>
              <MyDecisions />
            </RequireAuth>
          }
        />

        <Route
          path="/decisions/new"
          element={
            <RequireAuth>
              <DecisionForm />
            </RequireAuth>
          }
        />

        <Route
          path="/decisions/:id"
          element={
            <RequireAuth>
              <DecisionDetail />
            </RequireAuth>
          }
        />

        <Route
          path="/teams"
          element={
            <RequireAuth managerOnly>
              <ModulePage title="Teams" />
            </RequireAuth>
          }
        />

        <Route
          path="/discussions"
          element={
            <RequireAuth>
              <ModulePage title="Discussions" />
            </RequireAuth>
          }
        />

        {/* =====================================================
            MILESTONE 3 - MANAGER APPROVALS
            ===================================================== */}

        <Route
          path="/approvals"
          element={
            <RequireAuth>
              <Approvals />
            </RequireAuth>
          }
        />

        <Route
          path="/audit-logs"
          element={
            <RequireAuth>
              <AuditLogs />
            </RequireAuth>
          }
        />

        {/* =====================================================
            KNOWLEDGE MODULES
            ===================================================== */}

        <Route
          path="/documents"
          element={
            <RequireAuth>
              <ModulePage title="Documents" />
            </RequireAuth>
          }
        />

        <Route
          path="/knowledge-graph"
          element={
            <RequireAuth>
              <ModulePage title="Knowledge Graph" />
            </RequireAuth>
          }
        />

        <Route
          path="/analytics"
          element={
            <RequireAuth>
              <ModulePage title="Analytics" />
            </RequireAuth>
          }
        />

        <Route
          path="/profile"
          element={
            <RequireAuth>
              <ModulePage title="Profile" />
            </RequireAuth>
          }
        />

        <Route
          path="/settings"
          element={
            <RequireAuth>
              <ModulePage title="Settings" />
            </RequireAuth>
          }
        />

        {/* =====================================================
            UNKNOWN PAGE
            ===================================================== */}

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;