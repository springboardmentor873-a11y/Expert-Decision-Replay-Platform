import React from 'react';
import { Eye, GitCompare, User, Clock } from 'lucide-react';

export const VersionHistoryItem = ({
  version,
  isLatest,
  onView,
  onCompare,
}) => {
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
    <div className={`version-history-item ${isLatest ? 'is-current' : ''}`}>
      <div className="version-item-header">
        <div className="version-tag-wrapper">
          <span className="version-number-badge">v{version.version_number}</span>
          {isLatest && <span className="version-current-badge">CURRENT</span>}
        </div>
        <div className="version-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onView(version)}
            title="View read-only historical snapshot"
          >
            <Eye size={14} />
            <span>View</span>
          </button>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => onCompare(version)}
            title="Compare with another version"
          >
            <GitCompare size={14} />
            <span>Compare</span>
          </button>
        </div>
      </div>

      <div className="version-item-body">
        <p className="version-summary">{version.change_summary}</p>
        <div className="version-meta">
          <span className="version-meta-item">
            <User size={13} />
            <span>{changerName}</span>
          </span>
          <span className="version-meta-separator">•</span>
          <span className="version-meta-item">
            <Clock size={13} />
            <span>{formattedDate}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
