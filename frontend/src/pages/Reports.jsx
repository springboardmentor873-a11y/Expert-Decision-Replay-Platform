import { useEffect, useState } from "react";
import { api, downloadFile } from "../api";
import { useAuth } from "../AuthContext.jsx";
import { useToast } from "../ToastContext.jsx";

export default function Reports() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isAdmin = user?.role === "administrator";

  const [decisionsSummary, setDecisionsSummary] = useState(null);
  const [approvalsSummary, setApprovalsSummary] = useState(null);
  const [teamsSummary, setTeamsSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredSlice, setHoveredSlice] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const [ds, as_, ts] = await Promise.all([
        api.decisionsSummary(),
        api.approvalsSummary(),
        api.teamsSummary(),
      ]);
      setDecisionsSummary(ds);
      setApprovalsSummary(as_);
      setTeamsSummary(ts);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleExport(kind) {
    try {
      if (kind === "decisions_pdf") {
        await downloadFile(api.exportExecutivePdfPath, "executive_decisions_report.pdf");
      } else if (kind === "decisions") {
        await downloadFile(api.exportDecisionsCsvPath, "decisions_report.csv");
      } else {
        await downloadFile(api.exportAuditCsvPath, "audit_log_report.csv");
      }
      showToast("Download started.");
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  if (loading) return <div className="loading-state">Rendering dynamic decision analytics graphs...</div>;

  const statusCounts = decisionsSummary?.by_status || {};
  const categoryCounts = decisionsSummary?.by_category || {};
  const totalDecisions = Object.values(statusCounts).reduce((a, b) => a + b, 0) || 1;
  const maxCategoryCount = Math.max(...Object.values(categoryCounts), 1);

  const statusColors = {
    Draft: "#64748b",
    "Under Review": "#f59e0b",
    Approved: "#10b981",
    Rejected: "#ef4444",
    Archived: "#94a3b8"
  };

  // Compute Donut Chart SVG Slices
  let cumulativeAngle = 0;
  const donutSlices = Object.entries(statusCounts).map(([status, count]) => {
    const percentage = (count / totalDecisions) * 100;
    const angle = (count / totalDecisions) * 360;
    const startAngle = cumulativeAngle;
    cumulativeAngle += angle;

    // SVG arc coordinates
    const r = 70;
    const cx = 100;
    const cy = 100;

    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (startAngle + angle - 90) * (Math.PI / 180);

    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);

    const largeArcFlag = angle > 180 ? 1 : 0;
    const pathData = angle === 360
      ? `M ${cx - r}, ${cy} A ${r},${r} 0 1,0 ${cx + r},${cy} A ${r},${r} 0 1,0 ${cx - r},${cy}`
      : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

    return {
      status,
      count,
      percentage: Math.round(percentage),
      color: statusColors[status] || "#2563eb",
      pathData
    };
  });

  return (
    <div className="teams-page-container">
      {/* Header */}
      <div className="teams-header-row">
        <div className="teams-title-section">
          <h1>Analytics & Graph Visualizer</h1>
          <p className="subtitle">
            Real-time organizational graphs generated dynamically from your database records.
          </p>
        </div>

        <div className="teams-header-right">
          <a
            href="/EDRP_Milestone4_Presentation.pptx"
            download="EDRP_Milestone4_Presentation.pptx"
            className="btn btn-secondary"
            style={{ background: "#8b5cf6", color: "#ffffff", border: "none", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 700 }}
          >
            📊 Download Milestone 4 PPT
          </a>
          <button className="btn btn-secondary" onClick={() => handleExport("decisions_pdf")}>
            📄 Export Executive PDF
          </button>
          <button className="btn btn-primary" onClick={() => handleExport("decisions")}>
            📊 Export Decisions CSV
          </button>
          {isAdmin && (
            <button className="btn btn-secondary" onClick={() => handleExport("audit")}>
              📜 Export Audit CSV
            </button>
          )}
        </div>
      </div>

      {/* Top Visual Graphs Grid */}
      <div className="bottom-widgets-grid" style={{ gridTemplateColumns: "1.2fr 1fr" }}>
        {/* Graph 1: SVG Donut Chart for Status Distribution */}
        <div className="widget-card">
          <div className="widget-header">
            <div>
              <h3>⭕ Decision Status Distribution (Donut Chart)</h3>
              <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Hover over slices to inspect</p>
            </div>
            <span className="status-pill green"><span className="dot"></span> Live Real Data</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 30, flexWrap: "wrap", marginTop: 10 }}>
            {/* SVG Donut Graphic */}
            <div style={{ position: "relative", width: 200, height: 200, flexShrink: 0 }}>
              <svg width="200" height="200" viewBox="0 0 200 200">
                {donutSlices.map((slice, idx) => (
                  <path
                    key={idx}
                    d={slice.pathData}
                    fill={slice.color}
                    opacity={hoveredSlice === null || hoveredSlice === slice.status ? 1 : 0.4}
                    style={{ transition: "all 0.25s ease", cursor: "pointer" }}
                    onMouseEnter={() => setHoveredSlice(slice.status)}
                    onMouseLeave={() => setHoveredSlice(null)}
                  />
                ))}
                {/* Donut Hole */}
                <circle cx="100" cy="100" r="46" fill="#ffffff" />
              </svg>
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  textAlign: "center"
                }}
              >
                <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>{totalDecisions}</div>
                <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>Total</div>
              </div>
            </div>

            {/* Donut Legend */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, minWidth: 200 }}>
              {donutSlices.map((slice, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    borderRadius: 8,
                    background: hoveredSlice === slice.status ? "#f1f5f9" : "transparent",
                    transition: "background 0.2s ease",
                    cursor: "pointer"
                  }}
                  onMouseEnter={() => setHoveredSlice(slice.status)}
                  onMouseLeave={() => setHoveredSlice(null)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: slice.color }}></span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{slice.status}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>
                    {slice.count} ({slice.percentage}%)
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Graph 2: Horizontal Bar Chart for Categories */}
        <div className="widget-card">
          <div className="widget-header">
            <h3>🏷️ Decisions by Category (Bar Graph)</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 6 }}>
            {Object.entries(categoryCounts).length === 0 ? (
              <div style={{ color: "#94a3b8", fontSize: 13 }}>No category records found.</div>
            ) : (
              Object.entries(categoryCounts).map(([cat, count], idx) => {
                const pct = Math.round((count / maxCategoryCount) * 100);
                const barColors = ["#2563eb", "#8b5cf6", "#f59e0b", "#10b981", "#ec4899"];
                const color = barColors[idx % barColors.length];
                return (
                  <div key={cat} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600 }}>
                      <span style={{ color: "#0f172a" }}>{cat}</span>
                      <span style={{ color: color, fontWeight: 700 }}>{count} decisions</span>
                    </div>
                    <div style={{ height: 10, background: "#f1f5f9", borderRadius: 5, overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          backgroundColor: color,
                          borderRadius: 5,
                          transition: "width 0.6s ease"
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Bottom Visual Cards Row */}
      <div className="bottom-widgets-grid">
        {/* Card 1: Approval Workflow Breakdown */}
        <div className="widget-card">
          <div className="widget-header">
            <h3>✅ Approval Workflow Steps</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {approvalsSummary?.by_status && Object.entries(approvalsSummary.by_status).map(([st, count]) => (
              <div
                key={st}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  background: "#f8fafc",
                  borderRadius: 10,
                  border: "1px solid #f1f5f9"
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{st}</span>
                <span className="status-pill green">{count} steps</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Team Decision Activity Matrix */}
        <div className="widget-card" style={{ gridColumn: "span 2" }}>
          <div className="widget-header">
            <h3>👥 Team Activity & Decision Count</h3>
            <span className="members-count">{teamsSummary.length} Active Teams</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
            {teamsSummary.length === 0 ? (
              <div style={{ color: "#94a3b8", fontSize: 13 }}>No team statistics found.</div>
            ) : (
              teamsSummary.map((t) => (
                <div
                  key={t.team_id}
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 12,
                    padding: 16,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8
                  }}
                >
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{t.team_name}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "#64748b" }}>
                    <span>Members: <strong>{t.member_count}</strong></span>
                    <span style={{ color: "#2563eb", fontWeight: 700 }}>
                      {t.decisions_created_by_members} decisions
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
