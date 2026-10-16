import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api, downloadFile } from "../api";
import { useAuth } from "../AuthContext.jsx";
import { useToast } from "../ToastContext.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import AlternativesTab from "../components/AlternativesTab.jsx";
import CommentsTab from "../components/CommentsTab.jsx";
import AttachmentsTab from "../components/AttachmentsTab.jsx";
import VersionsTab from "../components/VersionsTab.jsx";
import ApprovalsTab from "../components/ApprovalsTab.jsx";

const STATUSES = ["Draft", "Under Review", "Approved", "Rejected", "Archived"];
const TABS = ["Alternatives", "Discussion", "Files", "Version history", "Approvals"];
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
  const [showAiCard, setShowAiCard] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);

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

  async function fetchAiSummary() {
    if (aiSummary) {
      setShowAiCard(!showAiCard);
      return;
    }
    setLoadingAi(true);
    try {
      const summary = await api.getDecisionAiSummary(id);
      setAiSummary(summary);
      setShowAiCard(true);
    } catch (err) {
      showToast(err.message || "Failed to load AI Insights", "error");
    } finally {
      setLoadingAi(false);
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
      <Link to="/" style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}>← All decisions</Link>

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
            style={{ padding: "6px 10px", border: "1px solid var(--border-light)", borderRadius: 3, fontSize: 13 }}
          >
            <option value="">Change status…</option>
            {STATUSES.filter((s) => s !== decision.status).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        )}
        {!canEdit && (
          <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
            Only the creator, a reviewer, a manager, or an administrator can change this.
          </span>
        )}
        {canDelete && (
          <button className="btn btn-danger" style={{ marginLeft: "auto" }} onClick={handleDelete}>Delete decision</button>
        )}
        <button
          className="btn btn-secondary"
          style={{ marginLeft: canDelete ? 10 : "auto", display: "inline-flex", alignItems: "center", gap: 6 }}
          onClick={async () => {
            try {
              await downloadFile(api.exportDecisionPdfPath(id), `decision_${id}_report.pdf`);
              showToast("PDF report downloaded successfully!");
            } catch (err) {
              showToast(err.message, "error");
            }
          }}
        >
          <span>📄 Export PDF</span>
        </button>
      </div>

      {decision.problem_statement && (
        <div className="problem-block">
          <strong>Problem statement</strong>
          {decision.problem_statement}
        </div>
      )}

      {/* Milestone 4 Phase 5: AI Insights Card Toggle */}
      <div style={{ margin: "14px 0" }}>
        <button
          className="btn btn-secondary"
          onClick={fetchAiSummary}
          disabled={loadingAi}
          style={{
            background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
            color: "#1e40af",
            border: "1px solid #bfdbfe",
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>🤖 {loadingAi ? "Generating AI Insights..." : showAiCard ? "Hide AI Analysis" : "Generate AI Insights"}</span>
        </button>

        {showAiCard && aiSummary && (
          <div
            style={{
              marginTop: 12,
              padding: 18,
              background: "#ffffff",
              borderRadius: 10,
              border: "1px solid #bfdbfe",
              boxShadow: "0 4px 12px rgba(30, 64, 175, 0.08)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h4 style={{ margin: 0, fontSize: 15, color: "#1e3a8a", display: "flex", alignItems: "center", gap: 6 }}>
                💡 Executive AI Analysis & Recommendation
              </h4>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "3px 10px",
                  borderRadius: 12,
                  backgroundColor: aiSummary.risk_assessment.risk_level === "Low" ? "#dcfce7" : "#fef3c7",
                  color: aiSummary.risk_assessment.risk_level === "Low" ? "#166534" : "#92400e",
                }}
              >
                Risk: {aiSummary.risk_assessment.risk_level} ({aiSummary.risk_assessment.average_risk_score}/10)
              </span>
            </div>
            <p style={{ fontSize: 13.5, color: "#334155", lineHeight: 1.5, margin: "6px 0 12px 0" }}>
              {aiSummary.executive_summary}
            </p>
            <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: 6, borderLeft: "3px solid #3b82f6" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4, textTransform: "uppercase" }}>
                Key Technical Insights
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#1e293b" }}>
                {aiSummary.key_insights.map((insight, idx) => (
                  <li key={idx} style={{ marginBottom: 3 }}>{insight}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "Alternatives" && <AlternativesTab decisionId={id} />}
      {tab === "Discussion" && <CommentsTab decisionId={id} />}
      {tab === "Files" && <AttachmentsTab decisionId={id} />}
      {tab === "Version history" && <VersionsTab decisionId={id} />}
      {tab === "Approvals" && <ApprovalsTab decisionId={id} />}
    </div>
  );
}
