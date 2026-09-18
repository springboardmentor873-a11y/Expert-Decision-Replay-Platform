import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getTeamWorkspace,
  addTeamMember,
  removeTeamMember,
  getJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
} from '../services/teamService';
import { getUserRoster } from '../services/userService';
import { downloadReport } from '../services/reportService';
import { downloadDocument } from '../services/documentService';
import { DecisionStatusBadge } from '../components/DecisionStatusBadge';
import {
  Users,
  ArrowLeft,
  PlusCircle,
  Layers,
  FileText,
  MessageSquare,
  Activity,
  BarChart3,
  Calendar,
  Clock,
  User,
  Crown,
  Shield,
  Trash2,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Folder,
  X,
  Plus,
  Paperclip,
  TrendingUp,
  UserPlus,
} from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'decisions', label: 'Decisions', icon: Layers },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'join-requests', label: 'Join Requests', icon: UserPlus },
  { id: 'discussions', label: 'Discussions', icon: MessageSquare },
  { id: 'documents', label: 'Documents', icon: Paperclip },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'reports', label: 'Reports', icon: TrendingUp },
];

export const TeamWorkspace = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exportingFormat, setExportingFormat] = useState(null);
  const [teamJoinRequests, setTeamJoinRequests] = useState([]);
  const [reqActionLoading, setReqActionLoading] = useState(false);

  // Add Member Modal State
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [rosterUsers, setRosterUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('Member');
  const [addMemberSubmitting, setAddMemberSubmitting] = useState(false);

  const isAdmin = user?.role?.name?.toLowerCase() === 'administrator';
  const isManager = user?.role?.name?.toLowerCase() === 'manager';

  const fetchWorkspace = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getTeamWorkspace(teamId);
      setWorkspace(data);
      try {
        const reqs = await getJoinRequests({ team_id: teamId, status: 'PENDING' });
        setTeamJoinRequests(reqs || []);
      } catch {
        // ignore if not authorized for join requests
      }
    } catch (err) {
      setError(err.message || 'Failed to load team workspace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspace();
  }, [teamId]);

  const team = workspace?.team;
  const isTeamOwner = team?.members?.some(m => m.user_id === user?.id && (m.role === 'Owner' || m.role === 'Leader'));
  const canManageMembers = isAdmin || isManager || isTeamOwner;

  const handleOpenAddMemberModal = async () => {
    setSelectedUserId('');
    setSelectedRole('Member');
    setShowAddMemberModal(true);
    try {
      const roster = await getUserRoster();
      // Filter out existing team members
      const existingUserIds = new Set((team?.members || []).map(m => m.user_id));
      setRosterUsers((roster || []).filter(u => !existingUserIds.has(u.id)));
    } catch (err) {
      console.warn('Could not load user roster:', err);
    }
  };

  const handleApproveReq = async (reqId) => {
    setReqActionLoading(true);
    try {
      await approveJoinRequest(reqId);
      await fetchWorkspace();
    } catch (err) {
      alert(err.message || 'Failed to approve request');
    } finally {
      setReqActionLoading(false);
    }
  };

  const handleRejectReq = async (reqId) => {
    setReqActionLoading(true);
    try {
      await rejectJoinRequest(reqId);
      await fetchWorkspace();
    } catch (err) {
      alert(err.message || 'Failed to reject request');
    } finally {
      setReqActionLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedUserId) return;
    setAddMemberSubmitting(true);
    try {
      await addTeamMember(teamId, {
        user_id: parseInt(selectedUserId, 10),
        role: selectedRole,
      });
      setShowAddMemberModal(false);
      await fetchWorkspace();
    } catch (err) {
      alert(err.message || 'Failed to add team member.');
    } finally {
      setAddMemberSubmitting(false);
    }
  };

  const handleRemoveMember = async (targetUserId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove "${memberName}" from this team workspace?`)) {
      return;
    }
    try {
      await removeTeamMember(teamId, targetUserId);
      await fetchWorkspace();
    } catch (err) {
      alert(err.message || 'Failed to remove team member.');
    }
  };

  const handleExport = async (format) => {
    setExportingFormat(format);
    try {
      await downloadReport({
        reportType: 'team',
        format,
        filters: { teamId },
      });
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setExportingFormat(null);
    }
  };

  const handleDownloadDoc = async (doc) => {
    try {
      await downloadDocument(doc.decision_id, doc.id, doc.file_name);
    } catch (err) {
      alert('Failed to download document.');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="card loading-state-card" style={{ minHeight: '350px' }}>
        <Loader2 size={36} className="spinner-icon text-primary" />
        <span>Loading team workspace...</span>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="alert alert-error" role="alert">
        <p>{error || 'Team workspace not found.'}</p>
        <Link to="/teams" className="btn btn-secondary btn-sm" style={{ marginTop: '1rem' }}>
          &larr; Back to Teams
        </Link>
      </div>
    );
  }

  const decisions = workspace.decisions || [];
  const members = team?.members || [];
  const discussions = workspace.discussions || [];
  const documents = workspace.documents || [];
  const activities = workspace.recent_activity || [];

  const pendingDecisionsCount = decisions.filter(d => d.status === 'Submitted' || d.status === 'Under Review').length;
  const approvedDecisionsCount = decisions.filter(d => d.status === 'Approved').length;

  const leaderMember = members.find(m => m.role?.toLowerCase() === 'lead' || m.role?.toLowerCase() === 'owner');
  const leadName = leaderMember?.user_name || team?.creator_name || 'Unassigned';

  return (
    <div className="team-workspace-page">
      {/* Action / Back Navigation */}
      <div className="details-action-bar">
        <Link to="/teams" className="btn btn-secondary btn-sm" style={{ width: 'fit-content' }}>
          <ArrowLeft size={14} />
          <span>Back to Teams Directory</span>
        </Link>

        <div className="details-actions-right">
          <Link
            to={`/decisions/new?team_id=${team.id}`}
            className="btn btn-primary btn-sm"
          >
            <PlusCircle size={15} />
            <span>+ Create Team Decision</span>
          </Link>
        </div>
      </div>

      {/* Team Hero Header */}
      <header className="card team-workspace-hero">
        <div className="team-hero-top">
          <div className="team-hero-badge">
            <Users size={28} />
          </div>
          <div className="team-hero-info">
            <h1 className="team-hero-title">{team.name}</h1>
            <p className="team-hero-desc">
              {team.description || 'Dedicated collaborative team workspace for evaluating architectural decisions.'}
            </p>
          </div>
        </div>

        <div className="team-hero-meta-row">
          <span className="team-hero-meta-item">
            <Crown size={14} className="text-warning" /> Lead: <strong>{leadName}</strong>
          </span>
          <span>•</span>
          <span className="team-hero-meta-item">
            <Users size={13} /> <strong>{members.length}</strong> {members.length === 1 ? 'Member' : 'Members'}
          </span>
          <span>•</span>
          <span className="team-hero-meta-item">
            <Layers size={13} /> <strong>{decisions.length}</strong> {decisions.length === 1 ? 'Decision' : 'Decisions'}
          </span>
          <span>•</span>
          <span className="team-hero-meta-item">
            <Calendar size={13} /> Established {formatDate(team.created_at)}
          </span>
        </div>
      </header>

      {/* Workspace Navigation Sub-Tabs */}
      <nav className="workspace-tabs-nav">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              className={`workspace-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {tab.id === 'decisions' && <span className="tab-badge">{decisions.length}</span>}
              {tab.id === 'members' && <span className="tab-badge">{members.length}</span>}
              {tab.id === 'discussions' && <span className="tab-badge">{discussions.length}</span>}
              {tab.id === 'documents' && <span className="tab-badge">{documents.length}</span>}
            </button>
          );
        })}
      </nav>

      {/* Tab Content Panes */}
      <div className="workspace-tab-content">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="overview-tab-pane">
            {/* KPI Metric Cards */}
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-icon" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
                  <Users size={22} />
                </div>
                <div>
                  <span className="metric-value">{members.length}</span>
                  <span className="metric-label">Team Members</span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
                  <Layers size={22} />
                </div>
                <div>
                  <span className="metric-value">{decisions.length}</span>
                  <span className="metric-label">Team Decisions</span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon" style={{ backgroundColor: '#fffbeb', color: '#d97706' }}>
                  <Clock size={22} />
                </div>
                <div>
                  <span className="metric-value">{pendingDecisionsCount}</span>
                  <span className="metric-label">Pending Review</span>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon" style={{ backgroundColor: '#fdf2f8', color: '#db2777' }}>
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <span className="metric-value">{approvedDecisionsCount}</span>
                  <span className="metric-label">Approved Decisions</span>
                </div>
              </div>
            </div>

            {/* Overview Sections Grid */}
            <div className="team-overview-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
              {/* Team Charter & Leadership */}
              <div className="card">
                <h3 className="section-box-title" style={{ marginBottom: '1rem' }}>
                  <Shield size={18} className="text-primary" />
                  <span>Team Leadership & Scope</span>
                </h3>
                <p style={{ color: 'var(--slate-600)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                  {team.description || 'No specific charter documented.'}
                </p>

                <h4 style={{ fontSize: '0.9rem', color: 'var(--slate-700)', marginTop: '1.25rem', marginBottom: '0.5rem' }}>
                  Team Leaders & Owners:
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {members.filter(m => m.role === 'Owner' || m.role === 'Leader').map(m => (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Crown size={14} className="text-warning" />
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{m.user?.full_name || `User #${m.user_id}`}</span>
                      <span className="badge-team-chip">{m.role}</span>
                    </div>
                  ))}
                  {members.filter(m => m.role === 'Owner' || m.role === 'Leader').length === 0 && (
                    <span style={{ fontSize: '0.85rem', color: 'var(--slate-400)' }}>No designated leaders yet.</span>
                  )}
                </div>
              </div>

              {/* Recent Activity Snippet */}
              <div className="card">
                <h3 className="section-box-title" style={{ marginBottom: '1rem' }}>
                  <Activity size={18} className="text-primary" />
                  <span>Recent Team Activity</span>
                </h3>
                {activities.length === 0 ? (
                  <p style={{ color: 'var(--slate-400)', fontSize: '0.9rem' }}>No recent activity recorded for this team.</p>
                ) : (
                  <div className="activity-mini-timeline">
                    {activities.slice(0, 5).map((act, i) => (
                      <div key={i} className="activity-mini-item">
                        <span className="activity-dot" />
                        <div>
                          <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>
                            {act.user?.full_name || 'User'} {act.action}
                          </p>
                          <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                            {formatDate(act.created_at)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DECISIONS */}
        {activeTab === 'decisions' && (
          <div className="card decisions-tab-pane">
            <div className="section-header-row" style={{ marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Team Decisions</h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>Decisions associated with {team.name}</span>
              </div>
              <Link to={`/decisions/new?team_id=${team.id}`} className="btn btn-primary btn-sm">
                <PlusCircle size={15} />
                <span>+ New Decision</span>
              </Link>
            </div>

            {decisions.length === 0 ? (
              <div className="empty-sub-state">
                <Layers size={32} />
                <p>No decisions attached to this team workspace yet.</p>
                <Link to={`/decisions/new?team_id=${team.id}`} className="btn btn-primary btn-sm">
                  Create First Decision
                </Link>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="app-data-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Category</th>
                      <th>Creator</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {decisions.map(d => (
                      <tr key={d.id}>
                        <td>
                          <Link to={`/decisions/${d.id}`} style={{ fontWeight: 600, color: 'var(--primary-600)' }}>
                            {d.title}
                          </Link>
                        </td>
                        <td>
                          <DecisionStatusBadge status={d.status} />
                        </td>
                        <td>
                          {d.category ? (
                            <span className="badge-category-chip">
                              <Folder size={11} /> {d.category.name}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--slate-400)', fontSize: '0.85rem' }}>—</span>
                          )}
                        </td>
                        <td>{d.creator?.full_name || `User #${d.created_by}`}</td>
                        <td>{formatDate(d.created_at)}</td>
                        <td>
                          <Link to={`/decisions/${d.id}`} className="btn btn-secondary btn-xs">
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
        )}

        {/* TAB 3: MEMBERS */}
        {activeTab === 'members' && (
          <div className="card members-tab-pane">
            <div className="section-header-row" style={{ marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Team Members Roster</h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>
                  {members.length} {members.length === 1 ? 'colleague' : 'colleagues'} active in this workspace
                </span>
              </div>
              {canManageMembers && (
                <button
                  type="button"
                  onClick={handleOpenAddMemberModal}
                  className="btn btn-primary btn-sm"
                >
                  <PlusCircle size={15} />
                  <span>+ Add Member</span>
                </button>
              )}
            </div>

            {members.length === 0 ? (
              <div className="empty-sub-state">
                <Users size={32} />
                <p>No members in this team yet.</p>
                {canManageMembers && (
                  <button type="button" onClick={handleOpenAddMemberModal} className="btn btn-primary btn-sm">
                    Add Team Member
                  </button>
                )}
              </div>
            ) : (
              <div className="table-responsive">
                <table className="app-data-table">
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Email</th>
                      <th>System Role</th>
                      <th>Team Role</th>
                      <th>Joined</th>
                      {canManageMembers && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => (
                      <tr key={m.id}>
                        <td style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div className="user-avatar" style={{ width: '28px', height: '28px', fontSize: '0.75rem' }}>
                            {m.user?.full_name ? m.user.full_name[0].toUpperCase() : 'U'}
                          </div>
                          <span style={{ fontWeight: 600 }}>{m.user?.full_name || `User #${m.user_id}`}</span>
                        </td>
                        <td>{m.user?.email || '—'}</td>
                        <td>
                          <span className="role-badge badge-employee">{m.user?.role?.name || 'Employee'}</span>
                        </td>
                        <td>
                          <span className={`badge-team-role role-${m.role.toLowerCase()}`}>{m.role}</span>
                        </td>
                        <td>{formatDate(m.joined_at || m.created_at)}</td>
                        {canManageMembers && (
                          <td>
                            {m.user_id !== user?.id && (
                              <button
                                type="button"
                                onClick={() => handleRemoveMember(m.user_id, m.user?.full_name || 'this member')}
                                className="btn-icon-danger"
                                title="Remove member from team"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: DISCUSSIONS */}
        {activeTab === 'join-requests' && (
        <div className="card" style={{ padding: '1.5rem', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                Pending Membership Requests ({teamJoinRequests.length})
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                Review prospective engineers requesting enrollment in this team workspace.
              </p>
            </div>
          </div>

          {teamJoinRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
              <CheckCircle2 size={36} style={{ color: '#10b981', margin: '0 auto 8px' }} />
              <p style={{ margin: 0, fontWeight: 500 }}>No pending join requests for this team.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {teamJoinRequests.map((req) => (
                <div
                  key={req.id}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '1.25rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{req.requester_name}</strong>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>({req.requester_email})</span>
                      <span style={{ fontSize: '0.75rem', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>{req.requester_role}</span>
                    </div>
                    {req.message && (
                      <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: '#334155', fontStyle: 'italic' }}>
                        "{req.message}"
                      </p>
                    )}
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                      Requested: {formatDate(req.created_at)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleRejectReq(req.id)}
                      disabled={reqActionLoading}
                      className="btn btn-secondary btn-sm"
                      style={{ color: '#dc2626' }}
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApproveReq(req.id)}
                      disabled={reqActionLoading}
                      className="btn btn-primary btn-sm"
                      style={{ background: '#16a34a', borderColor: '#16a34a' }}
                    >
                      Approve & Enroll
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'discussions' && (
          <div className="card discussions-tab-pane">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Team Discussions Feed</h2>
            <p style={{ color: 'var(--slate-500)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Aggregated collaborative commentary across all decisions owned by this team.
            </p>

            {discussions.length === 0 ? (
              <div className="empty-sub-state">
                <MessageSquare size={32} />
                <p>No discussion comments found for this team's decisions.</p>
              </div>
            ) : (
              <div className="team-discussions-list">
                {discussions.map((c) => (
                  <div key={c.id} className="team-discussion-item">
                    <div className="team-discussion-header">
                      <span style={{ fontWeight: 600 }}>{c.author?.full_name || `User #${c.user_id}`}</span>
                      <span style={{ color: 'var(--slate-400)', fontSize: '0.75rem' }}>
                        {formatDate(c.created_at)}
                      </span>
                    </div>
                    <p style={{ margin: '6px 0', fontSize: '0.9rem', color: 'var(--slate-700)' }}>{c.content}</p>
                    {c.decision_id && (
                      <Link
                        to={`/decisions/${c.decision_id}`}
                        style={{ fontSize: '0.8rem', color: 'var(--primary-600)', textDecoration: 'none' }}
                      >
                        In decision #{c.decision_id} &rarr;
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: DOCUMENTS */}
        {activeTab === 'documents' && (
          <div className="card documents-tab-pane">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Team Document Archive</h2>
            <p style={{ color: 'var(--slate-500)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              All supporting artifacts, specs, and attachments linked to decisions in this team workspace.
            </p>

            {documents.length === 0 ? (
              <div className="empty-sub-state">
                <Paperclip size={32} />
                <p>No documents attached to this team's decisions yet.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="app-data-table">
                  <thead>
                    <tr>
                      <th>Document Name</th>
                      <th>Decision</th>
                      <th>Uploaded By</th>
                      <th>Upload Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => (
                      <tr key={doc.id}>
                        <td style={{ fontWeight: 600 }}>{doc.file_name}</td>
                        <td>
                          <Link to={`/decisions/${doc.decision_id}`} style={{ color: 'var(--primary-600)' }}>
                            Decision #{doc.decision_id}
                          </Link>
                        </td>
                        <td>{doc.uploader?.full_name || `User #${doc.uploaded_by}`}</td>
                        <td>{formatDate(doc.created_at)}</td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleDownloadDoc(doc)}
                            className="btn btn-secondary btn-xs"
                          >
                            <Download size={12} /> Download
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: ACTIVITY */}
        {activeTab === 'activity' && (
          <div className="card activity-tab-pane">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Team Activity Trail</h2>
            <p style={{ color: 'var(--slate-500)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Immutable audit history of decisions, modifications, and approvals within this team.
            </p>

            {activities.length === 0 ? (
              <div className="empty-sub-state">
                <Activity size={32} />
                <p>No activity records logged for this team yet.</p>
              </div>
            ) : (
              <div className="team-activity-list">
                {activities.map((a, idx) => (
                  <div key={idx} className="team-activity-row">
                    <div className="team-activity-lead">
                      <span className="team-activity-icon-badge">
                        <Activity size={14} />
                      </span>
                    </div>
                    <div className="team-activity-body">
                      <p className="team-activity-action">
                        <strong>{a.user?.full_name || `User #${a.user_id}`}</strong> {a.action}
                      </p>
                      <span className="team-activity-meta">
                        {new Date(a.created_at).toLocaleString()}
                        {a.decision_id && ` • Decision #${a.decision_id}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 7: REPORTS */}
        {activeTab === 'reports' && (
          <div className="card reports-tab-pane">
            <div className="section-header-row" style={{ marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Team Analytics & Export</h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>
                  Performance benchmarks and export formats for {team.name}
                </span>
              </div>

              {/* Export Buttons: CSV, XLSX, PDF */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleExport('csv')}
                  disabled={exportingFormat !== null}
                >
                  <Download size={14} /> {exportingFormat === 'csv' ? 'Exporting...' : 'Export CSV'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleExport('xlsx')}
                  disabled={exportingFormat !== null}
                >
                  <Download size={14} /> {exportingFormat === 'xlsx' ? 'Exporting...' : 'Export Excel (.xlsx)'}
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => handleExport('pdf')}
                  disabled={exportingFormat !== null}
                >
                  <Download size={14} /> {exportingFormat === 'pdf' ? 'Exporting...' : 'Export PDF (.pdf)'}
                </button>
              </div>
            </div>

            {/* Performance Summary Grid */}
            <div className="metrics-grid" style={{ marginBottom: '1.5rem' }}>
              <div className="metric-card">
                <span className="metric-value">{decisions.length}</span>
                <span className="metric-label">Total Decisions</span>
              </div>
              <div className="metric-card">
                <span className="metric-value">{approvedDecisionsCount}</span>
                <span className="metric-label">Approved</span>
              </div>
              <div className="metric-card">
                <span className="metric-value">{pendingDecisionsCount}</span>
                <span className="metric-label">In Review</span>
              </div>
              <div className="metric-card">
                <span className="metric-value">
                  {decisions.length > 0 ? `${Math.round((approvedDecisionsCount / decisions.length) * 100)}%` : '0%'}
                </span>
                <span className="metric-label">Approval Rate</span>
              </div>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--slate-600)' }}>
              Export the team report in Excel or PDF format above for stakeholder reporting and audit compliance.
            </p>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="rpt-modal-overlay" role="dialog" aria-modal="true" onClick={() => setShowAddMemberModal(false)}>
          <div className="rpt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rpt-modal-header">
              <h2 className="rpt-modal-title">Add Member to {team.name}</h2>
              <button className="rpt-modal-close" onClick={() => setShowAddMemberModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddMember}>
              <div className="rpt-modal-body">
                <div className="form-group">
                  <label htmlFor="user_select">Select User *</label>
                  <select
                    id="user_select"
                    className="form-control-input"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Colleague from Directory --</option>
                    {rosterUsers.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.full_name} ({u.email}) — {u.role?.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="role_select">Team Role *</label>
                  <select
                    id="role_select"
                    className="form-control-input"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    required
                  >
                    <option value="Member">Member</option>
                    <option value="Leader">Leader</option>
                    <option value="Owner">Owner</option>
                  </select>
                </div>
              </div>

              <div className="form-actions-footer" style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--slate-200)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddMemberModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={addMemberSubmitting}>
                  {addMemberSubmitting ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamWorkspace;
