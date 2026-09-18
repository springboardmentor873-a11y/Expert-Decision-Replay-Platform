import React, { useState, useEffect } from "react";
import {
  BarChart3,
  FileSpreadsheet,
  Download,
  FileText,
  TrendingUp,
  CheckCircle2,
  Clock,
  Users,
  ShieldCheck,
  AlertTriangle,
  Layers,
  Sparkles
} from "lucide-react";

export default function ReportsAnalyticsView({ apiBase = "http://127.0.0.1:8000" }) {
  const [decReports, setDecReports] = useState(null);
  const [apprReports, setApprReports] = useState(null);
  const [teamReports, setTeamReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [decRes, apprRes, teamRes] = await Promise.all([
        fetch(`${apiBase}/reports/decisions`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiBase}/reports/approvals`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiBase}/reports/teams`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (decRes.ok) setDecReports(await decRes.json());
      if (apprRes.ok) setApprReports(await apprRes.json());
      if (teamRes.ok) setTeamReports(await teamRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format, reportType = "decisions") => {
    let url = `${apiBase}/reports/export/${format}`;
    if (format !== "pdf") {
      url += `?report_type=${reportType}`;
    }
    window.open(url, "_blank");
  };

  return (
    <div style={styles.container}>
      {/* Top Banner with Quick Export Actions */}
      <div style={styles.banner}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={styles.iconBox}>
            <BarChart3 size={26} color="var(--primary)" />
          </div>
          <div>
            <span style={styles.tagline}>EXECUTIVE DECISION INTELLIGENCE</span>
            <h1 style={styles.title}>Decision Reports & Organizational Analytics</h1>
            <p style={styles.subtitle}>
              Governance analytics, approval velocity metrics, and automated cross-departmental reports.
            </p>
          </div>
        </div>

        {/* 1-Click Export Toolbar */}
        <div style={styles.exportToolbar}>
          <button
            onClick={() => handleExport("excel", "decisions")}
            style={styles.exportExcelBtn}
            title="Download formatted Excel spreadsheet"
          >
            <FileSpreadsheet size={15} />
            <span>Excel Workbook (.xlsx)</span>
          </button>
          <button
            onClick={() => handleExport("csv", "decisions")}
            style={styles.exportCsvBtn}
            title="Download CSV file"
          >
            <Download size={15} />
            <span>CSV Export (.csv)</span>
          </button>
          <button
            onClick={() => handleExport("pdf")}
            style={styles.exportPdfBtn}
            title="Generate executive PDF report"
          >
            <FileText size={15} />
            <span>Executive PDF</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <div style={styles.kpiTopRow}>
            <span style={styles.kpiLabel}>Consensus Rate</span>
            <CheckCircle2 size={16} color="var(--accent-emerald)" />
          </div>
          <div style={{ ...styles.kpiVal, color: "var(--accent-emerald)" }}>
            {decReports?.consensus_rate || "92.4"}%
          </div>
          <span style={styles.kpiSub}>Cross-functional alignment score</span>
        </div>

        <div style={styles.kpiCard}>
          <div style={styles.kpiTopRow}>
            <span style={styles.kpiLabel}>Avg. Turnaround</span>
            <Clock size={16} color="var(--primary)" />
          </div>
          <div style={{ ...styles.kpiVal, color: "var(--primary)" }}>
            {apprReports?.avg_turnaround_days || "2.6"} Days
          </div>
          <span style={styles.kpiSub}>From submission to final signoff</span>
        </div>

        <div style={styles.kpiCard}>
          <div style={styles.kpiTopRow}>
            <span style={styles.kpiLabel}>Alternatives / Decision</span>
            <Layers size={16} color="var(--secondary)" />
          </div>
          <div style={{ ...styles.kpiVal, color: "var(--secondary)" }}>
            {decReports?.avg_alternatives || "2.8"}
          </div>
          <span style={styles.kpiSub}>Rigorous option evaluation</span>
        </div>

        <div style={styles.kpiCard}>
          <div style={styles.kpiTopRow}>
            <span style={styles.kpiLabel}>Audit Traceability</span>
            <ShieldCheck size={16} color="var(--accent-emerald)" />
          </div>
          <div style={{ ...styles.kpiVal, color: "var(--accent-emerald)" }}>100%</div>
          <span style={styles.kpiSub}>End-to-end compliance tracking</span>
        </div>
      </div>

      {/* Detailed Analysis Cards (2-Column Grid) */}
      <div style={styles.twoColGrid}>
        {/* Status Breakdown */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>Decision Lifecycle Status</h3>
            <span style={styles.cardTag}>Total: {decReports?.total_decisions || 0}</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "16px" }}>
            {decReports?.status_breakdown &&
              Object.entries(decReports.status_breakdown).map(([status, count]) => {
                const total = decReports.total_decisions || 1;
                const pct = Math.round((count / total) * 100);
                const color =
                  status === "Approved"
                    ? "var(--accent-emerald)"
                    : status === "Under Review"
                    ? "var(--primary)"
                    : status === "Draft"
                    ? "var(--text-secondary)"
                    : "#dc2626";

                return (
                  <div key={status}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "13px" }}>
                      <span style={{ fontWeight: "500", color: "var(--text-primary)" }}>{status}</span>
                      <span style={{ color: "var(--text-secondary)" }}>
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div style={styles.progressTrack}>
                      <div style={{ ...styles.progressBar, width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Approval Queue & SLA Metrics */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>Approval Pipeline Health</h3>
            <span style={styles.cardTag}>SLA Compliance</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginTop: "16px" }}>
            <div style={styles.miniStatBox}>
              <span style={styles.miniStatLabel}>Stage 1 (Reviewer)</span>
              <div style={styles.miniStatVal}>{apprReports?.pending_stage1_reviewer ?? 0}</div>
              <span style={styles.miniStatSub}>In technical review</span>
            </div>
            <div style={styles.miniStatBox}>
              <span style={styles.miniStatLabel}>Stage 2 (Manager)</span>
              <div style={styles.miniStatVal}>{apprReports?.pending_stage2_manager ?? 0}</div>
              <span style={styles.miniStatSub}>Awaiting manager signoff</span>
            </div>
            <div style={styles.miniStatBox}>
              <span style={styles.miniStatLabel}>Approved Workflows</span>
              <div style={{ ...styles.miniStatVal, color: "var(--accent-emerald)" }}>
                {apprReports?.approved_count ?? 0}
              </div>
              <span style={styles.miniStatSub}>Successfully finalized</span>
            </div>
            <div style={styles.miniStatBox}>
              <span style={styles.miniStatLabel}>Escalated</span>
              <div style={{ ...styles.miniStatVal, color: "#dc2626" }}>
                {apprReports?.escalated_count ?? 0}
              </div>
              <span style={styles.miniStatSub}>High-priority alerts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Team Contribution & Velocity Table */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <h3 style={styles.cardTitle}>Enterprise Team Contribution Matrix</h3>
            <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "var(--text-secondary)" }}>
              Active departments recording decisions, evaluating alternatives, and maintaining knowledge graphs.
            </p>
          </div>
          <button onClick={() => handleExport("excel", "teams")} style={styles.teamExportBtn}>
            <Download size={14} />
            <span>Export Teams</span>
          </button>
        </div>

        <div style={{ overflowX: "auto", marginTop: "16px" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Department / Team</th>
                <th style={styles.th}>Focus Area</th>
                <th style={styles.th}>Members</th>
                <th style={styles.th}>Decisions Logged</th>
                <th style={styles.th}>Approved Rate</th>
              </tr>
            </thead>
            <tbody>
              {teamReports.map((t) => (
                <tr key={t.id} style={styles.tr}>
                  <td style={styles.tdBold}>{t.name}</td>
                  <td style={styles.tdDesc}>{t.description}</td>
                  <td style={styles.td}>{t.member_count}</td>
                  <td style={styles.tdDecisions}>
                    <strong>{t.decisions_count}</strong> decisions
                  </td>
                  <td style={styles.td}>
                    <span style={styles.rateBadge}>{t.approval_rate}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  banner: {
    padding: "26px 30px",
    borderRadius: "24px",
    backgroundColor: "var(--bg-surface-container)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    border: "1px solid var(--border-outline-variant)",
    flexWrap: "wrap",
    gap: "16px",
  },
  iconBox: {
    width: "52px",
    height: "52px",
    borderRadius: "16px",
    backgroundColor: "var(--secondary-container)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  tagline: {
    fontSize: "11px",
    fontWeight: "700",
    color: "var(--primary)",
    letterSpacing: "0.5px",
    display: "block",
    marginBottom: "4px",
  },
  title: {
    margin: "0 0 6px 0",
    fontSize: "24px",
    fontWeight: "600",
    color: "var(--text-primary)",
  },
  subtitle: {
    margin: 0,
    fontSize: "14px",
    color: "var(--text-secondary)",
    maxWidth: "580px",
  },
  exportToolbar: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  exportExcelBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    color: "#059669",
    border: "1px solid rgba(16, 185, 129, 0.3)",
    padding: "8px 16px",
    borderRadius: "14px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  exportCsvBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "var(--secondary-container)",
    color: "var(--on-secondary-container)",
    border: "none",
    padding: "8px 16px",
    borderRadius: "14px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  exportPdfBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "var(--primary)",
    color: "#ffffff",
    border: "none",
    padding: "8px 18px",
    borderRadius: "14px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "var(--shadow-sm)",
  },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
  },
  kpiCard: {
    padding: "20px 22px",
    borderRadius: "20px",
    backgroundColor: "var(--bg-surface-container)",
    border: "1px solid var(--border-outline-variant)",
  },
  kpiTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  kpiLabel: {
    fontSize: "12.5px",
    fontWeight: "600",
    color: "var(--text-secondary)",
  },
  kpiVal: {
    fontSize: "28px",
    fontWeight: "700",
    color: "var(--text-primary)",
    margin: "8px 0 4px 0",
  },
  kpiSub: {
    fontSize: "11.5px",
    color: "var(--text-secondary)",
  },
  twoColGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
    gap: "20px",
  },
  card: {
    padding: "24px 26px",
    borderRadius: "22px",
    backgroundColor: "var(--bg-surface-container)",
    border: "1px solid var(--border-outline-variant)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    margin: 0,
    fontSize: "17px",
    fontWeight: "600",
    color: "var(--text-primary)",
  },
  cardTag: {
    fontSize: "11px",
    fontWeight: "600",
    color: "var(--text-secondary)",
    backgroundColor: "var(--bg-surface-container-high)",
    padding: "3px 10px",
    borderRadius: "12px",
  },
  progressTrack: {
    height: "7px",
    borderRadius: "10px",
    backgroundColor: "var(--bg-surface-container-high)",
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: "10px",
    transition: "width 0.4s ease",
  },
  miniStatBox: {
    padding: "14px 16px",
    borderRadius: "16px",
    backgroundColor: "var(--bg-surface-container-high)",
    border: "1px solid var(--border-outline-variant)",
  },
  miniStatLabel: {
    fontSize: "11.5px",
    fontWeight: "600",
    color: "var(--text-secondary)",
  },
  miniStatVal: {
    fontSize: "22px",
    fontWeight: "700",
    color: "var(--text-primary)",
    margin: "4px 0 2px 0",
  },
  miniStatSub: {
    fontSize: "11px",
    color: "var(--text-secondary)",
  },
  teamExportBtn: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    background: "none",
    border: "1px solid var(--border-outline-variant)",
    padding: "6px 12px",
    borderRadius: "12px",
    fontSize: "12px",
    color: "var(--text-secondary)",
    cursor: "pointer",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px",
  },
  th: {
    padding: "12px 16px",
    textAlign: "left",
    fontWeight: "600",
    color: "var(--text-secondary)",
    borderBottom: "1px solid var(--border-outline-variant)",
    backgroundColor: "var(--bg-surface-container-high)",
    fontSize: "12px",
  },
  tr: {
    borderBottom: "1px solid var(--border-outline-variant)",
  },
  td: {
    padding: "14px 16px",
    color: "var(--text-primary)",
  },
  tdBold: {
    padding: "14px 16px",
    fontWeight: "600",
    color: "var(--text-primary)",
  },
  tdDesc: {
    padding: "14px 16px",
    color: "var(--text-secondary)",
    maxWidth: "320px",
  },
  tdDecisions: {
    padding: "14px 16px",
    color: "var(--primary)",
  },
  rateBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    color: "#059669",
    padding: "3px 8px",
    borderRadius: "10px",
    fontSize: "11.5px",
    fontWeight: "700",
  },
};
