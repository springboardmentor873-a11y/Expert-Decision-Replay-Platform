import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import StatusBadge from "../../components/StatusBadge/StatusBadge";
import { useAuth } from "../../context/AuthContext";
import { listDecisions } from "../../services/decision";
import "./Decisions.css";

export default function Decisions() {
  const { tokens } = useAuth();
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

        {error && <div className="decisions__error">{error}</div>}

        {loading ? (
          <p className="decisions__loading">Loading…</p>
        ) : decisions.length === 0 ? (
          <div className="decisions__empty">
            <p>No decisions yet.</p>
            <Link to="/decisions/new">Create the first one</Link>
          </div>
        ) : (
          <ul className="decisions__list">
            {decisions.map((decision) => (
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
