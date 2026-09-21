import { useEffect, useState, useCallback } from "react";

import { API_BASE_URL, AppSidebar, NotificationBell } from "./shared";


// ==========================================
// DASHBOARD CONFIGURATION
// ==========================================

const STATUS_COLORS = {
  "Draft": "#94a3b8",
  "Under Review": "#f59e0b",
  "Reviewer Approved": "#3b82f6",
  "Approved": "#10b981",
  "Rejected": "#ef4444",
  "Archived": "#64748b"
};

const METRIC_ICONS = {
  total_decisions: "\uD83D\uDCCB",
  my_pending: "\u23F3",
  my_approved: "\u2705",
  draft: "\uD83D\uDCDD",
  assigned_for_review: "\uD83D\uDD0E",
  pending_reviews: "\u23F3",
  approved_by_me: "\u2705",
  rejected_by_me: "\u274C",
  team_decisions: "\uD83D\uDC65",
  team_pending: "\u23F3",
  team_approved: "\u2705",
  team_rejected: "\u274C",
  team_under_review: "\uD83D\uDD0E",
  total_users: "\uD83D\uDC64",
  total_teams: "\uD83D\uDC65",
  pending_approvals: "\u23F3",
  approved: "\u2705",
  rejected: "\u274C"
};

const METRIC_TONES = {
  total_decisions: { bg: "#dbeafe", color: "#2563eb" },
  my_pending: { bg: "#fef3c7", color: "#d97706" },
  my_approved: { bg: "#d1fae5", color: "#059669" },
  draft: { bg: "#e2e8f0", color: "#475569" },
  assigned_for_review: { bg: "#ede9fe", color: "#7c3aed" },
  pending_reviews: { bg: "#fef3c7", color: "#d97706" },
  approved_by_me: { bg: "#d1fae5", color: "#059669" },
  rejected_by_me: { bg: "#fee2e2", color: "#dc2626" },
  team_decisions: { bg: "#dbeafe", color: "#2563eb" },
  team_pending: { bg: "#fef3c7", color: "#d97706" },
  team_approved: { bg: "#d1fae5", color: "#059669" },
  team_rejected: { bg: "#fee2e2", color: "#dc2626" },
  team_under_review: { bg: "#ede9fe", color: "#7c3aed" },
  total_users: { bg: "#dbeafe", color: "#2563eb" },
  total_teams: { bg: "#ede9fe", color: "#7c3aed" },
  pending_approvals: { bg: "#fef3c7", color: "#d97706" },
  approved: { bg: "#d1fae5", color: "#059669" },
  rejected: { bg: "#fee2e2", color: "#dc2626" }
};

const QUICK_NAV = [
  { key: "decisions", label: "Decisions", icon: "\uD83D\uDCCB" },
  { key: "pending", label: "Pending Approvals", icon: "\u23F3" },
  { key: "notifications", label: "Notifications", icon: "\uD83D\uDD14" },
  { key: "reports", label: "Reports", icon: "\uD83D\uDCCA" },
  { key: "teams", label: "Teams", icon: "\uD83D\uDC65" },
  { key: "audit-logs", label: "Audit Logs", icon: "\uD83D\uDD0E" }
];


// ==========================================
// SMALL PRESENTATIONAL HELPERS
// ==========================================

const statusClass = (status) =>
  `status-badge status-${(status || "")
    .toLowerCase()
    .replace(/\s+/g, "-")}`;

const BarList = ({ items, emptyText }) => {
  if (!items || !items.length) {
    return <div className="db-empty">{emptyText || "No data yet"}</div>;
  }

  const max = Math.max(1, ...items.map((i) => i.count));

  return (
    <div className="db-bar-list">
      {items.map((item) => (
        <div className="db-bar-row" key={item.label}>
          <span className="db-bar-label" title={item.label}>
            {item.label}
          </span>
          <div className="db-bar-track">
            <div
              className="db-bar-fill"
              style={{
                width: `${Math.round((item.count / max) * 100)}%`,
                background: item.color || "#2563eb"
              }}
            />
          </div>
          <span className="db-bar-value">{item.count}</span>
        </div>
      ))}
    </div>
  );
};

const ActivityChart = ({ data, color }) => {
  if (!data || !data.length) {
    return <div className="db-empty">No activity in this period</div>;
  }

  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="db-activity">
      {data.map((d) => (
        <div className="db-activity-col" key={d.label}>
          <span className="db-activity-value">{d.count}</span>
          <div className="db-activity-bar-wrap">
            <div
              className="db-activity-bar"
              style={{
                height: `${Math.round((d.count / max) * 100)}%`,
                background: color || "#2563eb"
              }}
            />
          </div>
          <span className="db-activity-label">{d.label}</span>
        </div>
      ))}
    </div>
  );
};


// ==========================================
// DASHBOARD PAGE
// ==========================================

export const DashboardPage = (props) => {
  const {
    user,
    getRoleName,
    navigateTo,
    handleLogout,
    formatDate
  } = props;

  const [data, setData] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionTarget, setActionTarget] = useState(null);
  const [reason, setReason] = useState("");
  const [actionError, setActionError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");

  const roleId = Number(user?.role_id);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");

      if (!token) {
        setError("Your session has expired. Please sign in again.");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/dashboard/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        setError("Unable to load your dashboard right now.");
        return;
      }

      const payload = await response.json();
      setData(payload);
      setError("");

      try {
        const meetingsResponse = await fetch(
          `${API_BASE_URL}/meetings/upcoming?limit=5`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (meetingsResponse.ok) {
          const meetingsPayload = await meetingsResponse.json();
          setMeetings(
            Array.isArray(meetingsPayload) ? meetingsPayload : []
          );
        }
      } catch (me) {
        console.error("Dashboard meetings error:", me);
      }
    } catch (e) {
      console.error("Dashboard error:", e);
      setError("Unable to load your dashboard right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react/set-state-in-effect
    load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const fmt = (value) =>
    value && formatDate ? formatDate(value) : value || "";

  const closeAction = () => {
    setActionTarget(null);
    setReason("");
    setActionError("");
  };

  const runAction = async (decision, mode) => {
    const managerStage = decision.status === "Reviewer Approved";
    const endpoint = managerStage
      ? "manager-review"
      : "review";

    setSubmitting(true);
    setActionError("");

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${API_BASE_URL}/decisions/${decision.decision_id}/${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            action: mode,
            reason: mode === "reject" ? reason.trim() : null
          })
        }
      );

      if (!response.ok) {
        let detail = "Action failed. Please try again.";
        try {
          const body = await response.json();
          if (body && body.detail) detail = body.detail;
        } catch {
          /* keep default message */
        }
        setActionError(detail);
        return;
      }

      closeAction();
      setToast(
        mode === "approve"
          ? `Decision #${decision.decision_id} approved`
          : `Decision #${decision.decision_id} rejected`
      );
      await load();
    } catch (e) {
      console.error("Dashboard action error:", e);
      setActionError("Action failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmAction = () => {
    if (!actionTarget) return;
    const { decision, mode } = actionTarget;

    if (mode === "reject" && !reason.trim()) {
      setActionError("A reason is required to reject this decision.");
      return;
    }

    runAction(decision, mode);
  };

  const openDecision = (decision) =>
    navigateTo("decision-view", { decision_id: decision.decision_id });

  const metricLink = (key) => {
    if (roleId === 1) return "my-decisions";
    if (roleId === 3) return "team-decisions";
    if (key === "total_users" || key === "total_teams") return "teams";
    return "decisions";
  };

  const pendingLink = () => {
    if (roleId === 1) return "my-decisions";
    if (roleId === 3) return "team-decisions";
    return "decisions";
  };

  const quickDestination = (key) => {
    if (key === "pending") return pendingLink();
    if (key === "teams") return roleId === 4 ? "teams" : "my-teams";
    return key;
  };

  const canQuickAct = (decision) => {
    if (roleId === 2) return decision.status === "Under Review";
    if (roleId === 3) return decision.status === "Reviewer Approved";
    return false;
  };

  const hour = new Date().getHours();
  let greeting = "Good Evening";
  if (hour < 12) greeting = "Good Morning";
  else if (hour < 17) greeting = "Good Afternoon";

  const dashDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const roleFocus = {
    1: "Track the progress of decisions you created and what needs your attention.",
    2: "Review the decisions waiting on your team and move them forward.",
    3: "Monitor team decisions and give the final approval on pending items.",
    4: "Monitor platform-wide decision activity, users, and teams."
  };

  const roleTitle = {
    1: "My Dashboard",
    2: "Reviewer Dashboard",
    3: "Manager Dashboard",
    4: "Admin Dashboard"
  };

  const statusItems = data
    ? Object.keys(data.status_breakdown || {})
        .filter((status) => (data.status_breakdown || {})[status] > 0)
        .map((status) => ({
          label: status,
          count: data.status_breakdown[status],
          color: STATUS_COLORS[status] || "#2563eb"
        }))
    : [];

  const teamItems = (data?.team_breakdown || [])
    .map((team) => ({
      label: team.team_name,
      count: team.decision_count,
      color: "#2563eb"
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 7);

  const metrics = data?.metrics || [];
  const pendingDecisions = data?.pending_decisions || [];
  const recentDecisions = data?.recent_decisions || [];
  const recentActivity = data?.recent_activity || [];
  const notifications = data?.notifications || [];
  const unread = data?.unread_notifications || 0;

  const quickNavItems = QUICK_NAV.filter(
    (item) => item.key !== "audit-logs" || roleId === 3 || roleId === 4
  );

  return (
    <div className="dash-layout">

      <AppSidebar
        activePage="home"
        navigateTo={navigateTo}
        handleLogout={handleLogout}
      />

      <main className="dash-main home-dash-main db-main">

        <header className="dash-header">
          <div>
            <h2 className="dash-header-title">
              {roleTitle[roleId] || "Dashboard"}
            </h2>
            <p className="dash-header-sub">
              Real-time overview of your decisions, approvals and activity
            </p>
          </div>

          <div className="dash-header-right">
            <NotificationBell navigateTo={navigateTo} />
            <span className="dash-header-date">{dashDate}</span>
            <div className="dash-header-user">
              <div className="dash-avatar">
                {(user?.name || "U").charAt(0).toUpperCase()}
              </div>
              <div className="dash-user-info">
                <div className="dash-user-name">{user?.name}</div>
                <div className="dash-user-role">
                  {getRoleName(user?.role_id)}
                </div>
              </div>
            </div>
          </div>
        </header>

        {toast && <div className="db-toast">{toast}</div>}

        <section className="home-hero">
          <div className="home-hero-content">
            <h3 className="home-greeting">
              {greeting}, {user?.name || "User"}
              <span className="home-wave">&#128075;</span>
            </h3>
            <p className="home-hero-sub">
              {roleFocus[roleId] ||
                "Here is what is happening across your decisions today."}
            </p>
          </div>
          <div className="home-hero-badge">
            <div className="home-hero-badge-icon">
              {pendingDecisions.length > 0 ? "\u23F3" : "\u2705"}
            </div>
            <div>
              <strong>
                {pendingDecisions.length > 0
                  ? `${pendingDecisions.length} item${
                      pendingDecisions.length === 1 ? "" : "s"
                    }`
                  : "All caught up"}
              </strong>
              <span className="home-hero-badge-text">
                {pendingDecisions.length > 0
                  ? "awaiting your review"
                  : "no pending activities"}
              </span>
            </div>
          </div>
        </section>

        {error && <div className="db-error">{error}</div>}

        {loading && !data ? (
          <section className="dash-card db-loading">
            Loading your dashboard...
          </section>
        ) : (
          <>
            <section className="dash-stats home-stats">
              {metrics.map((metric) => {
                const tone = METRIC_TONES[metric.key] || {
                  bg: "#dbeafe",
                  color: "#2563eb"
                };
                return (
                  <button
                    key={metric.key}
                    className="dash-stat-card home-stat-card"
                    onClick={() => navigateTo(metricLink(metric.key))}
                    style={{ cursor: "pointer", width: "100%" }}
                  >
                    <div
                      className="dash-stat-icon"
                      style={{ background: tone.bg, color: tone.color }}
                    >
                      {METRIC_ICONS[metric.key] || "\uD83D\uDCCA"}
                    </div>
                    <div className="dash-stat-body">
                      <span className="dash-stat-value">{metric.value}</span>
                      <span className="dash-stat-label">{metric.label}</span>
                      {metric.hint && (
                        <span className="home-stat-caption">
                          {metric.hint}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </section>

            <section className="db-charts">
              <div className="dash-card db-chart-card">
                <div className="dash-card-header">
                  <h4>Decisions by Status</h4>
                </div>
                <BarList
                  items={statusItems}
                  emptyText="No decisions to summarize yet"
                />
              </div>

              <div className="dash-card db-chart-card">
                <div className="dash-card-header">
                  <h4>Decisions by Team</h4>
                </div>
                <BarList
                  items={teamItems}
                  emptyText="No team decisions to summarize yet"
                />
              </div>

              <div className="dash-card db-chart-card">
                <div className="dash-card-header">
                  <h4>Approval Activity</h4>
                </div>
                <ActivityChart
                  data={data?.approval_activity}
                  color="#2563eb"
                />
              </div>

              <div className="dash-card db-chart-card">
                <div className="dash-card-header">
                  <h4>Recent Decision Activity</h4>
                </div>
                <ActivityChart
                  data={data?.decision_activity}
                  color="#10b981"
                />
              </div>
            </section>

            <section className="dash-content-grid home-content-grid">

              <div className="dash-card home-table-card">
                <div className="dash-card-header">
                  <div className="home-card-title">
                    <div className="home-card-title-icon chip-blue">
                      {"\u23F3"}
                    </div>
                    <div>
                      <h4>Pending Approvals</h4>
                      <span>
                        Items that need review or final approval
                      </span>
                    </div>
                  </div>
                  <button
                    className="dash-link-btn"
                    onClick={() => navigateTo(pendingLink())}
                  >
                    View All
                  </button>
                </div>

                {pendingDecisions.length === 0 ? (
                  <div className="home-empty home-empty-compact">
                    <div className="home-empty-icon">{"\u2705"}</div>
                    <div className="home-empty-title">Nothing pending</div>
                    <div className="home-empty-desc">
                      You have no decisions waiting on action.
                    </div>
                  </div>
                ) : (
                  <div className="home-table-wrap">
                    <table className="home-table">
                      <thead>
                        <tr>
                          <th>Decision</th>
                          <th>Status</th>
                          <th>Owner</th>
                          <th>Updated</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {pendingDecisions.map((decision) => (
                          <tr key={decision.decision_id}>
                            <td>
                              <button
                                className="db-link"
                                onClick={() => openDecision(decision)}
                              >
                                {decision.title}
                              </button>
                            </td>
                            <td>
                              <span className={statusClass(decision.status)}>
                                {decision.status}
                              </span>
                            </td>
                            <td>{decision.expert_name || "—"}</td>
                            <td>{fmt(decision.updated_at)}</td>
                            <td className="db-actions-cell">
                              {canQuickAct(decision) ? (
                                <div className="db-action-group">
                                  <button
                                    className="db-approve-btn"
                                    onClick={() =>
                                      setActionTarget({
                                        decision,
                                        mode: "approve"
                                      })
                                    }
                                  >
                                    Approve
                                  </button>
                                  <button
                                    className="db-reject-btn"
                                    onClick={() =>
                                      setActionTarget({
                                        decision,
                                        mode: "reject"
                                      })
                                    }
                                  >
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <button
                                  className="home-view-btn"
                                  onClick={() => openDecision(decision)}
                                >
                                  Open
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="dash-card home-side-card">
                <div className="dash-card-header">
                  <div className="home-card-title">
                    <div className="home-card-title-icon chip-amber">
                      {"\uD83D\uDD14"}
                    </div>
                    <div>
                      <h4>Notifications</h4>
                      <span>
                        {unread > 0
                          ? `${unread} unread`
                          : "You are all caught up"}
                      </span>
                    </div>
                  </div>
                  <button
                    className="dash-link-btn"
                    onClick={() => navigateTo("notifications")}
                  >
                    View All
                  </button>
                </div>

                {notifications.length === 0 ? (
                  <div className="home-empty home-empty-compact">
                    <div className="home-empty-icon">{"\uD83D\uDD14"}</div>
                    <div className="home-empty-title">No notifications</div>
                    <div className="home-empty-desc">
                      Updates about your decisions will appear here.
                    </div>
                  </div>
                ) : (
                  <div className="db-notif-list">
                    {notifications.map((n) => (
                      <button
                        key={n.notification_id}
                        className={`db-notif-item${
                          n.is_read ? "" : " unread"
                        }`}
                        onClick={() => navigateTo("notifications")}
                      >
                        <div className="db-notif-top">
                          <span className="db-notif-title">{n.title}</span>
                          {!n.is_read && (
                            <span className="db-notif-dot" />
                          )}
                        </div>
                        <div className="db-notif-msg">{n.message}</div>
                        <div className="db-notif-time">
                          {fmt(n.created_at)}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="dash-content-grid home-content-grid">

              <div className="dash-card home-table-card">
                <div className="dash-card-header">
                  <div className="home-card-title">
                    <div className="home-card-title-icon chip-blue">
                      {"\uD83D\uDCCB"}
                    </div>
                    <div>
                      <h4>Recent Decisions</h4>
                      <span>Latest decisions you can access</span>
                    </div>
                  </div>
                  <button
                    className="dash-link-btn"
                    onClick={() => navigateTo("decisions")}
                  >
                    View All
                  </button>
                </div>

                {recentDecisions.length === 0 ? (
                  <div className="home-empty home-empty-compact">
                    <div className="home-empty-icon">{"\uD83D\uDCCB"}</div>
                    <div className="home-empty-title">No decisions yet</div>
                    <div className="home-empty-desc">
                      Decisions will show up here as they are created.
                    </div>
                  </div>
                ) : (
                  <div className="home-table-wrap">
                    <table className="home-table db-decisions">
                      <thead>
                        <tr>
                          <th className="db-col-decision">Decision</th>
                          <th className="db-col-owner">Owner / Team</th>
                          <th className="db-col-center">Status</th>
                          <th className="db-col-center">Priority</th>
                          <th className="db-col-updated">Updated</th>
                          <th className="db-col-action">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentDecisions.map((decision) => (
                          <tr key={decision.decision_id}>
                            <td>
                              <button
                                className="db-link"
                                onClick={() => openDecision(decision)}
                              >
                                {decision.title}
                              </button>
                            </td>
                            <td>
                              <div className="db-sub">
                                {decision.expert_name || "—"}
                              </div>
                              {decision.team_name ? (
                                <div className="db-sub db-sub-muted">
                                  {decision.team_name}
                                </div>
                              ) : null}
                            </td>
                            <td className="db-col-center">
                              <span className={statusClass(decision.status)}>
                                {decision.status}
                              </span>
                            </td>
                            <td className="db-col-center">{decision.priority}</td>
                            <td className="db-col-updated">
                              {fmt(decision.updated_at)}
                            </td>
                            <td className="db-col-action">
                              <button
                                className="home-view-btn"
                                onClick={() => openDecision(decision)}
                              >
                                {"\uD83D\uDD0D"} View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="dash-card home-side-card">
                <div className="dash-card-header">
                  <div className="home-card-title">
                    <div className="home-card-title-icon chip-green">
                      {"\uD83D\uDCC8"}
                    </div>
                    <div>
                      <h4>Recent Activity</h4>
                      <span>What happened most recently</span>
                    </div>
                  </div>
                </div>

                {recentActivity.length === 0 ? (
                  <div className="home-empty home-empty-compact">
                    <div className="home-empty-icon">{"\uD83D\uDCC8"}</div>
                    <div className="home-empty-title">No activity yet</div>
                    <div className="home-empty-desc">
                      Recent actions will be listed here.
                    </div>
                  </div>
                ) : (
                  <div className="db-activity-feed">
                    {recentActivity.map((item, index) => (
                      <div
                        className="db-feed-item"
                        key={`${item.key}-${index}`}
                      >
                        <div className="db-feed-dot" />
                        <div className="db-feed-body">
                          <div className="db-feed-action">{item.action}</div>
                          {item.decision_title && (
                            <button
                              className="db-link db-feed-link"
                              onClick={() =>
                                navigateTo("decision-view", {
                                  decision_id: item.decision_id
                                })
                              }
                            >
                              {item.decision_title}
                            </button>
                          )}
                          {item.description && (
                            <div className="db-feed-desc">
                              {item.description}
                            </div>
                          )}
                          <div className="db-feed-meta">
                            {item.user_name || "System"} ·{" "}
                            {fmt(item.created_at)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="dash-card db-meetings-card">
              <div className="dash-card-header">
                <div className="home-card-title">
                  <div className="home-card-title-icon chip-blue">
                    {"\uD83D\uDCC5"}
                  </div>
                  <div>
                    <h4>Upcoming Team Meetings</h4>
                    <span>Scheduled meetings for your teams</span>
                  </div>
                </div>
                <button
                  className="dash-link-btn"
                  onClick={() => navigateTo("meetings")}
                >
                  View All Meetings
                </button>
              </div>

              {meetings.length === 0 ? (
                <div className="home-empty home-empty-compact">
                  <div className="home-empty-icon">{"\uD83D\uDCC5"}</div>
                  <div className="home-empty-title">
                    No upcoming meetings
                  </div>
                  <div className="home-empty-desc">
                    Scheduled team meetings will appear here.
                  </div>
                </div>
              ) : (
                <div className="db-meetings-list">
                  {meetings.map((meeting) => (
                    <div
                      className="db-meeting-item"
                      key={meeting.meeting_id}
                    >
                      <div className="db-meeting-when">
                        <span className="db-meeting-day">
                          {meeting.scheduled_at
                            ? new Date(
                                meeting.scheduled_at
                              ).toLocaleDateString("en-US", {
                                day: "2-digit"
                              })
                            : "—"}
                        </span>
                        <span className="db-meeting-month">
                          {meeting.scheduled_at
                            ? new Date(
                                meeting.scheduled_at
                              ).toLocaleDateString("en-US", {
                                month: "short"
                              })
                            : ""}
                        </span>
                      </div>

                      <div className="db-meeting-main">
                        <div className="db-meeting-title">
                          {meeting.title}
                        </div>
                        <div className="db-meeting-meta">
                          {meeting.team_name || "No team"}
                          {meeting.organizer_name
                            ? ` · ${meeting.organizer_name}`
                            : ""}
                          {meeting.time ? ` · ${meeting.time}` : ""}
                        </div>
                        {meeting.decision_id && (
                          <button
                            className="db-link db-meeting-decision"
                            onClick={() =>
                              navigateTo("decision-view", {
                                decision_id: meeting.decision_id
                              })
                            }
                          >
                            {meeting.decision_title}
                          </button>
                        )}
                      </div>

                      {meeting.location && (
                        <div className="db-meeting-location">
                          {meeting.location}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="dash-card db-quicknav-card">
              <div className="dash-card-header">
                <div className="home-card-title">
                  <div className="home-card-title-icon chip-blue">
                    {"\u26A1"}
                  </div>
                  <div>
                    <h4>Quick Navigation</h4>
                    <span>Jump straight to the area you need</span>
                  </div>
                </div>
              </div>

              <div className="db-quicknav-grid">
                {quickNavItems.map((item) => (
                  <button
                    key={item.key}
                    className="db-quicknav-item"
                    onClick={() => navigateTo(quickDestination(item.key))}
                  >
                    <span className="db-quicknav-icon">{item.icon}</span>
                    <span className="db-quicknav-label">{item.label}</span>
                    <span className="db-quicknav-arrow">{"\u2192"}</span>
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      {actionTarget && (
        <div className="db-modal-backdrop" onClick={closeAction}>
          <div className="db-modal" onClick={(e) => e.stopPropagation()}>
            <h4 className="db-modal-title">
              {actionTarget.mode === "approve"
                ? "Approve Decision"
                : "Reject Decision"}
            </h4>
            <p className="db-modal-sub">
              {actionTarget.decision.title}
            </p>

            {actionTarget.mode === "reject" && (
              <textarea
                className="db-modal-textarea"
                placeholder="Reason for rejection (required)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            )}

            {actionError && <div className="db-error">{actionError}</div>}

            <div className="db-modal-actions">
              <button
                className="secondary-button"
                onClick={closeAction}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className={
                  actionTarget.mode === "approve"
                    ? "primary-button"
                    : "danger-button"
                }
                onClick={confirmAction}
                disabled={submitting}
              >
                {submitting
                  ? "Working..."
                  : actionTarget.mode === "approve"
                  ? "Approve"
                  : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
