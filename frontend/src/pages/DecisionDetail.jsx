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
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("Alternatives");
  const [changingStatus, setChangingStatus] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setDecision(await api.getDecision(id));
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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
  const canEdit = isCreator || isPrivileged;
  const canDelete = user?.role === "administrator";

  return (
    <div>
      <Link to="/" style={{ fontSize: 13, color: "var(--ink-soft)", textDecoration: "none" }}>← All decisions</Link>

      <div className="detail-head" style={{ marginTop: 14 }}>
        <span className="cat">{decision.category} · v{decision.version}</span>
        <h1>{decision.title}</h1>
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

      {decision.problem_statement && (
        <div className="problem-block">
          <strong>Problem statement</strong>
          {decision.problem_statement}
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
