import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createDecision } from '../services/decisionService';
import { ArrowLeft, Save, Loader2, FileText, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';

export const CreateDecision = () => {
  const [formData, setFormData] = useState({
    title: '',
    problem_statement: '',
    context: '',
    decision_taken: '',
    reasoning: '',
    expected_outcome: '',
    actual_outcome: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim() || !formData.problem_statement.trim() || !formData.context.trim() || !formData.decision_taken.trim() || !formData.reasoning.trim()) {
      setError('Please fill in all required fields (Title, Problem Statement, Context, Decision Taken, and Reasoning).');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        title: formData.title.trim(),
        problem_statement: formData.problem_statement.trim(),
        context: formData.context.trim(),
        decision_taken: formData.decision_taken.trim(),
        reasoning: formData.reasoning.trim(),
        expected_outcome: formData.expected_outcome.trim() || null,
        actual_outcome: formData.actual_outcome.trim() || null,
      };

      const newDecision = await createDecision(payload);
      navigate(`/decisions/${newDecision.id}`);
    } catch (err) {
      setError(err.message || 'Failed to create decision.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-layout-wrapper">
      <div className="form-navigation-header">
        <Link to="/decisions" className="btn btn-secondary btn-sm" style={{ width: 'fit-content' }}>
          <ArrowLeft size={14} />
          <span>Back to Decisions</span>
        </Link>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--slate-900)', marginTop: '0.5rem' }}>
          Create New Decision
        </h1>
        <p style={{ color: 'var(--slate-500)', fontSize: '0.95rem' }}>
          Document problem context, evaluate trade-offs, and record decisions with structured rationale.
        </p>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card form-card-container">
        {/* SECTION 1: Decision Information */}
        <div className="form-section-block">
          <div className="form-section-title">
            <div className="form-section-number">1</div>
            <FileText size={18} />
            <span>Decision Information</span>
          </div>

          <div className="form-group">
            <label htmlFor="title">
              Decision Title <span style={{ color: 'var(--danger-solid)' }}>*</span>
            </label>
            <input
              id="title"
              type="text"
              name="title"
              className="form-control-input"
              placeholder="e.g. Migrate Event Bus to Apache Kafka"
              value={formData.title}
              onChange={handleChange}
              required
              autoFocus
            />
            <span className="form-helper-text">Provide a concise, specific title summarizing the decision.</span>
          </div>
        </div>

        {/* SECTION 2: Problem */}
        <div className="form-section-block">
          <div className="form-section-title">
            <div className="form-section-number">2</div>
            <AlertTriangle size={18} />
            <span>Problem</span>
          </div>

          <div className="form-group">
            <label htmlFor="problem_statement">
              Problem Statement <span style={{ color: 'var(--danger-solid)' }}>*</span>
            </label>
            <textarea
              id="problem_statement"
              name="problem_statement"
              className="form-control-textarea"
              rows={4}
              placeholder="What core challenge, bottleneck, or constraint necessitates this decision?"
              value={formData.problem_statement}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="context">
              Context & Background Constraints <span style={{ color: 'var(--danger-solid)' }}>*</span>
            </label>
            <textarea
              id="context"
              name="context"
              className="form-control-textarea"
              rows={4}
              placeholder="Describe technical, organizational, or budget constraints influencing this decision..."
              value={formData.context}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* SECTION 3: Decision */}
        <div className="form-section-block">
          <div className="form-section-title">
            <div className="form-section-number">3</div>
            <CheckCircle2 size={18} />
            <span>Decision</span>
          </div>

          <div className="form-group">
            <label htmlFor="decision_taken">
              Decision Taken <span style={{ color: 'var(--danger-solid)' }}>*</span>
            </label>
            <textarea
              id="decision_taken"
              name="decision_taken"
              className="form-control-textarea"
              rows={4}
              placeholder="Detail the exact chosen option or architectural path..."
              value={formData.decision_taken}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reasoning">
              Reasoning <span style={{ color: 'var(--danger-solid)' }}>*</span>
            </label>
            <textarea
              id="reasoning"
              name="reasoning"
              className="form-control-textarea"
              rows={5}
              placeholder="Why was this chosen over alternatives? Detail trade-offs (e.g. latency vs consistency, cost vs operational complexity)..."
              value={formData.reasoning}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* SECTION 4: Expected Results */}
        <div className="form-section-block">
          <div className="form-section-title">
            <div className="form-section-number">4</div>
            <TrendingUp size={18} />
            <span>Expected Results</span>
          </div>

          <div className="form-group">
            <label htmlFor="expected_outcome">Expected Outcome</label>
            <textarea
              id="expected_outcome"
              name="expected_outcome"
              className="form-control-textarea"
              rows={3}
              placeholder="What measurable benchmarks or success metrics are anticipated?"
              value={formData.expected_outcome}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="actual_outcome">Actual Outcome</label>
            <textarea
              id="actual_outcome"
              name="actual_outcome"
              className="form-control-textarea"
              rows={3}
              placeholder="Observed real-world results post-implementation..."
              value={formData.actual_outcome}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="form-actions-footer">
          <Link to="/decisions" className="btn btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={18} className="spinner-icon" />
                <span>Creating Decision...</span>
              </>
            ) : (
              <>
                <Save size={18} />
                <span>Create Decision</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
