import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAuditLogs } from '../services/auditLogService';
import { AuditLogDetailsModal } from '../components/audit/AuditLogDetailsModal';
import {
  Shield,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  Activity,
  Database,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertCircle
} from 'lucide-react';

const ACTIONS = [
  'USER_REGISTERED',
  'USER_LOGIN',
  'USER_LOGOUT',
  'DECISION_CREATED',
  'DECISION_UPDATED',
  'DECISION_SUBMITTED',
  'DECISION_DELETED',
  'ALTERNATIVE_CREATED',
  'ALTERNATIVE_UPDATED',
  'ALTERNATIVE_DELETED',
  'DOCUMENT_UPLOADED',
  'DOCUMENT_DELETED',
  'DISCUSSION_CREATED',
  'DISCUSSION_UPDATED',
  'DISCUSSION_DELETED',
  'DISCUSSION_REPLY_CREATED',
  'DECISION_APPROVED',
  'DECISION_REJECTED',
  'VERSION_CREATED',
  'NOTIFICATION_CREATED',
  'NOTIFICATION_READ'
];

const ENTITY_TYPES = [
  'User',
  'Decision',
  'Alternative',
  'Document',
  'Discussion',
  'DecisionVersion',
  'Notification'
];

export const AuditLogs = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  // Filters and Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const [filterAction, setFilterAction] = useState('');
  const [filterEntityType, setFilterEntityType] = useState('');
  const [filterUserId, setFilterUserId] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAuditLogs({
        page,
        pageSize,
        action: filterAction,
        entityType: filterEntityType,
        userId: filterUserId ? parseInt(filterUserId, 10) : '',
        startDate: filterStartDate ? new Date(filterStartDate).toISOString() : '',
        endDate: filterEndDate ? new Date(filterEndDate).toISOString() : '',
      });
      setLogs(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message || 'Failed to retrieve audit logs');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filterAction, filterEntityType, filterUserId, filterStartDate, filterEndDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleResetFilters = () => {
    setFilterAction('');
    setFilterEntityType('');
    setFilterUserId('');
    setFilterStartDate('');
    setFilterEndDate('');
    setPage(1);
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      const date = new Date(isoString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="audit-logs-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-title-block">
          <div className="page-icon-wrapper audit-shield-wrapper">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="page-title">Audit Logs</h1>
            <p className="page-subtitle">Track important system activity, security monitoring, and decision history.</p>
          </div>
        </div>
        <div className="header-actions">
          <button
            className="btn-secondary btn-icon"
            onClick={fetchLogs}
            disabled={loading}
            title="Refresh Audit Logs"
          >
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="audit-filter-card card">
        <div className="filter-header">
          <div className="filter-title-group">
            <Filter size={16} />
            <span>Filter Audit Events</span>
          </div>
          {(filterAction || filterEntityType || filterUserId || filterStartDate || filterEndDate) && (
            <button className="btn-link" onClick={handleResetFilters}>
              Reset Filters
            </button>
          )}
        </div>

        <div className="filter-controls-grid">
          <div className="filter-control">
            <label htmlFor="action-filter">Action</label>
            <select
              id="action-filter"
              className="form-input"
              value={filterAction}
              onChange={(e) => {
                setFilterAction(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Actions</option>
              {ACTIONS.map((act) => (
                <option key={act} value={act}>{act}</option>
              ))}
            </select>
          </div>

          <div className="filter-control">
            <label htmlFor="entity-filter">Entity Type</label>
            <select
              id="entity-filter"
              className="form-input"
              value={filterEntityType}
              onChange={(e) => {
                setFilterEntityType(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Entities</option>
              {ENTITY_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="filter-control">
            <label htmlFor="user-filter">User ID</label>
            <input
              id="user-filter"
              type="number"
              placeholder="e.g. 1"
              className="form-input"
              value={filterUserId}
              onChange={(e) => {
                setFilterUserId(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="filter-control">
            <label htmlFor="start-date-filter">Date From</label>
            <input
              id="start-date-filter"
              type="date"
              className="form-input"
              value={filterStartDate}
              onChange={(e) => {
                setFilterStartDate(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="filter-control">
            <label htmlFor="end-date-filter">Date To</label>
            <input
              id="end-date-filter"
              type="date"
              className="form-input"
              value={filterEndDate}
              onChange={(e) => {
                setFilterEndDate(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="alert-banner alert-error" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Audit Logs Table Card */}
      <div className="card audit-table-card">
        <div className="card-header flex-between">
          <h2 className="card-title">Event Stream ({total} total records)</h2>
          <span className="audit-append-only-notice">
            <Shield size={14} /> Append-Only Immutable Ledger
          </span>
        </div>

        {loading ? (
          <div className="loading-state">
            <RefreshCw size={24} className="spinning" />
            <p>Loading audit logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <Shield size={40} className="empty-icon" />
            <h3>No audit records found</h3>
            <p>No audit events match your active filters.</p>
            {(filterAction || filterEntityType || filterUserId || filterStartDate || filterEndDate) && (
              <button className="btn-secondary mt-3" onClick={handleResetFilters}>
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th style={{ width: '160px' }}>Timestamp</th>
                  <th style={{ width: '160px' }}>User</th>
                  <th style={{ width: '190px' }}>Action</th>
                  <th style={{ width: '140px' }}>Entity</th>
                  <th>Description</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((item) => (
                  <tr key={item.id} className="audit-row" onClick={() => setSelectedLog(item)}>
                    <td className="audit-cell-timestamp">
                      <Clock size={13} className="inline-icon" />
                      <span>{formatDate(item.created_at)}</span>
                    </td>
                    <td className="audit-cell-user">
                      {item.user ? (
                        <div className="user-info-snippet">
                          <span className="user-name">{item.user.full_name}</span>
                          <span className="user-subtext">{item.user.email}</span>
                        </div>
                      ) : item.user_id ? (
                        <span className="user-fallback">User #{item.user_id}</span>
                      ) : (
                        <span className="text-muted">System</span>
                      )}
                    </td>
                    <td>
                      <span className="audit-action-badge">{item.action}</span>
                    </td>
                    <td>
                      <span className="audit-entity-badge">
                        {item.entity_type} {item.entity_id ? `#${item.entity_id}` : ''}
                      </span>
                    </td>
                    <td className="audit-cell-desc">
                      <span className="audit-desc-text" title={item.description}>
                        {item.description}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn-icon-cell"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(item);
                        }}
                        title="View Full Details"
                        aria-label="View Full Details"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 0 && (
          <div className="pagination-bar">
            <div className="pagination-info">
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total} records
            </div>
            <div className="pagination-controls">
              <button
                className="btn-page"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
              >
                <ChevronLeft size={16} />
                <span>Prev</span>
              </button>
              <span className="page-indicator">
                Page {page} of {totalPages}
              </span>
              <button
                className="btn-page"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <AuditLogDetailsModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
};

export default AuditLogs;
