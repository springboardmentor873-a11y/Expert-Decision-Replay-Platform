import React, { useEffect, useState } from 'react';
import { getApprovalHistory } from '../services/approvalService';

export default function ApprovalHistory({ decisionId, refreshTrigger }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = async () => {
    if (!decisionId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getApprovalHistory(decisionId);
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load approval history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [decisionId, refreshTrigger]);

  if (loading) {
    return (
      <div className="approval-history-card">
        <div className="approval-history-loading">
          <div className="spinner-border text-primary" role="status"></div>
          <p>Loading approval audit trail...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="approval-history-card">
      <div className="approval-history-header">
        <div className="approval-history-title-wrap">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="approval-history-title">Approval & Review History</h3>
          <span className="badge badge-pill badge-neutral">{history.length}</span>
        </div>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={fetchHistory}
          title="Refresh History"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ margin: '16px' }}>
          {error}
        </div>
      )}

      {history.length === 0 ? (
        <div className="approval-history-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>No approval actions have been recorded for this decision yet.</p>
        </div>
      ) : (
        <div className="approval-timeline">
          {history.map((item, index) => {
            const isApproved = item.action === 'Approve';
            const dateStr = item.created_at
              ? new Date(item.created_at).toLocaleString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Unknown date';

            return (
              <div key={item.id || index} className="timeline-item">
                <div className={`timeline-marker ${isApproved ? 'marker-approved' : 'marker-rejected'}`}>
                  {isApproved ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  )}
                </div>

                <div className="timeline-content">
                  <div className="timeline-header">
                    <div className="timeline-action-meta">
                      <span className={`badge ${isApproved ? 'badge-approve' : 'badge-reject'}`}>
                        {item.action === 'Approve' ? 'Approved' : 'Rejected'}
                      </span>
                      <span className="timeline-user">
                        {item.reviewer?.full_name || 'Reviewer'} ({item.reviewer?.email || 'N/A'})
                      </span>
                    </div>
                    <time className="timeline-time">{dateStr}</time>
                  </div>

                  <div className="timeline-status-transition">
                    <span className="transition-step">{item.previous_status || 'Submitted'}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                    <span className={`transition-step font-bold ${isApproved ? 'text-success' : 'text-danger'}`}>
                      {item.new_status || (isApproved ? 'Approved' : 'Rejected')}
                    </span>
                  </div>

                  {item.rejection_reason && (
                    <div className="timeline-rejection-box">
                      <strong className="text-danger">Reason for Rejection:</strong>
                      <p className="rejection-text">{item.rejection_reason}</p>
                    </div>
                  )}

                  {item.comment && (
                    <div className="timeline-comment-box">
                      <strong>Comment:</strong>
                      <p className="comment-text">{item.comment}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
