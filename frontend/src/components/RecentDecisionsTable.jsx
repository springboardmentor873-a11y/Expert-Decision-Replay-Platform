import React from 'react';
import { Link } from 'react-router-dom';
import { DecisionStatusBadge } from './DecisionStatusBadge';
import { Layers, ArrowRight, Clock, PlusCircle, ExternalLink } from 'lucide-react';

export const RecentDecisionsTable = ({ decisions = [] }) => {
  const recentList = [...decisions]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="card recent-decisions-card">
      <div className="card-header-clean">
        <div className="chart-header-title">
          <Layers size={18} className="chart-header-icon" />
          <h3>Recent Decisions</h3>
        </div>
        <Link to="/decisions" className="btn-link-action">
          <span>View All</span>
          <ArrowRight size={15} />
        </Link>
      </div>

      {recentList.length === 0 ? (
        <div className="table-empty-state">
          <Layers size={36} className="empty-icon-muted" />
          <h4>No decisions recorded yet</h4>
          <p>Create your first decision to start tracking institutional knowledge.</p>
          <Link to="/decisions/new" className="btn btn-primary btn-sm mt-3">
            <PlusCircle size={15} />
            <span>Create Decision</span>
          </Link>
        </div>
      ) : (
        <div className="table-responsive-wrapper">
          <table className="enterprise-data-table">
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Decision Title</th>
                <th style={{ width: '22%' }}>Creator</th>
                <th style={{ width: '18%' }}>Status</th>
                <th style={{ width: '12%' }}>Created</th>
                <th style={{ width: '8%', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentList.map((dec) => (
                <tr key={dec.id} className="table-row-hoverable">
                  <td>
                    <Link to={`/decisions/${dec.id}`} className="table-decision-title">
                      {dec.title}
                    </Link>
                    {dec.problem_statement && (
                      <span className="table-decision-desc" title={dec.problem_statement}>
                        {dec.problem_statement.length > 70
                          ? `${dec.problem_statement.substring(0, 70)}...`
                          : dec.problem_statement}
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="table-creator-cell">
                      <span className="creator-avatar-mini">
                        {dec.creator?.full_name ? dec.creator.full_name[0].toUpperCase() : 'U'}
                      </span>
                      <span className="creator-name-text">
                        {dec.creator?.full_name || `User #${dec.created_by}`}
                      </span>
                    </div>
                  </td>
                  <td>
                    <DecisionStatusBadge status={dec.status} />
                  </td>
                  <td>
                    <span className="table-date-cell">
                      {formatDate(dec.created_at)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Link
                      to={`/decisions/${dec.id}`}
                      className="btn-table-action"
                      title="View Decision Details"
                    >
                      <span>View</span>
                      <ExternalLink size={13} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
