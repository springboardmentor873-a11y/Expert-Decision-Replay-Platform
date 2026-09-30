import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE, getCurrentUser, logout } from "../API";
import { ThemeToggle } from "../theme";
import "./Workspace.css";

export default function AuditLogs() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const currentUserId = user?.id;

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("All Actions");
  const [userFilter, setUserFilter] = useState("All Users");
  const [reloadVersion, setReloadVersion] = useState(0);

  const role = (user?.role || "employee").toLowerCase();
  const isManager =
    role === "manager" || role === "admin" || role === "administrator";

  useEffect(() => {
    if (!user?.id) {
      navigate("/login");
      return;
    }
    const controller = new AbortController();
    const loadLogs = async () => {
      try {
        setLoading(true);
        setError("");
        const params = new URLSearchParams({ user_id: String(currentUserId) });
        if (actionFilter !== "All Actions") params.set("action", actionFilter);
        if (userFilter !== "All Users") params.set("user_filter", userFilter);
        if (search.trim()) params.set("search", search.trim());
        const response = await fetch(`${API_BASE}/audit-logs?${params.toString()}`, { signal: controller.signal });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.detail || "Failed to load audit logs");
        if (!controller.signal.aborted) setLogs(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error(err);
        setError(err.message || "Cannot connect to audit log service");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    const timer = setTimeout(loadLogs, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [currentUserId, user?.id, navigate, actionFilter, userFilter, search, reloadVersion]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const uniqueActions = useMemo(() => {
    const set = new Set(logs.map((l) => l.action).filter(Boolean));
    return ["All Actions", ...Array.from(set)];
  }, [logs]);

  const uniqueUsers = useMemo(() => {
    const set = new Set(logs.map((l) => l.user_name).filter(Boolean));
    return ["All Users", ...Array.from(set)];
  }, [logs]);

  const orderedLogs = useMemo(() => {
    return [...logs].sort((a, b) => {
      const aTime = new Date(a.timestamp || 0).getTime();
      const bTime = new Date(b.timestamp || 0).getTime();
      return bTime - aTime;
    });
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return orderedLogs.filter((log) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        log.description?.toLowerCase().includes(q) ||
        log.action?.toLowerCase().includes(q) ||
        log.user_name?.toLowerCase().includes(q) ||
        String(log.decision_id || "").toLowerCase().includes(q);

      const matchesAction =
        actionFilter === "All Actions" || log.action === actionFilter;

      const matchesUser =
        userFilter === "All Users" || log.user_name === userFilter;

      return matchesSearch && matchesAction && matchesUser;
    });
  }, [orderedLogs, search, actionFilter, userFilter]);

  const getActionBadgeClass = (action) => {
    const a = (action || "").toLowerCase();
    if (a.includes("approved")) return "audit-action-approved";
    if (a.includes("rejected")) return "audit-action-rejected";
    if (a.includes("submit")) return "audit-action-submitted";
    if (a.includes("delete")) return "audit-action-deleted";
    if (a.includes("login")) return "audit-action-login";
    if (a.includes("edit") || a.includes("update")) return "audit-action-updated";
    return "audit-action-default";
  };

  return (
    <div className="workspace dashboard-workspace">
      {/* SIDEBAR */}
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">ED</div>
          <div className="sidebar-brand-text">
            <strong>Expert Decision</strong>
            <span>Replay Platform</span>
          </div>
        </div>

        <div className="sidebar-divider"></div>
        <div className="sidebar-section-title">WORKSPACE</div>

        <nav className="sidebar-nav">
          <Link to="/dashboard" className="sidebar-link">
            <span className="sidebar-icon">◈</span>
            <span>Dashboard</span>
          </Link>

          <Link to="/my-decisions" className="sidebar-link">
            <span className="sidebar-icon">▣</span>
            <span>My Decisions</span>
          </Link>

          {!isManager && (
            <Link to="/decisions/new" className="sidebar-link">
              <span className="sidebar-icon">＋</span>
              <span>New Decision</span>
            </Link>
          )}

          <Link to="/teams" className="sidebar-link">
            <span className="sidebar-icon">♧</span>
            <span>Teams</span>
          </Link>

          <Link to="/discussions" className="sidebar-link">
            <span className="sidebar-icon">◌</span>
            <span>Discussions</span>
          </Link>

          {isManager && (
            <Link to="/approvals" className="sidebar-link">
              <span className="sidebar-icon">✓</span>
              <span>Approvals</span>
            </Link>
          )}
        </nav>

        <div className="sidebar-section-title second-section">KNOWLEDGE</div>

        <nav className="sidebar-nav">
          <Link to="/documents" className="sidebar-link">
            <span className="sidebar-icon">▤</span>
            <span>Documents</span>
          </Link>

          <Link to="/knowledge-graph" className="sidebar-link">
            <span className="sidebar-icon">?</span>
            <span>Knowledge Graph</span>
          </Link>

          <Link to="/analytics" className="sidebar-link">
            <span className="sidebar-icon">◒</span>
            <span>Analytics</span>
          </Link>

          <Link to="/audit-logs" className="sidebar-link active">
            <span className="sidebar-icon">📜</span>
            <span>Audit Logs</span>
          </Link>

          <Link to="/profile" className="sidebar-link">
            <span className="sidebar-icon">◎</span>
            <span>Profile</span>
          </Link>

          <Link to="/settings" className="sidebar-link">
            <span className="sidebar-icon">⚙</span>
            <span>Settings</span>
          </Link>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-role-card">
            <div className="sidebar-role-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div>
              <strong>{user?.name || "User"}</strong>
              <span>{isManager ? "Manager" : "Employee"}</span>
            </div>
          </div>

          <button className="sidebar-logout" onClick={handleLogout}>
            <span>↪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="dashboard-topbar-left">
            <div className="mobile-logo">ED</div>
            <div>
              <strong>Audit Logs</strong>
              <span>Organizational security and compliance activity</span>
            </div>
          </div>

          <div className="dashboard-topbar-right">
            <ThemeToggle />
            <div className="topbar-user">
              <div className="user-avatar">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="user-info">
                <strong>{user?.name || "User"}</strong>
                <span>{isManager ? "Manager" : "Employee"}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="dashboard-content audit-content">
          {/* Header & Access Notice */}
          <div className="audit-header-panel">
            <div>
              <div className={`audit-kicker ${isManager ? "audit-kicker-manager" : "audit-kicker-personal"}`}>
                {isManager ? "🛡 ORGANIZATIONAL AUDIT TRAIL" : "👤 PERSONAL ACTIVITY LOG"}
              </div>
              <h1 className="audit-page-title">
                System Audit Records
              </h1>
              <p className="audit-page-subtitle">
                {isManager
                  ? "Track changes, approvals, uploads, and logins across all team members."
                  : "Review your personal activity history and updates on your decisions."}
              </p>
            </div>

            <button
              className="audit-refresh-button"
              onClick={() => {
                setLoading(true);
                setReloadVersion((version) => version + 1);
              }}
              disabled={loading}
            >
              ↻ Refresh
            </button>
          </div>

          {/* Filters Bar */}
          <div className="audit-filters">
            <div className="audit-search-field">
              <input
                className="audit-search-input"
                type="text"
                placeholder="Search audit descriptions, users, actions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="audit-select-field">
              <select
                className="audit-filter-select"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
              >
                {uniqueActions.map((act) => (
                  <option key={act} value={act}>
                    {act}
                  </option>
                ))}
              </select>
            </div>

            {isManager && (
              <div className="audit-select-field">
                <select
                  className="audit-filter-select"
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                >
                  {uniqueUsers.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Table */}
          {loading ? (
            <div className="audit-loading-state">
              <div className="loading-spinner audit-spinner"></div>
              <p>Loading audit records...</p>
            </div>
          ) : error ? (
            <div className="audit-error-state">
              <strong>Error: </strong> {error}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="audit-empty-state">
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>📋</div>
              <h3 className="audit-empty-title" style={{ margin: "0 0 6px", color: "#0f172a" }}>
                No audit entries found
              </h3>
              <p className="audit-empty-copy" style={{ color: "#64748b", margin: 0, fontSize: "14px" }}>
                {logs.length === 0
                  ? "Audit records will appear as actions occur across the platform."
                  : "No audit logs match your search or filter criteria."}
              </p>
            </div>
          ) : (
            <div
              className="audit-table-card"
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "14px",
                overflow: "hidden",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    textAlign: "left",
                    fontSize: "13px",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: "#f8fafc",
                        borderBottom: "1px solid #e2e8f0",
                        color: "#475569",
                        fontWeight: 700,
                        fontSize: "12px",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      <th style={{ padding: "14px 18px" }}>ID</th>
                      <th style={{ padding: "14px 18px" }}>Action</th>
                      <th style={{ padding: "14px 18px" }}>User</th>
                      <th style={{ padding: "14px 18px" }}>Role</th>
                      <th style={{ padding: "14px 18px" }}>Decision</th>
                      <th style={{ padding: "14px 18px" }}>Description</th>
                      <th style={{ padding: "14px 18px" }}>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                        <td style={{ padding: "14px 18px", color: "#475569", fontWeight: 600 }}>{log.id}</td>
                        <td style={{ padding: "14px 18px" }}>
                          <span className={`audit-action-badge ${getActionBadgeClass(log.action)}`}>
                            {log.action || "Activity"}
                          </span>
                        </td>
                        <td style={{ padding: "14px 18px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                              {(log.user_name || "S").charAt(0).toUpperCase()}
                            </div>
                            <div style={{ color: "#0f172a", fontWeight: 600 }}>{log.user_name || "System"}</div>
                          </div>
                        </td>
                        <td style={{ padding: "14px 18px", color: "#475569" }}>{log.user_role || "System"}</td>
                        <td style={{ padding: "14px 18px" }}>{log.decision_id ? `#${log.decision_id}` : "?"}</td>
                        <td style={{ padding: "14px 18px", color: "#334155", maxWidth: "420px" }}>{log.description || "?"}</td>
                        <td style={{ padding: "14px 18px", whiteSpace: "nowrap", color: "#64748b" }}>{log.timestamp ? new Date(log.timestamp).toLocaleString() : "?"}</td>
                      </tr>
                    ))}                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
