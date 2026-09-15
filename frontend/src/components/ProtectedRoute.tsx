import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function ProtectedRoute({
  children,
  roles,
}: {
  children: ReactNode;
  roles?: string[];
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-row">Loading…</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="empty-state">
        <h3>Access restricted</h3>
        <p>Your role ({user.role}) does not have access to this page.</p>
      </div>
    );
  }

  return <>{children}</>;
}
