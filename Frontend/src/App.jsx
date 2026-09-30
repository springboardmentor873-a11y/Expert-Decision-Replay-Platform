import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { applyTheme } from "./theme";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import DecisionForm from "./pages/DecisionForm";
import DecisionDetail from "./pages/DecisionDetail";
import ModulePage from "./pages/ModulePage";
import Approvals from "./pages/Approvals";
import MyDecisions from "./pages/MyDecisions";
import AuditLogs from "./pages/AuditLogs";

function App() {
  useEffect(() => {
    applyTheme();
  }, []);

  return (
    <BrowserRouter>
      <Routes>

        {/* =====================================================
            LOGIN
            ===================================================== */}

        <Route
          path="/"
          element={<Login />}
        />

        <Route
          path="/login"
          element={<Login />}
        />


        {/* =====================================================
            REGISTER
            ===================================================== */}

        <Route
          path="/register"
          element={<Register />}
        />


        {/* =====================================================
            MAIN DASHBOARD
            ===================================================== */}

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />


        {/* =====================================================
            DECISIONS
            ===================================================== */}

        <Route
          path="/decisions/new"
          element={<DecisionForm />}
        />

        <Route
          path="/decisions/:id"
          element={<DecisionDetail />}
        />


        {/* =====================================================
            WORKSPACE MODULES
            ===================================================== */}

        <Route
          path="/teams"
          element={<ModulePage title="Teams" />}
        />

        <Route
          path="/discussions"
          element={<ModulePage title="Discussions" />}
        />


        {/* =====================================================
            MILESTONE 3
            MANAGER APPROVALS
            ===================================================== */}

        <Route
          path="/approvals"
          element={<Approvals />}
        />

        <Route
          path="/my-decisions"
          element={<MyDecisions />}
        />

        <Route
          path="/audit-logs"
          element={<AuditLogs />}
        />


        {/* =====================================================
            KNOWLEDGE MODULES
            ===================================================== */}

        <Route
          path="/documents"
          element={<ModulePage title="Documents" />}
        />

        <Route
          path="/knowledge-graph"
          element={<ModulePage title="Knowledge Graph" />}
        />

        <Route
          path="/analytics"
          element={<ModulePage title="Analytics" />}
        />

        <Route
          path="/profile"
          element={<ModulePage title="Profile" />}
        />

        <Route
          path="/settings"
          element={<ModulePage title="Settings" />}
        />


        {/* =====================================================
            UNKNOWN PAGE
            ===================================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;