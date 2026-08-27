import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", roles: null },
  { to: "/profile", label: "My Profile", roles: null },
  { to: "/teams", label: "Teams", roles: null },
  { to: "/users", label: "Users", roles: ["manager", "administrator"] },
  { to: "/audit", label: "Audit", roles: ["administrator"] },
];

function initials(fullName = "") {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return null;

  const visibleItems = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(user.role));

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <span className="brand-mark">DR</span>
          <span className="brand-name">Decision Replay</span>
        </div>
        <nav className="sidebar-nav">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-link ${isActive ? "sidebar-link-active" : ""}`}
              onClick={() => setSidebarOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button type="button" className="sidebar-logout" onClick={logout}>
          Log out
        </button>
      </aside>

      {sidebarOpen && <div className="sidebar-scrim" onClick={() => setSidebarOpen(false)} />}

      <div className="app-main">
        <header className="topbar">
          <button
            type="button"
            className="menu-toggle"
            aria-label="Toggle navigation"
            onClick={() => setSidebarOpen((v) => !v)}
          >
            ☰
          </button>
          <div className="topbar-spacer" />
          <div className="topbar-user">
            <div className="avatar" aria-hidden="true">
              {initials(user.full_name)}
            </div>
            <div className="topbar-user-meta">
              <span className="topbar-user-name">{user.full_name}</span>
              <span className="topbar-user-role">{user.role}</span>
            </div>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
