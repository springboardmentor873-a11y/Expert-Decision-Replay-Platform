import React from 'react';
import { X, Shield, Clock, User, Activity, Database, Globe, Monitor } from 'lucide-react';

export const AuditLogDetailsModal = ({ log, onClose }) => {
  if (!log) return null;

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      const date = new Date(isoString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content audit-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="audit-icon-badge">
              <Shield size={20} className="audit-badge-icon" />
            </div>
            <div>
              <h3 className="modal-title">Audit Record #{log.id}</h3>
              <p className="modal-subtitle">Immutable system activity event record</p>
            </div>
          </div>
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body audit-modal-body">
          <div className="audit-info-grid">
            <div className="audit-info-card">
              <div className="audit-card-label">
                <Clock size={15} />
                <span>Timestamp</span>
              </div>
              <div className="audit-card-val">{formatDate(log.created_at)}</div>
            </div>

            <div className="audit-info-card">
              <div className="audit-card-label">
                <User size={15} />
                <span>Acting User</span>
              </div>
              <div className="audit-card-val">
                {log.user ? (
                  <div>
                    <strong>{log.user.full_name}</strong>
                    <div className="audit-user-email">{log.user.email}</div>
                  </div>
                ) : log.user_id ? (
                  `User #${log.user_id}`
                ) : (
                  <span className="text-muted">System / Anonymous</span>
                )}
              </div>
            </div>

            <div className="audit-info-card">
              <div className="audit-card-label">
                <Activity size={15} />
                <span>Action</span>
              </div>
              <div className="audit-card-val">
                <span className="audit-action-tag">{log.action}</span>
              </div>
            </div>

            <div className="audit-info-card">
              <div className="audit-card-label">
                <Database size={15} />
                <span>Target Entity</span>
              </div>
              <div className="audit-card-val">
                {log.entity_type} {log.entity_id ? `(#${log.entity_id})` : ''}
              </div>
            </div>

            <div className="audit-info-card">
              <div className="audit-card-label">
                <Globe size={15} />
                <span>IP Address</span>
              </div>
              <div className="audit-card-val">{log.ip_address || '—'}</div>
            </div>

            <div className="audit-info-card">
              <div className="audit-card-label">
                <Monitor size={15} />
                <span>User Agent</span>
              </div>
              <div className="audit-card-val audit-val-truncate" title={log.user_agent}>
                {log.user_agent || '—'}
              </div>
            </div>
          </div>

          <div className="audit-section-block">
            <h4 className="audit-section-title">Description</h4>
            <div className="audit-description-box">{log.description}</div>
          </div>

          {log.details && Object.keys(log.details).length > 0 && (
            <div className="audit-section-block">
              <h4 className="audit-section-title">Structured Event Details</h4>
              <pre className="audit-json-box">
                {JSON.stringify(log.details, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
