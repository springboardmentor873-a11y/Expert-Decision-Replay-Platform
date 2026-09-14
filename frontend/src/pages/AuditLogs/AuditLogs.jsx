import { useCallback, useEffect, useState } from "react";
import Navbar from "../../components/Navbar/Navbar";
import { useAuth } from "../../context/AuthContext";
import { AUDIT_ACTION_LABELS, listAuditLogs } from "../../services/audit";
import { listDecisions } from "../../services/decision";
import { listUsers } from "../../services/users";
import "./AuditLogs.css";

const ACTION_LABELS = AUDIT_ACTION_LABELS;

const PAGE_SIZE = 25;

export default function AuditLogs() {
  const { tokens } = useAuth();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [action, setAction] = useState("");
  const [decisionId, setDecisionId] = useState("");
  const [actorId, setActorId] = useState("");
  const [decisions, setDecisions] = useState([]);
  const [users, setUsers] = useState([]);
  const [filtersApplied, setFiltersApplied] = useState(false);

  const load = useCallback(
    async (nextOffset = 0, filters = {}) => {
      setLoading(true);
      setError("");
      try {
        const params = { limit: PAGE_SIZE, offset: nextOffset, ...filters };
        const data = await listAuditLogs(tokens.access_token, params);
        setLogs(data.logs);
        setTotal(data.total);
        setOffset(nextOffset);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [tokens]
  );

  const loadOptions = useCallback(async () => {
    try {
      const [decisionData, userData] = await Promise.all([
        listDecisions(tokens.access_token),
        listUsers(tokens.access_token),
      ]);
      setDecisions(decisionData);
      setUsers(userData);
    } catch {
      // options are a nicety; the list itself still works without them
    }
  }, [tokens]);

  useEffect(() => {
    load(0);
    loadOptions();
  }, [load, loadOptions]);

  function handleApplyFilters() {
    const filters = {};
    if (action) filters.action = action;
    if (decisionId) filters.decision_id = decisionId;
    if (actorId) filters.actor_id = actorId;
    setFiltersApplied(Boolean(action || decisionId || actorId));
    load(0, filters);
  }

  function handleClearFilters() {
    setAction("");
    setDecisionId("");
    setActorId("");
    setFiltersApplied(false);
    load(0, {});
  }

  const activeFilters = Boolean(action || decisionId || actorId);
  const currentFilters = () => {
    const filters = {};
    if (action) filters.action = action;
    if (decisionId) filters.decision_id = decisionId;
    if (actorId) filters.actor_id = actorId;
    return filters;
  };

  return (
    <div className="page">
      <Navbar />
      <main className="audit-logs">
        <div className="audit-logs__header">
          <h1 className="audit-logs__title">Audit Logs</h1>
          <p className="audit-logs__subtitle">Immutable record of decision activity</p>
        </div>

        <div className="audit-logs__filters">
          <select value={action} onChange={(e) => setAction(e.target.value)}>
            <option value="">All actions</option>
            {Object.entries(ACTION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select value={decisionId} onChange={(e) => setDecisionId(e.target.value)}>
            <option value="">All decisions</option>
            {decisions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>
          <select value={actorId} onChange={(e) => setActorId(e.target.value)}>
            <option value="">All users</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name}
              </option>
            ))}
          </select>
          <button
            className="audit-logs__button audit-logs__button--primary"
            onClick={handleApplyFilters}
            disabled={!activeFilters}
          >
            Apply
          </button>
          {filtersApplied && (
            <button className="audit-logs__button" onClick={handleClearFilters}>
              Clear
            </button>
          )}
        </div>

        {error && <div className="audit-logs__error">{error}</div>}

        {loading ? (
          <p className="audit-logs__loading">Loading…</p>
        ) : logs.length === 0 ? (
          <div className="audit-logs__empty">
            <p>No audit log entries match the current view.</p>
          </div>
        ) : (
          <>
            <table className="audit-logs__table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Action</th>
                  <th>User</th>
                  <th>Decision</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="audit-logs__cell-time">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td>
                      <span className={`audit-logs__badge audit-logs__badge--${log.action.replace(/_/g, "-")}`}>
                        {ACTION_LABELS[log.action] || log.action}
                      </span>
                    </td>
                    <td>{log.actor_name || log.actor_id}</td>
                    <td>{log.decision_title || log.decision_id}</td>
                    <td className="audit-logs__cell-details">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="audit-logs__pagination">
              <span>
                Showing {offset + 1}–{Math.min(offset + logs.length, total)} of {total}
              </span>
              <div className="audit-logs__pagination-buttons">
                <button
                  className="audit-logs__button"
                  onClick={() => load(Math.max(0, offset - PAGE_SIZE), currentFilters())}
                  disabled={offset === 0 || loading}
                >
                  ← Prev
                </button>
                <button
                  className="audit-logs__button"
                  onClick={() => load(offset + PAGE_SIZE, currentFilters())}
                  disabled={offset + logs.length >= total || loading}
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}