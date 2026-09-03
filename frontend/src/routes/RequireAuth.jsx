import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null; // avoid a login-page flash while we check the stored token
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return children;
}
