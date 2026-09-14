import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useState, useEffect, useCallback } from "react";
import { listPendingApprovals } from "../../services/decision";
import NotificationBell from "../NotificationBell/NotificationBell";
import "./Navbar.css";

const ROLE_LABELS = {
  employee: "Employee",
  reviewer: "Reviewer",
  manager: "Manager",
  administrator: "Administrator",
};

export default function Navbar() {
  const { user, tokens, logout } = useAuth();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);

  const loadPending = useCallback(async () => {
    if (!tokens?.access_token || !user?.role || user.role === "employee") return;
    try {
      const data = await listPendingApprovals(tokens.access_token);
      setPendingCount(data.length);
    } catch {
      // ignore
    }
  }, [tokens, user]);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  return (
    <header className="navbar">
      <div className="navbar__left">
        <span className="navbar__mark">EDR</span>
        <nav className="navbar__links">
          <Link
            to="/dashboard"
            className={`navbar__link ${location.pathname === "/dashboard" ? "navbar__link--active" : ""}`}
          >
            Dashboard
          </Link>
          <Link
            to="/decisions"
            className={`navbar__link ${location.pathname.startsWith("/decisions") ? "navbar__link--active" : ""}`}
          >
            Decisions
          </Link>
          {(user?.role === "reviewer" || user?.role === "manager" || user?.role === "administrator") && (
            <Link
              to="/approvals"
              className={`navbar__link ${location.pathname === "/approvals" ? "navbar__link--active" : ""}`}
            >
              Approvals
              {pendingCount > 0 && (
                <span className="navbar__badge">{pendingCount}</span>
              )}
            </Link>
          )}
          {(user?.role === "manager" || user?.role === "administrator") && (
            <Link
              to="/audit-logs"
              className={`navbar__link ${location.pathname === "/audit-logs" ? "navbar__link--active" : ""}`}
            >
              Audit Logs
            </Link>
          )}
          {(user?.role === "manager" || user?.role === "administrator") && (
            <Link
              to="/reports"
              className={`navbar__link ${location.pathname === "/reports" ? "navbar__link--active" : ""}`}
            >
              Reports
            </Link>
          )}
        </nav>
      </div>

      <div className="navbar__right">
        <NotificationBell />
        <span className="navbar__user">
          {user?.full_name} <span className="navbar__role">· {ROLE_LABELS[user?.role]}</span>
        </span>
        <button className="navbar__logout" onClick={logout}>
          Sign out
        </button>
      </div>
    </header>
  );
}
