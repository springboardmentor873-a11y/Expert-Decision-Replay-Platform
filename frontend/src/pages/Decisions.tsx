import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { StatusBadge } from "../components/StatusBadge";
import { api, type Decision } from "../lib/api";

export function Decisions() {
  const navigate = useNavigate();
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    const qs = params.toString();
    api
      .get<Decision[]>(`/decisions${qs ? `?${qs}` : ""}`)
      .then(setDecisions)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timeout = setTimeout(load, 250);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  return (
    <AppLayout title="Decisions">
      <div className="page-header">
        <div>
          <h2>All decisions</h2>
          <p>Decisions you can access, based on your role.</p>
        </div>
        <Link className="btn btn-primary" to="/decisions/new">
          + New decision
        </Link>
      </div>

      <div className="card" style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
        <div className="field" style={{ flex: 1, marginBottom: 0 }}>
          <label>Search by title</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search decisions…"
          />
        </div>
        <div className="field" style={{ width: 200, marginBottom: 0 }}>
          <label>Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="Draft">Draft</option>
            <option value="Under Review">Under Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Archived">Archived</option>
          </select>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading-row">Loading decisions…</div>
        ) : decisions.length === 0 ? (
          <div className="empty-state">
            <h3>No decisions yet</h3>
            <p>Create your first decision to start building a record.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {decisions.map((d) => (
                <tr
                  key={d.id}
                  className="row-link"
                  onClick={() => navigate(`/decisions/${d.id}`)}
                >
                  <td>{d.title}</td>
                  <td>{d.category}</td>
                  <td>
                    <StatusBadge status={d.status} />
                  </td>
                  <td>{new Date(d.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppLayout>
  );
}
