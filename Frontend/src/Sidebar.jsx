import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "./api";
import "./pages/Workspace.css";

const WORKSPACE_ITEMS = [
  { to: "/dashboard", icon: "◈", label: "Dashboard" },
  { to: "/my-decisions", icon: "▣", label: "My Decisions" },
  { to: "/decisions/new", icon: "＋", label: "New Decision", employeeOnly: true },
  { to: "/teams", icon: "♧", label: "Teams", managerOnly: true },
  { to: "/discussions", icon: "◌", label: "Discussions" },
  { to: "/approvals", icon: "✓", label: "Approvals", managerLabel: "My Requests" },
];

const KNOWLEDGE_ITEMS = [
  { to: "/documents", icon: "▤", label: "Documents" },
  { to: "/knowledge-graph", icon: "?", label: "Knowledge Graph" },
  { to: "/analytics", icon: "◒", label: "Analytics" },
  { to: "/audit-logs", icon: "📜", label: "Audit Logs" },
  { to: "/profile", icon: "◎", label: "Profile" },
  { to: "/settings", icon: "⚙", label: "Settings" },
];

export function isManagerRole(role) {
  const value = String(role || "").toLowerCase();
  return (
    value === "manager" ||
    value === "admin" ||
    value === "administrator" ||
    value === "superadmin"
  );
}

/**
 * Single source of truth for the workspace navigation.
 *
 * Every authenticated page renders this instead of keeping its own copy, so
 * role-based visibility can never drift between pages.
 */
export default function Sidebar({ activePath }) {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const isManager = isManagerRole(user?.role);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const renderItems = (items) =>
    items
      .filter((item) => {
        if (item.managerOnly && !isManager) return false;
        if (item.employeeOnly && isManager) return false;
        return true;
      })
      .map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className={`sidebar-link${activePath === item.to ? " active" : ""}`}
        >
          <span className="sidebar-icon">{item.icon}</span>
          <span>{isManager ? item.label : item.managerLabel || item.label}</span>
        </Link>
      ));

  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">ED</div>
        <div className="sidebar-brand-text">
          <strong>Expert Decision</strong>
          <span>Replay Platform</span>
        </div>
      </div>

      <div className="sidebar-divider" />
      <div className="sidebar-section-title">WORKSPACE</div>

      <nav className="sidebar-nav">{renderItems(WORKSPACE_ITEMS)}</nav>

      <div className="sidebar-section-title second-section">KNOWLEDGE</div>

      <nav className="sidebar-nav">{renderItems(KNOWLEDGE_ITEMS)}</nav>

      <div className="sidebar-bottom">
        <div className="sidebar-role-card">
          <div className="sidebar-role-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div>
            <strong>{user?.name || "User"}</strong>
            <span>{isManager ? "Manager" : "Employee"}</span>
          </div>
        </div>

        <button className="sidebar-logout" onClick={handleLogout}>
          <span>↪</span>
          Logout
        </button>
      </div>
    </aside>
  );
}
