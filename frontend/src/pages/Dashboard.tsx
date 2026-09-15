import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { AvatarInitials } from "../components/AvatarInitials";
import { CenteredDonut } from "../components/DonutChart";
import { StatusBadge } from "../components/StatusBadge";
import { api, relativeTime, type DashboardData } from "../lib/api";
import { useAuth } from "../lib/auth";

const DONUT_COLORS: Record<string, string> = {
  Draft: "#6b7c99",
  "Under Review": "#f59e0b",
  Approved: "#10b981",
  Rejected: "#ef4444",
  Archived: "#9ca3af",
};

function formatFullDate(d = new Date()): string {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    api
      .get<DashboardData>("/dashboard/me")
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user]);

  const firstName = user?.full_name?.split(" ")[0] ?? "there";

  /* Donut chart slices */
  const donutSlices = data
    ? Object.entries({
        Draft: data.draft_decisions,
        "Under Review": data.under_review,
        Approved: data.approved_decisions,
        Rejected: data.rejected_decisions,
        Archived: data.archived_decisions,
      })
        .filter(([, v]) => v > 0)
        .map(([label, value]) => ({ label, value, color: DONUT_COLORS[label] ?? "#94a3b8" }))
    : [];

  return (
    <AppLayout title="Dashboard" notifCount={data?.unread_count ?? 0}>
      {/* ── WELCOME HEADER ── */}
      <div className="dashboard-welcome">
        <div>
          <h1>Welcome back, {firstName}!</h1>
          <p>Here's an overview of your decisions and team activity.</p>
        </div>
        <div className="dashboard-date">{formatFullDate()}</div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <div className="loading-row"><div className="spinner" /></div>}

      {data && (
        <>
          {/* ── STAT CARDS ── */}
          <div className="grid-cards">
            <div className="stat-card">
              <div className="stat-card-header">
                <div>
                  <div className="stat-value">{data.total_decisions}</div>
                  <div className="stat-label">Total Decisions</div>
                </div>
                <div className="stat-icon-circle stat-icon-blue">📋</div>
              </div>
              <Link className="stat-view-link" to="/decisions">View all →</Link>
            </div>
            <div className="stat-card">
              <div className="stat-card-header">
                <div>
                  <div className="stat-value">{data.draft_decisions}</div>
                  <div className="stat-label">Draft</div>
                </div>
                <div className="stat-icon-circle stat-icon-amber">✏️</div>
              </div>
              <Link className="stat-view-link" to="/decisions?status=Draft">View →</Link>
            </div>
            <div className="stat-card">
              <div className="stat-card-header">
                <div>
                  <div className="stat-value">{data.under_review}</div>
                  <div className="stat-label">Under Review</div>
                </div>
                <div className="stat-icon-circle stat-icon-blue">🕐</div>
              </div>
              <Link className="stat-view-link" to="/decisions?status=Under+Review">View →</Link>
            </div>
            <div className="stat-card">
              <div className="stat-card-header">
                <div>
                  <div className="stat-value">{data.approved_decisions}</div>
                  <div className="stat-label">Approved</div>
                </div>
                <div className="stat-icon-circle stat-icon-green">✅</div>
              </div>
              <Link className="stat-view-link" to="/decisions?status=Approved">View →</Link>
            </div>
            <div className="stat-card">
              <div className="stat-card-header">
                <div>
                  <div className="stat-value">{data.rejected_decisions}</div>
                  <div className="stat-label">Rejected</div>
                </div>
                <div className="stat-icon-circle stat-icon-red">❌</div>
              </div>
              <Link className="stat-view-link" to="/decisions?status=Rejected">View →</Link>
            </div>
          </div>

          {/* ── MAIN GRID ── */}
          <div className="dashboard-grid">
            {/* LEFT COLUMN */}
            <div className="dashboard-main">
              {/* Recent Decisions Table */}
              <div className="card" style={{ marginBottom: 0 }}>
                <div className="card-title">
                  <span>Recent Decisions</span>
                  <Link className="btn btn-primary btn-sm" to="/decisions/new">+ Create Decision</Link>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Created On</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_decisions.length === 0 && (
                      <tr><td colSpan={5} className="empty-state" style={{ textAlign: "center" }}>No decisions yet — create one to get started.</td></tr>
                    )}
                    {data.recent_decisions.map((d) => (
                      <tr key={d.id} className="row-link" onClick={() => navigate(`/decisions/${d.id}`)}>
                        <td style={{ fontWeight: 600, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.title}</td>
                        <td style={{ color: "var(--slate-500)" }}>{d.category}</td>
                        <td><StatusBadge status={d.status} /></td>
                        <td style={{ color: "var(--slate-500)" }}>{new Date(d.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</td>
                        <td style={{ textAlign: "right" }}>
                          <Link
                            className="btn btn-secondary btn-sm"
                            to={`/decisions/${d.id}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop: 14, textAlign: "center" }}>
                  <Link className="link-arrow" to="/decisions">View all decisions →</Link>
                </div>
              </div>

              {/* Bottom row: donut + discussions */}
              <div className="dashboard-bottom">
                {/* Donut Chart */}
                <div className="card" style={{ marginBottom: 0 }}>
                  <div className="card-title">Decisions by Status</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                    <CenteredDonut slices={donutSlices} size={140} thickness={26} />
                    <div className="donut-legend">
                      {donutSlices.map((sl) => (
                        <div className="donut-legend-item" key={sl.label}>
                          <div className="donut-legend-dot" style={{ background: sl.color }} />
                          <span className="donut-legend-label">{sl.label}</span>
                          <span className="donut-legend-count">{sl.value}</span>
                          <span className="donut-legend-pct">
                            ({data.total_decisions > 0 ? Math.round((sl.value / data.total_decisions) * 100) : 0}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recent Discussions */}
                <div className="card" style={{ marginBottom: 0 }}>
                  <div className="card-title">
                    <span>Recent Discussions</span>
                    <Link className="link-arrow" to="/my-discussions">View all →</Link>
                  </div>
                  {data.recent_discussions.length === 0 && (
                    <p className="text-muted text-sm">No discussions yet.</p>
                  )}
                  {data.recent_discussions.map((d) => (
                    <div className="discussion-item" key={d.id}>
                      <div className="discussion-icon">💬</div>
                      <div className="discussion-body">
                        <div className="discussion-title">{d.title}</div>
                        <div className="discussion-sub">
                          <Link to={`/decisions/${d.decision_id}`}>{d.decision_title}</Link>
                        </div>
                      </div>
                      <div className="discussion-time">{relativeTime(d.created_at)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="dashboard-side">
              {/* Team Activity */}
              <div className="card" style={{ marginBottom: 0 }}>
                <div className="card-title">Team Activity</div>
                {data.recent_activities.length === 0 && (
                  <p className="text-muted text-sm">No recent activity.</p>
                )}
                {data.recent_activities.slice(0, 5).map((a) => (
                  <div className="activity-item" key={a.id}>
                    <AvatarInitials name={a.actor_name} size="sm" />
                    <div className="activity-body">
                      <div className="activity-desc">
                        <strong>{a.actor_name}</strong> {a.description.replace(a.actor_name, "").trim()}
                      </div>
                      <div className="activity-meta">{relativeTime(a.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* My Teams */}
              <div className="card" style={{ marginBottom: 0 }}>
                <div className="card-title">
                  <span>My Teams</span>
                  <Link className="link-arrow" to="/teams">View all →</Link>
                </div>
                {data.my_teams.length === 0 && (
                  <p className="text-muted text-sm">You're not in any teams yet.</p>
                )}
                {data.my_teams.map((t) => (
                  <div
                    className="team-item"
                    key={t.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate(`/teams?highlight=${t.id}`)}
                  >
                    <div className="team-icon">👥</div>
                    <div className="team-info">
                      <div className="team-name">{t.name}</div>
                      <div className="team-count">{t.member_count} member{t.member_count !== 1 ? "s" : ""}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}
