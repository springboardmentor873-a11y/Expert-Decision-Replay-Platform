import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext.jsx";
import { useToast } from "../ToastContext.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import AlternativesTab from "../components/AlternativesTab.jsx";
import CommentsTab from "../components/CommentsTab.jsx";
import AttachmentsTab from "../components/AttachmentsTab.jsx";
import VersionsTab from "../components/VersionsTab.jsx";

const STATUSES = ["Draft", "Under Review", "Approved", "Rejected", "Archived"];
const TABS = ["Alternatives", "Discussion", "Files", "Version history"];
const PRIVILEGED_ROLES = ["reviewer", "manager", "administrator"];

export default function DecisionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [decision, setDecision] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("Alternatives");
  const [changingStatus, setChangingStatus] = useState(false);
  const [workflowAction, setWorkflowAction] = useState("");

  async function load() {
    setLoading(true);
    try {
      setDecision(await api.getDecision(id));
      if (["manager", "administrator"].includes(user?.role)) {
        setActivity(await api.listAuditLogs(id));
      } else {
        setActivity([]);
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
  }, [id, user?.role]);

  async function handleWorkflowAction(action) {
    setWorkflowAction(action);
    try {
      const actionApi = {
        submit: api.submitDecision,
        approve: api.approveDecision,
        reject: api.rejectDecision,
      }[action];
      const updated = await actionApi(id);
      setDecision(updated);
      if (["manager", "administrator"].includes(user?.role)) {
        setActivity(await api.listAuditLogs(id));
      }
      const message = {
        submit: "Decision submitted for review.",
        approve: "Decision approved.",
        reject: "Decision rejected.",
      }[action];
      showToast(message);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setWorkflowAction("");
    }
  }

  async function handleStatusChange(newStatus) {
    setChangingStatus(true);
    try {
      const updated = await api.updateDecision(id, {
        status: newStatus,
        change_summary: `Status changed to ${newStatus}`,
      });
      setDecision(updated);
      showToast(`Marked as ${newStatus}.`);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setChangingStatus(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this decision permanently? This cannot be undone.")) return;
    try {
      await api.deleteDecision(id);
      showToast("Decision deleted.");
      navigate("/");
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  if (loading) return <div className="loading-text">Loading decision…</div>;
  if (!decision) return null;

  const isCreator = decision.created_by_id === user?.id;
  const isPrivileged = PRIVILEGED_ROLES.includes(user?.role);
  const canApprove = ["reviewer", "manager", "administrator"].includes(user?.role);
  const canEdit = isCreator || isPrivileged;
  const canDelete = user?.role === "administrator";

  return (
    <div>
      <Link to="/" style={{ fontSize: 13, color: "var(--ink-soft)", textDecoration: "none" }}>← All decisions</Link>

      <div className="detail-head" style={{ marginTop: 14 }}>
        <span className="cat">{decision.category} · v{decision.version}</span>
        <h1>{decision.title}</h1>
        <p className="decision-team-label">Team: {decision.team_name || "No team assigned"}</p>
      </div>

      <div className="detail-meta-row">
        <StatusBadge status={decision.status} />
        {canEdit && (
          <select
            value=""
            onChange={(e) => e.target.value && handleStatusChange(e.target.value)}
            disabled={changingStatus}
            style={{ padding: "6px 10px", border: "1px solid var(--line)", borderRadius: 3, fontSize: 13 }}
          >
            <option value="">Change status…</option>
            {STATUSES.filter((s) => s !== decision.status).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        )}
        {!canEdit && (
          <span style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>
            Only the creator, a reviewer, a manager, or an administrator can change this.
          </span>
        )}
        {canDelete && (
          <button className="btn btn-danger" style={{ marginLeft: "auto" }} onClick={handleDelete}>Delete decision</button>
        )}
      </div>

      {decision.status === "Draft" && isCreator && (
        <div className="panel" style={{ marginTop: 18 }}>
          <div className="panel-header">
            <div>
              <h2>Ready for review?</h2>
              <p style={{ margin: "4px 0 0", color: "var(--ink-soft)" }}>
                Submit this draft to notify managers that it is ready for review.
              </p>
            </div>
            <button
              className="btn btn-primary"
              type="button"
              disabled={Boolean(workflowAction)}
              onClick={() => handleWorkflowAction("submit")}
            >
              {workflowAction === "submit" ? "Submitting…" : "Submit for Review"}
            </button>
          </div>
        </div>
      )}

      {decision.status === "Under Review" && canApprove && (
        <div className="panel" style={{ marginTop: 18 }}>
          <div className="panel-header">
            <div>
              <h2>Decision review</h2>
              <p style={{ margin: "4px 0 0", color: "var(--ink-soft)" }}>
                Record the review outcome for this decision.
              </p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="btn btn-primary"
                type="button"
                disabled={Boolean(workflowAction)}
                onClick={() => handleWorkflowAction("approve")}
              >
                {workflowAction === "approve" ? "Approving…" : "Approve"}
              </button>
              <button
                className="btn btn-danger"
                type="button"
                disabled={Boolean(workflowAction)}
                onClick={() => handleWorkflowAction("reject")}
              >
                {workflowAction === "reject" ? "Rejecting…" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {decision.problem_statement && (
        <div className="problem-block">
          <strong>Problem statement</strong>
          {decision.problem_statement}
        </div>
      )}

      {activity.length > 0 && (
        <div className="panel" style={{ marginTop: 18 }}>
          <div className="panel-header">
            <h2>Activity</h2>
          </div>
          <div className="discussion-list">
            {activity.map((entry) => (
              <div className="discussion-item" key={entry.id}>
                <div className="discussion-meta">
                  <span className="discussion-decision">{entry.action.replaceAll("_", " ")}</span>
                  <span className="discussion-time">{new Date(entry.created_at).toLocaleString()}</span>
                </div>
                <p>{entry.details || "Decision activity recorded."}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "Alternatives" && <AlternativesTab decisionId={id} />}
      {tab === "Discussion" && <CommentsTab decisionId={id} />}
      {tab === "Files" && <AttachmentsTab decisionId={id} />}
      {tab === "Version history" && <VersionsTab decisionId={id} />}
    </div>
  );
}
