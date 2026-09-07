import React, { useState, useEffect } from 'react';
import { X, GitCompare, ArrowRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { compareVersions } from '../services/decisionVersionService';

const FIELD_LABELS = {
  title: 'Title',
  problem_statement: 'Problem Statement',
  context: 'Context & Constraints',
  decision_taken: 'Decision Taken',
  reasoning: 'Reasoning & Trade-offs',
  expected_outcome: 'Expected Outcome',
  actual_outcome: 'Actual Outcome',
  status: 'Status',
};

export const VersionCompareModal = ({
  isOpen,
  onClose,
  decisionId,
  versions = [],
  initialVersionA,
  initialVersionB,
}) => {
  const [versionA, setVersionA] = useState(initialVersionA || 1);
  const [versionB, setVersionB] = useState(initialVersionB || 2);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialVersionA) setVersionA(initialVersionA);
    if (initialVersionB) setVersionB(initialVersionB);
  }, [initialVersionA, initialVersionB]);

  useEffect(() => {
    if (!isOpen || !decisionId) return;

    const runComparison = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await compareVersions(decisionId, versionA, versionB);
        setComparison(data);
      } catch (err) {
        setError(err.message || 'Failed to compare versions.');
        setComparison(null);
      } finally {
        setLoading(false);
      }
    };

    runComparison();
  }, [isOpen, decisionId, versionA, versionB]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-card compare-modal-card">
        <div className="modal-header">
          <div className="modal-title-with-icon">
            <GitCompare size={20} className="text-primary" />
            <h3>Compare Decision Versions</h3>
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
          {/* Version Selectors */}
          <div className="compare-selectors-bar">
            <div className="compare-selector-group">
              <label htmlFor="compare-version-a">Base Version (A):</label>
              <select
                id="compare-version-a"
                className="form-select"
                value={versionA}
                onChange={(e) => setVersionA(Number(e.target.value))}
              >
                {versions.map((v) => (
                  <option key={v.id || v.version_number} value={v.version_number}>
                    v{v.version_number} ({v.change_summary.slice(0, 30)})
                  </option>
                ))}
              </select>
            </div>

            <div className="compare-arrow-indicator">
              <ArrowRight size={20} />
            </div>

            <div className="compare-selector-group">
              <label htmlFor="compare-version-b">Compared Version (B):</label>
              <select
                id="compare-version-b"
                className="form-select"
                value={versionB}
                onChange={(e) => setVersionB(Number(e.target.value))}
              >
                {versions.map((v) => (
                  <option key={v.id || v.version_number} value={v.version_number}>
                    v{v.version_number} ({v.change_summary.slice(0, 30)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="compare-loading-state">
              <Loader2 size={32} className="spinner-icon text-primary" />
              <p>Analyzing differences between v{versionA} and v{versionB}...</p>
            </div>
          ) : comparison && comparison.changes ? (
            comparison.changes.length === 0 ? (
              <div className="compare-empty-diff">
                <CheckCircle2 size={36} color="var(--success-solid)" />
                <h4>No Differences Detected</h4>
                <p>The decision fields in version v{versionA} and version v{versionB} are identical.</p>
              </div>
            ) : (
              <div className="compare-diff-list">
                <div className="compare-diff-count-badge">
                  {comparison.changes.length} {comparison.changes.length === 1 ? 'field changed' : 'fields changed'}
                </div>

                {comparison.changes.map((change) => (
                  <div key={change.field} className="diff-card">
                    <div className="diff-field-header">
                      <span className="diff-field-name">
                        {FIELD_LABELS[change.field] || change.field}
                      </span>
                    </div>

                    <div className="diff-columns-grid">
                      <div className="diff-column diff-column-old">
                        <div className="diff-column-label">
                          <span>Version {versionA} (Previous)</span>
                        </div>
                        <div className="diff-column-content">
                          {change.old_value ? (
                            <pre>{change.old_value}</pre>
                          ) : (
                            <em className="text-muted">(empty / not set)</em>
                          )}
                        </div>
                      </div>

                      <div className="diff-column diff-column-new">
                        <div className="diff-column-label">
                          <span>Version {versionB} (Current / New)</span>
                        </div>
                        <div className="diff-column-content">
                          {change.new_value ? (
                            <pre>{change.new_value}</pre>
                          ) : (
                            <em className="text-muted">(empty / not set)</em>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : null}
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
