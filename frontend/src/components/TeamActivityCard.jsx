import React from 'react';
import { Link } from 'react-router-dom';
import { DecisionStatusBadge } from './DecisionStatusBadge';
import { Activity, Clock, FileEdit, CheckCircle2, Send, PlusCircle } from 'lucide-react';

export const TeamActivityCard = ({ decisions = [] }) => {
  const activities = [...decisions]
    .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
    .slice(0, 5);

  const getRelativeTime = (isoString) => {
    if (!isoString) return '';
    const now = new Date();
    const past = new Date(isoString);
    const diffSec = Math.floor((now - past) / 1000);

    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return past.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle2 size={14} className="text-success" />;
      case 'Submitted':
      case 'Under Review':
        return <Send size={14} className="text-warning" />;
      default:
        return <FileEdit size={14} className="text-primary" />;
    }
  };

  return (
    <div className="card team-activity-card">
      <div className="card-header-clean">
        <div className="chart-header-title">
          <Activity size={18} className="chart-header-icon" />
          <h3>Team Activity</h3>
        </div>
        <span className="badge-subtle-indicator">Live Updates</span>
      </div>

      {activities.length === 0 ? (
        <div className="activity-empty-state">
          <Clock size={32} className="empty-icon-muted" />
          <p>No recent activity detected.</p>
        </div>
      ) : (
        <div className="activity-timeline-list">
          {activities.map((dec) => {
            const userName = dec.creator?.full_name || `User #${dec.created_by}`;
            const timeAgo = getRelativeTime(dec.updated_at || dec.created_at);

            return (
              <div key={dec.id} className="activity-timeline-item">
                <div className="activity-indicator-col">
                  <div className="activity-status-ring">
                    {getStatusIcon(dec.status)}
                  </div>
                  <div className="activity-line-connector" />
                </div>

                <div className="activity-content-col">
                  <div className="activity-main-line">
                    <span className="activity-actor-name">{userName}</span>
                    <span className="activity-action-verb">
                      {dec.status === 'Draft' ? 'drafted' : dec.status === 'Approved' ? 'finalized' : 'updated'}
                    </span>
                    <Link to={`/decisions/${dec.id}`} className="activity-decision-link">
                      "{dec.title}"
                    </Link>
                  </div>
                  <div className="activity-meta-line">
                    <span className="activity-timestamp">
                      <Clock size={12} />
                      <span>{timeAgo}</span>
                    </span>
                    <DecisionStatusBadge status={dec.status} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
