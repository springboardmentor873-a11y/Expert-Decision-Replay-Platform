import React from 'react';
import {
  Layers,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Edit3,
  Trash2,
  PlusCircle,
  Sparkles,
  ShieldAlert,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

export const AlternativeComparisonTable = ({
  alternatives = [],
  canEdit = false,
  onAddAlternative,
  onEditAlternative,
  onDeleteAlternative,
}) => {
  const getFeasibilityBadge = (level) => {
    switch (level?.toLowerCase()) {
      case 'high':
        return <span className="feasibility-badge feasibility-high">High Feasibility</span>;
      case 'medium':
        return <span className="feasibility-badge feasibility-medium">Medium Feasibility</span>;
      case 'low':
        return <span className="feasibility-badge feasibility-low">Low Feasibility</span>;
      default:
        return level ? <span className="feasibility-badge feasibility-neutral">{level}</span> : null;
    }
  };

  if (!alternatives || alternatives.length === 0) {
    return (
      <div className="alternatives-empty-container">
        <div className="empty-state-icon">
          <Layers size={28} />
        </div>
        <h4>No alternatives evaluated yet</h4>
        <p>
          Document competing alternatives, trade-offs, and risk factors to capture the full decision context.
        </p>
        {canEdit && (
          <button onClick={onAddAlternative} className="btn btn-primary btn-sm">
            <PlusCircle size={15} />
            <span>+ Add First Alternative</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="alternatives-section-container">
      {/* Desktop Matrix Grid / Comparison Cards */}
      <div className="alternatives-matrix-grid">
        {alternatives.map((alt) => (
          <div
            key={alt.id}
            className={`alternative-matrix-card ${alt.is_selected ? 'is-selected-card' : ''}`}
          >
            {/* Top Bar / Selected Tag */}
            <div className="alt-card-header">
              <div className="alt-title-wrapper">
                <h4 className="alt-card-title">{alt.name}</h4>
                {alt.is_selected && (
                  <span className="selected-choice-badge">
                    <CheckCircle2 size={13} />
                    <span>Chosen Option</span>
                  </span>
                )}
              </div>

              {canEdit && (
                <div className="alt-card-actions">
                  <button
                    onClick={() => onEditAlternative(alt)}
                    className="icon-action-btn"
                    title="Edit alternative"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => onDeleteAlternative(alt.id)}
                    className="icon-action-btn btn-danger-icon"
                    title="Delete alternative"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>

            <p className="alt-card-description">{alt.description}</p>

            {/* Metrics Ribbon (Cost & Feasibility) */}
            <div className="alt-metrics-row">
              {alt.cost && (
                <div className="alt-metric-item" title="Estimated Cost">
                  <DollarSign size={14} className="metric-icon" />
                  <span className="metric-val">{alt.cost}</span>
                </div>
              )}
              {alt.feasibility && getFeasibilityBadge(alt.feasibility)}
            </div>

            {/* Pros & Cons Section */}
            <div className="alt-pros-cons-grid">
              <div className="pros-block">
                <span className="pros-cons-heading text-success">
                  <CheckCircle2 size={13} />
                  <span>Pros</span>
                </span>
                <p className="pros-cons-content">{alt.pros}</p>
              </div>

              <div className="cons-block">
                <span className="pros-cons-heading text-danger">
                  <XCircle size={13} />
                  <span>Cons</span>
                </span>
                <p className="pros-cons-content">{alt.cons}</p>
              </div>
            </div>

            {/* Risk Assessment Box */}
            {alt.risk_assessment && (
              <div className="alt-risk-box">
                <span className="risk-heading">
                  <ShieldAlert size={13} />
                  <span>Risk Assessment</span>
                </span>
                <p className="risk-content">{alt.risk_assessment}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Comparison Summary Table */}
      <div className="comparison-table-wrapper">
        <div className="comparison-table-header">
          <Sparkles size={16} className="text-primary" />
          <h5>Side-by-Side Trade-off Matrix</h5>
        </div>
        <div className="table-responsive">
          <table className="comparison-table">
            <thead>
              <tr>
                <th style={{ width: '22%' }}>Alternative</th>
                <th style={{ width: '15%' }}>Cost</th>
                <th style={{ width: '15%' }}>Feasibility</th>
                <th style={{ width: '24%' }}>Key Advantage (Pros)</th>
                <th style={{ width: '24%' }}>Primary Drawback (Cons)</th>
              </tr>
            </thead>
            <tbody>
              {alternatives.map((alt) => (
                <tr key={alt.id} className={alt.is_selected ? 'selected-row' : ''}>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <strong style={{ color: 'var(--slate-900)' }}>{alt.name}</strong>
                      {alt.is_selected && (
                        <span className="selected-choice-badge" style={{ width: 'fit-content' }}>
                          <CheckCircle2 size={12} />
                          <span>Chosen</span>
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="table-cell-text">{alt.cost || '—'}</span>
                  </td>
                  <td>{getFeasibilityBadge(alt.feasibility) || '—'}</td>
                  <td>
                    <span className="table-cell-text text-success-compact">{alt.pros}</span>
                  </td>
                  <td>
                    <span className="table-cell-text text-danger-compact">{alt.cons}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};