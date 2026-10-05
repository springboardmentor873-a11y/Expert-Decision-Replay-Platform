import { useEffect, useState } from "react";
import { api } from "../api";
import { useToast } from "../ToastContext.jsx";

const STATUS_LABELS = ["Draft", "Under Review", "Approved", "Rejected", "Archived"];

function formatDate(dateValue) {
  if (!dateValue) return "—";
  const date = new Date(dateValue);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

export default function Analytics() {
  const { showToast } = useToast();
  const [report, setReport] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [reportData, activityData] = await Promise.all([
          api.getDecisionReport(),
          api.listRecentActivity(),
        ]);
        setReport(reportData);
        setActivity(Array.isArray(activityData) ? activityData : []);
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [showToast]);

  if (loading) return <div className="loading-text">Loading report…</div>;

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1>Analytics</h1>
          <p>Summary metrics for decisions across the organization.</p>
        </div>
      </div>

      {!report ? (
        <div className="empty-state"><h3>No report available</h3></div>
      ) : (
        <>
          <section className="summary-grid">
            <div className="summary-card"><div className="summary-value">{report.total}</div><div className="summary-label">Total Decisions</div></div>
            {STATUS_LABELS.map((status) => (
              <div className="summary-card" key={status}>
                <div className="summary-value">{report.by_status?.[status] || 0}</div>
                <div className="summary-label">{status}</div>
              </div>
            ))}
            <div className="summary-card"><div className="summary-value">{report.pending_approvals}</div><div className="summary-label">Pending Approvals</div></div>
          </section>

          <section className="dashboard-content-grid" style={{ marginTop: 22 }}>
            <div className="panel">
              <div className="panel-header"><h2>Decisions by category</h2></div>
              {Object.entries(report.by_category || {}).length === 0 ? (
                <div className="empty-state slim"><p>No category data yet.</p></div>
              ) : (
                <table className="decisions-table">
                  <thead><tr><th>Category</th><th>Decisions</th></tr></thead>
                  <tbody>
                    {Object.entries(report.by_category).map(([category, count]) => (
                      <tr key={category}><td>{category}</td><td>{count}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="panel">
              <div className="panel-header"><h2>Decisions by team</h2></div>
              {!report.by_team?.length ? (
                <div className="empty-state slim"><p>No team decision data yet.</p></div>
              ) : (
                <table className="decisions-table">
                  <thead><tr><th>Team</th><th>Decisions</th></tr></thead>
                  <tbody>
                    {report.by_team.map((team) => (
                      <tr key={team.team_id}><td>{team.name}</td><td>{team.count}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          <section className="dashboard-content-grid">
            <div className="panel">
              <div className="panel-header"><h2>Decisions by contributor</h2></div>
              {!report.by_user?.length ? (
                <div className="empty-state slim"><p>No contributor data yet.</p></div>
              ) : (
                <table className="decisions-table">
                  <thead><tr><th>Contributor</th><th>Decisions</th></tr></thead>
                  <tbody>
                    {report.by_user.map((contributor) => (
                      <tr key={contributor.user_id}>
                        <td>{contributor.name}</td>
                        <td>{contributor.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <aside className="panel">
              <div className="panel-header"><h2>Recent activity</h2></div>
              {activity.length === 0 ? (
                <div className="empty-state slim"><p>No recent activity.</p></div>
              ) : (
                <div className="discussion-list">
                  {activity.map((entry) => (
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
            </aside>
          </section>
        </>
      )}
    </div>
  );
}
