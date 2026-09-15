import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";

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
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Employee Dashboard */}
        <Route
          path="/employee"
          element={
            <RoleRoute allowedRole="Employee">
              <EmployeeDashboard />
            </RoleRoute>
          }
        />

        {/* Reviewer Dashboard */}
        <Route
          path="/reviewer"
          element={
            <RoleRoute allowedRole="Reviewer">
              <ReviewerDashboard />
            </RoleRoute>
          }
        />

        {/* Manager Dashboard */}
        <Route
          path="/manager"
          element={
            <RoleRoute allowedRole="Manager">
              <ManagerDashboard />
            </RoleRoute>
          }
        />

        {/* Administrator Dashboard */}
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