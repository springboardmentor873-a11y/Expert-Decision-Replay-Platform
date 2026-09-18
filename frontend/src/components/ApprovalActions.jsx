import React, { useState } from 'react';
import { approveDecision, rejectDecision } from '../services/approvalService';

export default function ApprovalActions({ decision, onActionComplete }) {
  const [modalType, setModalType] = useState(null); // 'approve' | 'reject' | null
  const [comment, setComment] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isReviewable = ['Submitted', 'Under Review'].includes(decision?.status);

  if (!isReviewable) {
    return null;
  }

  const openApproveModal = () => {
    setError(null);
    setComment('');
    setModalType('approve');
  };

  const openRejectModal = () => {
    setError(null);
    setComment('');
    setRejectionReason('');
    setModalType('reject');
  };

  const closeModal = () => {
    if (loading) return;
    setModalType(null);
    setError(null);
  };

  const handleApprove = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = comment.trim() ? { comment: comment.trim() } : {};
      await approveDecision(decision.id, payload);
      setModalType(null);
      if (onActionComplete) {
        onActionComplete('Approved');
      }
    } catch (err) {
      setError(err.message || 'Failed to approve decision');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setError('Rejection reason is required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        rejection_reason: rejectionReason.trim(),
        comment: comment.trim() || undefined,
      };
      await rejectDecision(decision.id, payload);
      setModalType(null);
      if (onActionComplete) {
        onActionComplete('Rejected');
      }
    } catch (err) {
      setError(err.message || 'Failed to reject decision');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="approval-actions-container">
      <div className="approval-action-banner">
        <div className="approval-banner-info">
          <div className="approval-banner-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="approval-banner-title">Review & Approval Required</h4>
            <p className="approval-banner-desc">
              This decision is currently <strong>{decision.status}</strong> and awaiting executive evaluation.
            </p>
          </div>
        </div>

        <div className="approval-button-group">
          <button
            type="button"
            className="btn btn-success approval-btn"
            onClick={openApproveModal}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            Approve Decision
          </button>
          <button
            type="button"
            className="btn btn-danger approval-btn"
            onClick={openRejectModal}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
            Reject Decision
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {modalType && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-container approval-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrapper">
                <span className={`modal-status-badge ${modalType === 'approve' ? 'badge-approve' : 'badge-reject'}`}>
                  {modalType === 'approve' ? 'Approve' : 'Reject'}
                </span>
                <h3 className="modal-title">
                  {modalType === 'approve' ? 'Approve Decision' : 'Reject Decision'}
                </h3>
              </div>
              <button type="button" className="modal-close-btn" onClick={closeModal} disabled={loading}>
                &times;
              </button>
            </div>

            <form onSubmit={modalType === 'approve' ? handleApprove : handleReject}>
              <div className="modal-body">
                {error && (
                  <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
                    {error}
                  </div>
                )}

                <p className="modal-lead-text">
                  {modalType === 'approve'
                    ? `Are you sure you want to approve "${decision.title}"? This will advance its status to Approved and notify the team.`
                    : `Please specify the reason for rejecting "${decision.title}". This will transition the status to Rejected.`}
                </p>

                {modalType === 'reject' && (
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label className="form-label" htmlFor="rejectionReason">
                      Rejection Reason <span className="text-danger">*</span>
                    </label>
                    <textarea
                      id="rejectionReason"
                      className="form-control"
                      rows="3"
                      placeholder="Detail why this decision is being rejected..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" htmlFor="approvalComment">
                    Review Comment (Optional)
                  </label>
                  <textarea
                    id="approvalComment"
                    className="form-control"
                    rows="2"
                    placeholder="Additional context or instructions for the team..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`btn ${modalType === 'approve' ? 'btn-success' : 'btn-danger'}`}
                  disabled={loading}
                >
                  {loading
                    ? 'Processing...'
                    : modalType === 'approve'
                    ? 'Confirm Approval'
                    : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
