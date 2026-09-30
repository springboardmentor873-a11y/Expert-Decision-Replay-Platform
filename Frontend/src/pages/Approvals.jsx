import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE, getCurrentUser, logout } from "../API";
import { ThemeToggle } from "../theme";
import "./Workspace.css";

export default function Approvals() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [rejectComment, setRejectComment] = useState("");

  const role = (user?.role || "").toLowerCase();

  const isManager =
    role === "manager" ||
    role === "admin" ||
    role === "administrator";

  // ---------------------------------------------------------
  // Fetch approvals
  // ---------------------------------------------------------
  const fetchApprovals = async () => {
    if (!user?.id) {
      setError("User information not found.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE}/approvals?user_id=${encodeURIComponent(user.id)}`
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to load approvals.");
      }

      const data = await response.json();

      setApprovals(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Approval fetch error:", err);
      setError(err.message || "Failed to load approvals.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  // ---------------------------------------------------------
  // Approve
  // ---------------------------------------------------------
  const handleApprove = async (approvalId) => {
    if (!user?.id) return;

    const confirmed = window.confirm(
      "Are you sure you want to approve this decision?"
    );

    if (!confirmed) return;

    try {
      setActionLoading(approvalId);
      setError("");

      const response = await fetch(
        `${API_BASE}/approvals/${approvalId}/approve?user_id=${encodeURIComponent(
          user.id
        )}`,
        {
          method: "PUT",
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.detail || "Failed to approve decision.");
      }

      await fetchApprovals();
    } catch (err) {
      console.error("Approval error:", err);
      setError(err.message || "Failed to approve decision.");
    } finally {
      setActionLoading(null);
    }
  };

  // ---------------------------------------------------------
  // Open reject modal
  // ---------------------------------------------------------
  const openRejectModal = (approval) => {
    setSelectedApproval(approval);
    setRejectComment("");
    setShowRejectModal(true);
  };

  // ---------------------------------------------------------
  // Reject
  // ---------------------------------------------------------
  const handleReject = async () => {
    if (!user?.id || !selectedApproval) return;

    if (!rejectComment.trim()) {
      setError("Please enter a reason before rejecting.");
      return;
    }

    try {
      setActionLoading(selectedApproval.id);
      setError("");

      const response = await fetch(
        `${API_BASE}/approvals/${selectedApproval.id}/reject?user_id=${encodeURIComponent(
          user.id
        )}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            comments: rejectComment.trim(),
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.detail || "Failed to reject decision.");
      }

      setShowRejectModal(false);
      setSelectedApproval(null);
      setRejectComment("");

      await fetchApprovals();
    } catch (err) {
      console.error("Reject error:", err);
      setError(err.message || "Failed to reject decision.");
    } finally {
      setActionLoading(null);
    }
  };

  // ---------------------------------------------------------
  // Format date
  // ---------------------------------------------------------
  const formatDate = (dateValue) => {
    if (!dateValue) return "—";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleString();
  };

  // ---------------------------------------------------------
  // Access protection
  // ---------------------------------------------------------
  if (!user) {
    return (
      <div style={styles.centerMessage}>
        <div style={styles.messageCard}>
          <h2>Login Required</h2>
          <p>Please login to continue.</p>
        </div>
      </div>
    );
  }

  if (!isManager) {
    return (
      <div style={styles.centerMessage}>
        <div style={styles.messageCard}>
          <div style={styles.lockIcon}>🔒</div>

          <h2>Manager Access Only</h2>

          <p>
            The Approvals page is available only to managers and
            administrators.
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // Loading
  // ---------------------------------------------------------
  if (loading) {
    return (
      <div className="approvals-page" style={styles.page}>
        <div className="approvals-header" style={styles.header}>
          <div>
            <h1 className="approvals-title" style={styles.title}>Approvals</h1>
            <p className="approvals-subtitle" style={styles.subtitle}>
              Review and manage pending decision requests.
            </p>
          </div>
        </div>

        <div className="approvals-loading-card" style={styles.loadingCard}>
          <div className="approvals-spinner" style={styles.spinner}></div>
          <p>Loading approvals...</p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // ---------------------------------------------------------
  // Page
  // ---------------------------------------------------------
  return (
    <div className="workspace dashboard-workspace approvals-page-shell">
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
            <Link to="/approvals" className="sidebar-link active">
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

          <Link to="/audit-logs" className="sidebar-link">
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
        <main className="dashboard-content approvals-main" style={{ padding: "30px 40px" }}>
      <div className="milestone-page-toolbar approvals-toolbar">
        <ThemeToggle />
      </div>
      {/* Header */}
      <div className="approvals-header" style={styles.header}>
        <div>
          <h1 className="approvals-title" style={styles.title}>Approvals</h1>

          <p className="approvals-subtitle" style={styles.subtitle}>
            Review employee decisions submitted for management approval.
          </p>
        </div>

        <button
          className="approvals-refresh-button"
          onClick={fetchApprovals}
          style={styles.refreshButton}
          disabled={loading}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="approvals-error-box" style={styles.errorBox}>
          <span>⚠</span>
          <span>{error}</span>

          <button
            className="approvals-close-error"
            onClick={() => setError("")}
            style={styles.closeError}
          >
            ×
          </button>
        </div>
      )}

      {/* Statistics */}
      <div className="approvals-stats-grid" style={styles.statsGrid}>
        <div className="approvals-stat-card" style={styles.statCard}>
          <div className="approvals-stat-icon" style={styles.statIcon}>⏳</div>

          <div>
            <div className="approvals-stat-number" style={styles.statNumber}>
              {approvals.length}
            </div>

            <div className="approvals-stat-label" style={styles.statLabel}>
              Pending Requests
            </div>
          </div>
        </div>

        <div className="approvals-stat-card" style={styles.statCard}>
          <div className="approvals-stat-icon" style={styles.statIcon}>👥</div>

          <div>
            <div className="approvals-stat-number" style={styles.statNumber}>
              {
                new Set(
                  approvals
                    .map((item) => item.requested_by)
                    .filter(Boolean)
                ).size
              }
            </div>

            <div className="approvals-stat-label" style={styles.statLabel}>
              Employees
            </div>
          </div>
        </div>

        <div className="approvals-stat-card" style={styles.statCard}>
          <div className="approvals-stat-icon" style={styles.statIcon}>✓</div>

          <div>
            <div className="approvals-stat-number" style={styles.statNumber}>
              {approvals.filter(
                (item) =>
                  String(item.status || "").toLowerCase() ===
                  "approved"
              ).length}
            </div>

            <div className="approvals-stat-label" style={styles.statLabel}>
              Approved
            </div>
          </div>
        </div>
      </div>

      {/* Approval list */}
      <div className="approvals-section" style={styles.section}>
        <div className="approvals-section-header" style={styles.sectionHeader}>
          <div>
            <h2 className="approvals-section-title" style={styles.sectionTitle}>
              Decision Requests
            </h2>

            <p className="approvals-section-subtitle" style={styles.sectionSubtitle}>
              Decisions requiring your review.
            </p>
          </div>
        </div>

        {approvals.length === 0 ? (
          <div className="approvals-empty-card" style={styles.emptyCard}>
            <div className="approvals-empty-icon" style={styles.emptyIcon}>✓</div>

            <h3 className="approvals-empty-title" style={styles.emptyTitle}>
              No Pending Approvals
            </h3>

            <p className="approvals-empty-text" style={styles.emptyText}>
              There are currently no decision requests waiting
              for your approval.
            </p>
          </div>
        ) : (
          <div className="approvals-list" style={styles.approvalList}>
            {approvals.map((approval) => (
              <div
                key={approval.id}
                className="approvals-approval-card"
                style={styles.approvalCard}
              >
                {/* Top row */}
                <div className="approvals-card-top" style={styles.cardTop}>
                  <div>
                    <div className="approvals-request-label" style={styles.requestLabel}>
                      APPROVAL REQUEST #{approval.id}
                    </div>

                    <h3 className="approvals-decision-title" style={styles.decisionTitle}>
                      {approval.decision_title ||
                        `Decision #${approval.decision_id}`}
                    </h3>
                  </div>

                  <span className="approvals-pending-badge" style={styles.pendingBadge}>
                    {approval.status || "Pending"}
                  </span>
                </div>

                {/* Information */}
                <div className="approvals-info-grid" style={styles.infoGrid}>
                  <div>
                    <div className="approvals-info-label" style={styles.infoLabel}>
                      Employee
                    </div>

                    <div className="approvals-info-value" style={styles.infoValue}>
                      {approval.requested_by_name ||
                        approval.employee_name ||
                        approval.user_name ||
                        `User #${approval.requested_by}`}
                    </div>
                  </div>

                  <div>
                    <div className="approvals-info-label" style={styles.infoLabel}>
                      Decision ID
                    </div>

                    <div className="approvals-info-value" style={styles.infoValue}>
                      #{approval.decision_id}
                    </div>
                  </div>

                  <div>
                    <div className="approvals-info-label" style={styles.infoLabel}>
                      Submitted
                    </div>

                    <div className="approvals-info-value" style={styles.infoValue}>
                      {formatDate(approval.created_at)}
                    </div>
                  </div>

                  <div>
                    <div className="approvals-info-label" style={styles.infoLabel}>
                      Category
                    </div>

                    <div className="approvals-info-value" style={styles.infoValue}>
                      {approval.decision_category || "General"}
                    </div>
                  </div>

                  <div>
                    <div className="approvals-info-label" style={styles.infoLabel}>
                      Status
                    </div>

                    <div className="approvals-info-value" style={styles.infoValue}>
                      {approval.status || "Pending"}
                    </div>
                  </div>
                </div>

                {/* Comments */}
                {approval.comments && (
                  <div className="approvals-comment-box" style={styles.commentBox}>
                    <div className="approvals-info-label" style={styles.infoLabel}>
                      Request Comments
                    </div>

                    <p className="approvals-comment-text" style={styles.commentText}>
                      {approval.comments}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="approvals-actions" style={styles.actions}>
                  <Link
                    className="approvals-open-link"
                    to={`/decisions/${approval.decision_id}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "10px 18px",
                      background: "#f1f5f9",
                      color: "#1e293b",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      fontWeight: 600,
                      fontSize: "13px",
                      textDecoration: "none",
                    }}
                  >
                    Open Decision →
                  </Link>

                  <button
                    className="approvals-approve-button"
                    onClick={() =>
                      handleApprove(approval.id)
                    }
                    disabled={
                      actionLoading === approval.id
                    }
                    style={styles.approveButton}
                  >
                    {actionLoading === approval.id
                      ? "Processing..."
                      : "✓ Approve"}
                  </button>

                  <button
                    className="approvals-reject-button"
                    onClick={() =>
                      openRejectModal(approval)
                    }
                    disabled={
                      actionLoading === approval.id
                    }
                    style={styles.rejectButton}
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="approvals-modal-overlay" style={styles.modalOverlay}>
          <div className="approvals-modal" style={styles.modal}>
            <div className="approvals-modal-header" style={styles.modalHeader}>
              <div>
                <h2 className="approvals-modal-title" style={styles.modalTitle}>
                  Reject Decision
                </h2>

                <p className="approvals-modal-subtitle" style={styles.modalSubtitle}>
                  Please provide a reason for rejection.
                </p>
              </div>

              <button
                className="approvals-modal-close"
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedApproval(null);
                  setRejectComment("");
                  setError("");
                }}
                style={styles.modalClose}
              >
                ×
              </button>
            </div>

            <textarea
              className="approvals-textarea"
              value={rejectComment}
              onChange={(e) =>
                setRejectComment(e.target.value)
              }
              placeholder="Enter rejection reason..."
              style={styles.textarea}
              rows={6}
              autoFocus
            />

            <div className="approvals-modal-actions" style={styles.modalActions}>
              <button
                className="approvals-cancel-button"
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedApproval(null);
                  setRejectComment("");
                }}
                style={styles.cancelButton}
              >
                Cancel
              </button>

              <button
                className="approvals-confirm-reject-button"
                onClick={handleReject}
                disabled={
                  !rejectComment.trim() ||
                  actionLoading === selectedApproval?.id
                }
                style={{
                  ...styles.confirmRejectButton,
                  opacity:
                    !rejectComment.trim() ||
                    actionLoading === selectedApproval?.id
                      ? 0.5
                      : 1,
                }}
              >
                {actionLoading === selectedApproval?.id
                  ? "Rejecting..."
                  : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
        </main>
      </div>
    </div>
  );
}

// =========================================================
// STYLES
// =========================================================

const styles = {
  page: {
    minHeight: "100vh",
    padding: "32px",
    background: "#f7f8fc",
    color: "#1f2937",
    boxSizing: "border-box",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    marginBottom: "28px",
  },

  title: {
    margin: 0,
    fontSize: "32px",
    fontWeight: 700,
    letterSpacing: "-0.5px",
  },

  subtitle: {
    margin: "8px 0 0",
    color: "#6b7280",
    fontSize: "15px",
  },

  refreshButton: {
    border: "1px solid #d1d5db",
    background: "#ffffff",
    borderRadius: "10px",
    padding: "10px 16px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },

  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
    borderRadius: "10px",
    padding: "13px 16px",
    marginBottom: "20px",
    fontSize: "14px",
  },

  closeError: {
    marginLeft: "auto",
    border: "none",
    background: "transparent",
    color: "#991b1b",
    fontSize: "20px",
    cursor: "pointer",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "18px",
    marginBottom: "30px",
  },

  statCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
  },

  statIcon: {
    width: "46px",
    height: "46px",
    borderRadius: "12px",
    background: "#eef2ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
  },

  statNumber: {
    fontSize: "24px",
    fontWeight: 700,
    color: "#111827",
  },

  statLabel: {
    color: "#6b7280",
    fontSize: "13px",
    marginTop: "2px",
  },

  section: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    overflow: "hidden",
  },

  sectionHeader: {
    padding: "22px 24px",
    borderBottom: "1px solid #e5e7eb",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 700,
  },

  sectionSubtitle: {
    margin: "6px 0 0",
    color: "#6b7280",
    fontSize: "14px",
  },

  approvalList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    padding: "20px",
    background: "#f9fafb",
  },

  approvalCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "22px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "20px",
  },

  requestLabel: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#6b7280",
    letterSpacing: "0.8px",
    marginBottom: "7px",
  },

  decisionTitle: {
    margin: 0,
    fontSize: "19px",
    fontWeight: 700,
    color: "#111827",
  },

  pendingBadge: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "999px",
    padding: "6px 11px",
    background: "#fff7ed",
    color: "#c2410c",
    fontSize: "12px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(170px, 1fr))",
    gap: "18px",
    padding: "18px 0",
    borderTop: "1px solid #f0f0f0",
    borderBottom: "1px solid #f0f0f0",
  },

  infoLabel: {
    fontSize: "11px",
    color: "#9ca3af",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "5px",
  },

  infoValue: {
    fontSize: "14px",
    color: "#374151",
    fontWeight: 600,
  },

  commentBox: {
    marginTop: "16px",
    background: "#f9fafb",
    borderRadius: "10px",
    padding: "14px",
  },

  commentText: {
    margin: "5px 0 0",
    fontSize: "14px",
    color: "#4b5563",
    lineHeight: 1.5,
  },

  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "20px",
  },

  approveButton: {
    border: "none",
    background: "#166534",
    color: "#ffffff",
    borderRadius: "9px",
    padding: "10px 18px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },

  rejectButton: {
    border: "1px solid #fecaca",
    background: "#ffffff",
    color: "#b91c1c",
    borderRadius: "9px",
    padding: "10px 18px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },

  emptyCard: {
    padding: "70px 30px",
    textAlign: "center",
  },

  emptyIcon: {
    width: "60px",
    height: "60px",
    margin: "0 auto 16px",
    borderRadius: "50%",
    background: "#ecfdf5",
    color: "#15803d",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "25px",
    fontWeight: 700,
  },

  emptyTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: 700,
  },

  emptyText: {
    maxWidth: "450px",
    margin: "8px auto 0",
    color: "#6b7280",
    fontSize: "14px",
    lineHeight: 1.5,
  },

  loadingCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "60px",
    textAlign: "center",
    color: "#6b7280",
  },

  spinner: {
    width: "30px",
    height: "30px",
    border: "3px solid #e5e7eb",
    borderTop: "3px solid #4f46e5",
    borderRadius: "50%",
    margin: "0 auto 14px",
    animation: "spin 1s linear infinite",
  },

  centerMessage: {
    minHeight: "100vh",
    background: "#f7f8fc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },

  messageCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "40px",
    textAlign: "center",
    maxWidth: "430px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
  },

  lockIcon: {
    fontSize: "42px",
    marginBottom: "10px",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(17, 24, 39, 0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    zIndex: 1000,
  },

  modal: {
    width: "100%",
    maxWidth: "520px",
    background: "#ffffff",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "20px",
  },

  modalTitle: {
    margin: 0,
    fontSize: "21px",
    fontWeight: 700,
  },

  modalSubtitle: {
    margin: "6px 0 0",
    color: "#6b7280",
    fontSize: "14px",
  },

  modalClose: {
    border: "none",
    background: "transparent",
    fontSize: "26px",
    color: "#6b7280",
    cursor: "pointer",
  },

  textarea: {
    width: "100%",
    boxSizing: "border-box",
    resize: "vertical",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    padding: "12px",
    fontSize: "14px",
    fontFamily: "inherit",
    outline: "none",
  },

  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "20px",
  },

  cancelButton: {
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#374151",
    borderRadius: "9px",
    padding: "10px 16px",
    fontWeight: 600,
    cursor: "pointer",
  },

  confirmRejectButton: {
    border: "none",
    background: "#b91c1c",
    color: "#ffffff",
    borderRadius: "9px",
    padding: "10px 16px",
    fontWeight: 700,
    cursor: "pointer",
  },
};
