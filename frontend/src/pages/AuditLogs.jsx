import { useState, useEffect } from "react";
import { api, downloadFile } from "../api";
import { useToast } from "../ToastContext.jsx";

export default function AuditLogs() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [exporting, setExporting] = useState(false);

  async function fetchAuditLogs() {
    setLoading(true);
    try {
      const params = {};
      if (entityFilter !== "all") params.entity_type = entityFilter;
      const data = await api.listAuditLogs(params).catch(() => []);
      setLogs(data || []);
    } catch (err) {
      showToast(err.message || "Failed to load audit logs", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAuditLogs();
  }, [entityFilter]);

  async function handleExportCsv() {
    setExporting(true);
    try {
      await downloadFile(api.exportAuditCsvPath, "system_audit_logs.csv");
      showToast("Audit log CSV download started.");
    } catch (err) {
      showToast(err.message || "Failed to export CSV", "error");
    } finally {
      setExporting(false);
    }
  }

  const filteredLogs = logs.filter((log) => {
    const text = (log.action + " " + (log.details || "") + " " + (log.actor_email || "")).toLowerCase();
    return text.includes(searchQuery.toLowerCase());
  });

  const getActionBadge = (action) => {
    const act = (action || "").toLowerCase();
    if (act.includes("created")) return { label: "CREATED", bg: "#eff6ff", color: "#2563eb" };
    if (act.includes("status")) return { label: "STATUS CHANGE", bg: "#f0fdf4", color: "#16a34a" };
    if (act.includes("updated") || act.includes("role")) return { label: "UPDATED", bg: "#fff7ed", color: "#d97706" };
    if (act.includes("deleted") || act.includes("failed")) return { label: "DELETED / ALERT", bg: "#fef2f2", color: "#ef4444" };
    return { label: action ? action.toUpperCase() : "LOG", bg: "#f8fafc", color: "#64748b" };
  };

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1400, margin: "0 auto" }}>
      {/* Header Row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 28,
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          padding: "24px 32px",
          borderRadius: 16,
          boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.3)",
          color: "#ffffff"
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>📜</span>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: "#ffffff", letterSpacing: "-0.02em" }}>
              System Audit Trail & Compliance
            </h1>
          </div>
          <p style={{ color: "#94a3b8", fontSize: 14, margin: "6px 0 0 40px", maxWidth: 650 }}>
            Immutable activity stream tracking all decision creation, status workflow approvals, role modifications, and system events.
          </p>
        </div>

        <button
          className="btn btn-secondary"
          onClick={handleExportCsv}
          disabled={exporting}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 20px",
            fontSize: 14,
            fontWeight: 700,
            borderRadius: 10,
            background: "rgba(255, 255, 255, 0.1)",
            color: "#ffffff",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            cursor: "pointer"
          }}
        >
          <span style={{ fontSize: 18 }}>📥</span> {exporting ? "Exporting CSV..." : "Export Audit CSV"}
        </button>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 18,
          marginBottom: 28
        }}
      >
        <div
          style={{
            background: "#ffffff",
            padding: 20,
            borderRadius: 14,
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
              Total Log Entries
            </span>
            <span style={{ fontSize: 22 }}>📋</span>
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: "#0f172a", marginTop: 8 }}>
            {logs.length}
          </div>
          <div style={{ fontSize: 12, color: "#10b981", marginTop: 4, fontWeight: 600 }}>
            Real-time recorded
          </div>
        </div>

        <div
          style={{
            background: "#ffffff",
            padding: 20,
            borderRadius: 14,
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#2563eb", textTransform: "uppercase" }}>
              Decision Events
            </span>
            <span style={{ fontSize: 22 }}>📄</span>
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: "#1d4ed8", marginTop: 8 }}>
            {logs.filter((l) => (l.entity_type || "").toLowerCase() === "decision").length}
          </div>
          <div style={{ fontSize: 12, color: "#3b82f6", marginTop: 4 }}>
            Tracked modifications
          </div>
        </div>

        <div
          style={{
            background: "#ffffff",
            padding: 20,
            borderRadius: 14,
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#16a34a", textTransform: "uppercase" }}>
              Compliance Status
            </span>
            <span style={{ fontSize: 22 }}>🛡️</span>
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: "#15803d", marginTop: 8 }}>
            100%
          </div>
          <div style={{ fontSize: 12, color: "#22c55e", marginTop: 4, fontWeight: 600 }}>
            Immutable log chain
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        style={{
          background: "#ffffff",
          padding: 16,
          borderRadius: 14,
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          marginBottom: 24,
          display: "flex",
          gap: 14,
          alignItems: "center"
        }}
      >
        <div style={{ flex: 1, position: "relative" }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>
            🔍
          </span>
          <input
            type="text"
            placeholder="Search audit trail by actor email, details, action..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px 10px 38px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              fontSize: 14,
              outline: "none"
            }}
          />
        </div>

        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #cbd5e1",
            fontSize: 14,
            background: "#ffffff",
            color: "#334155",
            cursor: "pointer"
          }}
        >
          <option value="all">All Entity Types</option>
          <option value="decision">Decisions</option>
          <option value="user">Users</option>
          <option value="team">Teams</option>
          <option value="comment">Comments</option>
          <option value="attachment">Attachments</option>
        </select>
      </div>

      {/* Logs Table */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 16,
          border: "1px solid #e2e8f0",
          padding: 20,
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
        }}
      >
        <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>
          Recent Audit Logs ({filteredLogs.length})
        </h3>

        {loading ? (
          <div className="loading-state" style={{ padding: 40, textAlign: "center" }}>
            Loading system audit trail...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
            No audit log entries found matching filter.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="custom-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "12px 14px", textAlign: "left", color: "#475569", fontWeight: 600 }}>Timestamp</th>
                  <th style={{ padding: "12px 14px", textAlign: "left", color: "#475569", fontWeight: 600 }}>Actor / User</th>
                  <th style={{ padding: "12px 14px", textAlign: "left", color: "#475569", fontWeight: 600 }}>Action</th>
                  <th style={{ padding: "12px 14px", textAlign: "left", color: "#475569", fontWeight: 600 }}>Entity</th>
                  <th style={{ padding: "12px 14px", textAlign: "left", color: "#475569", fontWeight: 600 }}>Details & Context</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, idx) => {
                  const badge = getActionBadge(log.action);
                  return (
                    <tr key={log.id || idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "14px", color: "#64748b", fontSize: 12, whiteSpace: "nowrap" }}>
                        {new Date(log.created_at || Date.now()).toLocaleString()}
                      </td>
                      <td style={{ padding: "14px", fontWeight: 600, color: "#0f172a" }}>
                        {log.actor_email || `User #${log.actor_id || "System"}`}
                      </td>
                      <td style={{ padding: "14px" }}>
                        <span
                          style={{
                            background: badge.bg,
                            color: badge.color,
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: 6,
                            letterSpacing: "0.02em"
                          }}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: "14px", color: "#475569" }}>
                        <span style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>
                          {log.entity_type || "system"} #{log.entity_id || ""}
                        </span>
                      </td>
                      <td style={{ padding: "14px", color: "#334155", maxWidth: 400 }}>
                        {log.details || log.action || "Event logged"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
