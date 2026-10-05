import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext.jsx";

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleString();
}

export default function MyDiscussions() {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDiscussions() {
      setLoading(true);
      setError("");
      try {
        const decisions = await api.listDecisions();
        const results = await Promise.allSettled(
          decisions.map(async (decision) => {
            const decisionComments = await api.listComments(decision.id);
            return decisionComments.map((comment) => ({
              ...comment,
              decisionTitle: decision.title,
            }));
          })
        );
        const failedRequests = results.filter((result) => result.status === "rejected").length;
        const loadedComments = results
          .filter((result) => result.status === "fulfilled")
          .flatMap((result) => result.value)
          .sort((left, right) => new Date(right.created_at) - new Date(left.created_at));

        if (active) {
          setComments(loadedComments);
          if (failedRequests) {
            setError(`${failedRequests} decision discussion${failedRequests === 1 ? "" : "s"} could not be loaded.`);
          }
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDiscussions();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1>My Discussions</h1>
          <p>Your recent decision conversations and replies will appear here.</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-text">Loading discussions…</div>
      ) : error && comments.length === 0 ? (
        <div className="empty-state"><h3>Discussions could not be loaded</h3><p>{error}</p></div>
      ) : comments.length === 0 ? (
        <div className="empty-state">
          <h3>No discussions yet</h3>
          <p>Add a comment from a decision detail page to start a discussion.</p>
        </div>
      ) : (
        <>
          {error && <div className="error-text" role="status">{error} Showing available discussions.</div>}
          <div className="discussion-list">
            {comments.map((comment) => (
              <article className="discussion-item" key={`${comment.decision_id}-${comment.id}`}>
                <div className="discussion-meta">
                  <Link to={`/decisions/${comment.decision_id}`} className="discussion-decision">
                    {comment.decisionTitle}
                  </Link>
                  <span className="discussion-time">{formatDate(comment.created_at)}</span>
                </div>
                <p>{comment.content}</p>
                <span className="meta">
                  {comment.user_id === user?.id ? "You" : `User #${comment.user_id}`}
                </span>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
