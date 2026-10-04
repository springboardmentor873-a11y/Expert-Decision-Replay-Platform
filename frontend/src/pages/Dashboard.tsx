import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { StatusBadge } from "../components/StatusBadge";
import { DonutChart } from "../components/DonutChart";
import { api, type Decision, type TeamSummary } from "../lib/api";
import { useAuth } from "../lib/auth";
import { avatarColor, formatDateLong, initials, timeAgo } from "../lib/format";

interface DashboardData {
  total_decisions: number;
  draft_decisions: number;
  under_review: number;
  approved_decisions: number;
  rejected_decisions: number;
  archived_decisions: number;
  department?: string;
  total_users?: number;
  pending_reviews?: number;
  pending_approvals?: number;
  recent_activities?: RecentActivity[];
  recent_team_activities?: RecentActivity[];
}

interface RecentActivity {
  id: number;
  user_id?: number;
  action: string;
  description: string;
  created_at: string;
}

const STAT_ICONS: Record<string, { cls: string; icon: JSX.Element }> = {
  total: {
    cls: "stat-icon-blue",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
      </svg>
    ),
  },
  draft: {
    cls: "stat-icon-amber",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
    ),
  },
  review: {
    cls: "stat-icon-blue",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  approved: {
    cls: "stat-icon-green",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    ),
  },
  rejected: {
    cls: "stat-icon-red",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    ),
  },
  users: {
    cls: "stat-icon-slate",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
};

function StatCard({
  icon,
  value,
  label,
  linkTo,
}: {
  icon: keyof typeof STAT_ICONS;
  value: number;
  label: string;
  linkTo: string;
}) {
  const { cls, icon: svg } = STAT_ICONS[icon];
  return (
    <div className="stat-card">
      <div className="stat-card-row">
        <div className={`stat-icon ${cls}`}>{svg}</div>
        <div>
          <div className="stat-value">{value}</div>
          <div className="stat-label">{label}</div>
        </div>
      </div>
      <Link className="stat-link" to={linkTo} style={{ display: "inline-block", marginTop: 10 }}>
        View →
      </Link>
    </div>
  );
}

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const endpoint =
      user.role === "Manager"
        ? "/dashboard/manager"
        : user.role === "Administrator"
        ? "/dashboard/admin"
        : "/dashboard/employee";

    api.get<DashboardData>(endpoint).then(setData).catch((e) => setError(e.message));
    api
      .get<Decision[]>("/decisions")
      .then((all) => setDecisions(all.slice(0, 5)))
      .catch(() => {});
    api
      .get<TeamSummary[]>("/teams")
      .then((all) => setTeams(all.slice(0, 4)))
      .catch(() => {});
  }, [user]);

  const recent = data?.recent_activities || data?.recent_team_activities || [];

  const statusSegments = data
    ? [
        { label: "Draft", value: data.draft_decisions, color: "#c9a34e" },
        { label: "Under Review", value: data.under_review, color: "#3f7d52" },
        { label: "Approved", value: data.approved_decisions, color: "#4c7fae" },
        { label: "Rejected", value: data.rejected_decisions, color: "#a5433a" },
        { label: "Archived", value: data.archived_decisions, color: "#8892a0" },
      ]
    : [];

  const subtitle =
    user?.role === "Manager"
      ? `Here's an overview of ${data?.department || user.department}'s decisions and activity.`
      : user?.role === "Administrator"
      ? "Here's a system-wide overview of decisions and organizational activity."
      : "Here's an overview of your decisions and team activity.";

  return (
    <AppLayout title="Dashboard">
      <div className="page-header">
        <div>
          <h2>Welcome back, {user?.full_name.split(" ")[0]}!</h2>
          <p>{subtitle}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="text-muted" style={{ fontSize: "0.86rem" }}>{formatDateLong()}</div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {data && (
        <div className="grid-cards" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
          <StatCard icon="total" value={data.total_decisions} label="Total Decisions" linkTo="/decisions" />
          <StatCard icon="draft" value={data.draft_decisions} label="Draft" linkTo="/decisions?status=Draft" />
          <StatCard icon="review" value={data.under_review} label="Under Review" linkTo="/decisions?status=Under Review" />
          <StatCard icon="approved" value={data.approved_decisions} label="Approved" linkTo="/decisions?status=Approved" />
          <StatCard icon="rejected" value={data.rejected_decisions} label="Rejected" linkTo="/decisions?status=Rejected" />
          {data.total_users !== undefined && (
            <StatCard icon="users" value={data.total_users} label="Total Users" linkTo="/users" />
          )}
        </div>
      )}

      <div className="dashboard-grid">
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: "18px 20px 0 20px" }}>
            <div className="section-card-header">
              <h3 className="section-title" style={{ margin: 0 }}>Recent Decisions</h3>
              <Link className="btn btn-primary" to="/decisions/new">
                + Create Decision
              </Link>
            </div>
          </div>
          {decisions.length === 0 ? (
            <div className="empty-state">
              <h3>No decisions yet</h3>
              <p>Create your first decision to start building a record.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {decisions.map((d) => (
                  <tr key={d.id} className="row-link" onClick={() => navigate(`/decisions/${d.id}`)}>
                    <td>{d.title}</td>
                    <td>{d.category}</td>
                    <td><StatusBadge status={d.status} /></td>
                    <td>{new Date(d.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div style={{ padding: "12px 20px", textAlign: "center", borderTop: "1px solid var(--slate-100)" }}>
            <Link to="/decisions" style={{ fontSize: "0.86rem", fontWeight: 600 }}>
              View all decisions →
            </Link>
          </div>
        </div>

        <div className="card">
          <h3 className="section-title">Recent Activity</h3>
          {recent.length === 0 ? (
            <p className="text-muted">Nothing has happened yet.</p>
          ) : (
            recent.slice(0, 6).map((a) => (
              <div className="activity-row" key={a.id}>
                <div
                  className="avatar-circle"
                  style={{ background: avatarColor(a.action + a.id) }}
                >
                  {initials(a.action)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="activity-row-title">{a.action}</div>
                  <div className="activity-row-sub">{a.description}</div>
                </div>
                <div className="activity-row-time">{timeAgo(a.created_at)}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="dashboard-grid spacer-top">
        <div className="card">
          <h3 className="section-title">Decisions by Status</h3>
          {data && data.total_decisions > 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 32, flexWrap: "wrap" }}>
              <DonutChart
                segments={statusSegments}
                centerLabel={String(data.total_decisions)}
                centerSubLabel="Total"
              />
              <div style={{ flex: 1, minWidth: 180 }}>
                {statusSegments.map((s) => (
                  <div className="donut-legend-row" key={s.label}>
                    <span className="donut-legend-dot" style={{ background: s.color }} />
                    <span>{s.label}</span>
                    <span className="donut-legend-count">
                      {s.value} ({data.total_decisions ? Math.round((s.value / data.total_decisions) * 100) : 0}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-muted">No decisions yet to summarize.</p>
          )}
        </div>

        <div className="card">
          <div className="section-card-header">
            <h3 className="section-title" style={{ margin: 0 }}>My Teams</h3>
            <Link to="/teams" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
              View all →
            </Link>
          </div>
          {teams.length === 0 ? (
            <p className="text-muted">No teams yet.</p>
          ) : (
            teams.map((t) => (
              <div className="team-card" key={t.id}>
                <div className="avatar-circle" style={{ background: avatarColor(t.name) }}>
                  {initials(t.name)}
                </div>
                <div>
                  <div className="activity-row-title">{t.name}</div>
                  <div className="activity-row-sub">{t.member_count} members</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
