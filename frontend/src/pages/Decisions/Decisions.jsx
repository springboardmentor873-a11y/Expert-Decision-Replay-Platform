import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import StatusBadge from "../../components/StatusBadge/StatusBadge";
import { useAuth } from "../../context/AuthContext";
import { listDecisions } from "../../services/decision";
import "./Decisions.css";

const STATUS_LABELS = {
  draft: "Draft",
  under_review: "Under Review",
  pending_manager_review: "Pending Manager Review",
  approved: "Approved",
  rejected: "Rejected",
  archived: "Archived",
};

export default function Decisions() {
  const { tokens } = useAuth();
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const activeStatus = searchParams.get("status");

  useEffect(() => {
    async function load() {
      try {
        const data = await listDecisions(tokens.access_token);
        setDecisions(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [tokens]);

  const visible = activeStatus
    ? decisions.filter((d) => d.status === activeStatus)
    : decisions;
  const statusLabel = STATUS_LABELS[activeStatus] || activeStatus;

  return (
    <div className="page">
      <Navbar />
      <main className="decisions">
        <div className="decisions__header">
          <div>
            <p className="decisions__eyebrow">All records</p>
            <h1 className="decisions__title">Decisions</h1>
          </div>
          <Link to="/decisions/new" className="decisions__new-button">
            New decision
          </Link>
        </div>

        {activeStatus && (
          <div className="decisions__filter">
            <span>
              Showing <strong>{statusLabel}</strong> ({visible.length})
            </span>
            <button
              className="decisions__filter-clear"
              onClick={() => setSearchParams({})}
            >
              Clear filter
            </button>
          </div>
        )}

        {error && <div className="decisions__error">{error}</div>}

        {loading ? (
          <p className="decisions__loading">Loading…</p>
        ) : visible.length === 0 && !error ? (
          <div className="decisions__empty">
            <p>{activeStatus ? "No decisions match this filter." : "No decisions yet."}</p>
            {!activeStatus && <Link to="/decisions/new">Create the first one</Link>}
          </div>
        ) : (
          <ul className="decisions__list">
            {visible.map((decision) => (
              <li key={decision.id} className="decisions__item">
                <Link to={`/decisions/${decision.id}`} className="decisions__item-link">
                  <div className="decisions__item-main">
                    <h2 className="decisions__item-title">{decision.title}</h2>
                    <p className="decisions__item-problem">{decision.problem_statement}</p>
                  </div>
                  <div className="decisions__item-meta">
                    {decision.category && (
                      <span className="decisions__item-category">{decision.category}</span>
                    )}
                    <StatusBadge status={decision.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
