import { useState, useRef, useEffect, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { AvatarInitials } from "./AvatarInitials";

/* ------------------------------------------------------------------ */
/* Inline SVG icon components                                           */
/* ------------------------------------------------------------------ */
const Icons = {
  Dashboard: () => (
    <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
      <path d="M2 10a8 8 0 1116 0A8 8 0 012 10zm8-3a1 1 0 100-2 1 1 0 000 2zm-3.5 5.5a1 1 0 01.5-.866V10a3 3 0 016 0v1.634a1 1 0 01.5.866H6.5z" />
    </svg>
  ),
  Decisions: () => (
    <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
    </svg>
  ),
  Create: () => (
    <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
  ),
  Teams: () => (
    <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM6 8a2 2 0 11-4 0 2 2 0 014 0zM15.22 14.97A5.002 5.002 0 005.78 15H4a1 1 0 000 2h12a1 1 0 000-2h-1.78z" />
    </svg>
  ),
  Discussions: () => (
    <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
      <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
    </svg>
  ),
  Documents: () => (
    <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
      <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z" />
      <path d="M3 8a2 2 0 012-2v10h8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
    </svg>
  ),
  Analytics: () => (
    <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
    </svg>
  ),
  Profile: () => (
    <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
  ),
  Settings: () => (
    <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
    </svg>
  ),
  Bell: () => (
    <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
      <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zm0 16a2 2 0 01-2-2h4a2 2 0 01-2 2z" />
    </svg>
  ),
  Chevron: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16" className={className}>
      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  ),
  Users: () => (
    <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
    </svg>
  ),
  Reports: () => (
    <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
      <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586L7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
    </svg>
  ),
};

type NavItem = {
  to: string;
  label: string;
  icon: () => JSX.Element;
  roles?: string[];
};

const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard",     label: "Dashboard",      icon: Icons.Dashboard },
  { to: "/decisions",     label: "Decisions",      icon: Icons.Decisions },
  { to: "/decisions/new", label: "Create Decision", icon: Icons.Create },
  { to: "/teams",         label: "Teams",          icon: Icons.Teams },
  { to: "/my-discussions",label: "My Discussions", icon: Icons.Discussions },
  { to: "/documents",     label: "Documents",      icon: Icons.Documents },
  { to: "/analytics",     label: "Analytics",      icon: Icons.Analytics },
  { to: "/reports",       label: "Reports",        icon: Icons.Reports },
  { to: "/users",         label: "Users",          icon: Icons.Users, roles: ["Administrator"] },
  { to: "/profile",       label: "Profile",        icon: Icons.Profile },
  { to: "/settings",      label: "Settings",       icon: Icons.Settings },
];

export function AppLayout({
  title,
  children,
  notifCount = 0,
}: {
  title: string;
  children: ReactNode;
  notifCount?: number;
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <div className="app-shell">
      {/* ─────────── SIDEBAR ─────────── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">🧠</div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">Expert Decision</span>
            <span className="sidebar-brand-sub">Replay Platform</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/decisions" || item.to === "/dashboard"}
                className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
              >
                <Icon />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          Signed in as&nbsp;<strong style={{ color: "#fff" }}>{user?.role}</strong>
        </div>
      </aside>

      {/* ─────────── MAIN ─────────── */}
      <div className="main-column">
        {/* TOPBAR */}
        <header className="topbar">
          <div className="topbar-title">{title}</div>

          <div className="topbar-right">
            {/* Notification bell */}
            <button className="notif-btn" title="Notifications">
              <Icons.Bell />
              {notifCount > 0 && (
                <span className="notif-badge">{notifCount > 99 ? "99+" : notifCount}</span>
              )}
            </button>

            {/* User avatar + dropdown */}
            <div className="user-menu-wrapper" ref={dropdownRef}>
              <button
                className="user-menu-trigger"
                onClick={() => setDropdownOpen((v) => !v)}
              >
                <AvatarInitials name={user?.full_name || "U"} />
                <div className="user-info">
                  <div className="user-info-name">{user?.full_name}</div>
                  <div className="user-info-role">{user?.role}</div>
                </div>
                <Icons.Chevron className={`user-chevron${dropdownOpen ? " open" : ""}`} />
              </button>

              {dropdownOpen && (
                <div className="user-dropdown">
                  <NavLink
                    to="/profile"
                    className="user-dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Profile
                  </NavLink>
                  <NavLink
                    to="/settings"
                    className="user-dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Settings
                  </NavLink>
                  <button className="user-dropdown-item danger" onClick={handleLogout}>
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="content">{children}</main>
      </div>
    </div>
  );
}
