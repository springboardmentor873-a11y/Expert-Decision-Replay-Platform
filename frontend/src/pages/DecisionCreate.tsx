import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { api, ApiError, type Decision } from "../lib/api";

export function DecisionCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    problem_statement: "",
    category: "",
    tags: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const decision = await api.post<Decision>("/decisions", form);
      navigate(`/decisions/${decision.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create decision");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout title="New decision">
      <div className="page-header">
        <div>
          <h2>Start a new decision record</h2>
          <p>Describe the problem — you can add alternatives and discussion afterwards.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ maxWidth: 640 }}>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="title">Title</label>
            <input id="title" required value={form.title} onChange={update("title")} />
          </div>
          <div className="field">
            <label htmlFor="problem_statement">Problem statement</label>
            <textarea
              id="problem_statement"
              required
              value={form.problem_statement}
              onChange={update("problem_statement")}
              placeholder="What problem are we trying to solve?"
            />
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="category">Category</label>
              <input
                id="category"
                required
                value={form.category}
                onChange={update("category")}
                placeholder="e.g. Architecture, Budget, Hiring"
              />
            </div>
            <div className="field">
              <label htmlFor="tags">Tags (optional)</label>
              <input
                id="tags"
                value={form.tags}
                onChange={update("tags")}
                placeholder="comma,separated,tags"
              />
            </div>
          </div>
          <div className="inline-actions">
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Creating…" : "Create decision"}
            </button>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => navigate("/decisions")}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
