import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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

function DecisionForm() {
  const [title, setTitle] = useState("");
  const [problem, setProblem] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const user = getCurrentUser();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/decisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          problem,
          reasoning,
          category: category || null,
          user_id: user?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Could not create decision");
        setSubmitting(false);
        return;
      }

      navigate(`/decisions/${data.id}`);
    } catch (err) {
      console.error(err);
      setError("Cannot connect to backend");
      setSubmitting(false);
    }
  };

  return (
    <div className="workspace">
      <div className="topbar">
        <div className="topbar-brand">
          <div className="topbar-logo">ED</div>
          <h2>Expert Decision Replay Platform</h2>
        </div>
      </div>

      <div className="workspace-content" style={{ maxWidth: 700 }}>
        <Link className="back-link" to="/dashboard">
          ← Back to Decisions
        </Link>

        <div className="page-header">
          <h1>New Decision</h1>
        </div>

        <div className="workspace-card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                placeholder="e.g. Choosing a cloud provider for Q3 migration"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">No category</option>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Problem Statement</label>
              <textarea
                placeholder="What situation or problem needs a decision?"
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Reasoning / Important Factors</label>
              <textarea
                placeholder="What factors matter here? What's driving this decision?"
                value={reasoning}
                onChange={(e) => setReasoning(e.target.value)}
                required
              />
            </div>

            {error && <p className="error-text">{error}</p>}

            <button className="primary-btn" type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create Decision"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default DecisionForm;