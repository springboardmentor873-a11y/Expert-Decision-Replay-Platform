import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import StatusBadge from "../../components/StatusBadge/StatusBadge";
import { useAuth } from "../../context/AuthContext";
import { listAuditLogs } from "../../services/audit";
import { listDecisions, listPendingApprovals } from "../../services/decision";
import { getReportSummary } from "../../services/reports";
import "./Dashboard.css";

const ROLE_LABELS = {
  employee: "Employee",
  reviewer: "Reviewer",
  manager: "Manager",
  administrator: "Administrator",
};

const STATUS_ORDER = [
  "draft",
  "under_review",
  "pending_manager_review",
  "approved",
  "rejected",
  "archived",
];

const STATUS_LABELS = {
  draft: "Draft",
  under_review: "Under Review",
  pending_manager_review: "Pending Manager Review",
  approved: "Approved",
  rejected: "Rejected",
  archived: "Archived",
};

const STATUS_COLORS = {
  draft: "#c1893f",
  under_review: "#c1893f",
  pending_manager_review: "#c1893f",
  approved: "#3f6b63",
  rejected: "#b5432f",
  archived: "#6b7280",
};

const ACTION_LABELS = {
  decision_created: "Decision created",
  decision_updated: "Decision updated",
  decision_submitted: "Decision submitted",
  decision_archived: "Decision archived",
  reviewer_approved: "Reviewer approved",
  reviewer_rejected: "Reviewer rejected",
  manager_approved: "Manager approved",
  manager_rejected: "Manager rejected",
};

const RECENT_DECISION_LIMIT = 6;
const RECENT_ACTIVITY_LIMIT = 6;

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Dashboard() {
  const { user, tokens } = useAuth();
  const isPrivileged = user?.role === "manager" || user?.role === "administrator";
  const canReview = user?.role === "reviewer" || isPrivileged;

  const [decisions, setDecisions] = useState([]);
  const [activity, setActivity] = useState([]);
  const [pending, setPending] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (!tokens.access_token) return;
      const [decisionData, activityData, pendingData, summaryData] = await Promise.all([
        listDecisions(tokens.access_token),
        isPrivileged ? listAuditLogs(tokens.access_token, { limit: RECENT_ACTIVITY_LIMIT }) : null,
        canReview ? listPendingApprovals(tokens.access_token) : null,
        isPrivileged ? getReportSummary(tokens.access_token) : null,
      ]);
      setDecisions(decisionData ?? []);
      setActivity(activityData?.logs ?? []);
      setPending(pendingData ?? []);
      setTeams(summaryData?.teams?.by_team ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tokens, isPrivileged, canReview]);

  useEffect(() => {
    load();
  }, [load]);

  const byStatus = (status) => decisions.filter((d) => d.status === status).length;

  const counts = STATUS_ORDER.map((status) => ({ status, count: byStatus(status) }));
  const totalDecisions = decisions.length;

  const recentDecisions = [...decisions]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, RECENT_DECISION_LIMIT);

  const myDecisions = decisions
    .filter((d) => d.created_by === user?.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, RECENT_DECISION_LIMIT);

  // Donut segments from real counts — CSS conic-gradient only, no chart lib.
  const hasDecisions = totalDecisions > 0;
  let gradient = "conic-gradient(var(--paper-dim) 0deg 100%)";
  let donutLabel = "No data";
  if (hasDecisions) {
    let cumulative = 0;
    const segments = [];
    STATUS_ORDER.forEach((status) => {
      const share = (counts.find((c) => c.status === status).count / totalDecisions) * 360;
      if (share > 0) {
        segments.push(`${STATUS_COLORS[status]} ${cumulative}deg ${cumulative + share}deg`);
        cumulative += share;
      }
    });
    gradient = `conic-gradient(${segments.join(", ")})`;
    donutLabel = String(totalDecisions);
  }

  const today = new Date();
  const todayLabel = today.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="page">
      <Navbar />
      <main className="dashboard">
        <header className="dashboard__header">
          <div>
            <p className="dashboard__eyebrow">
              {todayLabel} · <span className="dashboard__role">{ROLE_LABELS[user?.role]}</span>
            </p>
            <h1 className="dashboard__title">Welcome back, {user?.full_name}</h1>
            <p className="dashboard__overview">
              {totalDecisions === 0
                ? "No decisions have been recorded yet. Decisions, approvals, and activity will appear here as the team gets to work."
                : `Here’s what’s happening across the platform right now — ${totalDecisions} decision${
                    totalDecisions === 1 ? "" : "s"
                  } in total.`}
            </p>
          </div>
          <Link to="/decisions" className="dashboard__cta">
            View all decisions →
          </Link>
        </header>

        {error && <div className="dashboard__error">{error}</div>}

        {loading ? (
          <p className="dashboard__loading">Loading…</p>
        ) : (
          <>
            <section className="dashboard__cards">
              <Link to="/decisions" className="dashboard__card">
                <span className="dashboard__card-label">Total decisions</span>
                <span className="dashboard__card-value">{totalDecisions}</span>
              </Link>
              {STATUS_ORDER.map((status) => (
                <Link
                  key={status}
                  to={`/decisions?status=${status}`}
                  className={`dashboard__card dashboard__card--${status}`}
                >
                  <span className="dashboard__card-label">{STATUS_LABELS[status]}</span>
                  <span className="dashboard__card-value">{counts.find((c) => c.status === status).count}</span>
                </Link>
              ))}
            </section>

            <section className="dashboard__grid">
              <div className="dashboard__panel">
                <h2 className="dashboard__panel-title">Decisions by status</h2>
                {hasDecisions ? (
                  <div className="dashboard__breakdown">
                    <div
                      className="dashboard__donut"
                      style={{ background: gradient }}
                      role="img"
                      aria-label={`${donutLabel} decisions by status`}
                    >
                      <span className="dashboard__donut-center">{donutLabel}</span>
                    </div>
                    <ul className="dashboard__legend">
                      {counts.map(({ status, count }) => (
                        <li key={status} className="dashboard__legend-item">
                          <span
                            className="dashboard__legend-swatch"
                            style={{ background: STATUS_COLORS[status] }}
                          />
                          <span className="dashboard__legend-label">{STATUS_LABELS[status]}</span>
                          <span className="dashboard__legend-count">{count}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="dashboard__empty">
                    <p>No decisions yet.</p>
                  </div>
                )}
              </div>

              {canReview && (
                <div className="dashboard__panel">
                  <h2 className="dashboard__panel-title">Awaiting your review</h2>
                  {pending.length === 0 ? (
                    <div className="dashboard__empty">
                      <p>You’re all caught up.</p>
                    </div>
                  ) : (
                    <ul className="dashboard__list">
                      {pending.map((d) => (
                        <li key={d.id} className="dashboard__list-item">
                          <Link to={`/decisions/${d.id}`} className="dashboard__list-main">
                            <span className="dashboard__list-title">{d.title}</span>
                            <StatusBadge status={d.status} />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {!canReview && (
                <div className="dashboard__panel">
                  <h2 className="dashboard__panel-title">Your decisions</h2>
                  {myDecisions.length === 0 ? (
                    <div className="dashboard__empty">
                      <p>You haven’t created any decisions yet.</p>
                      <Link to="/decisions/new" className="dashboard__inline-link">
                        Create your first decision
                      </Link>
                    </div>
                  ) : (
                    <ul className="dashboard__list">
                      {myDecisions.map((d) => (
                        <li key={d.id} className="dashboard__list-item">
                          <Link to={`/decisions/${d.id}`} className="dashboard__list-main">
                            <span className="dashboard__list-title">{d.title}</span>
                            <StatusBadge status={d.status} />
                          </Link>
                          <span className="dashboard__list-meta">{formatDate(d.created_at)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </section>

            <section className="dashboard__panel">
              <div className="dashboard__panel-header">
                <h2 className="dashboard__panel-title">Recent decisions</h2>
                <Link to="/decisions" className="dashboard__panel-link">
                  View all →
                </Link>
              </div>
              {recentDecisions.length === 0 ? (
                <div className="dashboard__empty">
                  <p>No decisions have been created yet.</p>
                </div>
              ) : (
                <ul className="dashboard__decisions">
                  {recentDecisions.map((d) => (
                    <li key={d.id} className="dashboard__decision">
                      <div className="dashboard__decision-main">
                        <Link to={`/decisions/${d.id}`} className="dashboard__decision-title">
                          {d.title}
                        </Link>
                        <span className="dashboard__decision-meta">
                          Created {formatDate(d.created_at)}
                        </span>
                      </div>
                      <div className="dashboard__decision-side">
                        <StatusBadge status={d.status} />
                        <Link to={`/decisions/${d.id}`} className="dashboard__decision-view">
                          View
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="dashboard__grid">
              {isPrivileged && (
                <div className="dashboard__panel">
                  <h2 className="dashboard__panel-title">Recent activity</h2>
                  {activity.length === 0 ? (
                    <div className="dashboard__empty">
                      <p>No activity recorded yet.</p>
                    </div>
                  ) : (
                    <ul className="dashboard__activity">
                      {activity.map((log) => (
                        <li key={log.id} className="dashboard__activity-item">
                          <span className="dashboard__activity-action">
                            {ACTION_LABELS[log.action] || log.action}
                          </span>
                          <span className="dashboard__activity-detail">
                            {log.actor_name || log.actor_id} · {log.decision_title || "—"}
                          </span>
                          <span className="dashboard__activity-time">
                            {formatDateTime(log.created_at)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {isPrivileged && (
                <div className="dashboard__panel">
                  <h2 className="dashboard__panel-title">Teams</h2>
                  {teams.length === 0 ? (
                    <div className="dashboard__empty">
                      <p>No teams have been set up yet.</p>
                    </div>
                  ) : (
                    <ul className="dashboard__team-list">
                      {teams.map((team) => (
                        <li key={team.team_id} className="dashboard__team-item">
                          <span className="dashboard__team-name">{team.team_name}</span>
                          <span className="dashboard__team-meta">
                            {team.users} member{team.users === 1 ? "" : "s"} · {team.decisions} decision
                            {team.decisions === 1 ? "" : "s"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}