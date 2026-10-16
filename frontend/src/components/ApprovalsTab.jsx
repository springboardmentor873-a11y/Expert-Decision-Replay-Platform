import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../AuthContext.jsx";
import { useToast } from "../ToastContext.jsx";

const CAN_MANAGE_APPROVALS = ["manager", "administrator"];

export default function ApprovalsTab({ decisionId }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const canManage = CAN_MANAGE_APPROVALS.includes(user?.role);

  const [steps, setSteps] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStartForm, setShowStartForm] = useState(false);
  const [selectedReviewers, setSelectedReviewers] = useState([""]);
  const [busy, setBusy] = useState(false);
  const [comments, setComments] = useState({}); // stepId -> comment text
  const [escalateTarget, setEscalateTarget] = useState({}); // stepId -> new reviewer id

  async function load() {
    setLoading(true);
    try {
      const stepData = await api.listApprovalSteps(decisionId);
      setSteps(stepData);
      if (canManage) {
        try {
          setUsers(await api.listUserDirectory());
        } catch {
          // Fall back silently — the reviewer picker just won't have names to show.
        }
      }
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decisionId]);

  function userLabel(userId) {
    const u = users.find((x) => x.id === userId);
    return u ? `${u.full_name} (${u.email})` : `User #${userId}`;
  }

  function isActionable(step, index) {
    if (step.status !== "Pending") return false;
    return steps.slice(0, index).every((s) => s.status === "Approved");
  }

  async function handleStartWorkflow(e) {
    e.preventDefault();
    const reviewerIds = selectedReviewers.map(Number).filter(Boolean);
    if (reviewerIds.length === 0) {
      showToast("Pick at least one reviewer.", "error");
      return;
    }
    setBusy(true);
    try {
      await api.createApprovalWorkflow(decisionId, reviewerIds);
      showToast("Approval workflow started.");
      setShowStartForm(false);
      setSelectedReviewers([""]);
      load();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleDecide(step, decision) {
    setBusy(true);
    try {
      await api.decideApprovalStep(decisionId, step.id, decision, comments[step.id] || "");
      showToast(decision === "approve" ? "Approved." : "Rejected.");
      load();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleEscalate(step) {
    const newReviewerId = Number(escalateTarget[step.id]);
    if (!newReviewerId) {
      showToast("Pick a reviewer to escalate to.", "error");
      return;
    }
    setBusy(true);
    try {
      await api.escalateApprovalStep(decisionId, step.id, newReviewerId);
      showToast("Step escalated to a new reviewer.");
      load();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="loading-text">Loading approval workflow…</div>;

  const hasPending = steps.some((s) => s.status === "Pending");

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div className="section-title" style={{ marginBottom: 0 }}>
          {steps.length === 0 ? "No approval workflow yet" : `${steps.length} approval level${steps.length === 1 ? "" : "s"}`}
        </div>
        {canManage && !hasPending && (
          <button className="btn" onClick={() => setShowStartForm((v) => !v)}>
            {showStartForm ? "Cancel" : steps.length ? "Start new workflow" : "Start approval workflow"}
          </button>
        )}
      </div>

      {showStartForm && (
        <form className="form-card" style={{ maxWidth: "none", marginBottom: 20 }} onSubmit={handleStartWorkflow}>
          <div className="field">
            <label>Reviewers, in approval order (level 1 first)</label>
            {selectedReviewers.map((val, i) => (
              <div className="form-row" key={i} style={{ marginTop: i > 0 ? 8 : 0 }}>
                <select
                  value={val}
                  onChange={(e) => {
                    const next = [...selectedReviewers];
                    next[i] = e.target.value;
                    setSelectedReviewers(next);
                  }}
                >
                  <option value="">Select a reviewer…</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      Level {i + 1} — {u.full_name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div className="modal-actions" style={{ justifyContent: "flex-start", gap: 10 }}>
            <button
              type="button"
              className="btn"
              onClick={() => setSelectedReviewers([...selectedReviewers, ""])}
            >
              + Add another level
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? "Starting…" : "Start workflow"}
            </button>
          </div>
        </form>
      )}

      {steps.length === 0 ? (
        <div className="empty-state">
          <h3>No approval workflow started</h3>
          <p>A manager or administrator can assign an ordered chain of reviewers to this decision.</p>
        </div>
      ) : (
        steps.map((step, index) => {
          const actionable = isActionable(step, index);
          const isMyStep = step.reviewer_id === user?.id;
          return (
            <div className="version-item" key={step.id} style={{ alignItems: "flex-start" }}>
              <div className="version-num">L{step.level}</div>
              <div style={{ flex: 1 }}>
                <div className="version-summary">
                  {canManage ? userLabel(step.reviewer_id) : `Reviewer #${step.reviewer_id}`}
                  {" — "}
                  <span
                    className={
                      step.status === "Approved"
                        ? "status-approved"
                        : step.status === "Rejected"
                        ? "status-rejected"
                        : step.status === "Skipped"
                        ? "status-archived"
                        : "status-under-review"
                    }
                  >
                    {step.status}
                  </span>
                </div>
                {step.comment && (
                  <div className="version-time" style={{ marginBottom: 4 }}>“{step.comment}”</div>
                )}
                <div className="version-time">
                  {step.decided_at
                    ? `Decided ${new Date(step.decided_at).toLocaleString()}`
                    : `Assigned ${new Date(step.created_at).toLocaleString()}`}
                </div>

                {isMyStep && actionable && (
                  <div style={{ marginTop: 10 }}>
                    <textarea
                      placeholder="Optional comment"
                      value={comments[step.id] || ""}
                      onChange={(e) => setComments({ ...comments, [step.id]: e.target.value })}
                      style={{ width: "100%", minHeight: 50, marginBottom: 8 }}
                    />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn btn-primary" disabled={busy} onClick={() => handleDecide(step, "approve")}>
                        Approve
                      </button>
                      <button className="btn btn-danger" disabled={busy} onClick={() => handleDecide(step, "reject")}>
                        Reject
                      </button>
                    </div>
                  </div>
                )}

                {canManage && step.status === "Pending" && (
                  <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
                    <select
                      value={escalateTarget[step.id] || ""}
                      onChange={(e) => setEscalateTarget({ ...escalateTarget, [step.id]: e.target.value })}
                      style={{ maxWidth: 260 }}
                    >
                      <option value="">Escalate to…</option>
                      {users
                        .filter((u) => u.id !== step.reviewer_id)
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.full_name} ({u.email})
                          </option>
                        ))}
                    </select>
                    <button className="btn" disabled={busy} onClick={() => handleEscalate(step)}>
                      Escalate
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
