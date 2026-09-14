import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import StatusBadge from "../../components/StatusBadge/StatusBadge";
import { useAuth } from "../../context/AuthContext";
import {
  attachmentDownloadUrl,
  deleteAlternative,
  deleteAttachment,
  getDecision,
  submitDecisionForReview,
  approveDecision,
  rejectDecision,
  getDecisionApprovals,
  archiveDecision,
} from "../../services/decision";
import { listAuditLogs, AUDIT_ACTION_LABELS } from "../../services/audit";
import "./DecisionDetails.css";

export default function DecisionDetails() {
  const { decisionId } = useParams();
  const { tokens, user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [decision, setDecision] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showApprovals, setShowApprovals] = useState(false);
  const [approvalHistory, setApprovalHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const isPrivileged = user && ["manager", "administrator"].includes(user.role);
  const isDraft = decision?.status === "draft";
  const canEdit = decision && (decision.created_by === user?.id || ["manager", "administrator"].includes(user?.role));
  const canEditNow = canEdit && isDraft;

  const isUnderReview = decision?.status === "under_review";
  const isPendingManagerReview = decision?.status === "pending_manager_review";

  const canApprove = isUnderReview && (user?.role === "reviewer" || user?.role === "administrator");
  const canManagerApprove = isPendingManagerReview && (user?.role === "manager" || user?.role === "administrator");
  const canReview = canApprove || canManagerApprove;

  const loadDecision = useCallback(async () => {
    try {
      const data = await getDecision(decisionId, tokens.access_token);
      setDecision(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [decisionId, tokens]);

  useEffect(() => {
    loadDecision();
  }, [loadDecision]);

async function handleSubmitForReview() {
    setActionError("");
    setSubmitting(true);
    try {
      await submitDecisionForReview(decisionId, tokens.access_token);
      await loadDecision();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApprove() {
    setActionError("");
    try {
      await approveDecision(decisionId, tokens.access_token);
      await loadDecision();
    } catch (err) {
      setActionError(err.message);
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) {
      setActionError("A reason is required when rejecting.");
      return;
    }
    setActionError("");
    setRejecting(true);
    try {
      await rejectDecision(decisionId, rejectReason, tokens.access_token);
      await loadDecision();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setRejecting(false);
      setShowRejectForm(false);
      setRejectReason("");
    }
  }

  async function handleToggleApprovals() {
    setShowApprovals(!showApprovals);
    if (!showApprovals) {
      setHistoryLoading(true);
      try {
        const data = await getDecisionApprovals(decisionId, tokens.access_token);
        setApprovalHistory(data);
      } catch {
        // ignore
      } finally {
        setHistoryLoading(false);
      }
    }
  }

  async function handleToggleActivity() {
    setShowActivity(!showActivity);
    if (!showActivity) {
      setAuditLoading(true);
      try {
        const data = await listAuditLogs(tokens.access_token, { decision_id: decisionId, limit: 100 });
        setAuditLogs(data.logs);
      } catch {
        // ignore
      } finally {
        setAuditLoading(false);
      }
    }
  }

  async function handleArchive() {
    setActionError("");
    if (!window.confirm("Archive this decision? This removes it from the active workflow.")) return;
    setArchiving(true);
    try {
      await archiveDecision(decisionId, tokens.access_token);
      await loadDecision();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setArchiving(false);
    }
  }

  async function handleRemoveAlternative(alternativeId) {
    setActionError("");
    try {
      await deleteAlternative(decisionId, alternativeId, tokens.access_token);
      await loadDecision();
    } catch (err) {
      setActionError(err.message);
    }
  }

  async function handleFileSelected(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setActionError("");
    setUploading(true);
    try {
      await uploadAttachment(decisionId, file, tokens.access_token);
      await loadDecision();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleRemoveAttachment(attachmentId) {
    setActionError("");
    try {
      await deleteAttachment(decisionId, attachmentId, tokens.access_token);
      await loadDecision();
    } catch (err) {
      setActionError(err.message);
    }
  }

  async function handleDownload(attachment) {
    // The download endpoint requires an auth header, which a plain <a href>
    // can't send — so we fetch it as an authenticated request and hand the
    // browser a local blob URL to save instead.
    const response = await fetch(attachmentDownloadUrl(decisionId, attachment.id), {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!response.ok) {
      setActionError("Could not download this file.");
      return;
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = attachment.filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="page">
        <Navbar />
        <main className="decision-details">
          <p className="decision-details__loading">Loading…</p>
        </main>
      </div>
    );
  }

  if (error || !decision) {
    return (
      <div className="page">
        <Navbar />
        <main className="decision-details">
          <div className="decision-details__error">{error || "Decision not found."}</div>
          <button className="decision-details__back" onClick={() => navigate("/decisions")}>
            ← Back to decisions
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="page">
      <Navbar />
      <main className="decision-details">
        <button className="decision-details__back" onClick={() => navigate("/decisions")}>
          ← Back to decisions
        </button>

        <div className="decision-details__header">
          <div>
            {decision.category && <p className="decision-details__category">{decision.category}</p>}
            <h1 className="decision-details__title">{decision.title}</h1>
          </div>
          <StatusBadge status={decision.status} />
        </div>

        <p className="decision-details__problem">{decision.problem_statement}</p>

        {actionError && <div className="decision-details__error">{actionError}</div>}

        {canEditNow && (
          <button className="submit-review-button" onClick={handleSubmitForReview} disabled={submitting}>
            {submitting ? "Submitting…" : "Submit for review"}
          </button>
        )}

        {canReview && (
          <div className="decision-details__approval">
            <h2 className="detail-section__title">Review Decision</h2>
            {showRejectForm ? (
              <div className="decision-details__reject-form">
                <textarea
                  placeholder="Reason for rejection…"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  autoFocus
                />
                <div>
                  <button className="submit-review-button" onClick={handleReject} disabled={rejecting}>
                    {rejecting ? "Rejecting…" : "Confirm Reject"}
                  </button>
                  <button
                    className="decision-details__back"
                    onClick={() => { setShowRejectForm(false); setRejectReason(""); setActionError(""); }}
                    style={{ marginLeft: "0.75rem" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button className="submit-review-button" onClick={handleApprove}>
                  Approve
                </button>
                <button
                  className="decision-details__back"
                  onClick={() => setShowRejectForm(true)}
                  style={{ marginLeft: "0.75rem", background: "transparent", color: "var(--text-ink)" }}
                >
                  Reject
                </button>
              </>
            )}
          </div>
        )}

        <button
          className="decision-details__back"
          onClick={handleToggleApprovals}
          style={{ marginTop: "1rem" }}
        >
          {showApprovals ? "Hide" : "Show"} Approval History
        </button>

        {isPrivileged && (
          <button
            className="decision-details__back"
            onClick={handleToggleActivity}
            style={{ marginLeft: "0.75rem", marginTop: "1rem" }}
          >
            {showActivity ? "Hide" : "Show"} Activity
          </button>
        )}

        {isPrivileged && ![null, "draft", "archived"].includes(decision.status) && (
          <button
            className="decision-details__back decision-details__archive"
            onClick={handleArchive}
            disabled={archiving}
            style={{ marginLeft: "0.75rem", marginTop: "1rem" }}
          >
            {archiving ? "Archiving…" : "Archive decision"}
          </button>
        )}

        {showActivity && isPrivileged && (
          <div className="decision-details__approval-history">
            <h2 className="detail-section__title">Activity</h2>
            {auditLoading ? (
              <p>Loading…</p>
            ) : auditLogs.length === 0 ? (
              <p>No activity recorded yet.</p>
            ) : (
              <ul className="activity-list">
                {auditLogs.map((log) => (
                  <li key={log.id} className="activity-list__item">
                    <span
                      className={`activity-list__badge activity-list__badge--${log.action.replace(/_/g, "-")}`}
                    >
                      {AUDIT_ACTION_LABELS[log.action] || log.action}
                    </span>
                    <span className="activity-list__details">{log.details}</span>
                    <span className="activity-list__actor">{log.actor_name}</span>
                    <span className="activity-list__time">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {showApprovals && (
          <div className="decision-details__approval-history">
            <h2 className="detail-section__title">Approval History</h2>
            {historyLoading ? (
              <p>Loading…</p>
            ) : approvalHistory.length === 0 ? (
              <p>No approval actions yet.</p>
            ) : (
              <ul className="alternative-list">
                {approvalHistory.map((entry) => (
                  <li key={entry.id} className="alternative-card">
                    <div className="alternative-card__header">
                      <span className={`status-badge status-badge--${entry.action}`}>
                        {entry.action}
                      </span>
                      <span className="decision-details__stage">
                        {entry.approval_stage}
                      </span>
                    </div>
                    {entry.reason && <p>{entry.reason}</p>}
                    <p className="alternative-card__cost">
                      {new Date(entry.created_at).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <section className="detail-section">
          <h2 className="detail-section__title">Alternatives</h2>
          {decision.alternatives.length === 0 ? (
            <p className="detail-section__empty">No alternatives added yet.</p>
          ) : (
            <ul className="alternative-list">
              {decision.alternatives.map((alt) => (
                <li key={alt.id} className="alternative-card">
                  <div className="alternative-card__header">
                    <h3 className="alternative-card__title">{alt.title}</h3>
                    {canEditNow && (
                      <button
                        className="alternative-card__remove"
                        onClick={() => handleRemoveAlternative(alt.id)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="alternative-card__grid">
                    {alt.pros && (
                      <div>
                        <span className="alternative-card__label">Pros</span>
                        <p>{alt.pros}</p>
                      </div>
                    )}
                    {alt.cons && (
                      <div>
                        <span className="alternative-card__label">Cons</span>
                        <p>{alt.cons}</p>
                      </div>
                    )}
                  </div>
                  {alt.estimated_cost != null && (
                    <p className="alternative-card__cost">Est. cost: ${alt.estimated_cost.toLocaleString()}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="detail-section">
          <h2 className="detail-section__title">Attachments</h2>
          {decision.attachments.length === 0 ? (
            <p className="detail-section__empty">No files attached yet.</p>
          ) : (
            <ul className="attachment-list">
              {decision.attachments.map((att) => (
                <li key={att.id} className="attachment-row">
                  <button className="attachment-row__name" onClick={() => handleDownload(att)}>
                    {att.filename}
                  </button>
                  <span className="attachment-row__size">{(att.size_bytes / 1024).toFixed(0)} KB</span>
                  {canEditNow && (
                    <button
                      className="attachment-row__remove"
                      onClick={() => handleRemoveAttachment(att.id)}
                    >
                      Remove
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {canEditNow && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelected}
                style={{ display: "none" }}
              />
              <button
                className="upload-button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? "Uploading…" : "+ Attach a file"}
              </button>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
