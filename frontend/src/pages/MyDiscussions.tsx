import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { api, relativeTime, type MyDiscussion } from "../lib/api";

export function MyDiscussions() {
  const [discussions, setDiscussions] = useState<MyDiscussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get<MyDiscussion[]>("/discussions/mine")
      .then(setDiscussions)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = discussions.filter(
    (d) =>
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.decision_title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout title="My Discussions">
      <div className="page-header">
        <div>
          <h2>My Discussions</h2>
          <p>All discussion threads you've started or replied in.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div style={{ marginBottom: 16 }}>
        <input
          className="field input"
          placeholder="Search discussions…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 360, padding: "9px 12px", border: "1px solid var(--slate-200)", borderRadius: "var(--radius-sm)" }}
        />
      </div>

      {loading && <div className="loading-row"><div className="spinner" /></div>}

      {!loading && filtered.length === 0 && (
        <div className="empty-state">
          <h3>No discussions found</h3>
          <p>Start a discussion on any decision page.</p>
        </div>
      )}

      {filtered.map((d) => (
        <div className="discussion-card" key={d.id}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div className="discussion-card-title">{d.title}</div>
              <div className="discussion-card-sub" style={{ marginTop: 4 }}>
                On decision:&nbsp;
                <Link to={`/decisions/${d.decision_id}`} style={{ fontWeight: 600 }}>
                  {d.decision_title}
                </Link>
              </div>
              <div className="text-sm text-muted" style={{ marginTop: 6 }}>
                {d.reply_count} {d.reply_count === 1 ? "reply" : "replies"} · by {d.author_name}
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div className="text-sm text-muted">{relativeTime(d.updated_at)}</div>
              <Link
                className="btn btn-secondary btn-sm"
                to={`/decisions/${d.decision_id}`}
                style={{ marginTop: 8, display: "inline-block" }}
              >
                Open →
              </Link>
            </div>
          </div>
        </div>
      ))}
    </AppLayout>
  );
}
