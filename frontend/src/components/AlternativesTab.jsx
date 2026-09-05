import { useEffect, useState } from "react";
import { api } from "../api";
import { useToast } from "../ToastContext.jsx";

const empty = { title: "", pros: "", cons: "", estimated_cost: "", risk_score: 5, feasibility_score: 5 };

export default function AlternativesTab({ decisionId }) {
  const { showToast } = useToast();
  const [alternatives, setAlternatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await api.listAlternatives(decisionId);
      setAlternatives(data);
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

  async function handleAdd(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.addAlternative(decisionId, {
        ...form,
        estimated_cost: Number(form.estimated_cost) || 0,
        risk_score: Number(form.risk_score),
        feasibility_score: Number(form.feasibility_score),
      });
      setForm(empty);
      setShowForm(false);
      showToast("Alternative added.");
      load();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="loading-text">Loading alternatives…</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div className="section-title" style={{ marginBottom: 0 }}>
          {alternatives.length} option{alternatives.length === 1 ? "" : "s"} considered
        </div>
        <button className="btn" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "+ Add alternative"}
        </button>
      </div>

      {showForm && (
        <form className="form-card" style={{ maxWidth: "none", marginBottom: 20 }} onSubmit={handleAdd}>
          <div className="field">
            <label>Option name</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Kubernetes on AWS EKS" />
          </div>
          <div className="form-row">
            <div className="field">
              <label>Pros</label>
              <textarea value={form.pros} onChange={(e) => setForm({ ...form, pros: e.target.value })} placeholder="What makes this option attractive?" />
            </div>
            <div className="field">
              <label>Cons</label>
              <textarea value={form.cons} onChange={(e) => setForm({ ...form, cons: e.target.value })} placeholder="What are the drawbacks?" />
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <label>Estimated cost</label>
              <input type="number" min="0" value={form.estimated_cost} onChange={(e) => setForm({ ...form, estimated_cost: e.target.value })} placeholder="0" />
            </div>
            <div className="field">
              <label>Risk (0 low – 10 high)</label>
              <input type="number" min="0" max="10" value={form.risk_score} onChange={(e) => setForm({ ...form, risk_score: e.target.value })} />
            </div>
            <div className="field">
              <label>Feasibility (0 – 10)</label>
              <input type="number" min="0" max="10" value={form.feasibility_score} onChange={(e) => setForm({ ...form, feasibility_score: e.target.value })} />
            </div>
          </div>
          <div className="modal-actions">
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Adding…" : "Add alternative"}</button>
          </div>
        </form>
      )}

      {alternatives.length === 0 ? (
        <div className="empty-state">
          <h3>No alternatives recorded</h3>
          <p>Add the options that were weighed before this decision was made.</p>
        </div>
      ) : (
        alternatives.map((alt) => (
          <div key={alt.id} className={`alt-card ${alt.is_recommended ? "recommended" : ""}`}>
            <div className="alt-card-head">
              <h4>{alt.title}</h4>
              {alt.is_recommended === 1 && <span className="recommended-tag">Recommended</span>}
            </div>
            <div className="alt-grid">
              <div>
                <div className="alt-grid-label">Pros</div>
                {alt.pros || "—"}
              </div>
              <div>
                <div className="alt-grid-label">Cons</div>
                {alt.cons || "—"}
              </div>
            </div>
            <div className="alt-scores">
              <span>Cost: <b>{alt.estimated_cost ?? 0}</b></span>
              <span>Risk: <b>{alt.risk_score}</b>/10</span>
              <span>Feasibility: <b>{alt.feasibility_score}</b>/10</span>
              <span>Composite: <b>{alt.composite_score}</b></span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
