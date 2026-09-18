import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardSummary } from '../services/dashboardService';
import {
  Layers,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Activity,
  PlusCircle,
  Compass,
  BarChart3,
  Shield,
  Bell,
  RefreshCw,
  AlertCircle,
  Calendar,
  ChevronRight,
  MessageSquare,
  Paperclip,
  Users,
  ExternalLink,
  TrendingUp,
  ArrowUpRight,
  Inbox
} from 'lucide-react';

const STATUS_COLORS = {
  Draft: '#94a3b8',
  Submitted: '#3b82f6',
  'Under Review': '#f59e0b',
  Approved: '#10b981',
  Rejected: '#ef4444',
};

function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || '#94a3b8';
  return (
    <span
      className="dash-status-badge"
      style={{
        backgroundColor: `${color}15`,
        color: color,
        borderColor: `${color}40`,
      }}
    >
      {status}
    </span>
  );
}

function KpiCard({ icon: Icon, label, value, color = '#2563eb', sub, highlight = false }) {
  return (
    <div className={`dash-kpi-card ${highlight ? 'dash-kpi-highlight' : ''}`}>
      <div className="dash-kpi-header">
        <span className="dash-kpi-label">{label}</span>
        <div className="dash-kpi-icon-wrap" style={{ backgroundColor: `${color}15`, color }}>
          <Icon size={18} strokeWidth={2.2} />
        </div>
      </div>
      <div className="dash-kpi-body">
        <span className="dash-kpi-value">{value ?? 0}</span>
        {sub && <span className="dash-kpi-sub">{sub}</span>}
      </div>
    </div>
  );
}

function DonutChart({ data = [], size = 150 }) {
  const total = data.reduce((s, d) => s + (d.count || 0), 0);
  if (total === 0) {
    return (
      <div className="dash-donut-empty">
        <svg width={size} height={size}>
          <circle cx={size / 2} cy={size / 2} r={size / 2 - 12} fill="none" stroke="#e2e8f0" strokeWidth={18} />
        </svg>
        <span className="dash-donut-empty-text">No Decisions</span>
      </div>
    );
  }

  const r = size / 2 - 14;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  const slices = data
    .filter((d) => d.count > 0)
    .map((d) => {
      const pct = d.count / total;
      const dashArray = circumference * pct;
      const slice = { ...d, dashArray, dashOffset: -offset * circumference };
      offset += pct;
      return slice;
    });

  return (
    <div className="dash-donut-wrap">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={18} />
        {slices.map((s, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={18}
            strokeDasharray={`${s.dashArray} ${circumference}`}
            strokeDashoffset={s.dashOffset}
            strokeLinecap="butt"
          />
        ))}
      </svg>
      <div className="dash-donut-center">
        <span className="dash-donut-total">{total}</span>
        <span className="dash-donut-label">Total</span>
      </div>
    </div>
  );
}

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDateTime(dtStr) {
  if (!dtStr) return '—';
  try {
    const d = new Date(dtStr);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dtStr;
  }
}

export function Dashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const summary = await getDashboardSummary(token);
      setData(summary);
    } catch (err) {
      setError(err.message || 'Unable to load dashboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const userRole = (data?.user_role || user?.role?.name || '').toLowerCase();
  const isReviewerOrAbove = ['reviewer', 'manager', 'administrator'].includes(userRole);
  const isManagerOrAdmin = ['manager', 'administrator'].includes(userRole);

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  if (loading && !data) {
    return (
      <div className="dash-page">
        <div className="dash-loading-container">
          <div className="dash-spinner"></div>
          <p className="dash-loading-text">Loading enterprise dashboard intelligence…</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="dash-page">
        <div className="dash-error-container">
          <AlertCircle size={44} className="dash-error-icon" />
          <h2 className="dash-error-title">Unable to Load Dashboard</h2>
          <p className="dash-error-desc">{error}</p>
          <button className="btn btn-primary" onClick={() => fetchDashboard(true)}>
            <RefreshCw size={16} />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const statusDist = data?.status_distribution || [];
  const trendData = data?.decision_trend || [];
  const approval = data?.approval_summary || {};
  const recentDecisions = data?.recent_decisions || [];
  const pendingItems = data?.pending_items || [];
  const recentActivity = data?.recent_activity || [];
  const recentDiscussions = data?.recent_discussions || [];
  const recentDocuments = data?.recent_documents || [];
  const notifications = data?.notifications || [];

  return (
    <div className="dash-page">
      {/* 1. Header Banner */}
      <div className="dash-header">
        <div className="dash-header-left">
          <div className="dash-welcome-row">
            <h1 className="dash-welcome-title">
              Welcome back, {user?.full_name || 'Team Member'}
            </h1>
            <span className={`dash-role-badge badge-${userRole}`}>
              {data?.user_role || user?.role?.name || 'Member'}
            </span>
          </div>
          <p className="dash-welcome-subtitle">
            Here's what's happening with your organization's decisions today.
          </p>
        </div>

        <div className="dash-header-right">
          <div className="dash-date-pill">
            <Calendar size={15} />
            <span>{todayFormatted}</span>
          </div>
          <button
            className="btn btn-outline btn-sm dash-refresh-btn"
            onClick={() => fetchDashboard(true)}
            disabled={refreshing}
            title="Refresh dashboard metrics"
            aria-label="Refresh dashboard data"
          >
            <RefreshCw size={14} className={refreshing ? 'spin-icon' : ''} />
            <span>{refreshing ? 'Updating…' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* 2. Quick Actions Bar */}
      <div className="dash-quick-actions-bar">
        <div className="dash-quick-actions-label">
          <span>Quick Actions:</span>
        </div>
        <div className="dash-quick-actions-list">
          <Link to="/decisions/new" className="btn btn-primary btn-sm dash-action-btn">
            <PlusCircle size={15} />
            <span>Create Decision</span>
          </Link>

          <Link to="/decisions" className="btn btn-outline btn-sm dash-action-btn">
            <Compass size={15} />
            <span>View Decisions</span>
          </Link>

          {isReviewerOrAbove && (
            <Link to="/approvals/pending" className="btn btn-outline btn-sm dash-action-btn">
              <Clock size={15} />
              <span>Pending Approvals ({kpis.pending_review || 0})</span>
            </Link>
          )}

          <Link to="/reports" className="btn btn-outline btn-sm dash-action-btn">
            <BarChart3 size={15} />
            <span>Reports</span>
          </Link>

          {isManagerOrAdmin && (
            <Link to="/audit-logs" className="btn btn-outline btn-sm dash-action-btn">
              <Shield size={15} />
              <span>Audit Logs</span>
            </Link>
          )}

          <Link to="/notifications" className="btn btn-outline btn-sm dash-action-btn">
            <Bell size={15} />
            <span>Notifications {kpis.unread_notifications_count > 0 && `(${kpis.unread_notifications_count})`}</span>
          </Link>
        </div>
      </div>

      {/* 3. Top KPI Cards */}
      <div className="dash-kpi-grid">
        <KpiCard
          icon={Layers}
          label="Total Decisions"
          value={kpis.total_decisions}
          color="#2563eb"
          sub="In your accessible scope"
          highlight={true}
        />
        <KpiCard
          icon={Clock}
          label="Pending Review"
          value={kpis.pending_review}
          color="#f59e0b"
          sub="Awaiting review or decision"
        />
        <KpiCard
          icon={CheckCircle2}
          label="Approved"
          value={kpis.approved}
          color="#10b981"
          sub={`${kpis.total_decisions > 0 ? Math.round((kpis.approved / kpis.total_decisions) * 100) : 0}% of all decisions`}
        />
        <KpiCard
          icon={XCircle}
          label="Rejected"
          value={kpis.rejected}
          color="#ef4444"
          sub={`${kpis.total_decisions > 0 ? Math.round((kpis.rejected / kpis.total_decisions) * 100) : 0}% of all decisions`}
        />
        <KpiCard
          icon={FileText}
          label="My Decisions"
          value={kpis.my_decisions}
          color="#8b5cf6"
          sub="Authored by you"
        />
        <KpiCard
          icon={Activity}
          label="Recent Activities"
          value={kpis.recent_activity_count}
          color="#0ea5e9"
          sub="System & decision events"
        />
      </div>

      {/* 4. Visual Charts Row (Status Distribution, Trend, Approval Performance) */}
      <div className="dash-charts-grid">
        {/* Status Distribution Donut */}
        <div className="dash-card dash-status-card">
          <div className="dash-card-header">
            <h3 className="dash-card-title">Decision Status Distribution</h3>
            <span className="dash-card-tag">{kpis.total_decisions} Total</span>
          </div>
          <div className="dash-donut-section">
            <DonutChart data={statusDist} size={150} />
            <div className="dash-donut-legend">
              {statusDist.map((item) => (
                <div key={item.status} className="dash-legend-item">
                  <div className="dash-legend-color-label">
                    <span className="dash-legend-dot" style={{ backgroundColor: item.color }}></span>
                    <span className="dash-legend-name">{item.status}</span>
                  </div>
                  <div className="dash-legend-stats">
                    <span className="dash-legend-count">{item.count}</span>
                    <span className="dash-legend-pct">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Decision Creation Trend */}
        <div className="dash-card dash-trend-card">
          <div className="dash-card-header">
            <h3 className="dash-card-title">Decision Creation Trend</h3>
            <span className="dash-card-tag">Timeline</span>
          </div>
          <div className="dash-trend-body">
            {trendData.length === 0 ? (
              <div className="dash-empty-chart">
                <TrendingUp size={28} className="dash-empty-icon" />
                <span>No decision history available for trend analysis.</span>
              </div>
            ) : (
              <div className="dash-trend-bars">
                {trendData.slice(-10).map((t, idx) => {
                  const maxCount = Math.max(...trendData.map((x) => x.count), 1);
                  const barHeight = Math.max(Math.round((t.count / maxCount) * 100), 12);
                  return (
                    <div key={idx} className="dash-trend-bar-col">
                      <div className="dash-trend-bar-val">{t.count}</div>
                      <div className="dash-trend-bar-track">
                        <div
                          className="dash-trend-bar-fill"
                          style={{ height: `${barHeight}%` }}
                          title={`${t.count} decisions on ${t.date}`}
                        ></div>
                      </div>
                      <div className="dash-trend-bar-label">{t.date.substring(5)}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Approval Performance */}
        <div className="dash-card dash-perf-card">
          <div className="dash-card-header">
            <h3 className="dash-card-title">Approval Performance</h3>
            <span className="dash-card-tag">{approval.total_reviews} Reviews</span>
          </div>
          <div className="dash-perf-body">
            <div className="dash-perf-stat-row">
              <div className="dash-perf-stat">
                <span className="dash-perf-label">Approval Rate</span>
                <span className="dash-perf-val text-success">{approval.approval_rate}%</span>
              </div>
              <div className="dash-perf-stat">
                <span className="dash-perf-label">Rejection Rate</span>
                <span className="dash-perf-val text-danger">{approval.rejection_rate}%</span>
              </div>
              <div className="dash-perf-stat">
                <span className="dash-perf-label">Avg Turnaround</span>
                <span className="dash-perf-val">
                  {approval.average_turnaround_hours !== null && approval.average_turnaround_hours !== undefined
                    ? `${approval.average_turnaround_hours}h`
                    : 'N/A'}
                </span>
              </div>
            </div>

            <div className="dash-perf-bar-wrap">
              <div className="dash-perf-bar-label-row">
                <span>Approved ({approval.approved_count})</span>
                <span>Rejected ({approval.rejected_count})</span>
              </div>
              <div className="dash-perf-progress-track">
                <div
                  className="dash-perf-progress-fill approved"
                  style={{ width: `${Math.min(approval.approval_rate, 100)}%` }}
                ></div>
                <div
                  className="dash-perf-progress-fill rejected"
                  style={{ width: `${Math.min(approval.rejection_rate, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="dash-perf-queue-summary">
              <span className="dash-perf-queue-icon">
                <Clock size={14} />
              </span>
              <span>
                <strong>{approval.pending_approvals}</strong> decisions currently in the approval queue.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Workload & Decision Queue Row */}
      <div className="dash-split-grid">
        {/* Pending Review Section */}
        <div className="dash-card">
          <div className="dash-card-header">
            <div className="dash-card-title-group">
              <h3 className="dash-card-title">
                {isReviewerOrAbove ? 'Decisions Awaiting Review' : 'My Decisions Awaiting Review'}
              </h3>
              <span className="dash-badge-count">{pendingItems.length}</span>
            </div>
            {isReviewerOrAbove && (
              <Link to="/approvals/pending" className="dash-header-link">
                View Queue <ArrowUpRight size={14} />
              </Link>
            )}
          </div>

          <div className="dash-card-body">
            {pendingItems.length === 0 ? (
              <div className="dash-empty-state">
                <Inbox size={32} className="dash-empty-icon" />
                <p className="dash-empty-title">Queue is clear</p>
                <p className="dash-empty-desc">
                  {isReviewerOrAbove
                    ? 'No decisions are currently pending review.'
                    : 'None of your submitted decisions are currently awaiting review.'}
                </p>
              </div>
            ) : (
              <div className="dash-pending-list">
                {pendingItems.map((item) => (
                  <div key={item.id} className="dash-pending-item">
                    <div className="dash-pending-info">
                      <Link to={`/decisions/${item.id}`} className="dash-pending-title">
                        {item.title}
                      </Link>
                      <div className="dash-pending-meta">
                        <span>Submitted by <strong>{item.submitted_by_name}</strong></span>
                        <span>•</span>
                        <span>{formatDateTime(item.submitted_at)}</span>
                      </div>
                    </div>
                    <div className="dash-pending-actions">
                      <StatusBadge status={item.status} />
                      <Link
                        to={`/decisions/${item.id}`}
                        className="btn btn-outline btn-xs"
                      >
                        {isReviewerOrAbove ? 'Review' : 'View'}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Decisions Section */}
        <div className="dash-card">
          <div className="dash-card-header">
            <div className="dash-card-title-group">
              <h3 className="dash-card-title">Recent Decisions</h3>
              <span className="dash-badge-count">{recentDecisions.length}</span>
            </div>
            <Link to="/decisions" className="dash-header-link">
              View All <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="dash-card-body">
            {recentDecisions.length === 0 ? (
              <div className="dash-empty-state">
                <Layers size={32} className="dash-empty-icon" />
                <p className="dash-empty-title">No decisions yet</p>
                <p className="dash-empty-desc">Start by capturing your first architectural decision.</p>
                <Link to="/decisions/new" className="btn btn-primary btn-sm mt-3">
                  <PlusCircle size={14} /> Create Decision
                </Link>
              </div>
            ) : (
              <div className="dash-table-wrap">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Author</th>
                      <th>Updated</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentDecisions.map((dec) => (
                      <tr key={dec.id}>
                        <td className="dash-td-title">
                          <Link to={`/decisions/${dec.id}`} className="dash-table-title-link">
                            {dec.title}
                          </Link>
                        </td>
                        <td>
                          <StatusBadge status={dec.status} />
                        </td>
                        <td className="dash-td-author">{dec.creator_name}</td>
                        <td className="dash-td-date">{formatDateTime(dec.updated_at)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <Link to={`/decisions/${dec.id}`} className="dash-view-link">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6. Collaboration, Activity & Feeds (Audit, Discussions, Documents, Team) */}
      <div className="dash-triple-grid">
        {/* Recent Activity Feed */}
        <div className="dash-card">
          <div className="dash-card-header">
            <div className="dash-card-title-group">
              <Activity size={16} className="text-primary" />
              <h3 className="dash-card-title">Recent Activity</h3>
            </div>
            {isManagerOrAdmin && (
              <Link to="/audit-logs" className="dash-header-link">
                Audit Logs <ChevronRight size={14} />
              </Link>
            )}
          </div>
          <div className="dash-card-body">
            {recentActivity.length === 0 ? (
              <div className="dash-empty-state-sm">
                <span>No recent activity recorded.</span>
              </div>
            ) : (
              <div className="dash-activity-stream">
                {recentActivity.map((act) => (
                  <div key={act.id} className="dash-activity-item">
                    <div className="dash-activity-dot"></div>
                    <div className="dash-activity-content">
                      <div className="dash-activity-desc">
                        <strong>{act.user_name}</strong> {act.description}
                      </div>
                      <div className="dash-activity-meta">
                        <span className="dash-activity-action-tag">{act.action}</span>
                        {act.decision_title && (
                          <span className="dash-activity-target">
                            • Decision: <em>{act.decision_title}</em>
                          </span>
                        )}
                        <span className="dash-activity-time">• {formatDateTime(act.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Discussions */}
        <div className="dash-card">
          <div className="dash-card-header">
            <div className="dash-card-title-group">
              <MessageSquare size={16} className="text-primary" />
              <h3 className="dash-card-title">Recent Discussions</h3>
            </div>
          </div>
          <div className="dash-card-body">
            {recentDiscussions.length === 0 ? (
              <div className="dash-empty-state-sm">
                <span>No discussions yet. Collaborate on any decision thread.</span>
              </div>
            ) : (
              <div className="dash-discussion-list">
                {recentDiscussions.map((disc) => (
                  <div key={disc.id} className="dash-discussion-item">
                    <div className="dash-discussion-header">
                      <span className="dash-discussion-author">{disc.user_name}</span>
                      <span className="dash-discussion-date">{formatDateTime(disc.created_at)}</span>
                    </div>
                    <p className="dash-discussion-snippet">"{disc.content_snippet}"</p>
                    <Link
                      to={`/decisions/${disc.decision_id}`}
                      className="dash-discussion-ref"
                    >
                      On: {disc.decision_title} <ExternalLink size={11} />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Supporting Documents & Team Insights */}
        <div className="dash-card-column">
          {/* Recent Documents */}
          <div className="dash-card">
            <div className="dash-card-header">
              <div className="dash-card-title-group">
                <Paperclip size={16} className="text-primary" />
                <h3 className="dash-card-title">Recent Documents</h3>
              </div>
            </div>
            <div className="dash-card-body">
              {recentDocuments.length === 0 ? (
                <div className="dash-empty-state-sm">
                  <span>No documents attached to accessible decisions.</span>
                </div>
              ) : (
                <div className="dash-document-list">
                  {recentDocuments.map((doc) => (
                    <div key={doc.id} className="dash-document-item">
                      <div className="dash-document-icon">
                        <FileText size={16} />
                      </div>
                      <div className="dash-document-info">
                        <span className="dash-document-name" title={doc.filename}>
                          {doc.filename}
                        </span>
                        <div className="dash-document-meta">
                          <span>{formatFileSize(doc.file_size)}</span>
                          <span>•</span>
                          <span>{doc.uploaded_by_name}</span>
                        </div>
                      </div>
                      <Link to={`/decisions/${doc.decision_id}`} className="dash-doc-link">
                        View
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Team Insights Placeholder */}
          <div className="dash-card dash-team-card">
            <div className="dash-card-header">
              <div className="dash-card-title-group">
                <Users size={16} className="text-primary" />
                <h3 className="dash-card-title">Team Insights</h3>
              </div>
            </div>
            <div className="dash-card-body">
              <div className="dash-team-placeholder">
                <p className="dash-team-msg">
                  Team insights and cross-functional metrics will appear here when organization team structures are configured.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
