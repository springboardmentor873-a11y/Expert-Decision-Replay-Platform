import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Client-side convenience only — hides pages the user's role shouldn't see.
 * This is NOT the security boundary: every endpoint these pages call is
 * independently enforced by the backend's require_roles() dependency.
 */
export default function RoleRoute({ roles, children }) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
