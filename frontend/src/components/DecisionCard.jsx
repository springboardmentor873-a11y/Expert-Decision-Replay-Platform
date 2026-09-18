import React from 'react';
import { Link } from 'react-router-dom';
import { DecisionStatusBadge } from './DecisionStatusBadge';
import { User, Calendar, Clock, ArrowRight, Edit3, Send, Tag as TagIcon, Folder, Users } from 'lucide-react';

export const DecisionCard = ({ decision, currentUser, onSubmitDecision }) => {
  const isOwner = currentUser && decision.created_by === currentUser.id;
  const isAdmin = currentUser?.role?.name?.toLowerCase() === 'administrator';
  const isArchived = decision.status === 'Archived';
  const isDraft = decision.status === 'Draft';
  const canEdit = (isOwner || isAdmin) && !isArchived;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <article className={`decision-card-item ${isArchived ? 'decision-card-archived' : ''}`}>
      <div>
        <div className="decision-card-top">
          <div className="decision-card-title-group">
            <h3 className="decision-card-title">
              <Link to={`/decisions/${decision.id}`}>{decision.title}</Link>
            </h3>
            <div className="decision-card-taxonomy">
              {decision.category && (
                <span className="badge-category-chip" title={`Category: ${decision.category.name}`}>
                  <Folder size={11} />
                  <span>{decision.category.name}</span>
                </span>
              )}
              {decision.team && (
                <span className="badge-team-chip" title={`Team: ${decision.team.name}`}>
                  <Users size={11} />
                  <span>{decision.team.name}</span>
                </span>
              )}
            </div>
          </div>
          <DecisionStatusBadge status={decision.status} />
        </div>

        <p className="decision-card-problem">
          {decision.problem_statement && decision.problem_statement.length > 135
            ? `${decision.problem_statement.substring(0, 135)}...`
            : decision.problem_statement || 'No problem statement recorded.'}
        </p>

        {/* Highlight Decision Taken */}
        <div className="decision-card-highlight">
          <span className="highlight-label">Decision Taken</span>
          <span className="highlight-text">
            {decision.decision_taken && decision.decision_taken.length > 85
              ? `${decision.decision_taken.substring(0, 85)}...`
              : decision.decision_taken || 'Pending selection'}
          </span>
        </div>

        {/* Tags row if any */}
        {decision.tags && decision.tags.length > 0 && (
          <div className="decision-card-tags-row">
            {decision.tags.slice(0, 4).map((t) => (
              <span key={t.id} className="tag-pill-badge">
                <TagIcon size={10} />
                <span>{t.name}</span>
              </span>
            ))}
            {decision.tags.length > 4 && (
              <span className="tag-pill-badge tag-pill-more">
                +{decision.tags.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="decision-card-bottom">
        <div className="decision-card-meta">
          <span className="meta-item-inline">
            <User size={13} />
            <span>{decision.creator?.full_name || `User #${decision.created_by}`}</span>
          </span>
          <span>•</span>
          <span className="meta-item-inline" title={`Created: ${formatDate(decision.created_at)}`}>
            <Calendar size={13} />
            <span>{formatDate(decision.created_at)}</span>
          </span>
          {decision.updated_at && decision.updated_at !== decision.created_at && (
            <>
              <span>•</span>
              <span className="meta-item-inline" title={`Updated: ${formatDate(decision.updated_at)}`}>
                <Clock size={12} />
                <span>Updated</span>
              </span>
            </>
          )}
        </div>

        <div className="decision-card-buttons">
          {canEdit && (
            <Link
              to={`/decisions/${decision.id}/edit`}
              className="btn btn-secondary btn-sm"
              title="Edit decision"
            >
              <Edit3 size={13} />
              <span>Edit</span>
            </Link>
          )}

          {isDraft && canEdit && onSubmitDecision && (
            <button
              onClick={() => onSubmitDecision(decision.id)}
              className="btn btn-primary btn-sm"
              title="Submit draft for review"
            >
              <Send size={13} />
              <span>Submit</span>
            </button>
          )}

          <Link
            to={`/decisions/${decision.id}`}
            className="btn btn-outline btn-sm"
            title="View full decision"
          >
            <span>View</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </article>
  );
};

export default DecisionCard;
