import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Sparkles, CheckCircle2, AlertTriangle, DollarSign, ShieldAlert, Layers } from 'lucide-react';

export const AlternativeModal = ({
  isOpen,
  onClose,
  onSave,
  alternative = null,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pros: '',
    cons: '',
    cost: '',
    feasibility: 'High',
    risk_assessment: '',
    is_selected: false,
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (alternative) {
      setFormData({
        name: alternative.name || '',
        description: alternative.description || '',
        pros: alternative.pros || '',
        cons: alternative.cons || '',
        cost: alternative.cost || '',
        feasibility: alternative.feasibility || 'High',
        risk_assessment: alternative.risk_assessment || '',
        is_selected: Boolean(alternative.is_selected),
      });
    } else {
      setFormData({
        name: '',
        description: '',
        pros: '',
        cons: '',
        cost: '',
        feasibility: 'High',
        risk_assessment: '',
        is_selected: false,
      });
    }
    setError('');
  }, [alternative, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim() || !formData.description.trim() || !formData.pros.trim() || !formData.cons.trim()) {
      setError('Please provide Name, Description, Pros, and Cons for this alternative.');
      return;
    }

    onSave({
      name: formData.name.trim(),
      description: formData.description.trim(),
      pros: formData.pros.trim(),
      cons: formData.cons.trim(),
      cost: formData.cost.trim() || null,
      feasibility: formData.feasibility || null,
      risk_assessment: formData.risk_assessment.trim() || null,
      is_selected: formData.is_selected,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="brand-icon-box" style={{ width: '32px', height: '32px' }}>
              <Layers size={18} />
            </div>
            <div>
              <h3 className="modal-title">
                {alternative ? 'Edit Alternative Evaluation' : 'Add Alternative for Comparison'}
              </h3>
              <p className="modal-subtitle">
                Evaluate technical, architectural, or procedural trade-offs side-by-side.
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="alert alert-error" style={{ margin: '1rem 1.75rem 0' }}>
            <span>{error}</span>
          </div>
        )}

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="modal-body-scrollable">
          <div className="form-group">
            <label htmlFor="alt-name">
              Alternative Name <span style={{ color: 'var(--danger-solid)' }}>*</span>
            </label>
            <input
              id="alt-name"
              type="text"
              name="name"
              className="form-control-input"
              placeholder="e.g. Apache Kafka Cluster, AWS SQS, Custom Redis Queue"
              value={formData.name}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="alt-description">
              Description <span style={{ color: 'var(--danger-solid)' }}>*</span>
            </label>
            <textarea
              id="alt-description"
              name="description"
              className="form-control-textarea"
              rows={3}
              placeholder="Summary of this alternative architecture, tool, or approach..."
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-grid-2col">
            <div className="form-group">
              <label htmlFor="alt-pros" style={{ color: 'var(--success-text)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CheckCircle2 size={14} color="var(--success-solid)" />
                <span>Pros / Advantages <span style={{ color: 'var(--danger-solid)' }}>*</span></span>
              </label>
              <textarea
                id="alt-pros"
                name="pros"
                className="form-control-textarea pros-textarea"
                rows={4}
                placeholder="Key strengths, performance benchmarks, simplicity..."
                value={formData.pros}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="alt-cons" style={{ color: 'var(--danger-text)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <AlertTriangle size={14} color="var(--danger-solid)" />
                <span>Cons / Drawbacks <span style={{ color: 'var(--danger-solid)' }}>*</span></span>
              </label>
              <textarea
                id="alt-cons"
                name="cons"
                className="form-control-textarea cons-textarea"
                rows={4}
                placeholder="Weaknesses, operational debt, vendor lock-in..."
                value={formData.cons}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-grid-2col">
            <div className="form-group">
              <label htmlFor="alt-cost" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <DollarSign size={14} />
                <span>Cost Evaluation</span>
              </label>
              <input
                id="alt-cost"
                type="text"
                name="cost"
                className="form-control-input"
                placeholder="e.g. $1,200/mo, Free OSS, High license fee"
                value={formData.cost}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="alt-feasibility" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Sparkles size={14} />
                <span>Technical Feasibility</span>
              </label>
              <select
                id="alt-feasibility"
                name="feasibility"
                className="form-control-select"
                value={formData.feasibility}
                onChange={handleChange}
              >
                <option value="High">High Feasibility (Proven in our stack)</option>
                <option value="Medium">Medium Feasibility (Requires ramp-up)</option>
                <option value="Low">Low Feasibility (Significant hurdles)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="alt-risk" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <ShieldAlert size={14} />
              <span>Risk Assessment & Mitigation</span>
            </label>
            <textarea
              id="alt-risk"
              name="risk_assessment"
              className="form-control-textarea"
              rows={3}
              placeholder="Potential failure points, migration risk, or security considerations..."
              value={formData.risk_assessment}
              onChange={handleChange}
            />
          </div>

          <div className="form-group checkbox-card-wrapper">
            <label className="checkbox-card-label">
              <input
                type="checkbox"
                name="is_selected"
                checked={formData.is_selected}
                onChange={handleChange}
                className="custom-checkbox-input"
              />
              <div className="checkbox-text-block">
                <span className="checkbox-title">Mark as Selected / Recommended Alternative</span>
                <span className="checkbox-desc">
                  Designates this alternative as the chosen path in this decision.
                </span>
              </div>
            </label>
          </div>

          <div className="modal-actions-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={16} className="spinner-icon" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>{alternative ? 'Save Changes' : 'Add Alternative'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};