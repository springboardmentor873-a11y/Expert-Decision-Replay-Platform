import { useEffect, useState } from "react";
import { AppLayout } from "../components/AppLayout";
import { api, type AnalyticsSummary } from "../lib/api";

const STATUS_COLORS: Record<string, string> = {
  Draft: "#6b7c99",
  "Under Review": "#f59e0b",
  Approved: "#10b981",
  Rejected: "#ef4444",
  Archived: "#9ca3af",
};

function BarChart({ data, max }: { data: [string, number][]; max: number }) {
  return (
    <div className="bar-chart">
      {data.map(([label, value]) => (
        <div className="bar-row" key={label}>
          <div className="bar-label" title={label}>{label}</div>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{ width: max > 0 ? `${(value / max) * 100}%` : "0%" }}
            />
          </div>
          <div className="bar-value">{value}</div>
        </div>
      ))}
      {data.length === 0 && <p className="text-muted text-sm">No data available.</p>}
    </div>
  );
}

export function Analytics() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<AnalyticsSummary>("/analytics/summary")
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const categoryEntries = data
    ? (Object.entries(data.by_category) as [string, number][]).sort((a, b) => b[1] - a[1])
    : [];
  const categoryMax = categoryEntries.reduce((m, [, v]) => Math.max(m, v), 0);

  const statusEntries = data
    ? (Object.entries(data.by_status) as [string, number][]).sort((a, b) => b[1] - a[1])
    : [];
  const statusMax = statusEntries.reduce((m, [, v]) => Math.max(m, v), 0);

  const contributorEntries = data
    ? data.top_contributors.slice(0, 8).map((c) => [c.full_name, c.decisions_created] as [string, number])
    : [];
  const contributorMax = contributorEntries.reduce((m, [, v]) => Math.max(m, v), 0);

  return (
    <AppLayout title="Analytics">
      <div className="page-header">
        <div>
          <h2>Analytics</h2>
          <p>Insights scoped to decisions you have access to.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <div className="loading-row"><div className="spinner" /></div>}

      {data && (
        <>
          {/* Highlight KPI cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
            <div className="stat-highlight">
              <div className="sh-value">{data.total_decisions}</div>
              <div className="sh-label">Total decisions</div>
            </div>
            <div className="card" style={{ marginBottom: 0, display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: "2.2rem", fontWeight: 700, lineHeight: 1 }}>
                {data.avg_days_to_approval !== null ? `${data.avg_days_to_approval}d` : "—"}
              </div>
              <div className="text-sm text-muted">Avg. days to approval</div>
            </div>
            <div className="card" style={{ marginBottom: 0, display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: "2.2rem", fontWeight: 700, lineHeight: 1 }}>
                {data.top_contributors.length}
              </div>
              <div className="text-sm text-muted">Contributors</div>
            </div>
            <div className="card" style={{ marginBottom: 0, display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: "2.2rem", fontWeight: 700, lineHeight: 1 }}>
                {data.approval_rate_by_reviewer.length > 0
                  ? `${Math.round(data.approval_rate_by_reviewer.reduce((s, r) => s + r.approval_rate_pct, 0) / data.approval_rate_by_reviewer.length)}%`
                  : "—"}
              </div>
              <div className="text-sm text-muted">Avg. approval rate</div>
            </div>
          </div>

          <div className="analytics-grid">
            {/* Decisions by Status */}
            <div className="card" style={{ marginBottom: 0 }}>
              <div className="card-title">Decisions by Status</div>
              <div className="bar-chart">
                {statusEntries.map(([label, value]) => (
                  <div className="bar-row" key={label}>
                    <div className="bar-label" title={label}>{label}</div>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{
                          width: statusMax > 0 ? `${(value / statusMax) * 100}%` : "0%",
                          background: STATUS_COLORS[label] ?? "var(--brand)",
                        }}
                      />
                    </div>
                    <div className="bar-value">{value}</div>
                  </div>
                ))}
                {statusEntries.length === 0 && <p className="text-muted text-sm">No data.</p>}
              </div>
            </div>

            {/* Decisions by Category */}
            <div className="card" style={{ marginBottom: 0 }}>
              <div className="card-title">Decisions by Category</div>
              <BarChart data={categoryEntries} max={categoryMax} />
            </div>

            {/* Top Contributors */}
            <div className="card" style={{ marginBottom: 0 }}>
              <div className="card-title">Top Contributors</div>
              <BarChart data={contributorEntries} max={contributorMax} />
            </div>

            {/* Approval Rate by Reviewer */}
            <div className="card" style={{ marginBottom: 0 }}>
              <div className="card-title">Approval Rate by Reviewer</div>
              {data.approval_rate_by_reviewer.length === 0 && (
                <p className="text-muted text-sm">No approval data yet.</p>
              )}
              {data.approval_rate_by_reviewer.slice(0, 8).map((r) => (
                <div key={r.reviewer_id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 130, fontSize: "0.82rem", color: "var(--slate-600)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.reviewer_name}
                  </div>
                  <div style={{ flex: 1, height: 22, background: "var(--parchment)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${r.approval_rate_pct}%`,
                        background: r.approval_rate_pct >= 70 ? "var(--success)" : r.approval_rate_pct >= 40 ? "var(--warning)" : "var(--danger)",
                        borderRadius: "var(--radius-full)",
                        transition: "width 0.6s ease",
                      }}
                    />
                  </div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 600, width: 40, textAlign: "right" }}>
                    {r.approval_rate_pct}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status over time */}
          {data.status_over_time.length > 0 && (
            <div className="card" style={{ marginTop: 20 }}>
              <div className="card-title">Decision Volume — Last 30 Days</div>
              <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 100, overflow: "hidden" }}>
                {data.status_over_time.slice(-30).map(({ date, counts }) => {
                  const total = Object.values(counts).reduce((a, b) => a + b, 0);
                  const maxVal = Math.max(...data.status_over_time.map((s) => Object.values(s.counts).reduce((a, b) => a + b, 0)));
                  return (
                    <div
                      key={date}
                      title={`${date}: ${total} decisions`}
                      style={{
                        flex: 1,
                        height: maxVal > 0 ? `${(total / maxVal) * 90}%` : "4px",
                        background: "var(--brand)",
                        borderRadius: "2px 2px 0 0",
                        minHeight: 4,
                        opacity: 0.8,
                      }}
                    />
                  );
                })}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--slate-500)", marginTop: 4 }}>
                <span>{data.status_over_time[0]?.date ?? ""}</span>
                <span>{data.status_over_time[data.status_over_time.length - 1]?.date ?? ""}</span>
              </div>
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}
