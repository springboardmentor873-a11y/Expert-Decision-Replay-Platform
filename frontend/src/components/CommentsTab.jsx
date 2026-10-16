import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../AuthContext.jsx";
import { useToast } from "../ToastContext.jsx";

function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

export default function CommentsTab({ decisionId }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setComments(await api.listComments(decisionId));
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decisionId]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim()) return;
    setBusy(true);
    try {
      await api.addComment(decisionId, { content });
      setContent("");
      load();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(commentId) {
    try {
      await api.deleteComment(decisionId, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  if (loading) return <div className="loading-text">Loading discussion…</div>;

  return (
    <div>
      <div className="section-title">{comments.length} comment{comments.length === 1 ? "" : "s"}</div>

      {comments.length === 0 ? (
        <div className="empty-state" style={{ marginBottom: 18 }}>
          <h3>No discussion yet</h3>
          <p>Add the rationale, meeting notes, or open questions here.</p>
        </div>
      ) : (
        <div style={{ marginBottom: 8 }}>
          {comments.map((c) => (
            <div className="comment" key={c.id}>
              <div className="comment-avatar">{initials(user?.full_name)}</div>
              <div className="comment-body">
                <div className="comment-head">
                  <span className="comment-author">{c.user_id === user?.id ? user.full_name : `User #${c.user_id}`}</span>
                  <span className="comment-time">{timeAgo(c.created_at)}</span>
                </div>
                <div className="comment-text">{c.content}</div>
                {c.user_id === user?.id && (
                  <button className="btn btn-danger" style={{ marginTop: 8, padding: "4px 10px", fontSize: 12 }} onClick={() => handleDelete(c.id)}>
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <form className="comment-form" onSubmit={handleSubmit}>
        <textarea
          rows={2}
          placeholder="Add a note, rationale, or question…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button className="btn btn-primary" type="submit" disabled={busy}>Post</button>
      </form>
    </div>
  );
}
