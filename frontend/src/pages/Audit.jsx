import { useCallback, useEffect, useState } from "react";
import { auditService } from "../services/auditService";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";

const PAGE_SIZE = 25;

export default function Audit() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchLogs = useCallback((nextOffset = 0, append = false) => {
    setLoading(true);
    setError(false);
    const params = { limit: PAGE_SIZE, offset: nextOffset };
    if (search) params.search = search;
    if (action) params.action = action;

    auditService
      .list(params)
      .then(({ data }) => {
        setLogs((prev) => (append ? [...prev, ...data] : data));
        setHasMore(data.length === PAGE_SIZE);
        setOffset(nextOffset);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [search, action]);

  useEffect(() => {
    const t = setTimeout(() => fetchLogs(0, false), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, action]);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Audit Log</h1>
        <p className="page-subtitle">Security-sensitive events across the platform.</p>
      </div>

      <div className="toolbar">
        <input
          className="search-input"
          placeholder="Search actor email or details"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          className="search-input"
          placeholder="Filter by action (e.g. login)"
          value={action}
          onChange={(e) => setAction(e.target.value)}
        />
      </div>

      {loading && logs.length === 0 ? (
        <LoadingState label="Loading audit log..." />
      ) : error ? (
        <ErrorState message="Couldn't load the audit log." onRetry={() => fetchLogs(0, false)} />
      ) : logs.length === 0 ? (
        <EmptyState title="No matching audit events" />
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Details</th>
                  <th>IP address</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((row) => (
                  <tr key={row.id}>
                    <td>{new Date(row.created_at).toLocaleString()}</td>
                    <td>{row.actor_email || "—"}</td>
                    <td><code>{row.action}</code></td>
                    <td>{row.details || "—"}</td>
                    <td>{row.ip_address || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {hasMore && (
            <div className="load-more">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={loading}
                onClick={() => fetchLogs(offset + PAGE_SIZE, true)}
              >
                {loading ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
