import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDecision, updateDecision } from '../services/decisionService';
import { getCategories } from '../services/categoryService';
import { getTeams } from '../services/teamService';
import { getTags, assignTagsToDecision } from '../services/tagService';
import {
  ArrowLeft,
  Save,
  Loader2,
  FileText,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Lock,
  Archive,
  Folder,
  Users,
  Tag as TagIcon,
  Sparkles,
} from 'lucide-react';

export const EditDecision = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    category_id: '',
    team_id: '',
    problem_statement: '',
    context: '',
    decision_taken: '',
    reasoning: '',
    expected_outcome: '',
    actual_outcome: '',
    status: 'Draft',
  });

  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [teams, setTeams] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
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
        const [data, cats, tms, tgs] = await Promise.all([
          getDecision(id),
          getCategories().catch(() => []),
          getTeams().catch(() => []),
          getTags().catch(() => []),
        ]);
        setOriginalDecision(data);
        setCategories(cats || []);
        setTeams(tms || []);
        setAvailableTags(tgs || []);

        setFormData({
          title: data.title || '',
          category_id: data.category_id || '',
          team_id: data.team_id || '',
          problem_statement: data.problem_statement || '',
          context: data.context || '',
          decision_taken: data.decision_taken || '',
          reasoning: data.reasoning || '',
          expected_outcome: data.expected_outcome || '',
          actual_outcome: data.actual_outcome || '',
          status: data.status || 'Draft',
        });

        if (data.tags && Array.isArray(data.tags)) {
          setSelectedTagIds(data.tags.map((t) => t.id));
        }
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

  const handleTagToggle = (tagId) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((i) => i !== tagId) : [...prev, tagId]
    );
  };

  const isArchived = originalDecision?.status === 'Archived';
  const isSubmitted = originalDecision?.status !== 'Draft' && !isAdmin;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isArchived) {
      alert('Archived decisions cannot be edited. Please unarchive the decision first.');
      return;
    }

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

      payload.category_id = formData.category_id ? parseInt(formData.category_id, 10) : null;
      payload.team_id = formData.team_id ? parseInt(formData.team_id, 10) : null;
      payload.expected_outcome = formData.expected_outcome.trim() || null;
      payload.actual_outcome = formData.actual_outcome.trim() || null;

      if (isAdmin && formData.status && formData.status !== 'Archived') {
        payload.status = formData.status;
      }

      await updateDecision(id, payload);

      // Sync tags if changed
      try {
        await assignTagsToDecision(id, selectedTagIds);
      } catch (tagErr) {
        console.warn('Failed to update tags:', tagErr);
      }

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
          <span>Loading decision details...</span>
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
          Edit Decision #{id}
        </h1>
        <p style={{ color: 'var(--slate-500)', fontSize: '0.95rem' }}>
          Update decision parameters, classifications, and rationale.
        </p>
      </div>

      {isArchived && (
        <div className="alert alert-warning" role="alert" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Archive size={18} />
          <span><strong>This decision is Archived.</strong> It is locked in read-only mode and cannot be modified until unarchived.</span>
        </div>
      )}

      {isSubmitted && !isArchived && (
        <div className="alert alert-info" role="alert" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Lock size={16} />
          <span>Core fields (title, problem, rationale) are locked because this decision is in <strong>{originalDecision?.status}</strong> status. Outcomes and classification may still be edited.</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error" role="alert">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card form-card-container">
        {/* SECTION 1: Decision Information & Classification */}
        <div className="form-section-block">
          <div className="form-section-title">
            <div className="form-section-number">1</div>
            <FileText size={18} />
            <span>Decision Information & Classification</span>
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
              disabled={isSubmitted || isArchived}
              required
            />
          </div>

          <div className="form-grid-2col">
            <div className="form-group">
              <label htmlFor="category_id">
                <Folder size={14} style={{ display: 'inline', marginRight: '4px' }} />
                Category
              </label>
              <select
                id="category_id"
                name="category_id"
                className="form-control-input"
                value={formData.category_id || ''}
                onChange={handleChange}
                disabled={isArchived}
              >
                <option value="">-- Select Category --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="team_id">
                <Users size={14} style={{ display: 'inline', marginRight: '4px' }} />
                Team Workspace
              </label>
              <select
                id="team_id"
                name="team_id"
                className="form-control-input"
                value={formData.team_id || ''}
                onChange={handleChange}
                disabled={isArchived}
              >
                <option value="">-- No Team (Individual/Global) --</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          {availableTags.length > 0 && (
            <div className="form-group">
              <label>
                <TagIcon size={14} style={{ display: 'inline', marginRight: '4px' }} />
                Tags
              </label>
              <div className="tags-checkbox-group">
                {availableTags.map((tag) => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  return (
                    <button
                      type="button"
                      key={tag.id}
                      className={`tag-toggle-chip ${isSelected ? 'selected' : ''}`}
                      onClick={() => !isArchived && handleTagToggle(tag.id)}
                      disabled={isArchived}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {isAdmin && !isArchived && (
            <div className="form-group">
              <label htmlFor="status">Administrative Status Override</label>
              <select
                id="status"
                name="status"
                className="form-control-input"
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

        {/* SECTION 2: Problem & Context */}
        <div className="form-section-block">
          <div className="form-section-title">
            <div className="form-section-number">2</div>
            <AlertTriangle size={18} />
            <span>Problem & Context</span>
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
              disabled={isSubmitted || isArchived}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="context">
              Context & Constraints <span style={{ color: 'var(--danger-solid)' }}>*</span>
            </label>
            <textarea
              id="context"
              name="context"
              className="form-control-textarea"
              rows={4}
              value={formData.context}
              onChange={handleChange}
              disabled={isSubmitted || isArchived}
              required
            />
          </div>
        </div>

        {/* SECTION 3: Decision & Rationale */}
        <div className="form-section-block">
          <div className="form-section-title">
            <div className="form-section-number">3</div>
            <CheckCircle2 size={18} />
            <span>Decision & Rationale</span>
          </div>

          <div className="form-group">
            <label htmlFor="decision_taken">
              Decision Taken <span style={{ color: 'var(--danger-solid)' }}>*</span>
            </label>
            <textarea
              id="decision_taken"
              name="decision_taken"
              className="form-control-textarea"
              rows={3}
              value={formData.decision_taken}
              onChange={handleChange}
              disabled={isSubmitted || isArchived}
              required
            />
          </div>

          <div className="form-group highlight-rationale-group">
            <label htmlFor="reasoning" className="rationale-field-label">
              <Sparkles size={16} className="text-primary" />
              <span>Decision Rationale (Reasoning)</span>
              <span style={{ color: 'var(--danger-solid)' }}>*</span>
            </label>
            <p className="form-helper-text" style={{ marginBottom: '8px' }}>
              Articulate the core architectural, economic, and operational justification for this decision.
            </p>
            <textarea
              id="reasoning"
              name="reasoning"
              className="form-control-textarea rationale-textarea"
              rows={5}
              value={formData.reasoning}
              onChange={handleChange}
              disabled={isSubmitted || isArchived}
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
              disabled={isArchived}
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
              disabled={isArchived}
            />
          </div>
        </div>

        {/* Form Actions Footer */}
        <div className="form-actions-footer">
          <Link to={`/decisions/${id}`} className="btn btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary btn-lg" disabled={submitting || isArchived}>
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

export default EditDecision;
