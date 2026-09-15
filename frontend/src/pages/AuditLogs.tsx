import { useEffect, useState } from "react";
import { AppLayout } from "../components/AppLayout";
import { api, type AuditLogEntry } from "../lib/api";

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<AuditLogEntry[]>("/audit-logs")
      .then(setLogs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout title="Audit Logs">
      <div className="page-header">
        <div>
          <h2>Audit trail</h2>
          <p>Every sensitive action, who performed it, and when.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading-row">Loading…</div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <h3>No audit entries yet</h3>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Action</th>
                <th>Entity</th>
                <th>Description</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <span className="role-badge">{log.action}</span>
                  </td>
                  <td>
                    {log.entity_type} #{log.entity_id}
                  </td>
                  <td>{log.description}</td>
                  <td>{new Date(log.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppLayout>
  );
}
