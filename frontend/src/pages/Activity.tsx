import { useEffect, useState } from "react";
import { AppLayout } from "../components/AppLayout";
import { api, type ActivityEntry } from "../lib/api";

export function ActivityPage() {
  const [items, setItems] = useState<ActivityEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<ActivityEntry[]>("/activities")
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout title="Activity">
      <div className="page-header">
        <div>
          <h2>Activity feed</h2>
          <p>A plain-language history of what's been happening.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        {loading ? (
          <div className="loading-row">Loading…</div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <h3>No activity yet</h3>
          </div>
        ) : (
          items.map((item) => (
            <div className="comment" key={item.id}>
              <div className="comment-meta">
                <strong>{item.action}</strong> · {new Date(item.created_at).toLocaleString()}
              </div>
              <div>{item.description}</div>
            </div>
          ))
        )}
      </div>
    </AppLayout>
  );
}
