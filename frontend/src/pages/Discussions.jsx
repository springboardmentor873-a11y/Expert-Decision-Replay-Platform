import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext.jsx";
import { useToast } from "../ToastContext.jsx";

export default function Discussions() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [decisions, setDecisions] = useState([]);
  const [selectedDecisionId, setSelectedDecisionId] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loadingDecisions, setLoadingDecisions] = useState(true);
  const [loadingComments, setLoadingComments] = useState(false);
  const [posting, setPosting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadDecisions = useCallback(async () => {
    setLoadingDecisions(true);
    try {
      const data = await api.listDecisions();
      setDecisions(data || []);
      if (data && data.length > 0 && !selectedDecisionId) {
        setSelectedDecisionId(data[0].id);
      }
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoadingDecisions(false);
    }
  }, [selectedDecisionId, showToast]);

  const loadComments = useCallback(async (decisionId) => {
    if (!decisionId) return;
    setLoadingComments(true);
    try {
      const list = await api.listComments(decisionId);
      setComments(list || []);
    } catch {
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  }, []);

  useEffect(() => {
    loadDecisions();
  }, [loadDecisions]);

  useEffect(() => {
    if (selectedDecisionId) {
      loadComments(selectedDecisionId);
    }
  }, [selectedDecisionId, loadComments]);

  async function handleAddComment(e) {
    e.preventDefault();
    if (!newComment.trim() || !selectedDecisionId) return;
    setPosting(true);
    try {
      await api.addComment(selectedDecisionId, { content: newComment });
      showToast("Comment posted to discussion thread!");
      setNewComment("");
      loadComments(selectedDecisionId);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setPosting(false);
    }
  }

  async function handleDeleteComment(commentId) {
    if (!selectedDecisionId) return;
    try {
      await api.deleteComment(selectedDecisionId, commentId);
      showToast("Comment deleted.");
      loadComments(selectedDecisionId);
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  const selectedDecision = decisions.find((d) => d.id === selectedDecisionId);

  const filteredDecisions = decisions.filter((d) =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.category && d.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="teams-page-container">
      {/* Page Header */}
      <div className="teams-header-row">
        <div className="teams-title-section">
          <h1>Discussion Threads & Rationale</h1>
          <p className="subtitle">
            Collaborate on decisions, share meeting notes, trade-offs, and decision rationale.
          </p>
        </div>
      </div>

      {/* Main Grid: Left Decision Threads List, Right Active Comment Stream */}
      <div className="bottom-widgets-grid" style={{ gridTemplateColumns: "340px 1fr" }}>
        {/* Left: Decision Threads List */}
        <div className="widget-card" style={{ padding: 18 }}>
          <div className="widget-header" style={{ marginBottom: 14 }}>
            <h3>💬 Decision Threads</h3>
            <span className="members-count">{decisions.length} Threads</span>
          </div>

          <div className="search-input-box" style={{ width: "100%", marginBottom: 14 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Search threads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {loadingDecisions ? (
            <div style={{ color: "#94a3b8", fontSize: 13, padding: 20, textAlign: "center" }}>
              Loading decision threads...
            </div>
          ) : filteredDecisions.length === 0 ? (
            <div style={{ color: "#94a3b8", fontSize: 13, padding: 20, textAlign: "center" }}>
              No decision threads found.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 520, overflowY: "auto" }}>
              {filteredDecisions.map((d) => (
                <div
                  key={d.id}
                  onClick={() => setSelectedDecisionId(d.id)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: selectedDecisionId === d.id ? "#eff6ff" : "#f8fafc",
                    border: `1px solid ${selectedDecisionId === d.id ? "#bfdbfe" : "#f1f5f9"}`,
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: selectedDecisionId === d.id ? "#1d4ed8" : "#0f172a" }}>
                    {d.title}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "#64748b", marginTop: 4 }}>
                    <span>{d.category || "General"}</span>
                    <span className="status-pill green" style={{ fontSize: 10, padding: "1px 6px" }}>{d.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Active Discussion Stream */}
        <div className="widget-card">
          {selectedDecision ? (
            <>
              <div className="widget-header" style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: 14 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <h3>{selectedDecision.title}</h3>
                    <span className="status-pill green">{selectedDecision.status}</span>
                  </div>
                  <p style={{ fontSize: 12.5, color: "#64748b", marginTop: 4 }}>
                    Category: <strong>{selectedDecision.category || "General"}</strong> · Decision ID: #{selectedDecision.id}
                  </p>
                </div>
                <Link to={`/decisions/${selectedDecision.id}`} className="btn btn-sm btn-secondary">
                  View Full Detail →
                </Link>
              </div>

              {/* Problem Statement Banner */}
              {selectedDecision.problem_statement && (
                <div style={{ background: "#f8fafc", padding: 14, borderRadius: 10, border: "1px solid #e2e8f0", margin: "14px 0" }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: 4 }}>
                    Problem Statement & Rationale
                  </div>
                  <p style={{ fontSize: 13, color: "#1e293b", lineHeight: 1.5 }}>
                    {selectedDecision.problem_statement}
                  </p>
                </div>
              )}

              {/* Discussion Comments Stream */}
              <div style={{ marginTop: 14 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>
                  Discussion Comments ({comments.length})
                </h4>

                {loadingComments ? (
                  <div style={{ color: "#94a3b8", fontSize: 13, padding: 20 }}>Loading comments...</div>
                ) : comments.length === 0 ? (
                  <div style={{ background: "#f8fafc", padding: 20, borderRadius: 10, textStyle: "italic", color: "#94a3b8", fontSize: 13 }}>
                    No comments posted yet on this thread. Be the first to add your thoughts below!
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                    {comments.map((c) => (
                      <div
                        key={c.id}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: 10,
                          padding: 14,
                          boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div className="avatar-circle" style={{ width: 28, height: 28, fontSize: 11 }}>
                              {c.user_name ? c.user_name.slice(0, 2).toUpperCase() : "U"}
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                              {c.user_name || `User #${c.user_id}`}
                            </span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 11.5, color: "#94a3b8" }}>
                              {new Date(c.created_at).toLocaleString()}
                            </span>
                            {c.user_id === user?.id && (
                              <button
                                style={{ color: "#ef4444", fontSize: 12, fontWeight: 600 }}
                                onClick={() => handleDeleteComment(c.id)}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                        <p style={{ fontSize: 13, color: "#334155", lineHeight: 1.5, paddingLeft: 36 }}>
                          {c.content || c.comment}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Comment Form */}
                <form onSubmit={handleAddComment} style={{ display: "flex", gap: 10, marginTop: 16 }}>
                  <input
                    type="text"
                    placeholder="Write a comment or decision rationale..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    style={{
                      flex: 1,
                      border: "1px solid var(--border-light)",
                      borderRadius: 10,
                      padding: "10px 14px",
                      fontSize: 13.5,
                      outline: "none"
                    }}
                    required
                  />
                  <button type="submit" className="btn btn-primary" disabled={posting}>
                    {posting ? "Posting..." : "Post Comment"}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>
              Select a decision thread from the left list to view discussion comments.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
