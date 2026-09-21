import { useEffect, useState, useCallback } from "react";

import { API_BASE_URL, AppSidebar, NotificationBell } from "./shared";

import {
  exportReportPdf,
  exportReportExcel
} from "./reportExport";


// ==========================================
// REPORT DEFINITIONS
// ==========================================

const STATUS_OPTIONS = [
  "Draft",
  "Under Review",
  "Reviewer Approved",
  "Approved",
  "Rejected",
  "Archived"
];

const PRIORITY_OPTIONS = ["Low", "Medium", "High"];

const ACTIVITY_TYPES = [
  "Decision",
  "Approval",
  "Document",
  "Discussion",
  "Authentication",
  "Other"
];

const REPORT_TYPES = [
  { key: "decisions", label: "Decision Report", icon: "\uD83D\uDCCB" },
  { key: "approvals", label: "Approval Report", icon: "\u2705" },
  { key: "teams", label: "Team Report", icon: "\uD83D\uDC65" },
  { key: "audit", label: "Audit Report", icon: "\uD83D\uDD0D" }
];

const DECISION_COLS = [
  { key: "decision_id", label: "ID", weight: 1 },
  { key: "title", label: "Title", weight: 4 },
  { key: "expert_name", label: "Expert", weight: 2.2 },
  { key: "team_name", label: "Team", weight: 2.2 },
  { key: "category_name", label: "Category", weight: 2 },
  { key: "status", label: "Status", weight: 2.1 },
  { key: "priority", label: "Priority", weight: 1.4 },
  {
    key: "decision_date",
    label: "Decision Date",
    weight: 1.9,
    render: (row, formatDate) => formatDate(row.decision_date)
  },
  {
    key: "updated_at",
    label: "Updated",
    weight: 1.9,
    render: (row, formatDate) => formatDate(row.updated_at)
  }
];

const APPROVAL_COLS = [
  { key: "approval_id", label: "ID", weight: 1 },
  {
    key: "decision_id",
    label: "Decision",
    weight: 3.4,
    render: (row) =>
      row.decision_title
        ? `${row.decision_title} (#${row.decision_id})`
        : `#${row.decision_id}`
  },
  { key: "action", label: "Action", weight: 3 },
  { key: "role_name", label: "Role", weight: 1.8 },
  { key: "user_name", label: "User", weight: 1.8 },
  { key: "reason", label: "Reason", weight: 4 },
  {
    key: "created_at",
    label: "Created",
    weight: 1.9,
    render: (row, formatDate) => formatDate(row.created_at)
  }
];

const TEAM_COLS = [
  { key: "team_name", label: "Team", weight: 2.6 },
  { key: "manager_name", label: "Manager", weight: 2 },
  { key: "member_count", label: "Members", weight: 1.2 },
  { key: "decision_count", label: "Decisions", weight: 1.3 },
  {
    key: "draft",
    label: "Draft",
    weight: 1,
    render: (row) => (row.status_breakdown || {}).Draft || 0
  },
  {
    key: "under_review",
    label: "Under Review",
    weight: 1.4,
    render: (row) => (row.status_breakdown || {})["Under Review"] || 0
  },
  {
    key: "reviewer_approved",
    label: "Reviewer Approved",
    weight: 1.7,
    render: (row) => (row.status_breakdown || {})["Reviewer Approved"] || 0
  },
  {
    key: "approved",
    label: "Approved",
    weight: 1.3,
    render: (row) => (row.status_breakdown || {}).Approved || 0
  },
  {
    key: "rejected",
    label: "Rejected",
    weight: 1.2,
    render: (row) => (row.status_breakdown || {}).Rejected || 0
  },
  {
    key: "archived",
    label: "Archived",
    weight: 1.2,
    render: (row) => (row.status_breakdown || {}).Archived || 0
  },
  { key: "approval_count", label: "Approvals", weight: 1.3 }
];

const AUDIT_COLS = [
  {
    key: "created_at",
    label: "Date/Time",
    weight: 2,
    render: (row, formatDate) => formatDate(row.created_at)
  },
  {
    key: "user_name",
    label: "User",
    weight: 2,
    render: (row) =>
      row.user_name ||
      row.user_email ||
      `User #${row.user_id}`
  },
  { key: "action", label: "Action", weight: 3 },
  {
    key: "decision_title",
    label: "Decision",
    weight: 2.5,
    render: (row) =>
      row.decision_title ||
      (row.decision_id ? `#${row.decision_id}` : "\u2014")
  },
  { key: "activity_type", label: "Activity Type", weight: 1.8 },
  { key: "description", label: "Details", weight: 4 }
];

const dateStr = () => new Date().toISOString().slice(0, 10);

const toExportRow = (cols, row, formatDate) =>
  cols.map((column) => {
    if (column.render) {
      const rendered = column.render(row, formatDate);

      return rendered === null || rendered === undefined
        ? ""
        : String(rendered);
    }

    const value = row[column.key];

    return value === null || value === undefined ? "" : String(value);
  });


// ==========================================
// REPORTS PAGE
// ==========================================

export const ReportsPage = ({
  user,
  getRoleName,
  navigateTo,
  formatDate,
  handleLogout
}) => {
  const roleId = Number(user?.role_id);

  const canViewAudit = roleId === 3 || roleId === 4;

  const isOrgWide = canViewAudit;

  const [reportType, setReportType] = useState("decisions");

  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [team, setTeam] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [action, setAction] = useState("");
  const [activityType, setActivityType] = useState("");
  const [decisionId, setDecisionId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [auditMeta, setAuditMeta] = useState({
    actions: [],
    entity_types: [],
    users: []
  });

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) return;

    Promise.all([
      fetch(`${API_BASE_URL}/teams/?include_archived=true`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then((r) => (r.ok ? r.json() : [])),
      fetch(`${API_BASE_URL}/users/`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then((r) => (r.ok ? r.json() : [])),
      canViewAudit
        ? fetch(`${API_BASE_URL}/audit-logs/meta`, {
            headers: { Authorization: `Bearer ${token}` }
          }).then((r) =>
            r.ok
              ? r.json()
              : { actions: [], entity_types: [], users: [] }
          )
        : Promise.resolve({
            actions: [],
            entity_types: [],
            users: []
          })
    ])
      .then(([teamData, userData, auditMetaData]) => {
        setTeams(Array.isArray(teamData) ? teamData : []);
        setUsers(Array.isArray(userData) ? userData : []);
        setAuditMeta(
          auditMetaData || {
            actions: [],
            entity_types: [],
            users: []
          }
        );
      })
      .catch(() => {
        // meta lists are optional; the report still loads
      });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canViewAudit]);

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();

    if (reportType === "decisions" || reportType === "approvals") {
      if (status) params.set("status", status);
      if (priority && reportType === "decisions") {
        params.set("priority", priority);
      }
      if (isOrgWide && team) params.set("team_id", team);
      if (isOrgWide && userFilter) params.set("user_id", userFilter);
      if (reportType === "approvals" && decisionId) {
        params.set("decision_id", decisionId);
      }
      if (dateFrom) params.set("date_from", `${dateFrom}T00:00:00`);
      if (dateTo) params.set("date_to", `${dateTo}T23:59:59`);
      if (search.trim()) params.set("search", search.trim());
    } else if (reportType === "teams") {
      if (isOrgWide && team) params.set("team_id", team);
      if (dateFrom) params.set("date_from", `${dateFrom}T00:00:00`);
      if (dateTo) params.set("date_to", `${dateTo}T23:59:59`);
    } else if (reportType === "audit" && canViewAudit) {
      if (userFilter) params.set("user_id", userFilter);
      if (action) params.set("action", action);
      if (activityType) params.set("activity_type", activityType);
      if (decisionId) params.set("decision_id", decisionId);
      if (dateFrom) params.set("date_from", `${dateFrom}T00:00:00`);
      if (dateTo) params.set("date_to", `${dateTo}T23:59:59`);
      if (search.trim()) params.set("search", search.trim());
    }

    return params.toString();
  }, [
    reportType,
    status,
    priority,
    team,
    userFilter,
    action,
    activityType,
    decisionId,
    dateFrom,
    dateTo,
    search,
    isOrgWide,
    canViewAudit
  ]);

  const loadReport = useCallback(async () => {
    const token = localStorage.getItem("access_token");

    if (!token) return;

    setLoading(true);
    setError("");

    try {
      const qs = buildQuery();

      const res = await fetch(
        `${API_BASE_URL}/reports/${reportType}?${qs}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));

        throw new Error(data.detail || "Failed to load report.");
      }

      const data = await res.json();

      setRows(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setError(
        loadError.message || "Failed to load report."
      );
    } finally {
      setLoading(false);
    }
  }, [reportType, buildQuery]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const switchType = (type) => {
    if (type === "audit" && !canViewAudit) return;

    setReportType(type);
    setStatus("");
    setPriority("");
    setTeam("");
    setUserFilter("");
    setAction("");
    setActivityType("");
    setDecisionId("");
    setDateFrom("");
    setDateTo("");
    setSearch("");
  };

  const resetFilters = () => {
    setStatus("");
    setPriority("");
    setTeam("");
    setUserFilter("");
    setAction("");
    setActivityType("");
    setDecisionId("");
    setDateFrom("");
    setDateTo("");
    setSearch("");
    setTimeout(loadReport, 0);
  };

  const cols = (() => {
    if (reportType === "decisions") return DECISION_COLS;
    if (reportType === "approvals") return APPROVAL_COLS;
    if (reportType === "teams") return TEAM_COLS;
    return AUDIT_COLS;
  })();

  const applyFilters = () => loadReport();

  const exportCurrent = (format) => {
    const title =
      reportType.charAt(0).toUpperCase() + reportType.slice(1) + " Report";

    const fileName =
      `report-${reportType}-${dateStr()}.` +
      (format === "pdf" ? "pdf" : "xls");

    const userLabel = userFilter
      ? (users.find(
          (item) => Number(item.user_id) === Number(userFilter)
        )?.name || `User #${userFilter}`)
      : null;

    const teamLabel = team
      ? (teams.find(
          (item) => Number(item.team_id) === Number(team)
        )?.team_name || `Team #${team}`)
      : null;

    const decisionLabel = decisionId
      ? (rows.find(
          (row) => Number(row.decision_id) === Number(decisionId)
        )?.decision_title || `Decision #${decisionId}`)
      : null;

    const filterParts = [
      dateFrom ? `From ${dateFrom}` : null,
      dateTo ? `To ${dateTo}` : null,
      status ? `Status: ${status}` : null,
      priority ? `Priority: ${priority}` : null,
      activityType ? `Activity Type: ${activityType}` : null,
      action ? `Action: ${action}` : null,
      userLabel ? `User: ${userLabel}` : null,
      teamLabel ? `Team: ${teamLabel}` : null,
      decisionLabel ? `Decision: ${decisionLabel}` : null,
      search.trim() ? `Search: "${search.trim()}"` : null
    ].filter(Boolean);

    const payload = {
      title,
      subtitle:
        (filterParts.length
          ? filterParts.join(" | ")
          : "All records") +
        ` | Rows: ${rows.length}`,
      columns: cols.map((column) => ({
        label: column.label,
        width: column.weight
      })),
      rows: rows.map((row) => toExportRow(cols, row, formatDate)),
      fileName,
      generatedBy: user?.name || "Unknown user"
    };

    if (reportType === "audit") {
      const counts = {};

      ACTIVITY_TYPES.forEach((type) => {
        counts[type] = 0;
      });

      rows.forEach((row) => {
        const type = row.activity_type || "Other";

        if (counts[type] === undefined) counts[type] = 0;

        counts[type] += 1;
      });

      payload.summary = [
        { label: "Total Activities", value: rows.length },
        ...ACTIVITY_TYPES.map((type) => ({
          label: `${type} Activities`,
          value: counts[type] || 0
        }))
      ];
    }

    if (format === "pdf") {
      exportReportPdf(payload);
    } else {
      exportReportExcel(payload);
    }
  };

  const openViewDecision = (decisionId) => {
    navigateTo("decision-view", decisionId);
  };

  const approvalActions = Array.from(
    new Set(rows.map((row) => row.action).filter(Boolean))
  );

  const decisionOptions = Array.from(
    new Map(
      rows
        .filter((row) => row.decision_id)
        .map((row) => [row.decision_id, row])
    ).values()
  );

  const auditSummary = (() => {
    const counts = {
      Decision: 0,
      Approval: 0,
      Document: 0,
      Discussion: 0,
      Authentication: 0,
      Other: 0
    };

    rows.forEach((row) => {
      const type = row.activity_type || "Other";

      if (counts[type] === undefined) counts[type] = 0;

      counts[type] += 1;
    });

    return counts;
  })();

  const summaryItems = [
    { label: "Total Activities", value: rows.length },
    { label: "Decision Activities", value: auditSummary.Decision },
    { label: "Approval Activities", value: auditSummary.Approval },
    { label: "Document Activities", value: auditSummary.Document },
    { label: "Discussion Activities", value: auditSummary.Discussion },
    { label: "Authentication Activities", value: auditSummary.Authentication }
  ];

  const renderDecisionTable = () => (
    <div className="table-wrap">
      <table className="decisions-table">
        <thead>
          <tr>
            {DECISION_COLS.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.decision_id}>
              <td>{row.decision_id}</td>
              <td
                className="reports-link"
                onClick={() => openViewDecision(row.decision_id)}
              >
                {row.title}
              </td>
              <td>{row.expert_name || "\u2014"}</td>
              <td>{row.team_name || "\u2014"}</td>
              <td>{row.category_name || "\u2014"}</td>
              <td>{row.status}</td>
              <td>{row.priority}</td>
              <td style={{ whiteSpace: "nowrap" }}>
                {formatDate(row.decision_date)}
              </td>
              <td style={{ whiteSpace: "nowrap" }}>
                {formatDate(row.updated_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderApprovalTable = () => (
    <div className="table-wrap">
      <table className="decisions-table">
        <thead>
          <tr>
            {APPROVAL_COLS.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.approval_id}>
              <td>{row.approval_id}</td>
              <td
                className="reports-link"
                onClick={() => openViewDecision(row.decision_id)}
              >
                {row.decision_title || `#${row.decision_id}`}
              </td>
              <td>{row.action}</td>
              <td>{row.role_name || "\u2014"}</td>
              <td>{row.user_name || "\u2014"}</td>
              <td className="reports-cell-wrap">
                {row.reason || "\u2014"}
              </td>
              <td style={{ whiteSpace: "nowrap" }}>
                {formatDate(row.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderTeamTable = () => (
    <div className="table-wrap">
      <table className="decisions-table">
        <thead>
          <tr>
            {TEAM_COLS.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const breakdown = row.status_breakdown || {};

            return (
              <tr key={row.team_id}>
                <td>{row.team_name}</td>
                <td>{row.manager_name || "\u2014"}</td>
                <td>{row.member_count}</td>
                <td>{row.decision_count}</td>
                <td>{breakdown.Draft || 0}</td>
                <td>{breakdown["Under Review"] || 0}</td>
                <td>{breakdown["Reviewer Approved"] || 0}</td>
                <td>{breakdown.Approved || 0}</td>
                <td>{breakdown.Rejected || 0}</td>
                <td>{breakdown.Archived || 0}</td>
                <td>{row.approval_count}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderAuditTable = () => (
    <div className="table-wrap">
      <table className="decisions-table">
        <thead>
          <tr>
            {AUDIT_COLS.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            let badgeClass = "audit-badge-info";

            if (row.action && row.action.includes("REJECTED")) {
              badgeClass = "audit-badge-danger";
            } else if (
              row.action &&
              (row.action.includes("APPROVED") ||
                row.action.includes("CREATED"))
            ) {
              badgeClass = "audit-badge-success";
            }

            return (
              <tr key={row.log_id}>
                <td style={{ whiteSpace: "nowrap" }}>
                  {formatDate(row.created_at)}
                </td>
                <td>
                  {row.user_name ||
                    row.user_email ||
                    `User #${row.user_id}`}
                </td>
                <td>
                  <span
                    className={`audit-action-badge ${badgeClass}`}
                  >
                    {row.action}
                  </span>
                </td>
                <td
                  className={
                    row.decision_title ? "reports-link" : ""
                  }
                  onClick={
                    row.decision_title
                      ? () => openViewDecision(row.decision_id)
                      : undefined
                  }
                >
                  {row.decision_title ||
                    (row.decision_id
                      ? `#${row.decision_id}`
                      : "\u2014")}
                </td>
                <td>
                  <span className="audit-type-badge">
                    {row.activity_type || "Other"}
                  </span>
                </td>
                <td className="reports-cell-wrap">
                  {row.description || "\u2014"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderTable = () => {
    if (reportType === "decisions") return renderDecisionTable();
    if (reportType === "approvals") return renderApprovalTable();
    if (reportType === "teams") return renderTeamTable();
    return renderAuditTable();
  };

  return (
    <div className="dash-layout">

      <AppSidebar
        activePage="reports"
        navigateTo={navigateTo}
        handleLogout={handleLogout}
      />

      <main className="dash-main">

        <header className="dash-header">

          <div>
            <h2 className="dash-header-title">
              {"\uD83D\uDCCA"} Reports
            </h2>
            <p className="dash-header-sub">
              Export decision, approval, team and audit reports
            </p>
          </div>

          <div className="dash-header-right">
            <NotificationBell navigateTo={navigateTo} />
            <button
              className="primary-button"
              disabled={!rows.length || loading}
              onClick={() => exportCurrent("excel")}
            >
              {"\u2913"} Export Excel
            </button>
            <button
              className="secondary-button"
              disabled={!rows.length || loading}
              onClick={() => exportCurrent("pdf")}
            >
              {"\u2913"} Export PDF
            </button>
            <button
              className="nav-button"
              onClick={() => navigateTo("home")}
            >
              {"\u2302"} Back to Dashboard
            </button>
            <div className="dash-header-user">
              <div className="dash-avatar">
                {(user?.name || "U").charAt(0).toUpperCase()}
              </div>
              <div className="dash-user-info">
                <div className="dash-user-name">{user?.name}</div>
                <div className="dash-user-role">
                  {getRoleName(user?.role_id)}
                </div>
              </div>
            </div>
          </div>

        </header>

        <section className="dash-card">

          <div className="reports-tabs">
            {REPORT_TYPES.map((type) => (
              <button
                key={type.key}
                className={[
                  "reports-tab",
                  reportType === type.key ? "active" : "",
                  type.key === "audit" && !canViewAudit
                    ? "disabled"
                    : ""
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => switchType(type.key)}
                title={
                  type.key === "audit" && !canViewAudit
                    ? "Available to Managers and Administrators only"
                    : ""
                }
              >
                <span>{type.icon}</span> {type.label}
              </button>
            ))}
          </div>

          <div className="reports-filter-grid">

            {reportType === "decisions" && (
              <>
                <div className="audit-filter-field">
                  <label>Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="audit-filter-field">
                  <label>Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="">All Priorities</option>
                    {PRIORITY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {reportType === "approvals" && (
              <>
                <div className="audit-filter-field">
                  <label>Action</label>
                  <select
                    value={action}
                    onChange={(e) => setAction(e.target.value)}
                  >
                    <option value="">All Actions</option>
                    {approvalActions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="audit-filter-field">
                  <label>Decision</label>
                  <select
                    value={decisionId}
                    onChange={(e) => setDecisionId(e.target.value)}
                  >
                    <option value="">All Decisions</option>
                    {decisionOptions.map((row) => (
                      <option
                        key={row.decision_id}
                        value={row.decision_id}
                      >
                        {row.decision_title || `#${row.decision_id}`}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {reportType === "teams" && (
              <div className="audit-filter-field reports-filter-wide">
                <label>Team</label>
                <select
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                >
                  <option value="">
                    {isOrgWide ? "All Teams" : "My Team"}
                  </option>
                  {teams
                    .filter(
                      (item) =>
                        isOrgWide ||
                        Number(item.team_id) === Number(user?.team_id)
                    )
                    .map((item) => (
                      <option
                        key={item.team_id}
                        value={item.team_id}
                      >
                        {item.team_name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {reportType === "audit" && canViewAudit && (
              <>
                <div className="audit-filter-field">
                  <label>Action</label>
                  <select
                    value={action}
                    onChange={(e) => setAction(e.target.value)}
                  >
                    <option value="">All Actions</option>
                    {(auditMeta.actions || []).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="audit-filter-field">
                  <label>Activity Type</label>
                  <select
                    value={activityType}
                    onChange={(e) =>
                      setActivityType(e.target.value)
                    }
                  >
                    <option value="">All Activity Types</option>
                    {ACTIVITY_TYPES.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="audit-filter-field">
                  <label>Decision</label>
                  <select
                    value={decisionId}
                    onChange={(e) => setDecisionId(e.target.value)}
                  >
                    <option value="">All Decisions</option>
                    {decisionOptions.map((row) => (
                      <option
                        key={row.decision_id}
                        value={row.decision_id}
                      >
                        {row.decision_title
                          ? `${row.decision_title} (#${row.decision_id})`
                          : `#${row.decision_id}`}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {isOrgWide &&
              (reportType === "decisions" ||
                reportType === "approvals" ||
                reportType === "audit") && (
                <>
                  <div className="audit-filter-field">
                    <label>
                      {reportType === "approvals"
                        ? "Approver"
                        : "User"}
                    </label>
                    <select
                      value={userFilter}
                      onChange={(e) =>
                        setUserFilter(e.target.value)
                      }
                    >
                      <option value="">
                        {reportType === "approvals"
                          ? "All Approvers"
                          : "All Users"}
                      </option>
                      {users.map((item) => (
                        <option
                          key={item.user_id}
                          value={item.user_id}
                        >
                          {item.name || item.email}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

            {isOrgWide &&
              (reportType === "decisions" ||
                reportType === "approvals") && (
                <>
                  <div className="audit-filter-field">
                    <label>Team</label>
                    <select
                      value={team}
                      onChange={(e) => setTeam(e.target.value)}
                    >
                      <option value="">All Teams</option>
                      {teams.map((item) => (
                        <option
                          key={item.team_id}
                          value={item.team_id}
                        >
                          {item.team_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

            {(reportType === "decisions" ||
              reportType === "approvals" ||
              reportType === "teams" ||
              reportType === "audit") && (
              <>
                <div className="audit-filter-field">
                  <label>From Date</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>

                <div className="audit-filter-field">
                  <label>To Date</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </>
            )}

            {(reportType === "decisions" ||
              reportType === "approvals" ||
              reportType === "audit") && (
              <div className="audit-filter-field audit-filter-search reports-filter-wide">
                <label>Search</label>
                <input
                  type="text"
                  placeholder={
                    reportType === "approvals"
                      ? "Search decision title or reason..."
                      : "Search title, description..."
                  }
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") applyFilters();
                  }}
                />
              </div>
            )}

            <div className="audit-filter-actions">
              <button
                className="audit-filter-btn"
                onClick={applyFilters}
                disabled={loading}
              >
                Apply Filters
              </button>
              <button
                className="audit-filter-btn audit-filter-reset"
                onClick={resetFilters}
                disabled={loading}
              >
                Reset
              </button>
            </div>

          </div>

          {error ? (
            <div className="empty-state" style={{ marginTop: "16px" }}>
              <p style={{ color: "#b91c1c" }}>{error}</p>
              <button
                className="audit-filter-btn"
                onClick={loadReport}
              >
                Retry
              </button>
            </div>
          ) : loading ? (
            <div className="empty-state">
              Loading report...
            </div>
          ) : rows.length === 0 ? (
            <>
              {reportType === "audit" && (
                <div className="reports-summary-card">
                  <div className="reports-summary-heading">
                    Audit Report Summary
                  </div>
                  <div className="reports-summary-stats">
                    {summaryItems.map((item) => (
                      <div
                        className="reports-summary-stat"
                        key={item.label}
                      >
                        <div className="reports-summary-value">
                          {item.value}
                        </div>
                        <div className="reports-summary-label">
                          {item.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="empty-state">
                <div style={{ fontSize: "28px", marginBottom: "10px" }}>
                  {"\uD83D\uDCCA"}
                </div>
                <h3 style={{ margin: "0 0 6px", color: "#0f172a" }}>
                  No Records Found
                </h3>
                <p style={{ margin: "0", color: "#64748b", fontSize: "14px" }}>
                  No records match the current filters.
                </p>
                {reportType === "audit" && (
                  <p
                    style={{
                      margin: "8px 0 0",
                      color: "#64748b",
                      fontSize: "13px"
                    }}
                  >
                    Authentication activity is hidden by default.
                    Select Activity Type &rarr; Authentication to
                    include login events.
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              {reportType === "audit" ? (
                <div className="reports-summary-card">
                  <div className="reports-summary-heading">
                    Audit Report Summary
                  </div>
                  <div className="reports-summary-stats">
                    {summaryItems.map((item) => (
                      <div
                        className="reports-summary-stat"
                        key={item.label}
                      >
                        <div className="reports-summary-value">
                          {item.value}
                        </div>
                        <div className="reports-summary-label">
                          {item.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="reports-summary">
                  <span className="team-count-pill">
                    {rows.length} record(s)
                  </span>
                </div>
              )}
              {renderTable()}
            </>
          )}

        </section>

      </main>

    </div>
  );
};