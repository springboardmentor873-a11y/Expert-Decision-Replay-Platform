import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPendingApprovals } from '../services/approvalService';
import { DecisionStatusBadge } from '../components/DecisionStatusBadge';

export default function PendingApprovals() {
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPending = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPendingApprovals();
      setDecisions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  return (
    <div className="pending-approvals-page">
      <div className="page-header-wrapper">
        <div className="page-header-content">
          <div className="page-header-badge">
            <span className="badge badge-primary">Milestone 3</span>
            <span className="badge badge-warning">Workflow Management</span>
          </div>
          <h1 className="page-header-title">Pending Approvals</h1>
          <p className="page-header-description">
            Decisions submitted across the organization awaiting formal review, verification, and sign-off.
          </p>
        </div>
        <div className="page-header-actions">
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={fetchPending}
            disabled={loading}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading-state-container">
          <div className="spinner-border text-primary" role="status"></div>
          <p>Retrieving decisions requiring approval...</p>
        </div>
      ) : decisions.length === 0 ? (
        <div className="empty-state-card">
          <div className="empty-icon-wrapper">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3>All Caught Up!</h3>
          <p>There are currently no decisions awaiting your review.</p>
          <Link to="/decisions" className="btn btn-primary" style={{ marginTop: '12px' }}>
            Browse All Decisions
          </Link>
        </div>
      ) : (
        <div className="pending-decisions-grid">
          {decisions.map((decision) => (
            <div key={decision.id} className="pending-decision-card">
              <div className="card-top-row">
                <DecisionStatusBadge status={decision.status} />
                <span className="decision-id-tag">#{decision.id}</span>
              </div>

              <h3 className="card-decision-title">
                <Link to={`/decisions/${decision.id}`}>{decision.title}</Link>
              </h3>

              <p className="card-decision-desc">
                {decision.description?.length > 130
                  ? `${decision.description.substring(0, 130)}...`
                  : decision.description || 'No description provided.'}
              </p>

              <div className="card-meta-section">
                <div className="meta-item">
                  <span className="meta-label">Submitted by</span>
                  <span className="meta-value font-medium">
                    {decision.creator?.full_name || 'Author'}
                  </span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Date Submitted</span>
                  <span className="meta-value">
                    {decision.submitted_at
                      ? new Date(decision.submitted_at).toLocaleDateString()
                      : new Date(decision.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="card-action-footer">
                <Link
                  to={`/decisions/${decision.id}`}
                  className="btn btn-primary btn-block"
                >
                  Review &amp; Decide
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: '6px' }}>
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
