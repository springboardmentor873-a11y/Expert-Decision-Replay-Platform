import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { API_BASE, getCurrentUser } from "../api";
import "./Workspace.css";

const CATEGORY_OPTIONS = [
  "Technology",
  "Finance",
  "Hiring",
  "Product",
  "Operations",
  "Strategy",
  "Other",
];

function statusClass(status) {
  return `status-badge status-${(status || "Draft").replaceAll(" ", "-")}`;
}

function DecisionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getCurrentUser();

  const [decision, setDecision] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [comments, setComments] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [history, setHistory] = useState([]);

  const [tab, setTab] = useState("alternatives");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [altName, setAltName] = useState("");
  const [altDesc, setAltDesc] = useState("");

  const [commentText, setCommentText] = useState("");
  const [isMeetingNote, setIsMeetingNote] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editProblem, setEditProblem] = useState("");
  const [editReasoning, setEditReasoning] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  // =========================
  // LOAD DECISION DATA
  // =========================
  const loadAll = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        decisionRes,
        alternativesRes,
        commentsRes,
        documentsRes,
        historyRes,
      ] = await Promise.all([
        fetch(`${API_BASE}/decisions/${id}`),
        fetch(`${API_BASE}/decisions/${id}/alternatives`),
        fetch(`${API_BASE}/decisions/${id}/comments`),
        fetch(`${API_BASE}/decisions/${id}/documents`),
        fetch(`${API_BASE}/decisions/${id}/history`),
      ]);

      if (!decisionRes.ok) {
        setError("Decision not found");
        setLoading(false);
        return;
      }

      const decisionData = await decisionRes.json();

      setDecision(decisionData);
      setEditTitle(decisionData.title || "");
      setEditProblem(decisionData.problem || "");
      setEditReasoning(decisionData.reasoning || "");
      setEditCategory(decisionData.category || "");

      setAlternatives(
        alternativesRes.ok ? await alternativesRes.json() : []
      );

      setComments(commentsRes.ok ? await commentsRes.json() : []);

      setDocuments(
        documentsRes.ok ? await documentsRes.json() : []
      );

      setHistory(historyRes.ok ? await historyRes.json() : []);

      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Cannot connect to backend");
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [id]);

  // =========================
  // ADD ALTERNATIVE
  // =========================
  const handleAddAlternative = async (e) => {
    e.preventDefault();

    if (!altName.trim()) return;

    try {
      const response = await fetch(
        `${API_BASE}/decisions/${id}/alternatives`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: altName.trim(),
            description: altDesc.trim(),
          }),
        }
      );

      if (!response.ok) {
        alert("Could not add alternative");
        return;
      }

      setAltName("");
      setAltDesc("");
      await loadAll();
    } catch (err) {
      console.error(err);
      alert("Cannot connect to backend");
    }
  };

  // =========================
  // DELETE ALTERNATIVE
  // =========================
  const handleDeleteAlternative = async (altId) => {
    if (!window.confirm("Remove this alternative?")) return;

    try {
      await fetch(`${API_BASE}/alternatives/${altId}`, {
        method: "DELETE",
      });

      await loadAll();
    } catch (err) {
      console.error(err);
    }
  };

  // =========================
  // ADD COMMENT
  // =========================
  const handleAddComment = async (e) => {
    e.preventDefault();

    if (!commentText.trim()) return;

    try {
      const response = await fetch(
        `${API_BASE}/decisions/${id}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: commentText.trim(),
            is_meeting_note: isMeetingNote ? 1 : 0,
            user_id: user?.id,
          }),
        }
      );

      if (!response.ok) {
        alert("Could not post comment");
        return;
      }

      setCommentText("");
      setIsMeetingNote(false);

      await loadAll();
    } catch (err) {
      console.error(err);
      alert("Cannot connect to backend");
    }
  };

  // =========================
  // UPLOAD DOCUMENT
  // =========================
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${API_BASE}/decisions/${id}/documents`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        alert("Could not upload file");
        return;
      }

      await loadAll();
    } catch (err) {
      console.error(err);
      alert("Cannot upload file");
    }

    e.target.value = "";
  };

  // =========================
  // MARK COMPLETED
  // =========================
  const handleMarkComplete = async () => {
    const finalDecision = window.prompt(
      "What was the final decision?"
    );

    if (!finalDecision?.trim()) return;

    try {
      const response = await fetch(
        `${API_BASE}/decisions/${id}?final_decision=${encodeURIComponent(
          finalDecision.trim()
        )}`,
        {
          method: "PUT",
        }
      );

      if (!response.ok) {
        alert("Could not complete decision");
        return;
      }

      await loadAll();
    } catch (err) {
      console.error(err);
      alert("Cannot connect to backend");
    }
  };

  // =========================
  // SAVE EDIT
  // =========================
  const handleSaveEdit = async (e) => {
    e.preventDefault();

    setSavingEdit(true);
    setEditError("");

    try {
      const response = await fetch(
        `${API_BASE}/decisions/${id}/edit`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: editTitle.trim(),
            problem: editProblem.trim(),
            reasoning: editReasoning.trim(),
            category: editCategory || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setEditError(
          data.detail || "Could not save changes"
        );
        setSavingEdit(false);
        return;
      }

      setIsEditing(false);
      setSavingEdit(false);

      await loadAll();
    } catch (err) {
      console.error(err);
      setEditError("Cannot connect to backend");
      setSavingEdit(false);
    }
  };

  // =========================
  // DELETE DECISION
  // =========================
  const handleDeleteDecision = async () => {
    const confirmed = window.confirm(
      "Delete this decision permanently?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API_BASE}/decisions/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        alert("Could not delete decision");
        return;
      }

      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Cannot connect to backend");
    }
  };

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <div className="workspace">
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <h3>Loading decision...</h3>
          <p>Please wait</p>
        </div>
      </div>
    );
  }

  // =========================
  // ERROR
  // =========================
  if (error || !decision) {
    return (
      <div className="workspace">
        <div className="error-card">
          <div className="error-icon">!</div>
          <h2>{error || "Decision not found"}</h2>

          <Link
            to="/dashboard"
            className="primary-btn"
          >
            ← Back to Decisions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace">

      {/* ================= HEADER ================= */}
      <div className="topbar">
        <div className="topbar-brand">
          <div className="topbar-logo">ED</div>

          <div>
            <h2>Expert Decision Replay</h2>
            <span className="brand-subtitle">
              Knowledge & Decision Intelligence Platform
            </span>
          </div>
        </div>

        <div className="topbar-user">
          <div className="user-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>

          <div className="user-info">
            <strong>{user?.name || "User"}</strong>
            <span>{user?.role || "Employee"}</span>
          </div>

          <Link
            to="/dashboard"
            className="header-dashboard-btn"
          >
            Dashboard
          </Link>
        </div>
      </div>

      {/* ================= MAIN ================= */}
      <main className="detail-container">

        {/* BACK */}
        <Link
          className="back-link modern-back"
          to="/dashboard"
        >
          ← Back to Decisions
        </Link>

        {/* ================= DECISION HEADER ================= */}
        {!isEditing && (
          <section className="decision-hero">

            <div className="decision-hero-content">

              <div className="badge-row">
                <span className={statusClass(decision.status)}>
                  {decision.status || "Draft"}
                </span>

                {decision.category && (
                  <span className="category-badge">
                    {decision.category}
                  </span>
                )}
              </div>

              <span className="decision-number">
                DECISION #{decision.id}
              </span>

              <h1>{decision.title}</h1>

              <p className="hero-description">
                {decision.problem}
              </p>
            </div>

            <div className="decision-actions">

              <button
                className="secondary-btn"
                onClick={() => setIsEditing(true)}
              >
                ✏ Edit
              </button>

              {decision.status !== "Completed" && (
                <button
                  className="complete-btn"
                  onClick={handleMarkComplete}
                >
                  ✓ Mark Completed
                </button>
              )}

              <button
                className="delete-btn"
                onClick={handleDeleteDecision}
              >
                Delete
              </button>

            </div>
          </section>
        )}

        {/* ================= EDIT ================= */}
        {isEditing ? (
          <section className="workspace-card edit-card">

            <div className="card-heading">
              <div>
                <span className="eyebrow">
                  EDIT DECISION
                </span>

                <h2>Update Decision</h2>

                <p>
                  Modify the information associated with
                  this decision.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveEdit}>

              <div className="form-group">
                <label>Decision Title</label>

                <input
                  value={editTitle}
                  onChange={(e) =>
                    setEditTitle(e.target.value)
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Category</label>

                <select
                  value={editCategory}
                  onChange={(e) =>
                    setEditCategory(e.target.value)
                  }
                >
                  <option value="">
                    Select category
                  </option>

                  {CATEGORY_OPTIONS.map((category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Problem Statement</label>

                <textarea
                  value={editProblem}
                  onChange={(e) =>
                    setEditProblem(e.target.value)
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Reasoning / Important Factors</label>

                <textarea
                  value={editReasoning}
                  onChange={(e) =>
                    setEditReasoning(e.target.value)
                  }
                  required
                />
              </div>

              {editError && (
                <div className="form-error">
                  {editError}
                </div>
              )}

              <div className="form-actions">

                <button
                  className="primary-btn"
                  type="submit"
                  disabled={savingEdit}
                >
                  {savingEdit
                    ? "Saving..."
                    : "Save Changes"}
                </button>

                <button
                  className="secondary-btn"
                  type="button"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>

              </div>

            </form>
          </section>
        ) : (
          <>
            {/* ================= SUMMARY ================= */}
            <section className="summary-section">

              <div className="section-heading center-heading">
                <span className="eyebrow">
                  DECISION SUMMARY
                </span>

                <h2>Why this decision was made</h2>

                <p>
                  The key information and reasoning behind
                  this organizational decision.
                </p>
              </div>

              <div className="summary-grid">

                <div className="summary-box problem-box">
                  <div className="summary-icon">
                    ?
                  </div>

                  <div>
                    <span>Problem Statement</span>
                    <p>{decision.problem}</p>
                  </div>
                </div>

                <div className="summary-box reasoning-box">
                  <div className="summary-icon">
                    💡
                  </div>

                  <div>
                    <span>Reasoning</span>
                    <p>{decision.reasoning}</p>
                  </div>
                </div>

                {decision.final_decision && (
                  <div className="summary-box final-box">
                    <div className="summary-icon">
                      ✓
                    </div>

                    <div>
                      <span>Final Decision</span>
                      <p>{decision.final_decision}</p>
                    </div>
                  </div>
                )}

              </div>
            </section>

            {/* ================= TABS ================= */}
            <section className="tabs-section">

              <div className="modern-tabs">

                <button
                  className={
                    tab === "alternatives"
                      ? "tab active"
                      : "tab"
                  }
                  onClick={() =>
                    setTab("alternatives")
                  }
                >
                  <span>⚖</span>

                  <div>
                    <strong>Alternatives</strong>
                    <small>
                      Compare options
                    </small>
                  </div>

                  <b>{alternatives.length}</b>
                </button>

                <button
                  className={
                    tab === "discussion"
                      ? "tab active"
                      : "tab"
                  }
                  onClick={() =>
                    setTab("discussion")
                  }
                >
                  <span>💬</span>

                  <div>
                    <strong>Discussion</strong>
                    <small>
                      Team collaboration
                    </small>
                  </div>

                  <b>{comments.length}</b>
                </button>

                <button
                  className={
                    tab === "documents"
                      ? "tab active"
                      : "tab"
                  }
                  onClick={() =>
                    setTab("documents")
                  }
                >
                  <span>📎</span>

                  <div>
                    <strong>Documents</strong>
                    <small>
                      Supporting evidence
                    </small>
                  </div>

                  <b>{documents.length}</b>
                </button>

                <button
                  className={
                    tab === "history"
                      ? "tab active"
                      : "tab"
                  }
                  onClick={() =>
                    setTab("history")
                  }
                >
                  <span>↻</span>

                  <div>
                    <strong>History</strong>
                    <small>
                      Track changes
                    </small>
                  </div>

                  <b>{history.length}</b>
                </button>

              </div>

              {/* ================= TAB CONTENT ================= */}
              <div className="workspace-card tab-content">

                {/* ================= ALTERNATIVES ================= */}
                {tab === "alternatives" && (
                  <div>

                    <div className="section-heading">
                      <span className="eyebrow">
                        COMPARE OPTIONS
                      </span>

                      <h2>
                        Alternative Comparison
                      </h2>

                      <p>
                        Compare possible solutions before
                        making the final decision.
                      </p>
                    </div>

                    <form
                      className="alternative-form"
                      onSubmit={handleAddAlternative}
                    >

                      <div className="input-wrapper">
                        <label>Option Name</label>

                        <input
                          placeholder="e.g. React"
                          value={altName}
                          onChange={(e) =>
                            setAltName(e.target.value)
                          }
                        />
                      </div>

                      <div className="input-wrapper">
                        <label>
                          Pros / Cons / Notes
                        </label>

                        <input
                          placeholder="Advantages, disadvantages or notes"
                          value={altDesc}
                          onChange={(e) =>
                            setAltDesc(e.target.value)
                          }
                        />
                      </div>

                      <button
                        className="primary-btn add-option-btn"
                        type="submit"
                      >
                        + Add Option
                      </button>

                    </form>

                    {alternatives.length === 0 ? (
                      <div className="empty-module">

                        <div className="empty-icon">
                          ⚖
                        </div>

                        <h3>
                          No alternatives added
                        </h3>

                        <p>
                          Add different options above to
                          compare them.
                        </p>

                      </div>
                    ) : (
                      <div className="alternative-grid">

                        {alternatives.map((alternative, index) => (
                          <div
                            className="alternative-card"
                            key={alternative.id}
                          >

                            <div className="alternative-top">

                              <div className="option-number">
                                {String(index + 1).padStart(
                                  2,
                                  "0"
                                )}
                              </div>

                              <button
                                className="remove-btn"
                                type="button"
                                onClick={() =>
                                  handleDeleteAlternative(
                                    alternative.id
                                  )
                                }
                              >
                                ×
                              </button>

                            </div>

                            <span className="option-small">
                              OPTION {index + 1}
                            </span>

                            <h3>
                              {alternative.name}
                            </h3>

                            <div className="option-divider"></div>

                            <span className="option-label">
                              NOTES
                            </span>

                            <p>
                              {alternative.description ||
                                "No additional notes provided."}
                            </p>

                          </div>
                        ))}

                      </div>
                    )}

                  </div>
                )}

                {/* ================= DISCUSSION ================= */}
                {tab === "discussion" && (
                  <div>

                    <div className="section-heading">
                      <span className="eyebrow">
                        TEAM COLLABORATION
                      </span>

                      <h2>Discussion</h2>

                      <p>
                        Capture comments, ideas and important
                        meeting notes.
                      </p>
                    </div>

                    <form
                      className="discussion-form"
                      onSubmit={handleAddComment}
                    >

                      <textarea
                        placeholder="Share your thoughts, comments or meeting notes..."
                        value={commentText}
                        onChange={(e) =>
                          setCommentText(e.target.value)
                        }
                        rows={5}
                      />

                      <div className="discussion-actions">

                        <label className="meeting-check">
                          <input
                            type="checkbox"
                            checked={isMeetingNote}
                            onChange={(e) =>
                              setIsMeetingNote(
                                e.target.checked
                              )
                            }
                          />

                          <span>
                            Mark as meeting note
                          </span>
                        </label>

                        <button
                          className="primary-btn"
                          type="submit"
                        >
                          Post Comment
                        </button>

                      </div>

                    </form>

                    {comments.length === 0 ? (
                      <div className="empty-module">

                        <div className="empty-icon">
                          💬
                        </div>

                        <h3>
                          No discussion yet
                        </h3>

                        <p>
                          Start a discussion around this
                          decision.
                        </p>

                      </div>
                    ) : (
                      <div className="discussion-list">

                        {comments.map((comment) => (
                          <div
                            className="comment-card"
                            key={comment.id}
                          >

                            <div className="comment-icon">
                              {comment.is_meeting_note
                                ? "📝"
                                : "💬"}
                            </div>

                            <div className="comment-body">

                              <div className="comment-top">

                                <strong>
                                  {comment.is_meeting_note
                                    ? "Meeting Note"
                                    : "Team Comment"}
                                </strong>

                                <span>
                                  {comment.created_at
                                    ? new Date(
                                        comment.created_at
                                      ).toLocaleString()
                                    : ""}
                                </span>

                              </div>

                              <p>
                                {comment.content}
                              </p>

                            </div>

                          </div>
                        ))}

                      </div>
                    )}

                  </div>
                )}

                {/* ================= DOCUMENTS ================= */}
                {tab === "documents" && (
                  <div>

                    <div className="section-heading">
                      <span className="eyebrow">
                        DOCUMENT MANAGEMENT
                      </span>

                      <h2>
                        Supporting Documents
                      </h2>

                      <p>
                        Attach documents and evidence related
                        to this decision.
                      </p>
                    </div>

                    <label className="upload-area">

                      <div className="upload-icon">
                        ↑
                      </div>

                      <div>
                        <strong>
                          Upload a document
                        </strong>

                        <p>
                          Click here to select a file
                          from your computer.
                        </p>

                        <span>
                          PDF, DOC, DOCX, XLSX and other files
                        </span>
                      </div>

                      <input
                        type="file"
                        onChange={handleUpload}
                      />

                    </label>

                    {documents.length === 0 ? (
                      <div className="empty-module">

                        <div className="empty-icon">
                          📎
                        </div>

                        <h3>
                          No documents attached
                        </h3>

                        <p>
                          Upload supporting evidence for
                          this decision.
                        </p>

                      </div>
                    ) : (
                      <div className="document-list">

                        {documents.map((document) => (
                          <div
                            className="document-card"
                            key={document.id}
                          >

                            <div className="document-icon">
                              📄
                            </div>

                            <div className="document-info">

                              <h3>
                                {document.filename}
                              </h3>

                              <p>
                                Uploaded{" "}
                                {document.uploaded_at
                                  ? new Date(
                                      document.uploaded_at
                                    ).toLocaleString()
                                  : ""}
                              </p>

                            </div>

                            <a
                              className="download-btn"
                              href={`${API_BASE}/documents/${document.id}/download`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Download
                            </a>

                          </div>
                        ))}

                      </div>
                    )}

                  </div>
                )}

                {/* ================= HISTORY ================= */}
                {tab === "history" && (
                  <div>

                    <div className="section-heading">
                      <span className="eyebrow">
                        AUDIT TRAIL
                      </span>

                      <h2>
                        Version History
                      </h2>

                      <p>
                        Track changes made to this decision
                        over time.
                      </p>
                    </div>

                    {history.length === 0 ? (
                      <div className="empty-module">

                        <div className="empty-icon">
                          ↻
                        </div>

                        <h3>
                          No version history yet
                        </h3>

                        <p>
                          Changes to this decision will
                          appear here.
                        </p>

                      </div>
                    ) : (
                      <div className="timeline">

                        {history.map((item, index) => (
                          <div
                            className="timeline-item"
                            key={item.id}
                          >

                            <div className="timeline-dot">
                              {index + 1}
                            </div>

                            <div className="timeline-content">

                              <span className="history-label">
                                VERSION UPDATE
                              </span>

                              <h3>
                                {item.action}
                              </h3>

                              <p>
                                {item.description}
                              </p>

                            </div>

                          </div>
                        ))}

                      </div>
                    )}

                  </div>
                )}

              </div>

            </section>
          </>
        )}

      </main>
    </div>
  );
}

export default DecisionDetail;