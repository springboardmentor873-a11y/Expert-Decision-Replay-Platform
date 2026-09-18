import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getDecisionSummaryReport,
  getApprovalReport,
  getOutcomeReport,
  getAlternativeReport,
  getActivityReport,
  getTeamReport,
  getAuditReport,
  getDecisionTimeline,
  downloadReport,
} from '../services/reportService';
import {
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Activity,
  Download,
  Printer,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Loader,
  TrendingUp,
  Users,
  Shield,
  X,
} from 'lucide-react';

const TABS = [
  { id: 'summary', label: 'Decision Summary', icon: BarChart3 },
  { id: 'approvals', label: 'Approvals', icon: CheckCircle },
  { id: 'outcomes', label: 'Outcomes', icon: TrendingUp },
  { id: 'alternatives', label: 'Alternatives', icon: FileText },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'team', label: 'Team Reports', icon: Users },
  { id: 'audit', label: 'Audit Trail', icon: Shield },
];

const STATUS_COLORS = {
  Draft: '#94a3b8',
  Submitted: '#3b82f6',
  'Under Review': '#f59e0b',
  Approved: '#10b981',
  Rejected: '#ef4444',
  Archived: '#64748b',
};

function KpiCard({ icon: Icon, label, value, sub, color = '#3b82f6' }) {
  return (
    <div className="rpt-kpi-card">
      <div className="rpt-kpi-icon" style={{ background: `${color}18`, color }}>
        <Icon size={20} strokeWidth={2} />
      </div>
      <div className="rpt-kpi-body">
        <div className="rpt-kpi-value">{value}</div>
        <div className="rpt-kpi-label">{label}</div>
        {sub && <div className="rpt-kpi-sub">{sub}</div>}
      </div>
    </div>
  );
}

function DonutChart({ data = [], size = 140 }) {
  const total = data.reduce((s, d) => s + (d.count || 0), 0);
  if (total === 0) {
    return (
      <div className="rpt-donut-empty">
        <svg width={size} height={size}>
          <circle cx={size / 2} cy={size / 2} r={size / 2 - 10} fill="none" stroke="#e2e8f0" strokeWidth={20} />
        </svg>
        <span>No data</span>
      </div>
    );
  }

  const r = size / 2 - 18;
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
    <div className="rpt-donut-wrap">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth={20} />
        {slices.map((s, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={STATUS_COLORS[s.status] || '#94a3b8'}
            strokeWidth={20}
            strokeDasharray={`${s.dashArray} ${circumference}`}
            strokeDashoffset={s.dashOffset}
          />
        ))}
      </svg>
      <div className="rpt-donut-center">
        <span className="rpt-donut-total">{total}</span>
        <span className="rpt-donut-sub">Total</span>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || '#94a3b8';
  return (
    <span className="rpt-badge" style={{ background: `${color}18`, color }}>
      <span className="rpt-badge-dot" style={{ background: color }} />
      {status}
    </span>
  );
}

function Pagination({ page, pages, onPage }) {
  if (!pages || pages <= 1) return null;
  return (
    <div className="rpt-pagination">
      <button
        className="rpt-page-btn"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft size={16} /> Prev
      </button>
      <span className="rpt-page-info">
        Page {page} of {pages}
      </span>
      <button
        className="rpt-page-btn"
        disabled={page >= pages}
        onClick={() => onPage(page + 1)}
        aria-label="Next page"
      >
        Next <ChevronRight size={16} />
      </button>
    </div>
  );
}

function TimelineModal({ decisionId, token, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    getDecisionTimeline(decisionId, token)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [decisionId, token]);

  const STAGE_COLORS = {
    Creation: '#3b82f6',
    Submission: '#f59e0b',
    Alternatives: '#8b5cf6',
    Documents: '#06b6d4',
    Discussions: '#10b981',
    Review: '#f43f5e',
    Revision: '#6366f1',
    Activity: '#94a3b8',
  };

  return (
    <div className="rpt-modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="rpt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="rpt-modal-header">
          <div>
            <h2 className="rpt-modal-title">Decision Timeline</h2>
            {data && (
              <p className="rpt-modal-subtitle">
                #{data.decision_id} — {data.title}
                <StatusBadge status={data.status} />
              </p>
            )}
          </div>
          <button className="rpt-modal-close" onClick={onClose} aria-label="Close timeline">
            <X size={18} />
          </button>
        </div>
        <div className="rpt-modal-body">
          {loading && (
            <div className="rpt-loading-state">
              <Loader size={28} className="rpt-spinner" />
              <span>Loading timeline…</span>
            </div>
          )}
          {error && <div className="rpt-error-state"><AlertTriangle size={20} />{error}</div>}
          {data && !loading && (
            <div className="rpt-timeline">
              {data.events.map((ev, i) => {
                const color = STAGE_COLORS[ev.stage] || '#94a3b8';
                return (
                  <div key={ev.event_id} className="rpt-timeline-item">
                    <div className="rpt-timeline-rail">
                      <div className="rpt-timeline-dot" style={{ background: color, borderColor: `${color}40` }} />
                      {i < data.events.length - 1 && <div className="rpt-timeline-line" />}
                    </div>
                    <div className="rpt-timeline-content">
                      <div className="rpt-timeline-header">
                        <span className="rpt-timeline-stage" style={{ color }}>{ev.stage}</span>
                        <span className="rpt-timeline-time">
                          {new Date(ev.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="rpt-timeline-title">{ev.title}</div>
                      {ev.description && (
                        <div className="rpt-timeline-desc">{ev.description}</div>
                      )}
                      {ev.actor_name && (
                        <div className="rpt-timeline-actor">
                          <Users size={12} /> {ev.actor_name}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Reports() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('summary');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [timelineId, setTimelineId] = useState(null);
  const [exportingFormat, setExportingFormat] = useState(null);

  // Filters per tab
  const [filters, setFilters] = useState({
    summary: { startDate: '', endDate: '', status: '', title: '' },
    approvals: { startDate: '', endDate: '', action: '', reviewerId: '' },
    outcomes: { outcomeStatus: '', status: '' },
    alternatives: { feasibility: '', isSelected: '' },
    activity: { action: '', decisionId: '' },
    team: { teamId: '', startDate: '', endDate: '' },
    audit: { action: '', userId: '', decisionId: '', startDate: '', endDate: '' },
  });

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError('');
    setData(null);
    try {
      let result;
      const f = filters[activeTab] || {};
      if (activeTab === 'summary') {
        result = await getDecisionSummaryReport(f, token);
      } else if (activeTab === 'approvals') {
        result = await getApprovalReport({ page, pageSize: 20, ...f }, token);
      } else if (activeTab === 'outcomes') {
        result = await getOutcomeReport({ page, pageSize: 20, ...f }, token);
      } else if (activeTab === 'alternatives') {
        result = await getAlternativeReport({ page, pageSize: 20, ...f }, token);
      } else if (activeTab === 'activity') {
        result = await getActivityReport({ page, pageSize: 20, ...f }, token);
      } else if (activeTab === 'team') {
        result = await getTeamReport(f, token);
      } else if (activeTab === 'audit') {
        result = await getAuditReport({ page, pageSize: 20, ...f }, token);
      }
      setData(result);
    } catch (e) {
      setError(e.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, filters, token]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
    setData(null);
    setError('');
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], [field]: value },
    }));
    setPage(1);
  };

  const handleExport = async (format) => {
    if (exportingFormat) return;
    setExportingFormat(format);
    try {
      const f = filters[activeTab] || {};
      await downloadReport({ reportType: activeTab, format, filters: f }, token);
    } catch (e) {
      alert(`${format.toUpperCase()} export failed: ` + e.message);
    } finally {
      setExportingFormat(null);
    }
  };

  const f = filters[activeTab] || {};
  const dist = data?.status_distribution || [];
  const legendItems = dist.filter((d) => d.count > 0);

  return (
    <div className="rpt-page">
      {/* Page Header */}
      <div className="rpt-page-header">
        <div className="rpt-page-title-block">
          <h1 className="rpt-page-title">
            <BarChart3 size={22} strokeWidth={2} className="rpt-title-icon" />
            Reports & Analytics
          </h1>
          <p className="rpt-page-subtitle">
            Real-time intelligence across decisions, approvals, outcomes, team metrics, and audit logs.
          </p>
        </div>
        <div className="rpt-page-actions">
          <button
            className="rpt-btn rpt-btn-outline"
            onClick={() => window.print()}
            aria-label="Print report"
          >
            <Printer size={15} /> Print
          </button>
          <button
            className="rpt-btn rpt-btn-outline"
            onClick={fetchReport}
            disabled={loading}
            aria-label="Refresh report"
          >
            <RefreshCw size={15} className={loading ? 'rpt-spin' : ''} /> Refresh
          </button>

          {/* Native High-Fidelity Export Actions: CSV, Excel (.xlsx), PDF (.pdf) */}
          <button
            className="rpt-btn rpt-btn-outline"
            onClick={() => handleExport('csv')}
            disabled={exportingFormat !== null || loading}
            aria-label="Export CSV"
          >
            <Download size={14} /> {exportingFormat === 'csv' ? 'Exporting…' : 'Export CSV'}
          </button>
          <button
            className="rpt-btn rpt-btn-outline"
            onClick={() => handleExport('xlsx')}
            disabled={exportingFormat !== null || loading}
            aria-label="Export Excel"
          >
            <Download size={14} /> {exportingFormat === 'xlsx' ? 'Exporting…' : 'Export Excel (.xlsx)'}
          </button>
          <button
            className="rpt-btn rpt-btn-primary"
            onClick={() => handleExport('pdf')}
            disabled={exportingFormat !== null || loading}
            aria-label="Export PDF"
          >
            <Download size={14} /> {exportingFormat === 'pdf' ? 'Exporting…' : 'Export PDF (.pdf)'}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="rpt-tabs" role="tablist" aria-label="Report sections">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`rpt-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              <Icon size={15} strokeWidth={2} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="rpt-filter-bar">
        {activeTab === 'summary' && (
          <>
            <input
              className="rpt-input"
              type="datetime-local"
              placeholder="Start Date"
              value={f.startDate || ''}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              aria-label="Start date filter"
            />
            <input
              className="rpt-input"
              type="datetime-local"
              placeholder="End Date"
              value={f.endDate || ''}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              aria-label="End date filter"
            />
            <select
              className="rpt-select"
              value={f.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              aria-label="Status filter"
            >
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Review">Under Review</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Archived">Archived</option>
            </select>
            <input
              className="rpt-input"
              type="text"
              placeholder="Search title…"
              value={f.title || ''}
              onChange={(e) => handleFilterChange('title', e.target.value)}
              aria-label="Title search filter"
            />
          </>
        )}
        {activeTab === 'approvals' && (
          <>
            <input
              className="rpt-input"
              type="datetime-local"
              value={f.startDate || ''}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              aria-label="Start date filter"
            />
            <input
              className="rpt-input"
              type="datetime-local"
              value={f.endDate || ''}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              aria-label="End date filter"
            />
            <select
              className="rpt-select"
              value={f.action || ''}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              aria-label="Action filter"
            >
              <option value="">All Actions</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Requested Changes">Requested Changes</option>
            </select>
          </>
        )}
        {activeTab === 'outcomes' && (
          <>
            <select
              className="rpt-select"
              value={f.outcomeStatus || ''}
              onChange={(e) => handleFilterChange('outcomeStatus', e.target.value)}
              aria-label="Outcome recorded filter"
            >
              <option value="">All Outcomes</option>
              <option value="recorded">Outcome Recorded</option>
              <option value="pending">Outcome Pending</option>
            </select>
            <select
              className="rpt-select"
              value={f.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              aria-label="Status filter"
            >
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Review">Under Review</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Archived">Archived</option>
            </select>
          </>
        )}
        {activeTab === 'alternatives' && (
          <>
            <select
              className="rpt-select"
              value={f.isSelected !== undefined ? f.isSelected : ''}
              onChange={(e) => handleFilterChange('isSelected', e.target.value)}
              aria-label="Selected filter"
            >
              <option value="">All Alternatives</option>
              <option value="true">Selected Only</option>
              <option value="false">Not Selected</option>
            </select>
            <select
              className="rpt-select"
              value={f.feasibility || ''}
              onChange={(e) => handleFilterChange('feasibility', e.target.value)}
              aria-label="Feasibility filter"
            >
              <option value="">All Feasibilities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </>
        )}
        {activeTab === 'activity' && (
          <>
            <input
              className="rpt-input"
              type="text"
              placeholder="Action name…"
              value={f.action || ''}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              aria-label="Action filter"
            />
            <input
              className="rpt-input"
              type="number"
              placeholder="Decision ID…"
              value={f.decisionId || ''}
              onChange={(e) => handleFilterChange('decisionId', e.target.value)}
              aria-label="Decision ID filter"
            />
          </>
        )}
        {activeTab === 'team' && (
          <>
            <input
              className="rpt-input"
              type="datetime-local"
              placeholder="Start Date"
              value={f.startDate || ''}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
            <input
              className="rpt-input"
              type="datetime-local"
              placeholder="End Date"
              value={f.endDate || ''}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </>
        )}
        {activeTab === 'audit' && (
          <>
            <input
              className="rpt-input"
              type="text"
              placeholder="Action name…"
              value={f.action || ''}
              onChange={(e) => handleFilterChange('action', e.target.value)}
            />
            <input
              className="rpt-input"
              type="datetime-local"
              value={f.startDate || ''}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
            <input
              className="rpt-input"
              type="datetime-local"
              value={f.endDate || ''}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </>
        )}
      </div>

      {/* Report Content Body */}
      <div className="rpt-body">
        {loading && (
          <div className="rpt-loading-state">
            <Loader size={32} className="rpt-spinner" />
            <span>Generating real-time analytics…</span>
          </div>
        )}

        {error && (
          <div className="rpt-error-state" role="alert">
            <AlertTriangle size={24} />
            <div>
              <strong>Failed to load report</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* ── SUMMARY TAB ── */}
        {!loading && !error && data && activeTab === 'summary' && (
          <>
            <div className="rpt-kpi-grid">
              <KpiCard icon={BarChart3} label="Total Decisions" value={data.total_decisions} color="#3b82f6" />
              <KpiCard icon={CheckCircle} label="Approved Rate" value={`${data.approved_rate}%`} color="#10b981" />
              <KpiCard icon={Clock} label="Under Review" value={data.status_counts?.['Under Review'] || 0} color="#f59e0b" />
              <KpiCard icon={FileText} label="Draft Decisions" value={data.status_counts?.Draft || 0} color="#94a3b8" />
            </div>

            <div className="rpt-charts-row">
              <div className="rpt-card rpt-chart-card">
                <h3 className="rpt-card-title">Status Distribution</h3>
                <div className="rpt-donut-layout">
                  <DonutChart data={dist} />
                  <div className="rpt-legend">
                    {legendItems.map((item) => (
                      <div key={item.status} className="rpt-legend-item">
                        <span className="rpt-legend-dot" style={{ background: STATUS_COLORS[item.status] || '#94a3b8' }} />
                        <span className="rpt-legend-name">{item.status}</span>
                        <span className="rpt-legend-cnt">{item.count}</span>
                        <span className="rpt-legend-pct">({item.percentage}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rpt-card rpt-table-card">
                <h3 className="rpt-card-title">Recent Decisions</h3>
                <div className="rpt-table-wrap">
                  <table className="rpt-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Title</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Timeline</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.decisions?.map((d) => (
                        <tr key={d.id}>
                          <td className="rpt-id">#{d.id}</td>
                          <td className="rpt-title-cell">{d.title}</td>
                          <td><StatusBadge status={d.status} /></td>
                          <td className="rpt-date">{new Date(d.created_at).toLocaleDateString()}</td>
                          <td>
                            <button
                              className="rpt-link-btn"
                              onClick={() => setTimelineId(d.id)}
                              aria-label={`View timeline for decision #${d.id}`}
                            >
                              Timeline &rarr;
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── APPROVALS TAB ── */}
        {!loading && !error && data && activeTab === 'approvals' && (
          <>
            <div className="rpt-kpi-grid">
              <KpiCard icon={CheckCircle} label="Total Actions" value={data.total_actions} color="#10b981" />
              <KpiCard icon={CheckCircle} label="Approvals" value={data.action_counts?.Approved || 0} color="#10b981" />
              <KpiCard icon={XCircle} label="Rejections" value={data.action_counts?.Rejected || 0} color="#ef4444" />
              <KpiCard icon={Clock} label="Changes Requested" value={data.action_counts?.['Requested Changes'] || 0} color="#f59e0b" />
            </div>

            <div className="rpt-card">
              <h3 className="rpt-card-title">Approval Audit Trail</h3>
              <div className="rpt-table-wrap">
                <table className="rpt-table">
                  <thead>
                    <tr>
                      <th>Decision</th>
                      <th>Reviewer</th>
                      <th>Action</th>
                      <th>Comments</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items?.length === 0 ? (
                      <tr><td colSpan={5} className="rpt-empty-row">No approval records found.</td></tr>
                    ) : (
                      data.items?.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <span className="rpt-link" onClick={() => setTimelineId(item.decision_id)}>
                              #{item.decision_id} {item.decision_title || ''}
                            </span>
                          </td>
                          <td>{item.reviewer_name}</td>
                          <td>
                            <span className={`rpt-action-tag rpt-action-${item.action?.toLowerCase().replace(/\s+/g, '-')}`}>
                              {item.action}
                            </span>
                          </td>
                          <td className="rpt-comments-cell">{item.comments || <span className="rpt-empty-text">—</span>}</td>
                          <td className="rpt-date">{new Date(item.created_at).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} pages={data.pages} onPage={setPage} />
            </div>
          </>
        )}

        {/* ── OUTCOMES TAB ── */}
        {!loading && !error && data && activeTab === 'outcomes' && (
          <>
            <div className="rpt-kpi-grid">
              <KpiCard icon={TrendingUp} label="Total Decisions" value={data.total_decisions} color="#3b82f6" />
              <KpiCard icon={CheckCircle} label="Recorded Outcomes" value={data.recorded_outcomes} color="#10b981" />
              <KpiCard icon={Clock} label="Pending Outcomes" value={data.pending_outcomes} color="#f59e0b" />
              <KpiCard icon={Activity} label="Outcome Rate" value={`${data.outcome_rate}%`} color="#8b5cf6" />
            </div>

            <div className="rpt-card">
              <h3 className="rpt-card-title">Decision Outcomes Evaluation</h3>
              <div className="rpt-table-wrap">
                <table className="rpt-table">
                  <thead>
                    <tr>
                      <th>Decision</th>
                      <th>Status</th>
                      <th>Expected Outcome</th>
                      <th>Actual Outcome</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items?.length === 0 ? (
                      <tr><td colSpan={4} className="rpt-empty-row">No outcome records found.</td></tr>
                    ) : (
                      data.items?.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <span className="rpt-link" onClick={() => setTimelineId(item.id)}>
                              #{item.id} {item.title}
                            </span>
                          </td>
                          <td><StatusBadge status={item.status} /></td>
                          <td className="rpt-outcome-cell">{item.expected_outcome || <span className="rpt-empty-text">Not recorded</span>}</td>
                          <td className="rpt-outcome-cell">{item.actual_outcome || <span className="rpt-empty-text">Pending observation</span>}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} pages={data.pages} onPage={setPage} />
            </div>
          </>
        )}

        {/* ── ALTERNATIVES TAB ── */}
        {!loading && !error && data && activeTab === 'alternatives' && (
          <>
            <div className="rpt-kpi-grid">
              <KpiCard icon={FileText} label="Total Alternatives" value={data.total_alternatives} color="#3b82f6" />
              <KpiCard icon={CheckCircle} label="Selected Alternatives" value={data.selected_alternatives} color="#10b981" />
              <KpiCard icon={TrendingUp} label="High Feasibility" value={data.feasibility_counts?.High || 0} color="#10b981" />
              <KpiCard icon={AlertTriangle} label="Medium/Low" value={(data.feasibility_counts?.Medium || 0) + (data.feasibility_counts?.Low || 0)} color="#f59e0b" />
            </div>

            <div className="rpt-card">
              <h3 className="rpt-card-title">Evaluated Alternatives</h3>
              <div className="rpt-table-wrap">
                <table className="rpt-table">
                  <thead>
                    <tr>
                      <th>Decision</th>
                      <th>Alternative</th>
                      <th>Cost</th>
                      <th>Feasibility</th>
                      <th>Risk Assessment</th>
                      <th>Selected</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items?.length === 0 ? (
                      <tr><td colSpan={6} className="rpt-empty-row">No alternatives found.</td></tr>
                    ) : (
                      data.items?.map((alt) => (
                        <tr key={alt.id}>
                          <td>
                            <span className="rpt-link" onClick={() => setTimelineId(alt.decision_id)}>
                              #{alt.decision_id} {alt.decision_title || ''}
                            </span>
                          </td>
                          <td>
                            <div className="rpt-alt-title">{alt.title}</div>
                            <div className="rpt-alt-desc">{alt.description}</div>
                          </td>
                          <td>{alt.cost || <span className="rpt-empty-text">—</span>}</td>
                          <td>{alt.feasibility || <span className="rpt-empty-text">—</span>}</td>
                          <td>{alt.risk_assessment || <span className="rpt-empty-text">—</span>}</td>
                          <td>
                            {alt.is_selected
                              ? <span className="rpt-yes-badge"><CheckCircle size={13} /> Yes</span>
                              : <span className="rpt-no-badge"><XCircle size={13} /> No</span>
                            }
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} pages={data.pages} onPage={setPage} />
            </div>
          </>
        )}

        {/* ── ACTIVITY TAB ── */}
        {!loading && !error && data && activeTab === 'activity' && (
          <>
            <div className="rpt-kpi-grid">
              <KpiCard icon={Activity} label="Total Activities" value={data.total_activities} color="#6366f1" />
              {Object.entries(data.action_counts || {}).slice(0, 3).map(([act, cnt]) => (
                <KpiCard key={act} icon={Activity} label={act.replace(/_/g, ' ')} value={cnt} color="#3b82f6" />
              ))}
            </div>

            <div className="rpt-card">
              <h3 className="rpt-card-title">Activity Feed</h3>
              <div className="rpt-table-wrap">
                <table className="rpt-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>User</th>
                      <th>Action</th>
                      <th>Entity</th>
                      <th>Decision</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items?.length === 0 ? (
                      <tr><td colSpan={6} className="rpt-empty-row">No activity records found.</td></tr>
                    ) : (
                      data.items?.map((item) => (
                        <tr key={item.id}>
                          <td className="rpt-timestamp">{new Date(item.timestamp).toLocaleString()}</td>
                          <td>{item.user_name}</td>
                          <td><span className="rpt-action-tag">{item.action}</span></td>
                          <td>{item.entity_type} #{item.entity_id}</td>
                          <td>
                            {item.decision_id
                              ? <span className="rpt-link" onClick={() => setTimelineId(item.decision_id)}>
                                  #{item.decision_id} {item.decision_title || ''}
                                </span>
                              : <span className="rpt-empty-text">—</span>
                            }
                          </td>
                          <td className="rpt-desc-cell">{item.description || <span className="rpt-empty-text">—</span>}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} pages={data.pages} onPage={setPage} />
            </div>
          </>
        )}

        {/* ── FEATURE 8: TEAM PERFORMANCE TAB ── */}
        {!loading && !error && data && activeTab === 'team' && (
          <>
            <div className="rpt-kpi-grid">
              <KpiCard icon={Users} label="Total Teams" value={data.total_teams || 0} color="#2563eb" />
              <KpiCard icon={BarChart3} label="Team Decisions" value={data.teams?.reduce((s, t) => s + (t.total_decisions || 0), 0) || 0} color="#10b981" />
              <KpiCard icon={CheckCircle} label="Approved Decisions" value={data.teams?.reduce((s, t) => s + (t.approved_decisions || 0), 0) || 0} color="#059669" />
              <KpiCard icon={Clock} label="Pending Review" value={data.teams?.reduce((s, t) => s + (t.pending_decisions || 0), 0) || 0} color="#d97706" />
            </div>

            <div className="rpt-card">
              <h3 className="rpt-card-title">Team Collaboration & Decision Metrics</h3>
              <div className="rpt-table-wrap">
                <table className="rpt-table">
                  <thead>
                    <tr>
                      <th>Team Name</th>
                      <th>Members</th>
                      <th>Total Decisions</th>
                      <th>Approved</th>
                      <th>Rejected</th>
                      <th>Pending Review</th>
                      <th>Discussions</th>
                      <th>Documents</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.teams?.length === 0 ? (
                      <tr><td colSpan={8} className="rpt-empty-row">No team performance records found.</td></tr>
                    ) : (
                      data.teams?.map((t) => (
                        <tr key={t.team_id}>
                          <td style={{ fontWeight: 600 }}>{t.team_name}</td>
                          <td>{t.member_count}</td>
                          <td><strong>{t.total_decisions}</strong></td>
                          <td style={{ color: 'var(--success-solid)', fontWeight: 600 }}>{t.approved_decisions}</td>
                          <td style={{ color: 'var(--danger-solid)' }}>{t.rejected_decisions}</td>
                          <td style={{ color: 'var(--warning-solid)' }}>{t.pending_decisions}</td>
                          <td>{t.total_discussions}</td>
                          <td>{t.total_documents}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ── FEATURE 8: AUDIT TRAIL TAB ── */}
        {!loading && !error && data && activeTab === 'audit' && (
          <>
            <div className="rpt-kpi-grid">
              <KpiCard icon={Shield} label="Total Audit Records" value={data.total_logs || 0} color="#6366f1" />
              {Object.entries(data.action_counts || {}).slice(0, 3).map(([act, count]) => (
                <KpiCard key={act} icon={Activity} label={act} value={count} color="#2563eb" />
              ))}
            </div>

            <div className="rpt-card">
              <h3 className="rpt-card-title">Enterprise Audit Log Trail</h3>
              <div className="rpt-table-wrap">
                <table className="rpt-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>User</th>
                      <th>Action</th>
                      <th>Entity</th>
                      <th>Details</th>
                      <th>IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items?.length === 0 ? (
                      <tr><td colSpan={6} className="rpt-empty-row">No audit logs found matching criteria.</td></tr>
                    ) : (
                      data.items?.map((log) => (
                        <tr key={log.id}>
                          <td className="rpt-timestamp">{new Date(log.created_at).toLocaleString()}</td>
                          <td>{log.user_name || `User #${log.user_id}`}</td>
                          <td><span className="rpt-action-tag">{log.action}</span></td>
                          <td>{log.entity_type} #{log.entity_id}</td>
                          <td className="rpt-desc-cell">{log.details ? JSON.stringify(log.details) : '—'}</td>
                          <td className="rpt-date">{log.ip_address || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} pages={data.pages} onPage={setPage} />
            </div>
          </>
        )}

        {/* Empty State */}
        {!loading && !error && data && data.total_decisions === 0 && activeTab === 'summary' && (
          <div className="rpt-empty-page">
            <BarChart3 size={40} strokeWidth={1.2} />
            <h3>No data available</h3>
            <p>Create some decisions to start seeing reports here.</p>
          </div>
        )}
      </div>

      {/* Timeline Modal */}
      {timelineId && (
        <TimelineModal
          decisionId={timelineId}
          token={token}
          onClose={() => setTimelineId(null)}
        />
      )}
    </div>
  );
}
