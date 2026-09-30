import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Teams from "./pages/Teams";
import KnowledgeRepository from "./pages/KnowledgeRepository";

import EmployeeDashboard from "./pages/EmployeeDashboard";
import ReviewerDashboard from "./pages/ReviewerDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import AdminDashboard from "./pages/AdminDashboard";

import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import AdminRoute from "./AdminRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =====================================================
            PUBLIC ROUTES
        ===================================================== */}

        <Route path="/" element={<Login />} />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        {/* =====================================================
            TEAMS
        ===================================================== */}

        <Route
          path="/teams"
          element={<Teams />}
        />

        {/* =====================================================
            KNOWLEDGE REPOSITORY
        ===================================================== */}

        <Route
          path="/knowledge-repository"
          element={
            <ProtectedRoute>
              <KnowledgeRepository />
            </ProtectedRoute>
          }
        />

        {/* =====================================================
            EMPLOYEE DASHBOARD
        ===================================================== */}

        <Route
          path="/employee"
          element={
            <RoleRoute allowedRole="Employee">
              <EmployeeDashboard />
            </RoleRoute>
          }
        />

        {/* =====================================================
            REVIEWER DASHBOARD
        ===================================================== */}

        <Route
          path="/reviewer"
          element={
            <RoleRoute allowedRole="Reviewer">
              <ReviewerDashboard />
            </RoleRoute>
          }
        />

        {/* =====================================================
            MANAGER DASHBOARD
        ===================================================== */}

        <Route
          path="/manager"
          element={
            <RoleRoute allowedRole="Manager">
              <ManagerDashboard />
            </RoleRoute>
          }
        />

        {/* =====================================================
            ADMINISTRATOR DASHBOARD
        ===================================================== */}

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;