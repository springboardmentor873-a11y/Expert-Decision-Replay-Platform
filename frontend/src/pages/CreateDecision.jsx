import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useToast } from "../ToastContext.jsx";

const CATEGORIES = ["Architecture", "Infrastructure", "Security", "Process"];

export default function CreateDecision() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Architecture");
  const [problemStatement, setProblemStatement] = useState("");
  const [rationale, setRationale] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      const created = await api.createDecision({
        title,
        category,
        problem_statement: problemStatement,
        rationale,
      });

      showToast("Decision created.");
      navigate(`/decisions/${created.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1>Create Decision</h1>
          <p>Document a decision and preserve the context behind it.</p>
        </div>
      </div>

      <div className="form-card create-decision-form">
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Adopt Kubernetes for staging environment"
            />
          </div>

          <div className="field">
            <label htmlFor="category">Category</label>
            <select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="problem">Problem statement</label>
            <textarea
              id="problem"
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
              placeholder="What issue or opportunity led to this decision?"
            />
          </div>

          <div className="field">
            <label htmlFor="rationale">Rationale</label>
            <textarea
              id="rationale"
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="Why was this approach chosen?"
            />
          </div>

          {error && <div className="error-text">{error}</div>}

          <div className="modal-actions">
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? "Creating…" : "Create decision"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
