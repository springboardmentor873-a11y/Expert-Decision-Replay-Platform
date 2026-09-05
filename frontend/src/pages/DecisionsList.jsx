import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useToast } from "../ToastContext.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import NewDecisionModal from "../components/NewDecisionModal.jsx";

const CATEGORIES = ["All", "Architecture", "Infrastructure", "Security", "Process"];
const STATUSES = ["All", "Draft", "Under Review", "Approved", "Rejected", "Archived"];

export default function DecisionsList() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (category !== "All") params.category = category;
      if (status !== "All") params.status = status;
      const data = await api.listDecisions(params);
      setDecisions(data);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [category, status, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(payload) {
    const created = await api.createDecision(payload);
    setShowModal(false);
    showToast("Decision created.");
    navigate(`/decisions/${created.id}`);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Decisions</h1>
          <p>The organization's record of what was decided, why, and by whom.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New decision</button>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: "7px 10px", border: "1px solid var(--line)", borderRadius: 3 }}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c === "All" ? "All categories" : c}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ padding: "7px 10px", border: "1px solid var(--line)", borderRadius: 3 }}>
          {STATUSES.map((s) => <option key={s} value={s}>{s === "All" ? "All statuses" : s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="loading-text">Loading decisions…</div>
      ) : decisions.length === 0 ? (
        <div className="empty-state">
          <h3>No decisions yet</h3>
          <p>Start documenting a decision so the reasoning behind it isn't lost.</p>
        </div>
      ) : (
        <table className="decisions-table">
          <thead>
            <tr>
              <th>Decision</th>
              <th>Category</th>
              <th>Status</th>
              <th>Version</th>
            </tr>
          </thead>
          <tbody>
            {decisions.map((d) => (
              <tr key={d.id} onClick={() => navigate(`/decisions/${d.id}`)}>
                <td className="decision-title-cell">
                  {d.title}
                  <span className="meta">{new Date(d.created_at).toLocaleDateString()}</span>
                </td>
                <td>{d.category}</td>
                <td><StatusBadge status={d.status} /></td>
                <td>v{d.version}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <NewDecisionModal onClose={() => setShowModal(false)} onCreate={handleCreate} />
      )}
    </div>
  );
}
