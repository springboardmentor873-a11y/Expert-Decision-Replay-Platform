import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE, getCurrentUser, logout } from "../API";
import { ThemeToggle } from "../theme";
import "./Workspace.css";

export default function MyDecisions() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);

  const role = (user?.role || "employee").toLowerCase();
  const isManager =
    role === "manager" || role === "admin" || role === "administrator";

  useEffect(() => {
    if (!user?.id) {
      navigate("/login");
      return;
    }

    const loadDecisions = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_BASE}/decisions`);
        if (!response.ok) {
          throw new Error("Could not load decisions");
        }

        const data = await response.json();
        const all = Array.isArray(data) ? data : [];
        // Only decisions created by the logged-in user
        const mine = all.filter(
          (d) => Number(d.user_id) === Number(user.id)
        );
        setDecisions(mine);
      } catch (err) {
        console.error(err);
        setError("Failed to load your decisions from server.");
      } finally {
        setLoading(false);
      }
    };

    loadDecisions();
  }, [navigate, user?.id]);

  // Notifications
  const loadNotifications = async () => {
    if (!user?.id) return;
    try {
      setNotificationLoading(true);
      const res = await fetch(
        `${API_BASE}/notifications?user_id=${encodeURIComponent(user.id)}`
      );
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : [];
        setNotifications(items);
        setUnreadCount(
          items.filter((item) => Number(item.is_read) === 0).length
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setNotificationLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const markNotificationRead = async (id) => {
    if (!user?.id) return;
    try {
      await fetch(
        `${API_BASE}/notifications/${id}/read?user_id=${encodeURIComponent(
          user.id
        )}`,
        { method: "PUT" }
      );
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllNotificationsRead = async () => {
    if (!user?.id) return;
    try {
      await fetch(
        `${API_BASE}/notifications/read-all?user_id=${encodeURIComponent(
          user.id
        )}`,
        { method: "PUT" }
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Metrics
  const totalCount = decisions.length;
  const draftCount = decisions.filter((d) => d.status === "Draft").length;
  const underReviewCount = decisions.filter(
    (d) => d.status === "Under Review"
  ).length;
  const approvedCount = decisions.filter(
    (d) => d.status === "Approved"
  ).length;
  const rejectedCount = decisions.filter(
    (d) => d.status === "Rejected"
  ).length;
  const completedCount = decisions.filter(
    (d) => d.status === "Completed"
  ).length;

  const filteredDecisions = useMemo(() => {
    return decisions.filter((d) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        d.title?.toLowerCase().includes(q) ||
        d.problem?.toLowerCase().includes(q) ||
        d.category?.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "All" || d.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [decisions, search, statusFilter]);

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case "Approved":
        return { background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0" };
      case "Under Review":
        return { background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" };
      case "Rejected":
        return { background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" };
      case "Completed":
        return { background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" };
      default:
        return { background: "#f3f4f6", color: "#4b5563", border: "1px solid #e5e7eb" };
    }
  };

  return (
    <div className="workspace dashboard-workspace">
      {/* SIDEBAR */}
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">ED</div>
          <div className="sidebar-brand-text">
            <strong>Expert Decision</strong>
            <span>Replay Platform</span>
          </div>
        </div>

        <div className="sidebar-divider"></div>
        <div className="sidebar-section-title">WORKSPACE</div>

        <nav className="sidebar-nav">
          <Link to="/my-decisions" className="sidebar-link active">
            <span className="sidebar-icon">◈</span>
            <span>Dashboard</span>
          </Link>

          <Link to="/my-decisions" className="sidebar-link active">
            <span className="sidebar-icon">▣</span>
            <span>My Decisions</span>
          </Link>

          {!isManager && (
            <Link to="/decisions/new" className="sidebar-link">
              <span className="sidebar-icon">＋</span>
              <span>New Decision</span>
            </Link>
          )}

          <Link to="/teams" className="sidebar-link">
            <span className="sidebar-icon">♧</span>
            <span>Teams</span>
          </Link>

          <Link to="/discussions" className="sidebar-link">
            <span className="sidebar-icon">◌</span>
            <span>Discussions</span>
          </Link>

          <Link to="/approvals" className="sidebar-link">
            <span className="sidebar-icon">✓</span>
            <span>Approvals</span>
          </Link>
        </nav>

        <div className="sidebar-section-title second-section">KNOWLEDGE</div>

        <nav className="sidebar-nav">
          <Link to="/documents" className="sidebar-link">
            <span className="sidebar-icon">▤</span>
            <span>Documents</span>
          </Link>

          <Link to="/knowledge-graph" className="sidebar-link">
            <span className="sidebar-icon">?</span>
            <span>Knowledge Graph</span>
          </Link>

          <Link to="/analytics" className="sidebar-link">
            <span className="sidebar-icon">◒</span>
            <span>Analytics</span>
          </Link>

          <Link to="/audit-logs" className="sidebar-link">
            <span className="sidebar-icon">📜</span>
            <span>Audit Logs</span>
          </Link>

          <Link to="/profile" className="sidebar-link">
            <span className="sidebar-icon">◎</span>
            <span>Profile</span>
          </Link>

          <Link to="/settings" className="sidebar-link">
            <span className="sidebar-icon">⚙</span>
            <span>Settings</span>
          </Link>
        </nav>

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

      {/* MAIN CONTENT */}
      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="dashboard-topbar-left">
            <div className="mobile-logo">ED</div>
            <div>
              <strong>My Decisions</strong>
              <span>Track, manage and review your decisions</span>
            </div>
          </div>

          <div className="dashboard-topbar-right">
            <ThemeToggle />
            {/* Notification Bell */}
            <div style={{ position: "relative" }}>
              <button
                type="button"
                className="notification-icon"
                onClick={() => setShowNotifications((c) => !c)}
                aria-label="Notifications"
                style={{
                  position: "relative",
                  cursor: "pointer",
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  borderRadius: "10px",
                  padding: "8px 12px",
                  fontSize: "18px",
                }}
              >
                🔔
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-4px",
                      right: "-4px",
                      background: "#ef4444",
                      color: "white",
                      borderRadius: "50%",
                      padding: "2px 6px",
                      fontSize: "11px",
                      fontWeight: 700,
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div
                  style={{
                    position: "absolute",
                    top: "45px",
                    right: 0,
                    width: "350px",
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                    zIndex: 200,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid #e2e8f0",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <strong>Notifications</strong>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsRead}
                        style={{
                          border: "none",
                          background: "none",
                          color: "#2563eb",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div style={{ maxHeight: "350px", overflowY: "auto" }}>
                    {notifications.length === 0 ? (
                      <div
                        style={{
                          padding: "24px",
                          textAlign: "center",
                          color: "#6b7280",
                          fontSize: "13px",
                        }}
                      >
                        No notifications
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (Number(n.is_read) === 0) markNotificationRead(n.id);
                            if (n.decision_id) {
                              navigate(`/decisions/${n.decision_id}`);
                              setShowNotifications(false);
                            }
                          }}
                          style={{
                            padding: "12px 16px",
                            borderBottom: "1px solid #f1f5f9",
                            background: n.is_read ? "#ffffff" : "#f8fbff",
                            cursor: n.decision_id ? "pointer" : "default",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "13px",
                              fontWeight: 600,
                              color: "#1e293b",
                            }}
                          >
                            {n.title}
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#64748b",
                              marginTop: "2px",
                            }}
                          >
                            {n.message}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="topbar-user">
              <div className="user-avatar">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="user-info">
                <strong>{user?.name || "User"}</strong>
                <span>{isManager ? "Manager" : "Employee"}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="dashboard-content my-decisions-page" style={{ padding: "30px 40px" }}>
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "24px",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: "26px",
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                My Decision Workspace
              </h1>
              <p
                style={{
                  margin: "4px 0 0",
                  color: "#64748b",
                  fontSize: "14px",
                }}
              >
                Decisions authored by you across the organization
              </p>
            </div>

            {!isManager && (
              <Link
                to="/decisions/new"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#2563eb",
                  color: "#ffffff",
                  padding: "10px 18px",
                  borderRadius: "10px",
                  fontWeight: 600,
                  fontSize: "14px",
                  textDecoration: "none",
                  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
                }}
              >
                ＋ New Decision
              </Link>
            )}
          </div>

          {/* Metric Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "16px",
              marginBottom: "28px",
            }}
          >
            {[
              { label: "Total Decisions", count: totalCount, filter: "All", color: "#2563eb" },
              { label: "Draft", count: draftCount, filter: "Draft", color: "#64748b" },
              { label: "Under Review", count: underReviewCount, filter: "Under Review", color: "#3b82f6" },
              { label: "Approved", count: approvedCount, filter: "Approved", color: "#059669" },
              { label: "Rejected", count: rejectedCount, filter: "Rejected", color: "#dc2626" },
              { label: "Completed", count: completedCount, filter: "Completed", color: "#16a34a" },
            ].map((stat) => (
              <div
                key={stat.label}
                onClick={() => setStatusFilter(stat.filter)}
                style={{
                  background: "#ffffff",
                  border:
                    statusFilter === stat.filter
                      ? `2px solid ${stat.color}`
                      : "1px solid #e2e8f0",
                  borderRadius: "14px",
                  padding: "18px 20px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow:
                    statusFilter === stat.filter
                      ? "0 6px 18px rgba(0,0,0,0.06)"
                      : "0 2px 6px rgba(0,0,0,0.02)",
                }}
              >
                <div
                  style={{
                    fontSize: "26px",
                    fontWeight: 800,
                    color: stat.color,
                    marginBottom: "4px",
                  }}
                >
                  {stat.count}
                </div>
                <div style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Search and Filters */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              padding: "16px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "16px",
              marginBottom: "24px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: "1 1 280px" }}>
              <input
                type="text"
                placeholder="Search by title, category, problem..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {["All", "Draft", "Under Review", "Approved", "Rejected", "Completed"].map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    style={{
                      border: "none",
                      padding: "8px 14px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                      background:
                        statusFilter === status ? "#2563eb" : "#f1f5f9",
                      color: statusFilter === status ? "#ffffff" : "#475569",
                      transition: "background 0.15s ease",
                    }}
                  >
                    {status}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Decision List */}
          {loading ? (
            <div
              className="my-decisions-state"
              style={{
                textAlign: "center",
                padding: "60px 20px",
                background: "#ffffff",
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
              }}
            >
              <div className="loading-spinner" style={{ margin: "0 auto 16px" }}></div>
              <p style={{ color: "#64748b", margin: 0 }}>Loading your decisions...</p>
            </div>
          ) : error ? (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                borderRadius: "12px",
                padding: "18px 24px",
              }}
            >
              <strong>Error: </strong> {error}
            </div>
          ) : filteredDecisions.length === 0 ? (
            <div
              className="my-decisions-state"
              style={{
                textAlign: "center",
                padding: "60px 20px",
                background: "#ffffff",
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
              }}
            >
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>📝</div>
              <h3 style={{ margin: "0 0 6px", color: "#0f172a" }}>
                No decisions found
              </h3>
              <p style={{ color: "#64748b", margin: "0 0 20px", fontSize: "14px" }}>
                {decisions.length === 0
                  ? "You have not created any decisions yet."
                  : "No decisions match your search or filter criteria."}
              </p>
              {!isManager && decisions.length === 0 && (
                <Link
                  to="/decisions/new"
                  style={{
                    display: "inline-block",
                    background: "#2563eb",
                    color: "#ffffff",
                    padding: "10px 20px",
                    borderRadius: "8px",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  Create Your First Decision
                </Link>
              )}
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "20px",
              }}
            >
              {filteredDecisions.map((decision) => (
                <div
                  className="my-decision-card"
                  key={decision.id}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "14px",
                    padding: "20px 24px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                    transition: "transform 0.15s ease, box-shadow 0.15s ease",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "12px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          letterSpacing: "0.5px",
                          color: "#64748b",
                          background: "#f1f5f9",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          textTransform: "uppercase",
                        }}
                      >
                        {decision.category || "General"}
                      </span>

                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          padding: "4px 10px",
                          borderRadius: "999px",
                          ...getStatusBadgeStyle(decision.status),
                        }}
                      >
                        {decision.status}
                      </span>
                    </div>

                    <h3
                      style={{
                        margin: "0 0 10px",
                        fontSize: "17px",
                        fontWeight: 700,
                        color: "#0f172a",
                        lineHeight: 1.35,
                      }}
                    >
                      {decision.title}
                    </h3>

                    <p
                      style={{
                        margin: "0 0 16px",
                        color: "#475569",
                        fontSize: "13px",
                        lineHeight: 1.5,
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {decision.problem || "No problem statement provided."}
                    </p>
                  </div>

                  <div
                    style={{
                      borderTop: "1px solid #f1f5f9",
                      paddingTop: "14px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                      ID #{decision.id}
                    </span>

                    <Link
                      to={`/decisions/${decision.id}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        color: "#2563eb",
                        fontWeight: 600,
                        fontSize: "13px",
                        textDecoration: "none",
                      }}
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
