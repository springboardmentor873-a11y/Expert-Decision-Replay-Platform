import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../AuthContext.jsx";
import { api } from "../api";

export default function Sidebar() {
  const { user, logout, refreshUser } = useAuth();
  const isAdmin = user?.role === "administrator";
  const canSeeReports = ["manager", "administrator"].includes(user?.role);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const { unread_count } = await api.unreadNotificationCount();
        if (!cancelled) setUnreadCount(unread_count);
      } catch {
        // Sidebar polling failure shouldn't disrupt navigation.
      }
      try {
        // Picks up a role change an admin made while this user is still
        // logged in, without requiring them to log out and back in.
        await refreshUser();
      } catch {
        // Same — a failed refresh shouldn't disrupt navigation.
      }
    }
    poll();
    const interval = setInterval(poll, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/>
            <path d="M12 6a6 6 0 1 0 6 6 6 6 0 0 0-6-6zm0 10a4 4 0 1 1 4-4 4 4 0 0 1-4 4z"/>
            <circle cx="12" cy="12" r="2"/>
          </svg>
        </div>
        <div className="brand-text">
          <div className="brand-name">DecisioHub</div>
          <div className="brand-tagline">Smarter Decisions Together</div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "active" : "")}>
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          <span>Home</span>
        </NavLink>

        <NavLink to="/notifications" className={({ isActive }) => (isActive ? "active" : "")}>
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <span>Notifications</span>
          {unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}
        </NavLink>

        <NavLink to="/teams" className={({ isActive }) => (isActive ? "active" : "")}>
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <span>My Teams</span>
        </NavLink>

        <NavLink to="/profile" className={({ isActive }) => (isActive ? "active" : "")}>
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span>Profile</span>
        </NavLink>

        <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          <span>My Decisions</span>
        </NavLink>

        <NavLink to="/team-decisions" className={({ isActive }) => (isActive ? "active" : "")}>
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          </svg>
          <span>Team Decisions</span>
        </NavLink>

        <NavLink to="/repository" className={({ isActive }) => (isActive ? "active" : "")}>
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M3 12h6m6 0h6M12 3v6m0 6v6"></path>
          </svg>
          <span>🕸️ Knowledge Graph</span>
        </NavLink>

        <NavLink to="/discussions" className={({ isActive }) => (isActive ? "active" : "")}>
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <span>Discussions</span>
        </NavLink>

        <NavLink to="/search" className={({ isActive }) => (isActive ? "active" : "")}>
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <span>Search</span>
        </NavLink>

        {canSeeReports && (
          <NavLink to="/reports" className={({ isActive }) => (isActive ? "active" : "")}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
            <span>Insights</span>
          </NavLink>
        )}

        {isAdmin && (
          <NavLink to="/audit-logs" className={({ isActive }) => (isActive ? "active" : "")}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <path d="M14 2v6h6"></path>
              <path d="M16 13H8"></path>
              <path d="M16 17H8"></path>
              <path d="M10 9H8"></path>
            </svg>
            <span>Audit Trail</span>
          </NavLink>
        )}

        {isAdmin && (
          <NavLink to="/admin" className={({ isActive }) => (isActive ? "active" : "")}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span>User Directory</span>
          </NavLink>
        )}
      </nav>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        <button className="footer-link-btn" onClick={() => alert("Help & Support: Please contact your admin or support@decisiohub.com")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <span>Help & Support</span>
        </button>

        <button className="footer-link-btn logout-btn" onClick={logout}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
