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
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setLoading(true);

    try {
      const [decisionData, teamData] = await Promise.all([api.listDecisions(), api.listTeams()]);
      const normalizedDecisions = Array.isArray(decisionData) ? decisionData : [];
      const normalizedTeams = Array.isArray(teamData) ? teamData : [];

      const sortedDecisions = [...normalizedDecisions].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      const recentDecisionSamples = sortedDecisions.slice(0, 3);
      const discussionResults = await Promise.allSettled(
        recentDecisionSamples.map(async (decision) => {
          const comments = await api.listComments(decision.id);
          return {
            decisionId: decision.id,
            decisionTitle: decision.title,
            comments: Array.isArray(comments) ? comments : [],
          };
        })
      );

      const collectedDiscussions = discussionResults
        .filter((result) => result.status === "fulfilled")
        .flatMap((result) =>
          result.value.comments.map((comment) => ({
            ...comment,
            decisionId: result.value.decisionId,
            decisionTitle: result.value.decisionTitle,
          }))
        )
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 4);

      setDecisions(sortedDecisions);
      setTeams(normalizedTeams);
      setDiscussions(collectedDiscussions);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

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
    ];
  }, [decisions]);

  const recentDecisions = decisions.slice(0, 5);
  const myTeams = teams.filter((team) => team.id === user?.team_id);

  const statusCounts = [
    { label: "Draft", count: summaryCards[1].value, color: STATUS_META.Draft.color },
    { label: "Under Review", count: summaryCards[2].value, color: STATUS_META["Under Review"].color },
    { label: "Approved", count: summaryCards[3].value, color: STATUS_META.Approved.color },
    { label: "Rejected", count: summaryCards[4].value, color: STATUS_META.Rejected.color },
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
          <button type="button" className="dashboard-icon-button" aria-label="Notifications">
            🔔
            <span className="notification-dot" aria-hidden="true" />
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
                      <td className="dashboard-team-cell">—</td>
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

            {discussions.length === 0 ? (
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
            <div className="empty-state slim">
              <h3>No recent activity</h3>
              <p>Team-level activity will appear here when updates are available.</p>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h2>My Teams</h2>
            </div>

            {myTeams.length === 0 ? (
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
                      <span>{team.manager_id ? `Manager ID: ${team.manager_id}` : "No manager assigned"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="panel">
            <div className="panel-header">
              <h2>Decisions by Status</h2>
            </div>
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
          </div>
        </aside>
      </section>
    </div>
  );
}
