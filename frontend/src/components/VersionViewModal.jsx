import React from 'react';
import { X, History, User, Clock, ShieldCheck, FileText, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';
import { DecisionStatusBadge } from './DecisionStatusBadge';

export const VersionViewModal = ({
  isOpen,
  onClose,
  version,
  isLatest,
}) => {
  if (!isOpen || !version) return null;

  const formattedDate = version.created_at
    ? new Date(version.created_at).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '';

  const changerName = version.changer?.full_name || `User #${version.changed_by}`;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-card version-view-modal-card">
        <div className="modal-header">
          <div className="modal-title-with-icon">
            <History size={20} className="text-primary" />
            <h3>Historical Snapshot: Version {version.version_number}</h3>
            {isLatest && <span className="version-current-badge">CURRENT</span>}
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Read-Only Notice */}
          <div className="version-readonly-banner">
            <ShieldCheck size={16} className="text-primary" />
            <span>
              <strong>Read-Only Historical Snapshot:</strong> This view reflects the immutable state of the decision at the time version v{version.version_number} was created.
            </span>
          </div>

          {/* Meta Info Card */}
          <div className="version-snapshot-meta-card">
            <div className="meta-grid-row">
              <div className="meta-grid-cell">
                <span className="meta-cell-label">Changed By</span>
                <span className="meta-cell-value">
                  <User size={13} />
                  <span>{changerName}</span>
                </span>
              </div>
              <div className="meta-grid-cell">
                <span className="meta-cell-label">Recorded At</span>
                <span className="meta-cell-value">
                  <Clock size={13} />
                  <span>{formattedDate}</span>
                </span>
              </div>
              <div className="meta-grid-cell">
                <span className="meta-cell-label">Status in this Version</span>
                <span className="meta-cell-value">
                  <DecisionStatusBadge status={version.status} />
                </span>
              </div>
            </div>
            <div className="meta-summary-row">
              <span className="meta-cell-label">Change Summary:</span>
              <span className="meta-summary-text">{version.change_summary}</span>
            </div>
          </div>

          {/* Decision Content Fields */}
          <div className="version-content-sections">
            <div className="version-content-block">
              <h4>Title</h4>
              <p className="version-field-value version-title-value">{version.title}</p>
            </div>

            <div className="version-content-block">
              <h4>Problem Statement</h4>
              <p className="version-field-value">{version.problem_statement}</p>
            </div>

            <div className="version-content-block">
              <h4>Context &amp; Constraints</h4>
              <p className="version-field-value">{version.context}</p>
            </div>

            <div className="version-content-block">
              <h4>Decision Taken</h4>
              <p className="version-field-value decision-taken-text">{version.decision_taken}</p>
            </div>

            <div className="version-content-block">
              <h4>Reasoning &amp; Trade-offs</h4>
              <p className="version-field-value">{version.reasoning}</p>
            </div>

            {version.expected_outcome && (
              <div className="version-content-block">
                <h4>Expected Outcome</h4>
                <p className="version-field-value">{version.expected_outcome}</p>
              </div>
            )}

            {version.actual_outcome && (
              <div className="version-content-block">
                <h4>Actual Outcome</h4>
                <p className="version-field-value">{version.actual_outcome}</p>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
