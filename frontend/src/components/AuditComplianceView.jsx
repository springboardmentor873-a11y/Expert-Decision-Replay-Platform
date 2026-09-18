import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Search,
  Download,
  Filter,
  Clock,
  User,
  Activity,
  FileSpreadsheet,
  Lock,
  Eye,
  CheckCircle,
  AlertTriangle,
  RotateCcw
} from "lucide-react";

export default function AuditComplianceView({ apiBase = "http://127.0.0.1:8000" }) {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedLog, setSelectedLog] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [category, page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let url = `${apiBase}/audit/logs?page=${page}&page_size=20`;
      if (category !== "All") url += `&category=${category}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setTotal(data.total);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${apiBase}/audit/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleExport = (type) => {
    window.open(`${apiBase}/reports/export/${type}?report_type=audit`, "_blank");
  };

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case "Security":
        return { background: "rgba(220, 38, 38, 0.12)", color: "#dc2626" };
      case "Approval":
        return { background: "rgba(16, 185, 129, 0.12)", color: "#059669" };
      case "Decision":
        return { background: "var(--secondary-container)", color: "var(--on-secondary-container)" };
      case "Access":
        return { background: "rgba(59, 130, 246, 0.12)", color: "#2563eb" };
      case "Export":
        return { background: "rgba(245, 158, 11, 0.12)", color: "#d97706" };
      default:
        return { background: "var(--bg-surface-container-high)", color: "var(--text-secondary)" };
    }
  };

  return (
    <div style={styles.container}>
      {/* Header Banner */}
      <div style={styles.banner}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={styles.iconBox}>
            <ShieldAlert size={26} color="var(--primary)" />
          </div>
          <div>
            <span style={styles.tagline}>IMMUTABLE ENTERPRISE GOVERNANCE</span>
            <h1 style={styles.title}>Audit Trail & Compliance Logs</h1>
            <p style={styles.subtitle}>
              Full cryptographic traceability of user authentication, decision lifecycle transitions, and document access.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button onClick={() => handleExport("excel")} style={styles.exportBtnExcel}>
            <FileSpreadsheet size={15} />
            <span>Export Excel</span>
          </button>
          <button onClick={() => handleExport("csv")} style={styles.exportBtnCsv}>
            <Download size={15} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={styles.kpiGrid}>
          <div style={styles.kpiCard}>
            <span style={styles.kpiLabel}>Total Audit Logs</span>
            <div style={styles.kpiVal}>{stats.total_logs}</div>
            <span style={styles.kpiSub}>100% activity coverage</span>
          </div>
          <div style={styles.kpiCard}>
            <span style={styles.kpiLabel}>Security Events</span>
            <div style={{ ...styles.kpiVal, color: "#dc2626" }}>{stats.security_events_count}</div>
            <span style={styles.kpiSub}>Logins, session & privilege tracking</span>
          </div>
          <div style={styles.kpiCard}>
            <span style={styles.kpiLabel}>Approval Actions</span>
            <div style={{ ...styles.kpiVal, color: "var(--accent-emerald)" }}>{stats.approvals_count}</div>
            <span style={styles.kpiSub}>Stage reviews & escalations</span>
          </div>
          <div style={styles.kpiCard}>
            <span style={styles.kpiLabel}>Access & Exports</span>
            <div style={{ ...styles.kpiVal, color: "var(--primary)" }}>{stats.access_events_count}</div>
            <span style={styles.kpiSub}>Document downloads & reports</span>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div style={styles.filterBar}>
        <div style={styles.categoryPills}>
          {["All", "Security", "Approval", "Decision", "Access", "Export"].map((c) => (
            <button
              key={c}
              onClick={() => {
                setCategory(c);
                setPage(1);
              }}
              style={{
                ...styles.filterPill,
                backgroundColor: category === c ? "var(--primary)" : "var(--bg-surface-container-high)",
                color: category === c ? "#ffffff" : "var(--text-secondary)",
                fontWeight: category === c ? "600" : "500",
              }}
            >
              {c}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} style={styles.searchForm}>
          <Search size={16} color="var(--text-secondary)" />
          <input
            type="text"
            placeholder="Search email, action, details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </form>
      </div>

      {/* Audit Log Table */}
      <div style={styles.tableCard}>
        {loading ? (
          <div style={styles.loadingBox}>
            <div className="spinner" />
            <span>Loading audit logs...</span>
          </div>
        ) : logs.length === 0 ? (
          <div style={styles.empty}>
            <Activity size={36} color="var(--text-secondary)" />
            <div style={{ marginTop: "12px", fontSize: "15px", fontWeight: "600", color: "var(--text-primary)" }}>
              No audit records found
            </div>
            <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
              Try adjusting your category or search query.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Timestamp</th>
                  <th style={styles.th}>Category</th>
                  <th style={styles.th}>Action</th>
                  <th style={styles.th}>User / Actor</th>
                  <th style={styles.th}>Entity</th>
                  <th style={styles.th}>Details</th>
                  <th style={styles.th}>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const badge = getCategoryBadge(log.action_category);
                  return (
                    <tr
                      key={log.id}
                      style={styles.tr}
                      onClick={() => setSelectedLog(log)}
                    >
                      <td style={styles.tdTime}>
                        {new Date(log.created_at).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, ...badge }}>
                          {log.action_category}
                        </span>
                      </td>
                      <td style={styles.tdAction}>
                        <code>{log.action}</code>
                      </td>
                      <td style={styles.tdUser}>
                        <span style={{ fontWeight: "500" }}>{log.user_email}</span>
                      </td>
                      <td style={styles.tdEntity}>
                        {log.entity_type ? `${log.entity_type} ${log.entity_id ? `#${log.entity_id}` : ""}` : "-"}
                      </td>
                      <td style={styles.tdDetails}>{log.details}</td>
                      <td style={styles.tdIp}>{log.ip_address}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div style={styles.paginationRow}>
          <span style={styles.paginationText}>
            Showing {logs.length} of {total} events
          </span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              style={styles.pageBtn}
            >
              Previous
            </button>
            <button
              disabled={page * 20 >= total}
              onClick={() => setPage(page + 1)}
              style={styles.pageBtn}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Log Detail Inspector Modal */}
      {selectedLog && (
        <div style={styles.modalOverlay} onClick={() => setSelectedLog(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <span style={{ ...styles.badge, ...getCategoryBadge(selectedLog.action_category) }}>
                  {selectedLog.action_category}
                </span>
                <h2 style={styles.modalTitle}>{selectedLog.action}</h2>
              </div>
              <button onClick={() => setSelectedLog(null)} style={styles.closeBtn}>
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.detailRow}>
                <span style={styles.detailKey}>Event ID:</span>
                <span style={styles.detailVal}>#{selectedLog.id}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailKey}>User Email:</span>
                <span style={styles.detailVal}>{selectedLog.user_email}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailKey}>IP Address:</span>
                <span style={styles.detailVal}>{selectedLog.ip_address}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailKey}>Timestamp:</span>
                <span style={styles.detailVal}>{selectedLog.created_at}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailKey}>Target Entity:</span>
                <span style={styles.detailVal}>
                  {selectedLog.entity_type} {selectedLog.entity_id ? `(ID: ${selectedLog.entity_id})` : ""}
                </span>
              </div>
              <div style={{ marginTop: "14px" }}>
                <span style={styles.detailKey}>Details / Payload:</span>
                <div style={styles.payloadBox}>{selectedLog.details}</div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "18px" }}>
              <button onClick={() => setSelectedLog(null)} style={styles.closeModalBtn}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
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
  exportBtnExcel: {
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
  exportBtnCsv: {
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
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
  },
  kpiCard: {
    padding: "18px 20px",
    borderRadius: "18px",
    backgroundColor: "var(--bg-surface-container)",
    border: "1px solid var(--border-outline-variant)",
  },
  kpiLabel: {
    fontSize: "12px",
    fontWeight: "600",
    color: "var(--text-secondary)",
  },
  kpiVal: {
    fontSize: "26px",
    fontWeight: "700",
    color: "var(--text-primary)",
    margin: "6px 0 4px 0",
  },
  kpiSub: {
    fontSize: "11px",
    color: "var(--text-secondary)",
  },
  filterBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
  },
  categoryPills: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  filterPill: {
    border: "none",
    padding: "7px 16px",
    borderRadius: "16px",
    fontSize: "12.5px",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  searchForm: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 14px",
    borderRadius: "18px",
    backgroundColor: "var(--bg-surface-container)",
    border: "1px solid var(--border-outline-variant)",
    minWidth: "260px",
  },
  searchInput: {
    border: "none",
    background: "none",
    color: "var(--text-primary)",
    fontSize: "13px",
    outline: "none",
    width: "100%",
  },
  tableCard: {
    borderRadius: "20px",
    backgroundColor: "var(--bg-surface-container)",
    border: "1px solid var(--border-outline-variant)",
    overflow: "hidden",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px",
  },
  th: {
    padding: "14px 18px",
    textAlign: "left",
    fontWeight: "600",
    color: "var(--text-secondary)",
    borderBottom: "1px solid var(--border-outline-variant)",
    backgroundColor: "var(--bg-surface-container-high)",
    fontSize: "12px",
    letterSpacing: "0.4px",
  },
  tr: {
    borderBottom: "1px solid var(--border-outline-variant)",
    cursor: "pointer",
    transition: "background-color 0.12s ease",
  },
  td: {
    padding: "14px 18px",
    color: "var(--text-primary)",
  },
  tdTime: {
    padding: "14px 18px",
    color: "var(--text-secondary)",
    fontSize: "12px",
    whiteSpace: "nowrap",
  },
  tdAction: {
    padding: "14px 18px",
    color: "var(--primary)",
    fontWeight: "600",
  },
  tdUser: {
    padding: "14px 18px",
    color: "var(--text-primary)",
  },
  tdEntity: {
    padding: "14px 18px",
    color: "var(--text-secondary)",
    whiteSpace: "nowrap",
  },
  tdDetails: {
    padding: "14px 18px",
    color: "var(--text-secondary)",
    maxWidth: "280px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  tdIp: {
    padding: "14px 18px",
    color: "var(--text-secondary)",
    fontSize: "12px",
    fontFamily: "monospace",
  },
  badge: {
    display: "inline-block",
    padding: "3px 8px",
    borderRadius: "8px",
    fontSize: "10.5px",
    fontWeight: "700",
    letterSpacing: "0.4px",
  },
  paginationRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 20px",
    borderTop: "1px solid var(--border-outline-variant)",
  },
  paginationText: {
    fontSize: "12.5px",
    color: "var(--text-secondary)",
  },
  pageBtn: {
    border: "1px solid var(--border-outline-variant)",
    backgroundColor: "var(--bg-surface-container-high)",
    color: "var(--text-primary)",
    padding: "5px 12px",
    borderRadius: "10px",
    fontSize: "12px",
    cursor: "pointer",
  },
  loadingBox: {
    padding: "48px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    color: "var(--text-secondary)",
  },
  empty: {
    padding: "48px 24px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000,
    padding: "20px",
  },
  modalContent: {
    width: "550px",
    maxWidth: "100%",
    backgroundColor: "var(--bg-surface-container-high)",
    borderRadius: "24px",
    padding: "26px",
    boxShadow: "var(--shadow-xl)",
    border: "1px solid var(--border-outline-variant)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "16px",
  },
  modalTitle: {
    margin: "6px 0 0 0",
    fontSize: "18px",
    fontWeight: "600",
    color: "var(--text-primary)",
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: "18px",
    color: "var(--text-secondary)",
    cursor: "pointer",
  },
  modalBody: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "6px 0",
    borderBottom: "1px solid var(--border-outline-variant)",
    fontSize: "13px",
  },
  detailKey: {
    fontWeight: "600",
    color: "var(--text-secondary)",
  },
  detailVal: {
    color: "var(--text-primary)",
  },
  payloadBox: {
    padding: "12px",
    borderRadius: "12px",
    backgroundColor: "var(--bg-surface-container)",
    border: "1px solid var(--border-outline-variant)",
    fontSize: "12.5px",
    color: "var(--text-primary)",
    marginTop: "6px",
    lineHeight: "1.45",
  },
  closeModalBtn: {
    border: "none",
    backgroundColor: "var(--primary)",
    color: "#ffffff",
    padding: "8px 20px",
    borderRadius: "14px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
};
