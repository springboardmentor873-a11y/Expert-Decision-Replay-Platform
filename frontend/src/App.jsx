import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./ProtectedRoute";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRoute from "./AdminRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
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
