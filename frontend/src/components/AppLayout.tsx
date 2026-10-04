import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { NotificationBell } from "./NotificationBell";

const NAV_ITEMS: { to: string; label: string; roles?: string[] }[] = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/decisions", label: "Decisions" },
  { to: "/knowledge-graph", label: "Knowledge Graph" },
  { to: "/teams", label: "Teams" },
  { to: "/documents", label: "Documents" },
  { to: "/reports", label: "Reports" },
  { to: "/activity", label: "Activity" },
  { to: "/audit-logs", label: "Audit Logs", roles: ["Administrator", "Manager"] },
  { to: "/users", label: "Users", roles: ["Administrator"] },
  { to: "/profile", label: "Profile" },
];

export function AppLayout({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          Decision Replay
          <small>Expert Decision Platform</small>
        </div>
        {NAV_ITEMS.filter(
          (item) => !item.roles || (user && item.roles.includes(user.role))
        ).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
          >
            {item.label}
          </NavLink>
        ))}
        <div className="sidebar-footer">
          Signed in as
          <br />
          <strong style={{ color: "#fff" }}>{user?.full_name}</strong>
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <div className="topbar-title">{title}</div>
          <div className="topbar-user">
            <NotificationBell />
            <span className="role-badge">{user?.role}</span>
            <span>{user?.email}</span>
            <button className="btn btn-secondary" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
