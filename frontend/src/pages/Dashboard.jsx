import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext.jsx";
import { useToast } from "../ToastContext.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

const STATUS_META = {
  Draft: { color: "#6b7280", bg: "#eef2f7" },
  "Under Review": { color: "#b3730c", bg: "#fef3d2" },
  Approved: { color: "#2b6358", bg: "#e4eeec" },
  Rejected: { color: "#b23a3a", bg: "#f8e9e9" },
  Archived: { color: "#8a8478", bg: "#eeece7" },
};

function formatDate(dateValue) {
  if (!dateValue) return "—";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const INITIALS = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "U";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [decisions, setDecisions] = useState([]);
  const [teams, setTeams] = useState([]);
  const [teamUsers, setTeamUsers] = useState([]);
  const [teamMembersById, setTeamMembersById] = useState({});
  const [profile, setProfile] = useState(user);
  const [discussions, setDiscussions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activity, setActivity] = useState([]);
  const [teamActivity, setTeamActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewAction, setReviewAction] = useState("");
  const [loadErrors, setLoadErrors] = useState({});

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    const errors = {};
    const [decisionResult, teamResult, notificationResult, activityResult, teamActivityResult, usersResult, profileResult] =
      await Promise.allSettled([
        api.listDecisions(),
        api.listTeams(),
        api.listNotifications(),
        api.listRecentActivity(),
        api.listTeamActivity(),
        user?.role === "administrator" ? api.listUsers() : Promise.resolve([]),
        api.getMe(),
      ]);

    const readList = (result, key) => {
      if (result.status === "rejected") {
        errors[key] = result.reason?.message || "Request failed.";
        return [];
      }
      return Array.isArray(result.value) ? result.value : [];
    };

    const normalizedDecisions = readList(decisionResult, "decisions");
    const normalizedTeams = readList(teamResult, "teams");
    const normalizedNotifications = readList(notificationResult, "notifications");
    const normalizedActivity = readList(activityResult, "activity");
    const normalizedTeamActivity = readList(teamActivityResult, "teamActivity");
    const normalizedUsers = readList(usersResult, "teamUsers");
    const freshProfile = profileResult.status === "fulfilled" ? profileResult.value : user;
    if (profileResult.status === "rejected") {
      errors.profile = profileResult.reason?.message || "Profile request failed.";
    }

    const visibleMemberTeams = ["manager", "administrator"].includes(user?.role)
      ? normalizedTeams.filter(
          (team) => team.id === freshProfile?.team_id || team.manager_id === user?.id
        )
      : [];
    const memberResults = await Promise.allSettled(
      visibleMemberTeams.map((team) => api.listTeamMembers(team.id))
    );
    const membersByTeam = {};
    memberResults.forEach((result, index) => {
      if (result.status === "fulfilled" && Array.isArray(result.value)) {
        membersByTeam[visibleMemberTeams[index].id] = result.value;
      }
    });
    if (memberResults.some((result) => result.status === "rejected")) {
      errors.teamMembers = "Some team member details could not be loaded.";
    }

    const sortedDecisions = [...normalizedDecisions].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
    const discussionResults = decisionResult.status === "fulfilled"
      ? await Promise.allSettled(
          sortedDecisions.slice(0, 3).map(async (decision) => ({
            decisionId: decision.id,
            decisionTitle: decision.title,
            comments: await api.listComments(decision.id),
          }))
        )
      : [];
    const collectedDiscussions = discussionResults
      .filter((result) => result.status === "fulfilled")
      .flatMap((result) =>
        (Array.isArray(result.value.comments) ? result.value.comments : []).map((comment) => ({
          ...comment,
          decisionId: result.value.decisionId,
          decisionTitle: result.value.decisionTitle,
        }))
      )
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 4);
    if (discussionResults.some((result) => result.status === "rejected")) {
      errors.discussions = "Some recent decision discussions could not be loaded.";
    }

    setDecisions(sortedDecisions);
    setTeams(normalizedTeams);
    setTeamUsers(normalizedUsers);
    setTeamMembersById(membersByTeam);
    setDiscussions(collectedDiscussions);
    setNotifications(normalizedNotifications);
    setActivity(normalizedActivity);
    setTeamActivity(normalizedTeamActivity);
    if (profileResult.status === "fulfilled") setProfile(profileResult.value);
    setLoadErrors(errors);
    if (errors.decisions) showToast(errors.decisions, "error");
    setLoading(false);
  }, [showToast, user?.id, user?.role]);

  async function handleMarkNotificationRead(notificationId) {
    try {
      const updated = await api.markNotificationRead(notificationId);
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId ? updated : notification
        )
      );
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function handleReviewAction(decisionId, action) {
    setReviewAction(`${action}-${decisionId}`);
    try {
      const actionApi = action === "approve" ? api.approveDecision : api.rejectDecision;
      await actionApi(decisionId);
      showToast(action === "approve" ? "Decision approved." : "Decision rejected.");
      await loadDashboard();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setReviewAction("");
    }
  }

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const summaryCards = useMemo(() => {
    const counts = {
      total: decisions.length,
      draft: decisions.filter((decision) => decision.status === "Draft").length,
      underReview: decisions.filter((decision) => decision.status === "Under Review").length,
      approved: decisions.filter((decision) => decision.status === "Approved").length,
      rejected: decisions.filter((decision) => decision.status === "Rejected").length,
      archived: decisions.filter((decision) => decision.status === "Archived").length,
    };

    return [
      {
        label: "Total Decisions",
        value: counts.total,
        icon: "▣",
        href: "/decisions",
      },
      {
        label: "Draft",
        value: counts.draft,
        icon: "✎",
        href: "/decisions",
      },
      {
        label: "Under Review",
        value: counts.underReview,
        icon: "◔",
        href: "/decisions",
      },
      {
        label: "Approved",
        value: counts.approved,
        icon: "✓",
        href: "/decisions",
      },
      {
        label: "Rejected",
        value: counts.rejected,
        icon: "✕",
        href: "/decisions",
      },
      {
        label: "Archived",
        value: counts.archived,
        icon: "◼",
        href: "/decisions",
      },
    ];
  }, [decisions]);

  const recentDecisions = decisions.slice(0, 5);
  const pendingDecisions = decisions.filter((decision) => decision.status === "Under Review");
  const unreadNotifications = notifications.filter((notification) => !notification.is_read);
  const canReview = ["reviewer", "manager", "administrator"].includes(user?.role);
  const dashboardUser = profile?.id === user?.id ? profile : user;
  const myTeams = teams.filter(
    (team) => team.id === dashboardUser?.team_id || team.manager_id === dashboardUser?.id
  );
  const myTeamIds = new Set(myTeams.map((team) => team.id));
  const myTeamActivity = teamActivity
    .filter((entry) => myTeamIds.has(entry.team_id))
    .slice(0, 6);

  const statusCounts = [
    { label: "Draft", count: summaryCards[1].value, color: STATUS_META.Draft.color },
    { label: "Under Review", count: summaryCards[2].value, color: STATUS_META["Under Review"].color },
    { label: "Approved", count: summaryCards[3].value, color: STATUS_META.Approved.color },
    { label: "Rejected", count: summaryCards[4].value, color: STATUS_META.Rejected.color },
    { label: "Archived", count: summaryCards[5].value, color: STATUS_META.Archived.color },
  ];

  const totalStatusCount = statusCounts.reduce((sum, item) => sum + item.count, 0);

  const donutBackground = useMemo(() => {
    let current = 0;

    const segments = statusCounts
      .map((item) => {
        const start = current;
        const end = current + (totalStatusCount ? (item.count / totalStatusCount) * 100 : 0);
        current = end;
        return `${item.color} ${start}% ${end}%`;
      })
      .join(", ");

    return `conic-gradient(${segments || "#e5e7eb 0 100%"})`;
  }, [statusCounts, totalStatusCount]);

  const initials = INITIALS(user?.full_name);

  return (
    <div className="dashboard-page">
      <header className="dashboard-topbar">
        <div>
          <p className="dashboard-kicker">Overview</p>
          <h1>Welcome back, {user?.full_name || "there"}!</h1>
          <p className="dashboard-subtitle">
            This is an overview of decisions, team activity, and recent discussions across your workspace.
          </p>
        </div>

        <div className="dashboard-topbar-actions">
          <button
            type="button"
            className="dashboard-icon-button"
            aria-label="Refresh dashboard"
            title="Refresh dashboard"
            onClick={loadDashboard}
          >
            ↻
          </button>
          <button
            type="button"
            className="dashboard-icon-button"
            aria-label="View notifications"
            title="View notifications"
            onClick={() => document.getElementById("dashboard-notifications")?.scrollIntoView()}
          >
            🔔
            {unreadNotifications.length > 0 && <span className="notification-dot" aria-hidden="true" />}
          </button>

          <div className="user-profile-pill">
            <div className="user-avatar">{initials}</div>
            <div className="user-profile-copy">
              <span className="user-name">{user?.full_name || "User"}</span>
              <span className="user-role">{user?.role || "employee"}</span>
            </div>
          </div>
        </div>
      </header>

      <section className="summary-grid">
        {summaryCards.map((card) => (
          <div className="summary-card" key={card.label}>
            <div className="summary-card-header">
              <span className="summary-icon">{card.icon}</span>
              <Link to={card.href} className="summary-link">
                View →
              </Link>
            </div>
            <div className="summary-value">{card.value}</div>
            <div className="summary-label">{card.label}</div>
          </div>
        ))}
      </section>

      <section className="dashboard-content-grid">
        <div className="dashboard-main-column">
          <div className="panel" id="dashboard-notifications">
            <div className="panel-header">
              <h2>Notifications <span className="meta">({unreadNotifications.length} unread)</span></h2>
            </div>
            {loadErrors.notifications ? (
              <div className="empty-state slim"><p>Notifications could not be loaded: {loadErrors.notifications}</p></div>
            ) : notifications.length === 0 ? (
              <div className="empty-state slim"><p>No notifications yet.</p></div>
            ) : (
              <div className="discussion-list">
                {notifications.slice(0, 5).map((notification) => (
                  <div
                    className="discussion-item"
                    key={notification.id}
                    style={{ opacity: notification.is_read ? 0.65 : 1 }}
                  >
                    <div className="discussion-meta">
                      <span className="discussion-decision">
                        {notification.is_read ? "Read" : "Unread"}
                      </span>
                      <span className="discussion-time">
                        {formatDate(notification.created_at)}
                      </span>
                    </div>
                    <p>{notification.message}</p>
                    {!notification.is_read && (
                      <button
                        type="button"
                        className="table-action-link"
                        onClick={() => handleMarkNotificationRead(notification.id)}
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {canReview && (
            <div className="panel">
              <div className="panel-header">
                <div>
                  <h2>Pending approvals</h2>
                  <p style={{ margin: "4px 0 0", color: "var(--ink-soft)" }}>
                    {pendingDecisions.length} decision{pendingDecisions.length === 1 ? "" : "s"} awaiting review.
                  </p>
                </div>
              </div>
              {loadErrors.decisions ? (
                <div className="empty-state slim"><p>Pending approvals could not be loaded.</p></div>
              ) : pendingDecisions.length === 0 ? (
                <div className="empty-state slim"><p>No decisions are waiting for review.</p></div>
              ) : (
                <div className="discussion-list">
                  {pendingDecisions.slice(0, 5).map((decision) => (
                    <div className="discussion-item" key={decision.id}>
                      <div className="discussion-meta">
                        <Link to={`/decisions/${decision.id}`} className="discussion-decision">
                          {decision.title}
                        </Link>
                        <span className="discussion-time">{formatDate(decision.created_at)}</span>
                      </div>
                      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={Boolean(reviewAction)}
                          onClick={() => handleReviewAction(decision.id, "approve")}
                        >
                          {reviewAction === `approve-${decision.id}` ? "Approving…" : "Approve"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger"
                          disabled={Boolean(reviewAction)}
                          onClick={() => handleReviewAction(decision.id, "reject")}
                        >
                          {reviewAction === `reject-${decision.id}` ? "Rejecting…" : "Reject"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="dashboard-side-column">
          <div className="panel">
            <div className="panel-header">
              <h2>Recent activity</h2>
            </div>
            {loadErrors.activity ? (
              <div className="empty-state slim"><p>Recent activity could not be loaded: {loadErrors.activity}</p></div>
            ) : activity.length === 0 ? (
              <div className="empty-state slim"><p>No recent activity.</p></div>
            ) : (
              <div className="discussion-list">
                {activity.slice(0, 6).map((entry) => (
                  <div className="discussion-item" key={entry.id}>
                    <div className="discussion-meta">
                      <span className="discussion-decision">{entry.action.replaceAll("_", " ")}</span>
                      <span className="discussion-time">{formatDate(entry.created_at)}</span>
                    </div>
                    <p>{entry.details || "Activity recorded."}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </section>

      <section className="dashboard-content-grid">
        <div className="dashboard-main-column">
          <div className="panel">
            <div className="panel-header">
              <h2>Recent Decisions</h2>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigate("/decisions")}
              >
                Create Decision
              </button>
            </div>

            {loading ? (
              <div className="loading-text">Loading dashboard…</div>
            ) : loadErrors.decisions ? (
              <div className="empty-state slim"><h3>Decisions could not be loaded</h3><p>{loadErrors.decisions}</p></div>
            ) : recentDecisions.length === 0 ? (
              <div className="empty-state slim">
                <h3>No decisions yet</h3>
                <p>Start documenting a decision so the reasoning behind it isn't lost.</p>
              </div>
            ) : (
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Team</th>
                    <th>Status</th>
                    <th>Created On</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDecisions.map((decision) => (
                    <tr key={decision.id}>
                      <td>
                        <div className="dashboard-title-cell">
                          <span className="dashboard-decision-title">{decision.title}</span>
                          <span className="dashboard-decision-subtitle">{decision.category}</span>
                        </div>
                      </td>
                      <td className="dashboard-team-cell">{decision.team_name || "—"}</td>
                      <td>
                        <StatusBadge status={decision.status} />
                      </td>
                      <td>{formatDate(decision.created_at)}</td>
                      <td>
                        <Link to={`/decisions/${decision.id}`} className="table-action-link">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="panel">
            <div className="panel-header">
              <h2>Recent Discussions</h2>
            </div>

            {loadErrors.discussions && discussions.length > 0 && (
              <div className="error-text" role="status">{loadErrors.discussions} Showing available discussions.</div>
            )}
            {loadErrors.decisions || (loadErrors.discussions && discussions.length === 0) ? (
              <div className="empty-state slim"><p>{loadErrors.decisions || loadErrors.discussions}</p></div>
            ) : discussions.length === 0 ? (
              <div className="empty-state slim">
                <h3>No discussions yet</h3>
                <p>Decision comments and replies will appear here once available.</p>
              </div>
            ) : (
              <div className="discussion-list">
                {discussions.map((discussion) => (
                  <div key={`${discussion.decisionId}-${discussion.id}`} className="discussion-item">
                    <div className="discussion-meta">
                      <span className="discussion-decision">{discussion.decisionTitle}</span>
                      <span className="discussion-time">{formatDate(discussion.created_at)}</span>
                    </div>
                    <p>{discussion.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="dashboard-side-column">
          <div className="panel">
            <div className="panel-header">
              <h2>Team Activity</h2>
            </div>
            {loadErrors.teamActivity ? (
              <div className="empty-state slim"><p>Team activity could not be loaded: {loadErrors.teamActivity}</p></div>
            ) : myTeams.length === 0 ? (
              <div className="empty-state slim">
                <p>No team is assigned to or managed by this account.</p>
              </div>
            ) : myTeamActivity.length === 0 ? (
              <div className="empty-state slim"><p>No recent activity for your teams.</p></div>
            ) : (
              <div className="discussion-list">
                {myTeamActivity.map((entry) => (
                  <div className="discussion-item" key={entry.id}>
                    <div className="discussion-meta">
                      <span className="discussion-decision">{entry.action.replaceAll("_", " ")}</span>
                      <span className="discussion-time">{formatDate(entry.created_at)}</span>
                    </div>
                    {entry.team_name && <span className="meta">{entry.team_name}</span>}
                    <p>{entry.details || "Activity recorded."}</p>
                    {entry.decision_id && (
                      <Link to={`/decisions/${entry.decision_id}`} className="table-action-link">
                        View decision
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="panel">
            <div className="panel-header">
              <h2>My Teams</h2>
            </div>

            {loadErrors.teams ? (
              <div className="empty-state slim"><p>Teams could not be loaded: {loadErrors.teams}</p></div>
            ) : myTeams.length === 0 ? (
              <div className="empty-state slim">
                <h3>No teams yet</h3>
                <p>No teams are currently assigned to this user.</p>
              </div>
            ) : (
              <div className="team-list">
                {myTeams.map((team) => (
                  <div className="team-item" key={team.id}>
                    <div className="team-badge">{team.name.slice(0, 2).toUpperCase()}</div>
                    <div>
                      <strong>{team.name}</strong>
                      <span>
                        {team.manager_id
                          ? `Manager: ${teamUsers.find((candidate) => candidate.id === team.manager_id)?.full_name || `User ${team.manager_id}`}`
                          : "No manager assigned"}
                      </span>
                      {Object.prototype.hasOwnProperty.call(teamMembersById, team.id) ? (
                        <div className="team-members">
                          <h3>{teamMembersById[team.id].length} members</h3>
                          {teamMembersById[team.id].length > 0 && (
                            <ul>
                              {teamMembersById[team.id].slice(0, 3).map((member) => (
                                <li key={member.id}>
                                  <span>{member.full_name}</span>
                                  <span className="team-member-meta">{member.role}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ) : user?.role === "manager" || user?.role === "administrator" ? (
                        <span>Member details unavailable</span>
                      ) : (
                        <span>Member details are manager/admin-only</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {loadErrors.profile && (
              <div className="error-text" role="status">Current team membership may be stale: {loadErrors.profile}</div>
            )}
            {loadErrors.teamMembers && (
              <div className="error-text" role="status">{loadErrors.teamMembers}</div>
            )}
          </div>

          <div className="panel">
            <div className="panel-header">
              <h2>Decisions by Status</h2>
            </div>
            {loading ? (
              <div className="loading-text">Loading decision data…</div>
            ) : loadErrors.decisions ? (
              <div className="empty-state slim"><p>Decision status data could not be loaded.</p></div>
            ) : totalStatusCount === 0 ? (
              <div className="empty-state slim"><p>No decisions yet.</p></div>
            ) : (
              <div className="status-visual">
                <div className="donut-chart" style={{ background: donutBackground }}>
                  <div className="donut-center">
                    <span>{totalStatusCount}</span>
                  </div>
                </div>

                <div className="status-breakdown">
                  {statusCounts.map((item) => (
                    <div className="status-breakdown-row" key={item.label}>
                      <div className="status-breakdown-label">
                        <span
                          className="status-breakdown-dot"
                          style={{ background: item.color }}
                          aria-hidden="true"
                        />
                        {item.label}
                      </div>
                      <strong>{item.count}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}
