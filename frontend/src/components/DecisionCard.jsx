import React from 'react';
import { Link } from 'react-router-dom';
import { DecisionStatusBadge } from './DecisionStatusBadge';
import { User, Calendar, Clock, ArrowRight, Edit3, Send } from 'lucide-react';

export const DecisionCard = ({ decision, currentUser, onSubmitDecision }) => {
  const isOwner = currentUser && decision.created_by === currentUser.id;
  const isAdmin = currentUser?.role?.name?.toLowerCase() === 'administrator';
  const isDraft = decision.status === 'Draft';
  const canEdit = isOwner || isAdmin;

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
    <article className="decision-card-item">
      <div>
        <div className="decision-card-top">
          <h3 className="decision-card-title">
            <Link to={`/decisions/${decision.id}`}>{decision.title}</Link>
          </h3>
          <DecisionStatusBadge status={decision.status} />
        </div>

        <p className="decision-card-problem">
          {decision.problem_statement.length > 135
            ? `${decision.problem_statement.substring(0, 135)}...`
            : decision.problem_statement}
        </p>

        <div className="decision-card-highlight">
          <span className="highlight-label">Decision Taken</span>
          <span className="highlight-text">
            {decision.decision_taken.length > 85
              ? `${decision.decision_taken.substring(0, 85)}...`
              : decision.decision_taken}
          </span>
        </div>
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
