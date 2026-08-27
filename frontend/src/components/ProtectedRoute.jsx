import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingState from "./LoadingState";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingState label="Checking your session..." />;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}
