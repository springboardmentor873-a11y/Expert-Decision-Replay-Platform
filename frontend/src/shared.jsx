import { useEffect, useState, useCallback } from "react";

export const API_BASE_URL = "http://127.0.0.1:8000";

// ==========================================
// NOTIFICATION BELL
// ==========================================

export const NotificationBell = ({ navigateTo, refreshKey }) => {
  const [count, setCount] = useState(0);

  const loadUnread = useCallback(async () => {
    const token = localStorage.getItem("access_token");

    if (!token) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/unread-count`,
        {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
      );

      if (!response.ok) return;

      const data = await response.json();

      setCount(data.unread_count || 0);
    } catch (error) {
      console.error("Unread count error:", error);
    }
  }, []);

  useEffect(() => {
    loadUnread();

    const timer = setInterval(loadUnread, 15000);

    return () => clearInterval(timer);
  }, [loadUnread, refreshKey]);

  return (
    <button
      className="notification-bell"
      onClick={() => navigateTo("notifications")}
      title="Notifications"
      aria-label="Notifications"
    >
      <span className="notification-bell-icon">&#128276;</span>
      {count > 0 && (
        <span className="notification-bell-badge">
          {count}
        </span>
      )}
    </button>
  );
};

// ==========================================
// SIDEBAR
// ==========================================

export const AppSidebar = ({ activePage, navigateTo, handleLogout }) => {
  const goHome = () => navigateTo("home");
  const goMyTeams = () => navigateTo("my-teams");
  const goMyDecisions = () => navigateTo("my-decisions");
  const goTeamDecisions = () => navigateTo("team-decisions");
  const goKnowledge = () => navigateTo("knowledge");
  const goDiscussions = () => navigateTo("discussions");
  const goSearch = () => navigateTo("search");
  const goReports = () => navigateTo("reports");
  const goAuditLogs = () => navigateTo("audit-logs");

  const storedUser = (() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  })();

  const canViewAuditLogs =
    storedUser && (storedUser.role_id === 3 || storedUser.role_id === 4);

  const navClass = (page) =>
    `dash-nav-item${activePage === page ? " active" : ""}`;

  return (
    <aside className="dash-sidebar">
      <div className="dash-sidebar-brand">
        <div className="dash-sidebar-logo">ED</div>
        <div className="dash-sidebar-text">
          <div className="dash-sidebar-title">
            Expert Decision Replay
          </div>
          <div className="dash-sidebar-subtitle">
            Decision Intelligence Platform
          </div>
        </div>
      </div>

      <nav className="dash-sidebar-nav">

        <div className="dash-nav-group-label">Main</div>

        <button
          className={navClass("home")}
          onClick={goHome}
        >
          <span className="dash-nav-icon">&#128202;</span>
          Home
        </button>

        <button
          className={navClass("my-teams")}
          onClick={goMyTeams}
        >
          <span className="dash-nav-icon">&#128101;</span>
          My Teams
        </button>

        <button
          className={navClass("my-decisions")}
          onClick={goMyDecisions}
        >
          <span className="dash-nav-icon">&#128203;</span>
          My Decisions
        </button>

        <button
          className={navClass("team-decisions")}
          onClick={goTeamDecisions}
        >
          <span className="dash-nav-icon">&#128218;</span>
          Team Decisions
        </button>

        <button
          className={navClass("knowledge")}
          onClick={goKnowledge}
        >
          <span className="dash-nav-icon">&#128214;</span>
          Knowledge Repository
        </button>

        <button
          className={navClass("discussions")}
          onClick={goDiscussions}
        >
          <span className="dash-nav-icon">&#128172;</span>
          Discussions
        </button>

        <button
          className={navClass("search")}
          onClick={goSearch}
        >
          <span className="dash-nav-icon">&#128269;</span>
          Search
        </button>

        <button
          className={navClass("reports")}
          onClick={goReports}
        >
          <span className="dash-nav-icon">&#128202;</span>
          Reports
        </button>

        {canViewAuditLogs && (
          <button
            className={navClass("audit-logs")}
            onClick={goAuditLogs}
          >
            <span className="dash-nav-icon">&#128270;</span>
            Audit Logs
          </button>
        )}

      </nav>

      <div className="dash-sidebar-footer">
        <button
          className="dash-nav-item"
          onClick={handleLogout}
        >
          <span className="dash-nav-icon">&#128682;</span>
          Logout
        </button>
      </div>
    </aside>
  );
};