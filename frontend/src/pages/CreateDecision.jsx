import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { createDecision } from '../services/decisionService';
import { getCategories } from '../services/categoryService';
import { getTeams } from '../services/teamService';
import { getTags } from '../services/tagService';
import {
  ArrowLeft,
  Save,
  Loader2,
  FileText,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Folder,
  Users,
  Tag as TagIcon,
  Sparkles,
} from 'lucide-react';

export const CreateDecision = () => {
  const [searchParams] = useSearchParams();
  const prefillTeamId = searchParams.get('team_id') || '';

  const [formData, setFormData] = useState({
    title: '',
    category_id: '',
    team_id: prefillTeamId,
    problem_statement: '',
    context: '',
    decision_taken: '',
    reasoning: '',
    expected_outcome: '',
    actual_outcome: '',
  });

  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [teams, setTeams] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      try {
        const [cats, tms, tgs] = await Promise.all([
          getCategories().catch(() => []),
          getTeams().catch(() => []),
          getTags().catch(() => []),
        ]);
        setCategories(cats || []);
        setTeams(tms || []);
        setAvailableTags(tgs || []);
      } catch (err) {
        console.warn('Failed to load taxonomies:', err);
      }
    }
    loadData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTagToggle = (tagId) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (
      !formData.title.trim() ||
      !formData.problem_statement.trim() ||
      !formData.context.trim() ||
      !formData.decision_taken.trim() ||
      !formData.reasoning.trim()
    ) {
      setError(
        'Please fill in all required fields (Title, Problem Statement, Context, Decision Taken, and Decision Rationale).'
      );
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
        category_id: formData.category_id ? parseInt(formData.category_id, 10) : null,
        team_id: formData.team_id ? parseInt(formData.team_id, 10) : null,
        tag_ids: selectedTagIds.length > 0 ? selectedTagIds : null,
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
              placeholder="e.g. Migrate Event Bus to Apache Kafka"
              value={formData.title}
              onChange={handleChange}
              required
              autoFocus
            />
            <span className="form-helper-text">Provide a concise, specific title summarizing the decision.</span>
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
                value={formData.category_id}
                onChange={handleChange}
              >
                <option value="">-- Select Category --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <span className="form-helper-text">Organize decision under an architectural domain.</span>
            </div>

            <div className="form-group">
              <label htmlFor="team_id">
                <Users size={14} style={{ display: 'inline', marginRight: '4px' }} />
                Assign to Team Workspace
              </label>
              <select
                id="team_id"
                name="team_id"
                className="form-control-input"
                value={formData.team_id}
                onChange={handleChange}
              >
                <option value="">-- No Team (Individual/Global) --</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <span className="form-helper-text">Scope this decision to a collaborative team workspace.</span>
            </div>
          </div>

          {/* Tags selection */}
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
                      onClick={() => handleTagToggle(tag.id)}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
              <span className="form-helper-text">Select relevant tags for enhanced indexing and discovery.</span>
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
              placeholder="Detail the exact chosen option or architectural path..."
              value={formData.decision_taken}
              onChange={handleChange}
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
              Articulate the core architectural, economic, and operational justification for this decision. Detail key trade-offs (e.g. latency vs consistency, build vs buy, immediate velocity vs long-term maintainability).
            </p>
            <textarea
              id="reasoning"
              name="reasoning"
              className="form-control-textarea rationale-textarea"
              rows={5}
              placeholder="Detail the structured rationale, key drivers, and evaluated trade-offs..."
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

export default CreateDecision;
