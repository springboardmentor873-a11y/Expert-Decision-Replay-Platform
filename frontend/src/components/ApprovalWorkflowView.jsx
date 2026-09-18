import React, { useState, useEffect } from "react";
import {
  GitPullRequest,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  User,
  Shield,
  ArrowRight,
  Send,
  Filter,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  FileText,
  AlertCircle
} from "lucide-react";
import MD3Button from "./md3/MD3Button";
import MD3Card from "./md3/MD3Card";

export default function ApprovalWorkflowView({ user, apiBase = "http://127.0.0.1:8000", onNavigateDecision }) {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("my_queue"); // my_queue | all | escalated
  const [selectedWf, setSelectedWf] = useState(null);
  const [decisionDetail, setDecisionDetail] = useState(null);
  const [actionComments, setActionComments] = useState("");
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState("approve"); // approve | reject | request_changes | escalate
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchPendingApprovals();
  }, [tab]);

  const fetchPendingApprovals = async () => {
    setLoading(true);
    try {
      let url = `${apiBase}/approvals/pending`;
      if (tab === "escalated") {
        url += "?escalated_only=true";
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWorkflows(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openActionModal = async (wf, defaultAction = "approve") => {
    setSelectedWf(wf);
    setActionType(defaultAction);
    setActionComments("");
    setMessage(null);
    setIsActionModalOpen(true);

    // Fetch full decision details
    try {
      const res = await fetch(`${apiBase}/decisions/${wf.decision_id}`);
      if (res.ok) {
        const data = await res.json();
        setDecisionDetail(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleExecuteAction = async () => {
    if (!selectedWf) return;
    setSubmitting(true);
    setMessage(null);

    let endpoint = "";
    let body = { action: "Approved", comments: actionComments };

    if (actionType === "approve") {
      endpoint = `${apiBase}/decisions/${selectedWf.decision_id}/approve-stage`;
      body = { action: "Approved", comments: actionComments || "Stage requirements satisfied." };
    } else if (actionType === "reject") {
      endpoint = `${apiBase}/decisions/${selectedWf.decision_id}/reject-stage`;
      body = { action: "Rejected", comments: actionComments || "Decision rejected during review." };
    } else if (actionType === "request_changes") {
      endpoint = `${apiBase}/decisions/${selectedWf.decision_id}/request-changes`;
      body = { action: "Changes Requested", comments: actionComments || "Please address requested changes." };
    } else if (actionType === "escalate") {
      endpoint = `${apiBase}/decisions/${selectedWf.decision_id}/escalate`;
      body = { escalation_reason: actionComments || "Review turnaround deadline exceeded." };
    }

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const resData = await res.json();
      if (!res.ok) {
        setMessage({ text: resData.detail || "Action execution failed", isError: true });
        return;
      }

      setMessage({ text: resData.message || "Action processed successfully!", isError: false });
      setTimeout(() => {
        setIsActionModalOpen(false);
        fetchPendingApprovals();
      }, 1000);
    } catch (e) {
      setMessage({ text: "Network error occurred", isError: true });
    } finally {
      setSubmitting(false);
    }
  };

  const userRole = user?.role_name || "Employee";

  return (
    <div style={styles.container}>
      {/* Top Banner */}
      <div style={styles.heroBanner}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={styles.heroIconBox}>
            <GitPullRequest size={26} color="var(--primary)" />
          </div>
          <div>
            <div style={styles.categoryBadge}>
              <Sparkles size={12} />
              <span>STAGE 1 & 2 GOVERNANCE PIPELINE</span>
            </div>
            <h1 style={styles.title}>Multi-Level Approval Workflows</h1>
            <p style={styles.subtitle}>
              Review candidate decisions, evaluate alternative trade-offs, and advance peer and executive signoffs.
            </p>
          </div>
        </div>

        <div style={styles.roleChip}>
          <Shield size={14} color="var(--primary)" />
          <span>Active Role: <strong>{userRole}</strong></span>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Total Pending</span>
          <div style={styles.kpiVal}>{workflows.length}</div>
          <span style={styles.kpiSub}>Awaiting action across pipeline</span>
        </div>
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Stage 1: Reviewer</span>
          <div style={{ ...styles.kpiVal, color: "var(--primary)" }}>
            {workflows.filter((w) => w.stage === 1).length}
          </div>
          <span style={styles.kpiSub}>Technical feasibility check</span>
        </div>
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Stage 2: Manager</span>
          <div style={{ ...styles.kpiVal, color: "var(--accent-emerald)" }}>
            {workflows.filter((w) => w.stage === 2).length}
          </div>
          <span style={styles.kpiSub}>Executive & budget signoff</span>
        </div>
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Escalated</span>
          <div style={{ ...styles.kpiVal, color: "#dc2626" }}>
            {workflows.filter((w) => w.is_escalated).length}
          </div>
          <span style={styles.kpiSub}>Urgent SLA turnaround alerts</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={styles.navBar}>
        <div style={{ display: "flex", gap: "8px" }}>
          {[
            { id: "my_queue", label: "My Review Queue" },
            { id: "all", label: "All Pending Approvals" },
            { id: "escalated", label: "Escalated Decisions ⚠️" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                ...styles.tabBtn,
                backgroundColor: tab === t.id ? "var(--primary)" : "var(--bg-surface-container-high)",
                color: tab === t.id ? "#ffffff" : "var(--text-secondary)",
                fontWeight: tab === t.id ? "600" : "500",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button onClick={fetchPendingApprovals} style={styles.refreshBtn}>
          <RotateCcw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Approvals List */}
      {loading ? (
        <div style={styles.loadingBox}>
          <div className="spinner" />
          <span>Loading approval queue...</span>
        </div>
      ) : workflows.length === 0 ? (
        <div style={styles.emptyCard}>
          <CheckCircle2 size={40} color="var(--accent-emerald)" />
          <h3 style={{ margin: "14px 0 6px 0", fontSize: "17px", color: "var(--text-primary)" }}>
            Approval Queue Clear!
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "13.5px", margin: 0 }}>
            No decisions are currently awaiting action in this category.
          </p>
        </div>
      ) : (
        <div style={styles.cardList}>
          {workflows.map((wf) => {
            const isStage1 = wf.stage === 1;
            const canApprove =
              (isStage1 && ["Reviewer", "Manager", "Administrator"].includes(userRole)) ||
              (!isStage1 && ["Manager", "Administrator"].includes(userRole));

            return (
              <div
                key={wf.id}
                style={{
                  ...styles.approvalCard,
                  borderLeft: wf.is_escalated
                    ? "4px solid #ef4444"
                    : isStage1
                    ? "4px solid var(--primary)"
                    : "4px solid var(--accent-emerald)",
                }}
              >
                {/* Header Row */}
                <div style={styles.cardHeader}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <span style={styles.decisionTag}>DECISION #{wf.decision_id}</span>
                    <span style={styles.categoryPill}>{wf.decision_category}</span>
                    <span
                      style={{
                        ...styles.priorityPill,
                        color: wf.decision_priority === "Critical" ? "#dc2626" : "var(--text-secondary)",
                      }}
                    >
                      {wf.decision_priority} Priority
                    </span>
                    {wf.is_escalated && (
                      <span style={styles.escalatedPill}>
                        <AlertTriangle size={12} />
                        <span>ESCALATED</span>
                      </span>
                    )}
                  </div>

                  {/* Stage Badge */}
                  <div style={isStage1 ? styles.stageBadge1 : styles.stageBadge2}>
                    <span>
                      {isStage1 ? "Stage 1: Reviewer Review" : "Stage 2: Manager Approval"}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <h3 style={styles.decisionTitle}>{wf.decision_title}</h3>

                {/* Escalation details if any */}
                {wf.is_escalated && wf.escalation_reason && (
                  <div style={styles.escalationBox}>
                    <AlertTriangle size={15} color="#dc2626" />
                    <span>
                      <strong>Escalation Reason:</strong> {wf.escalation_reason}
                    </span>
                  </div>
                )}

                {/* Metadata row */}
                <div style={styles.metaRow}>
                  <div style={styles.metaItem}>
                    <User size={13} color="var(--text-secondary)" />
                    <span>Author: <strong>{wf.decision_creator_name || "Employee User"}</strong></span>
                  </div>
                  <div style={styles.metaItem}>
                    <Clock size={13} color="var(--text-secondary)" />
                    <span>
                      Target Role: <strong>{wf.assigned_role_name}</strong>
                    </span>
                  </div>
                  <div style={styles.metaItem}>
                    <Clock size={13} color="var(--text-secondary)" />
                    <span>
                      Submitted: {new Date(wf.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </div>

                {/* Action Footer */}
                <div style={styles.cardFooter}>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {onNavigateDecision && (
                      <button
                        onClick={() => onNavigateDecision(wf.decision_id)}
                        style={styles.detailsBtn}
                      >
                        <FileText size={14} />
                        <span>View Decision & Alternatives</span>
                      </button>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: "10px" }}>
                    {!wf.is_escalated && (
                      <button
                        onClick={() => openActionModal(wf, "escalate")}
                        style={styles.escalateBtn}
                        title="Escalate decision review"
                      >
                        <AlertTriangle size={14} />
                        <span>Escalate</span>
                      </button>
                    )}

                    {canApprove && (
                      <>
                        <button
                          onClick={() => openActionModal(wf, "request_changes")}
                          style={styles.changesBtn}
                        >
                          <RotateCcw size={14} />
                          <span>Request Changes</span>
                        </button>
                        <button
                          onClick={() => openActionModal(wf, "reject")}
                          style={styles.rejectBtn}
                        >
                          <XCircle size={14} />
                          <span>Reject</span>
                        </button>
                        <button
                          onClick={() => openActionModal(wf, "approve")}
                          style={styles.approveBtn}
                        >
                          <Check size={14} />
                          <span>
                            {isStage1 ? "Approve (Pass to Manager)" : "Final Executive Approval"}
                          </span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Action Dialog Modal */}
      {isActionModalOpen && selectedWf && (
        <div style={styles.modalOverlay} onClick={() => setIsActionModalOpen(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <span style={styles.decisionTag}>STAGE {selectedWf.stage} REVIEW</span>
                <h2 style={styles.modalTitle}>{selectedWf.decision_title}</h2>
              </div>
              <button onClick={() => setIsActionModalOpen(false)} style={styles.closeBtn}>
                ✕
              </button>
            </div>

            {/* Decision summary snippet */}
            {decisionDetail && (
              <div style={styles.decisionSummaryBox}>
                <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--primary)", marginBottom: "4px" }}>
                  DECISION OVERVIEW
                </div>
                <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                  {decisionDetail.problem_statement}
                </div>
                {decisionDetail.decision_rationale && (
                  <div style={{ marginTop: "8px", fontSize: "12.5px", color: "var(--text-primary)" }}>
                    <strong>Selected Rationale:</strong> {decisionDetail.decision_rationale}
                  </div>
                )}
              </div>
            )}

            {/* Action Selector */}
            <div style={{ marginTop: "16px" }}>
              <label style={styles.fieldLabel}>Action to Execute:</label>
              <div style={styles.actionSelectRow}>
                {[
                  { id: "approve", label: selectedWf.stage === 1 ? "Approve (To Manager)" : "Final Approval", color: "var(--accent-emerald)" },
                  { id: "request_changes", label: "Request Changes", color: "#f59e0b" },
                  { id: "reject", label: "Reject Decision", color: "#dc2626" },
                  { id: "escalate", label: "Escalate Review", color: "#ef4444" },
                ].map((act) => (
                  <button
                    key={act.id}
                    onClick={() => setActionType(act.id)}
                    style={{
                      ...styles.actionPillBtn,
                      border: actionType === act.id ? `2px solid ${act.color}` : "1px solid var(--border-outline-variant)",
                      backgroundColor: actionType === act.id ? "var(--secondary-container)" : "transparent",
                      color: actionType === act.id ? "var(--text-primary)" : "var(--text-secondary)",
                      fontWeight: actionType === act.id ? "600" : "500",
                    }}
                  >
                    {act.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Comments Field */}
            <div style={{ marginTop: "16px" }}>
              <label style={styles.fieldLabel}>
                {actionType === "escalate" ? "Escalation Reason / Urgency Notes:" : "Reviewer Comments & Feedback:"}
              </label>
              <textarea
                value={actionComments}
                onChange={(e) => setActionComments(e.target.value)}
                placeholder={
                  actionType === "approve"
                    ? "Add verification notes or justifications for approval..."
                    : actionType === "request_changes"
                    ? "List specific modifications needed before this can be approved..."
                    : actionType === "reject"
                    ? "Provide reasons for decision rejection..."
                    : "Specify reason for escalation and SLA priority..."
                }
                style={styles.commentTextArea}
                rows={4}
              />
            </div>

            {/* Status Message */}
            {message && (
              <div
                style={{
                  ...styles.alertBanner,
                  backgroundColor: message.isError ? "rgba(220, 38, 38, 0.1)" : "rgba(16, 185, 129, 0.1)",
                  color: message.isError ? "#dc2626" : "#059669",
                }}
              >
                {message.text}
              </div>
            )}

            {/* Modal Actions */}
            <div style={styles.modalFooter}>
              <button
                onClick={() => setIsActionModalOpen(false)}
                style={styles.cancelBtn}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteAction}
                disabled={submitting}
                style={{
                  ...styles.submitActionBtn,
                  backgroundColor:
                    actionType === "approve"
                      ? "var(--primary)"
                      : actionType === "reject"
                      ? "#dc2626"
                      : actionType === "request_changes"
                      ? "#d97706"
                      : "#dc2626",
                }}
              >
                {submitting ? "Processing..." : `Confirm ${actionType.replace("_", " ").toUpperCase()}`}
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
  heroBanner: {
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
  heroIconBox: {
    width: "52px",
    height: "52px",
    borderRadius: "16px",
    backgroundColor: "var(--secondary-container)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  categoryBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "11px",
    fontWeight: "700",
    color: "var(--primary)",
    letterSpacing: "0.5px",
    marginBottom: "6px",
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
    maxWidth: "600px",
  },
  roleChip: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    borderRadius: "20px",
    backgroundColor: "var(--secondary-container)",
    color: "var(--on-secondary-container)",
    fontSize: "13px",
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
    fontSize: "12.5px",
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
    fontSize: "11.5px",
    color: "var(--text-secondary)",
  },
  navBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
  },
  tabBtn: {
    border: "none",
    padding: "8px 18px",
    borderRadius: "20px",
    fontSize: "13px",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  refreshBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    border: "1px solid var(--border-outline-variant)",
    backgroundColor: "var(--bg-surface-container)",
    padding: "7px 14px",
    borderRadius: "16px",
    fontSize: "12.5px",
    color: "var(--text-secondary)",
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
  emptyCard: {
    padding: "54px 24px",
    textAlign: "center",
    borderRadius: "20px",
    backgroundColor: "var(--bg-surface-container)",
    border: "1px dashed var(--border-outline-variant)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  cardList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  approvalCard: {
    padding: "22px 24px",
    borderRadius: "20px",
    backgroundColor: "var(--bg-surface-container)",
    border: "1px solid var(--border-outline-variant)",
    boxShadow: "var(--shadow-sm)",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px",
  },
  decisionTag: {
    fontSize: "10.5px",
    fontWeight: "700",
    color: "var(--primary)",
    backgroundColor: "rgba(103, 80, 164, 0.08)",
    padding: "3px 8px",
    borderRadius: "6px",
    letterSpacing: "0.5px",
  },
  categoryPill: {
    fontSize: "11px",
    fontWeight: "600",
    color: "var(--text-secondary)",
    backgroundColor: "var(--bg-surface-container-high)",
    padding: "3px 10px",
    borderRadius: "12px",
  },
  priorityPill: {
    fontSize: "11px",
    fontWeight: "600",
  },
  escalatedPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "10px",
    fontWeight: "800",
    color: "#dc2626",
    backgroundColor: "rgba(220, 38, 38, 0.12)",
    padding: "3px 8px",
    borderRadius: "10px",
    letterSpacing: "0.5px",
  },
  stageBadge1: {
    fontSize: "11.5px",
    fontWeight: "600",
    color: "var(--primary)",
    backgroundColor: "var(--secondary-container)",
    padding: "5px 12px",
    borderRadius: "14px",
  },
  stageBadge2: {
    fontSize: "11.5px",
    fontWeight: "600",
    color: "#059669",
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    padding: "5px 12px",
    borderRadius: "14px",
  },
  decisionTitle: {
    margin: 0,
    fontSize: "17.5px",
    fontWeight: "600",
    color: "var(--text-primary)",
    lineHeight: "1.35",
  },
  escalationBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 14px",
    borderRadius: "12px",
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    fontSize: "12.5px",
    color: "#dc2626",
  },
  metaRow: {
    display: "flex",
    gap: "24px",
    flexWrap: "wrap",
  },
  metaItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12.5px",
    color: "var(--text-secondary)",
  },
  cardFooter: {
    paddingTop: "14px",
    borderTop: "1px solid var(--border-outline-variant)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px",
  },
  detailsBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "none",
    border: "1px solid var(--border-outline-variant)",
    padding: "7px 14px",
    borderRadius: "12px",
    fontSize: "12px",
    color: "var(--text-secondary)",
    cursor: "pointer",
  },
  escalateBtn: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    background: "none",
    border: "1px solid rgba(220, 38, 38, 0.3)",
    padding: "7px 14px",
    borderRadius: "12px",
    fontSize: "12px",
    color: "#dc2626",
    cursor: "pointer",
  },
  changesBtn: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    background: "none",
    border: "1px solid rgba(245, 158, 11, 0.3)",
    padding: "7px 14px",
    borderRadius: "12px",
    fontSize: "12px",
    color: "#d97706",
    cursor: "pointer",
  },
  rejectBtn: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    background: "none",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    padding: "7px 14px",
    borderRadius: "12px",
    fontSize: "12px",
    color: "#dc2626",
    cursor: "pointer",
  },
  approveBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "var(--primary)",
    color: "#ffffff",
    border: "none",
    padding: "8px 18px",
    borderRadius: "14px",
    fontSize: "12.5px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "var(--shadow-sm)",
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
    width: "600px",
    maxWidth: "100%",
    backgroundColor: "var(--bg-surface-container-high)",
    borderRadius: "24px",
    padding: "28px",
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
    margin: "4px 0 0 0",
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
  decisionSummaryBox: {
    padding: "12px 16px",
    borderRadius: "14px",
    backgroundColor: "var(--bg-surface-container)",
    border: "1px solid var(--border-outline-variant)",
    marginBottom: "14px",
  },
  fieldLabel: {
    display: "block",
    fontSize: "12.5px",
    fontWeight: "600",
    color: "var(--text-primary)",
    marginBottom: "8px",
  },
  actionSelectRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  actionPillBtn: {
    padding: "8px 14px",
    borderRadius: "16px",
    fontSize: "12px",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  commentTextArea: {
    width: "100%",
    padding: "12px",
    borderRadius: "14px",
    border: "1px solid var(--border-outline-variant)",
    backgroundColor: "var(--bg-surface-container)",
    color: "var(--text-primary)",
    fontSize: "13px",
    outline: "none",
    resize: "vertical",
    boxSizing: "border-box",
  },
  alertBanner: {
    padding: "10px 14px",
    borderRadius: "12px",
    fontSize: "12.5px",
    marginTop: "14px",
    fontWeight: "500",
  },
  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "20px",
  },
  cancelBtn: {
    padding: "8px 18px",
    borderRadius: "14px",
    border: "1px solid var(--border-outline-variant)",
    backgroundColor: "transparent",
    color: "var(--text-secondary)",
    fontSize: "13px",
    cursor: "pointer",
  },
  submitActionBtn: {
    padding: "8px 22px",
    borderRadius: "14px",
    border: "none",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "var(--shadow-sm)",
  },
};
