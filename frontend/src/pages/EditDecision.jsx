import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDecision, updateDecision } from '../services/decisionService';
import { ArrowLeft, Save, Loader2, FileText, AlertTriangle, CheckCircle2, TrendingUp, Lock } from 'lucide-react';

export const EditDecision = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    problem_statement: '',
    context: '',
    decision_taken: '',
    reasoning: '',
    expected_outcome: '',
    actual_outcome: '',
    status: 'Draft',
  });

  const [originalDecision, setOriginalDecision] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = user?.role?.name?.toLowerCase() === 'administrator';

  useEffect(() => {
    const fetchExistingDecision = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getDecision(id);
        setOriginalDecision(data);
        setFormData({
          title: data.title || '',
          problem_statement: data.problem_statement || '',
          context: data.context || '',
          decision_taken: data.decision_taken || '',
          reasoning: data.reasoning || '',
          expected_outcome: data.expected_outcome || '',
          actual_outcome: data.actual_outcome || '',
          status: data.status || 'Draft',
        });
      } catch (err) {
        setError(err.message || 'Failed to load decision for editing.');
      } finally {
        setLoading(false);
      }
    };

    fetchExistingDecision();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isSubmitted = originalDecision?.status !== 'Draft' && !isAdmin;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const payload = {};

      if (!isSubmitted) {
        if (formData.title.trim()) payload.title = formData.title.trim();
        if (formData.problem_statement.trim()) payload.problem_statement = formData.problem_statement.trim();
        if (formData.context.trim()) payload.context = formData.context.trim();
        if (formData.decision_taken.trim()) payload.decision_taken = formData.decision_taken.trim();
        if (formData.reasoning.trim()) payload.reasoning = formData.reasoning.trim();
      }

      payload.expected_outcome = formData.expected_outcome.trim() || null;
      payload.actual_outcome = formData.actual_outcome.trim() || null;

      if (isAdmin && formData.status) {
        payload.status = formData.status;
      }

      await updateDecision(id, payload);
      navigate(`/decisions/${id}`);
    } catch (err) {
      setError(err.message || 'Failed to update decision.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="form-layout-wrapper">
        <div className="card loading-state-card">
          <Loader2 size={36} className="spinner-icon text-primary" />
          <span>Loading decision for editing...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="form-layout-wrapper">
      <div className="form-navigation-header">
        <Link to={`/decisions/${id}`} className="btn btn-secondary btn-sm" style={{ width: 'fit-content' }}>
          <ArrowLeft size={14} />
          <span>Back to Decision Details</span>
        </Link>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--slate-900)', marginTop: '0.5rem' }}>
          Edit Decision
        </h1>
        <p style={{ color: 'var(--slate-500)', fontSize: '0.95rem' }}>
          Update decision fields, outcome metrics, and review rationale.
        </p>
      </div>

      {isSubmitted && (
        <div className="alert alert-info">
          <Lock size={16} />
          <span>
            This decision is in <strong>{originalDecision.status}</strong> status and is locked for core text edits. You can still record expected and actual outcome metrics.
          </span>
        </div>
      )}

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
              value={formData.title}
              onChange={handleChange}
              disabled={isSubmitted}
              required
            />
          </div>

          {isAdmin && (
            <div className="form-group">
              <label htmlFor="status">
                Decision Status (Admin Override)
              </label>
              <select
                id="status"
                name="status"
                className="form-control-select"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="Draft">Draft</option>
                <option value="Submitted">Submitted</option>
                <option value="Under Review">Under Review</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          )}
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
              value={formData.problem_statement}
              onChange={handleChange}
              disabled={isSubmitted}
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
              value={formData.context}
              onChange={handleChange}
              disabled={isSubmitted}
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
              value={formData.decision_taken}
              onChange={handleChange}
              disabled={isSubmitted}
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
              value={formData.reasoning}
              onChange={handleChange}
              disabled={isSubmitted}
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
              value={formData.actual_outcome}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Form Actions Footer */}
        <div className="form-actions-footer">
          <Link to={`/decisions/${id}`} className="btn btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 size={18} className="spinner-icon" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save size={18} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
