import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  API_BASE,
  getCurrentUser,
  logout,
} from "../api";
import { ThemeToggle } from "../theme";
import Sidebar from "../Sidebar";
import "./Workspace.css";

function Dashboard() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ============================================================
  // MILESTONE 3 - NOTIFICATIONS
  // ============================================================
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationError, setNotificationError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");

  const role = (user?.role || "employee").toLowerCase();

  const isManager =
    role === "manager" ||
    role === "admin" ||
    role === "administrator";

  useEffect(() => {
    if (!user?.id) {
      navigate("/login");
      return;
    }

    const loadDecisions = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE}/decisions?user_id=${encodeURIComponent(
            user.id
          )}`
        );

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.detail || "Could not load decisions");
        }

        const data = await response.json();

        const allDecisions = Array.isArray(data)
          ? data
          : [];

        // The API already scopes this list; the filter keeps the UI honest
        // if it ever receives an unrestricted response.
        const visibleDecisions = isManager
          ? allDecisions
          : allDecisions.filter(
              (decision) =>
                Number(decision.user_id) ===
                Number(user.id)
            );

        setDecisions(visibleDecisions);
      } catch (err) {
        console.error(err);

        setError(
          "Cannot connect to backend. Please make sure the server is running."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDecisions();
  }, [navigate, user?.id, isManager]);

  const filteredDecisions = useMemo(() => {
    return decisions.filter((decision) => {
      const searchText = search
        .trim()
        .toLowerCase();

      const matchesSearch =
        !searchText ||
        decision.title
          ?.toLowerCase()
          .includes(searchText) ||
        decision.problem
          ?.toLowerCase()
          .includes(searchText) ||
        decision.category
          ?.toLowerCase()
          .includes(searchText);

      const matchesStatus =
        statusFilter === "All Status" ||
        decision.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [decisions, search, statusFilter]);

  const totalCount = decisions.length;

  const completedCount = decisions.filter(
    (decision) =>
      decision.status === "Completed"
  ).length;

  const reviewCount = decisions.filter(
    (decision) =>
      decision.status === "Under Review"
  ).length;

  const draftCount = decisions.filter(
    (decision) =>
      decision.status === "Draft"
  ).length;

  const organizationStatusCounts = useMemo(() => {
    const statuses = [
      ["Draft", "#64748b"],
      ["Under Review", "#f59e0b"],
      ["Approved", "#10b981"],
      ["Rejected", "#ef4444"],
      ["Completed", "#3b82f6"],
    ];
    return statuses.map(([label, color]) => ({
      label,
      color,
      count: decisions.filter((decision) => (decision.status || "").toLowerCase() === label.toLowerCase()).length,
    }));
  }, [decisions]);

  const organizationCategoryCounts = useMemo(() => {
    const totals = decisions.reduce((counts, decision) => {
      const category = decision.category || "General";
      counts[category] = (counts[category] || 0) + 1;
      return counts;
    }, {});
    return Object.entries(totals).sort((left, right) => right[1] - left[1]).slice(0, 6);
  }, [decisions]);

  let statusChartOffset = 0;
  const statusChartGradient = organizationStatusCounts.map(({ color, count }) => {
    const start = totalCount ? (statusChartOffset / totalCount) * 100 : 0;
    statusChartOffset += count;
    const end = totalCount ? (statusChartOffset / totalCount) * 100 : 0;
    return `${color} ${start}% ${end}%`;
  }).join(", ");
  const maxOrganizationCategoryCount = Math.max(...organizationCategoryCounts.map(([, count]) => count), 1);

  // ============================================================
  // MILESTONE 3 - NOTIFICATION FUNCTIONS
  // ============================================================

  const loadNotifications = async () => {
    if (!user?.id) return;

    try {
      setNotificationLoading(true);
      setNotificationError("");

      const [notificationsResponse, countResponse] = await Promise.all([
        fetch(
          `${API_BASE}/notifications?user_id=${encodeURIComponent(
            user.id
          )}`
        ),
        fetch(
          `${API_BASE}/notifications/unread-count?user_id=${encodeURIComponent(
            user.id
          )}`
        ),
      ]);

      if (!notificationsResponse.ok) {
        throw new Error("Could not load notifications");
      }

      if (!countResponse.ok) {
        throw new Error("Could not load notification count");
      }

      const notificationData = await notificationsResponse.json();
      const countData = await countResponse.json();

      setNotifications(
        Array.isArray(notificationData) ? notificationData : []
      );

      setUnreadCount(Number(countData?.count || 0));
    } catch (err) {
      console.error("Notification error:", err);
      setNotificationError("Unable to load notifications.");
    } finally {
      setNotificationLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    loadNotifications();

    // Refresh notification count/list periodically so new approval
    // requests appear without requiring a page refresh.
    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [user?.id]);

  const handleNotificationClick = async (notification) => {
    if (!user?.id || !notification?.id) return;

    try {
      if (Number(notification.is_read) === 0) {
        const response = await fetch(
          `${API_BASE}/notifications/${notification.id}/read?user_id=${encodeURIComponent(
            user.id
          )}`,
          {
            method: "PUT",
          }
        );

        if (!response.ok) {
          throw new Error("Could not mark notification as read");
        }

        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id
              ? { ...item, is_read: 1 }
              : item
          )
        );

        setUnreadCount((current) => Math.max(0, current - 1));
      }
    } catch (err) {
      console.error("Mark notification read error:", err);
    }

    setShowNotifications(false);

    if (notification.decision_id) {
      navigate(`/decisions/${notification.decision_id}`);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    if (!user?.id || unreadCount === 0) return;

    try {
      const response = await fetch(
        `${API_BASE}/notifications/read-all?user_id=${encodeURIComponent(
          user.id
        )}`,
        {
          method: "PUT",
        }
      );

      if (!response.ok) {
        throw new Error("Could not mark notifications as read");
      }

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          is_read: 1,
        }))
      );

      setUnreadCount(0);
    } catch (err) {
      console.error("Mark all notifications read error:", err);
      setNotificationError("Could not mark notifications as read.");
    }
  };

  const formatNotificationTime = (dateValue) => {
    if (!dateValue) return "";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return "Just now";

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    }

    const days = Math.floor(hours / 24);
    if (days < 7) {
      return `${days} day${days === 1 ? "" : "s"} ago`;
    }

    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type) => {
    const notificationType = (type || "").toLowerCase();

    if (notificationType === "approved") return "✓";
    if (notificationType === "rejected") return "✕";
    if (notificationType === "approval") return "●";

    return "●";
  };

  const handleStatusCard = (status) => {
    setStatusFilter(status);

    window.scrollTo({
      top: 450,
      behavior: "smooth",
    });
  };

  if (loading) {
    return (
      <div className="workspace">
        <div className="loading-screen">
          <div className="loading-spinner"></div>

          <h3>
            Loading dashboard...
          </h3>

          <p>
            Please wait
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace dashboard-workspace">

      <Sidebar activePath={"/dashboard"} />


      {/* =====================================================
          MAIN AREA
          ===================================================== */}

      <div className="dashboard-main">

        {/* =================================================
            TOP BAR
            ================================================= */}

        <header className="dashboard-topbar">

          <div className="dashboard-topbar-left">

            <div className="mobile-logo">
              ED
            </div>

            <div>

              <strong>
                Decision Intelligence
              </strong>

              <span>
                Organizational knowledge workspace
              </span>

            </div>

          </div>


          <div className="dashboard-topbar-right">
            <ThemeToggle />

            {/* =================================================
                MILESTONE 3 - NOTIFICATION CENTER
                ================================================= */}

            <div
              style={{
                position: "relative",
              }}
            >
              <button
                type="button"
                className="notification-icon"
                onClick={() =>
                  setShowNotifications((current) => !current)
                }
                aria-label="Notifications"
                aria-expanded={showNotifications}
                style={{
                  position: "relative",
                  cursor: "pointer",
                  border: "none",
                  background: "transparent",
                }}
              >
                🔔

                {unreadCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-4px",
                      right: "-4px",
                      minWidth: "19px",
                      height: "19px",
                      padding: "0 5px",
                      borderRadius: "999px",
                      background: "#ef4444",
                      color: "#fff",
                      fontSize: "10px",
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "2px solid #fff",
                      boxSizing: "border-box",
                    }}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <>
                  <div
                    onClick={() => setShowNotifications(false)}
                    style={{
                      position: "fixed",
                      inset: 0,
                      zIndex: 998,
                    }}
                  />

                  <div
                    className="notification-popover"
                  >
                    <div className="notification-popover-header">
                      <div>
                        <strong className="notification-popover-title">
                          Notifications
                        </strong>

                        <span className="notification-popover-subtitle">
                          {unreadCount > 0
                            ? `${unreadCount} unread notification${
                                unreadCount === 1 ? "" : "s"
                              }`
                            : "You're all caught up"}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="notification-popover-action"
                        onClick={handleMarkAllNotificationsRead}
                        disabled={unreadCount === 0}
                      >
                        Mark all read
                      </button>
                    </div>

                    {notificationError && (
                      <div className="notification-popover-error">
                        {notificationError}
                      </div>
                    )}

                    <div className="notification-popover-list">
                      {notificationLoading ? (
                        <div className="notification-popover-state">
                          Loading notifications...
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="notification-popover-empty">
                          <div className="notification-popover-empty-icon">
                            🔔
                          </div>

                          <strong>No notifications</strong>

                          <span>
                            New updates will appear here.
                          </span>
                        </div>
                      ) : (
                        notifications.map((notification) => {
                          const isUnread =
                            Number(notification.is_read) === 0;

                          const type = (
                            notification.notification_type || ""
                          ).toLowerCase();

                          const icon =
                            getNotificationIcon(type);

                          return (
                            <button
                              key={notification.id}
                              type="button"
                              onClick={() =>
                                handleNotificationClick(
                                  notification
                                )
                              }
                              className={`notification-item${
                                isUnread ? " is-unread" : ""
                              }`}
                            >
                              <span
                                className={`notification-item-icon type-${type}`}
                              >
                                {icon}
                              </span>

                              <span className="notification-item-body">
                                <span className="notification-item-head">
                                  <strong>
                                    {notification.title}
                                  </strong>

                                  {isUnread && (
                                    <span className="notification-dot" />
                                  )}
                                </span>

                                <span className="notification-item-message">
                                  {notification.message}
                                </span>

                                <span className="notification-item-time">
                                  {formatNotificationTime(
                                    notification.created_at
                                  )}
                                </span>
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>


            <div className="topbar-user">

              <div className="user-avatar">
                {user?.name
                  ?.charAt(0)
                  ?.toUpperCase() || "U"}
              </div>


              <div className="user-info">

                <strong>
                  {user?.name || "User"}
                </strong>

                <span>
                  {isManager
                    ? "Manager"
                    : "Employee"}
                </span>

              </div>

            </div>

          </div>

        </header>


        {/* =================================================
            MAIN CONTENT
            ================================================= */}

        <main className="dashboard-content">

          {/* =================================================
              HERO
              ================================================= */}

          <section className="dashboard-hero">

            <div className="dashboard-hero-text">

              <span className="eyebrow">

                {isManager
                  ? "MANAGER WORKSPACE"
                  : "MY WORKSPACE"}

              </span>


              <h1>
                Decision Dashboard
              </h1>


              <p>

                {isManager
                  ? "View and manage organizational decisions across your team."
                  : "View and manage the decisions you have created."}

              </p>

            </div>


            {/* =================================================
                ONLY EMPLOYEE GETS NEW DECISION BUTTON
                MANAGER GETS NOTHING HERE
                ================================================= */}

            {!isManager && (
              <Link
                to="/decisions/new"
                className="new-decision-btn"
              >

                <span>
                  ＋
                </span>

                New Decision

              </Link>
            )}

          </section>


          {/* =================================================
              ACCESS BANNER
              ================================================= */}

          <div className="access-banner">

            <div className="access-banner-icon">

              {isManager
                ? "♛"
                : "🔒"}

            </div>


            <div>

              <strong>

                {isManager
                  ? "Manager access"
                  : "Employee access"}

              </strong>


              <span>

                {isManager
                  ? "You can view all organizational decisions."
                  : "You can view only your own decisions."}

              </span>

            </div>

          </div>


          {/* =================================================
              STATISTICS
              ================================================= */}

          <section className="dashboard-stats">

            {/* TOTAL */}

            <button
              className="dashboard-stat-card"
              onClick={() =>
                handleStatusCard(
                  "All Status"
                )
              }
            >

              <div className="stat-card-top">

                <div className="dashboard-stat-icon blue">
                  ◈
                </div>

                <span className="stat-arrow">
                  →
                </span>

              </div>


              <span className="dashboard-stat-label">
                Total Decisions
              </span>


              <strong className="dashboard-stat-number">
                {totalCount}
              </strong>


              <span className="dashboard-stat-description">

                {isManager
                  ? "Across the organization"
                  : "Created by you"}

              </span>

            </button>


            {/* COMPLETED */}

            <button
              className="dashboard-stat-card"
              onClick={() =>
                handleStatusCard(
                  "Completed"
                )
              }
            >

              <div className="stat-card-top">

                <div className="dashboard-stat-icon green">
                  ✓
                </div>

                <span className="stat-arrow">
                  →
                </span>

              </div>


              <span className="dashboard-stat-label">
                Completed
              </span>


              <strong className="dashboard-stat-number">
                {completedCount}
              </strong>


              <span className="dashboard-stat-description">
                Final decisions recorded
              </span>

            </button>


            {/* UNDER REVIEW */}

            <button
              className="dashboard-stat-card"
              onClick={() =>
                handleStatusCard(
                  "Under Review"
                )
              }
            >

              <div className="stat-card-top">

                <div className="dashboard-stat-icon orange">
                  ◌
                </div>

                <span className="stat-arrow">
                  →
                </span>

              </div>


              <span className="dashboard-stat-label">
                Under Review
              </span>


              <strong className="dashboard-stat-number">
                {reviewCount}
              </strong>


              <span className="dashboard-stat-description">
                Decisions being reviewed
              </span>

            </button>


            {/* DRAFT */}

            <button
              className="dashboard-stat-card"
              onClick={() =>
                handleStatusCard(
                  "Draft"
                )
              }
            >

              <div className="stat-card-top">

                <div className="dashboard-stat-icon purple">
                  ✎
                </div>

                <span className="stat-arrow">
                  →
                </span>

              </div>


              <span className="dashboard-stat-label">
                Draft
              </span>


              <strong className="dashboard-stat-number">
                {draftCount}
              </strong>


              <span className="dashboard-stat-description">
                Work in progress
              </span>

            </button>

          </section>


          {isManager && (
            <section className="organization-insights" aria-label="Organization decision charts">
              <article className="organization-chart-card">
                <div className="organization-chart-heading">
                  <div><span className="eyebrow">ORGANIZATION</span><h2>Decision status</h2><p>Click a status to filter the decision list.</p></div>
                  <span className="chart-kicker">{totalCount} total</span>
                </div>
                <div className="organization-status-layout">
                  <div className="organization-status-donut" style={{ background: totalCount ? `conic-gradient(${statusChartGradient})` : "conic-gradient(#334155 0 100%)" }} aria-label={`${totalCount} organizational decisions`}>
                    <div><strong>{totalCount}</strong><span>Decisions</span></div>
                  </div>
                  <div className="organization-chart-legend">
                    {organizationStatusCounts.map(({ label, color, count }) => (
                      <button type="button" key={label} onClick={() => setStatusFilter(label)}>
                        <span className="organization-legend-dot" style={{ background: color }} />{label}<strong>{count}</strong>
                      </button>
                    ))}
                  </div>
                </div>
              </article>
              <article className="organization-chart-card">
                <div className="organization-chart-heading">
                  <div><span className="eyebrow">ORGANIZATION</span><h2>Decisions by category</h2><p>Click a category to search matching decisions.</p></div>
                  <span className="chart-kicker">Top {organizationCategoryCounts.length}</span>
                </div>
                <div className="organization-category-chart">
                  {organizationCategoryCounts.length ? organizationCategoryCounts.map(([category, count]) => (
                    <button type="button" className="organization-category-row" key={category} onClick={() => setSearch(category)}>
                      <span title={category}>{category}</span>
                      <i><b style={{ width: `${(count / maxOrganizationCategoryCount) * 100}%` }} /></i>
                      <strong>{count}</strong>
                    </button>
                  )) : <p className="organization-chart-empty">No decision categories yet.</p>}
                </div>
              </article>
            </section>
          )}


          {/* =================================================
              DECISION RECORDS
              ================================================= */}

          <section className="decision-record-section">

            <div className="records-header">

              <div>

                <span className="eyebrow">
                  DECISION RECORDS
                </span>


                <h2>

                  {isManager
                    ? "All Decisions"
                    : "My Decisions"}

                </h2>


                <p>

                  {isManager
                    ? "Review decisions created across the organization."
                    : "Review decisions created by you."}

                </p>

              </div>


              <div className="records-count">

                <strong>
                  {filteredDecisions.length}
                </strong>

                <span>
                  records
                </span>

              </div>

            </div>


            {/* SEARCH + FILTER */}

            <div className="decision-toolbar">

              <div className="premium-search">

                <span>
                  ⌕
                </span>


                <input
                  type="text"
                  placeholder="Search decisions, categories..."
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                />


                {search && (
                  <button
                    type="button"
                    onClick={() =>
                      setSearch("")
                    }
                  >
                    ×
                  </button>
                )}

              </div>


              <select
                className="premium-status-filter"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value
                  )
                }
              >

                <option>
                  All Status
                </option>

                <option>
                  Draft
                </option>

                <option>
                  Under Review
                </option>

                <option>
                  Completed
                </option>

                <option>
                  Approved
                </option>

                <option>
                  Rejected
                </option>

              </select>

            </div>


            {/* ERROR */}

            {error && (

              <div className="dashboard-error">

                <strong>
                  Unable to load decisions
                </strong>

                <span>
                  {error}
                </span>

              </div>

            )}


            {/* DECISION LIST */}

            {!error &&
            filteredDecisions.length === 0 ? (

              <div className="dashboard-empty">

                <div className="dashboard-empty-icon">
                  ◈
                </div>


                <h3>

                  {search ||
                  statusFilter !== "All Status"
                    ? "No matching decisions"
                    : "No decisions yet"}

                </h3>


                <p>

                  {search ||
                  statusFilter !== "All Status"
                    ? "Try changing your search or status filter."
                    : "Create your first decision to get started."}

                </p>


                {/* ONLY EMPLOYEE CAN CREATE */}

                {!isManager &&
                  !search &&
                  statusFilter ===
                    "All Status" && (

                    <Link
                      to="/decisions/new"
                      className="primary-btn"
                    >
                      + Create Decision
                    </Link>

                  )}

              </div>

            ) : (

              <div className="premium-decision-list">

                {filteredDecisions.map(
                  (decision) => (

                    <Link
                      key={decision.id}
                      to={`/decisions/${decision.id}`}
                      className="premium-decision-card"
                    >

                      <div className="decision-card-number">

                        #
                        {String(
                          decision.id
                        ).padStart(3, "0")}

                      </div>


                      <div className="premium-decision-main">

                        <div className="premium-decision-badges">

                          <span
                            className={`premium-status status-${(
                              decision.status ||
                              "Draft"
                            )
                              .toLowerCase()
                              .replaceAll(
                                " ",
                                "-"
                              )}`}
                          >

                            {decision.status ||
                              "Draft"}

                          </span>


                          {decision.category && (

                            <span className="premium-category">

                              {decision.category}

                            </span>

                          )}

                        </div>


                        <h3>
                          {decision.title}
                        </h3>


                        <p>

                          {decision.problem ||
                            "No problem statement provided."}

                        </p>


                        <div className="decision-card-meta">

                          <span>
                            ◷ Decision record
                          </span>


                          {decision.created_at && (

                            <span>

                              {new Date(
                                decision.created_at
                              ).toLocaleDateString()}

                            </span>

                          )}

                        </div>

                      </div>


                      <div className="premium-decision-arrow">
                        →
                      </div>

                    </Link>

                  )
                )}

              </div>

            )}

          </section>

        </main>

      </div>

    </div>
  );
}

export default Dashboard;
