import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useToast } from "../ToastContext.jsx";
import { useAuth } from "../AuthContext.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import NewDecisionModal from "../components/NewDecisionModal.jsx";

const CATEGORIES = ["All", "Architecture", "Infrastructure", "Security", "Process"];
const STATUSES = ["All", "Draft", "Under Review", "Approved", "Rejected", "Archived"];
const CAN_CREATE_DECISION = ["manager", "administrator"];

export default function DecisionsList({ scope }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const canCreate = CAN_CREATE_DECISION.includes(user?.role);

  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let data;
      if (scope === "team") {
        data = await api.listTeamDecisions();
        if (category !== "All") data = data.filter((d) => d.category === category);
        if (status !== "All") data = data.filter((d) => d.status === status);
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          data = data.filter(
            (d) =>
              d.title.toLowerCase().includes(q) ||
              (d.problem_statement && d.problem_statement.toLowerCase().includes(q)) ||
              (d.rationale && d.rationale.toLowerCase().includes(q))
          );
        }
      } else {
        const params = {};
        if (category !== "All") params.category = category;
        if (status !== "All") params.status = status;
        if (searchQuery.trim()) params.q = searchQuery.trim();
        data = await api.searchDecisions(params);
      }
      setDecisions(data || []);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [category, status, searchQuery, scope, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 200);
    return () => clearTimeout(timer);
  }, [load]);

  async function handleCreate(payload) {
    const created = await api.createDecision(payload);
    setShowModal(false);
    showToast("Decision documented successfully!");
    navigate(`/decisions/${created.id}`);
  }

  const filteredDecisions = decisions;

  return (
    <div className="teams-page-container">
      {/* Header */}
      <div className="teams-header-row">
        <div className="teams-title-section">
          <h1>Knowledge Repository & Decisions</h1>
          <p className="subtitle">
            Search, review, and track organizational decision history, context, and outcomes.
          </p>
        </div>
        {canCreate && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 16, height: 16 }}>
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>+ Document Decision</span>
          </button>
        )}
      </div>

      {/* Filter Controls Bar */}
      <div className="teams-filter-bar">
        <div className="teams-tabs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`tab-btn ${category === cat ? "active" : ""}`}
              onClick={() => setCategory(cat)}
            >
              {cat === "All" ? "All Categories" : cat}
            </button>
          ))}
        </div>

        <div className="filter-controls">
          <div className="search-input-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Filter decisions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="sort-dropdown-box">
            <span className="sort-label">Status:</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s === "All" ? "All Statuses" : s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Decisions List Container */}
      {loading ? (
        <div className="loading-state">Loading decisions from database...</div>
      ) : filteredDecisions.length === 0 ? (
        <div className="widget-card" style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>📖</div>
          <h3 style={{ fontSize: 16, color: "#0f172a" }}>No decisions found</h3>
          <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
            {canCreate ? "Click '+ Document Decision' to create the first record." : "Try clearing filters."}
          </p>
        </div>
      ) : (
        <div className="widget-card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="decisions-table-wrapper">
            <table className="decisions-custom-table">
              <thead>
                <tr>
                  <th>Decision Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Version</th>
                  <th>Created Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredDecisions.map((d) => (
                  <tr key={d.id} onClick={() => navigate(`/decisions/${d.id}`)} className="table-row-hover">
                    <td className="title-cell">
                      <div className="title-text">{d.title}</div>
                      <div className="title-subtext">ID: #{d.id} · Created by User #{d.created_by_user_id}</div>
                    </td>
                    <td>
                      <span className="category-pill">{d.category || "General"}</span>
                    </td>
                    <td>
                      <StatusBadge status={d.status} />
                    </td>
                    <td>
                      <span className="version-tag">v{d.version}</span>
                    </td>
                    <td className="date-cell">
                      {new Date(d.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td style={{ textAlign: "right", paddingRight: 20 }}>
                      <span className="arrow-btn">›</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <NewDecisionModal onClose={() => setShowModal(false)} onCreate={handleCreate} />
      )}
    </div>
  );
}
