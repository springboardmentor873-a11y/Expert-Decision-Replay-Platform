import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyTeams, getTeamWorkspace } from '../services/teamService';
import { downloadDocument } from '../services/documentService';
import { DecisionStatusBadge } from '../components/DecisionStatusBadge';
import {
  Users,
  Layers,
  Crown,
  ChevronRight,
  PlusCircle,
  ExternalLink,
  Calendar,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Shield,
  ArrowRight,
  UserCheck,
  BarChart3,
  MessageSquare,
  Paperclip,
  Activity,
  Clock,
  Download,
} from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'decisions', label: 'Decisions', icon: Layers },
  { id: 'discussions', label: 'Discussions', icon: MessageSquare },
  { id: 'documents', label: 'Documents', icon: Paperclip },
  { id: 'activity', label: 'Activity', icon: Activity },
];

export const MyTeam = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [myTeams, setMyTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);
  const [error, setError] = useState('');

  // 1. Fetch User Teams
  const fetchUserTeams = async () => {
    setLoadingTeams(true);
    setError('');
    try {
      const data = await getMyTeams();
      const teams = data || [];
      setMyTeams(teams);
      if (teams.length > 0) {
        setSelectedTeamId(teams[0].id);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch your teams.');
    } finally {
      setLoadingTeams(false);
    }
  };

  // 2. Fetch Selected Team Workspace Data
  const fetchWorkspaceData = async (teamId) => {
    if (!teamId) return;
    setLoadingWorkspace(true);
    try {
      const data = await getTeamWorkspace(teamId);
      setWorkspace(data);
    } catch (err) {
      console.error('Failed to load team workspace:', err);
      setError(err.message || 'Failed to load team workspace details.');
    } finally {
      setLoadingWorkspace(false);
    }
  };

  useEffect(() => {
    fetchUserTeams();
  }, []);

  useEffect(() => {
    if (selectedTeamId) {
      fetchWorkspaceData(selectedTeamId);
    }
  }, [selectedTeamId]);

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

  if (loadingTeams) {
    return (
      <div className="enterprise-page-container" style={{ padding: '2rem 2.5rem', maxWidth: '1440px', margin: '0 auto' }}>
        <div className="card loading-state-card" style={{ minHeight: '320px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <Loader2 size={36} className="spinner-icon text-primary" />
          <span style={{ color: '#64748b', fontSize: '0.95rem' }}>Loading your squad workspace...</span>
        </div>
      </div>
    );
  }

  if (myTeams.length === 0) {
    return (
      <div className="enterprise-page-container" style={{ padding: '2rem 2.5rem', maxWidth: '1440px', margin: '0 auto' }}>
        <div className="card empty-state-card" style={{ padding: '4rem 2rem', textAlign: 'center', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <Users size={32} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1e293b', margin: '0 0 0.5rem' }}>
            You haven't joined a team workspace yet
          </h2>
          <p style={{ color: '#64748b', maxWidth: '480px', margin: '0 auto 1.5rem', fontSize: '0.925rem', lineHeight: 1.5 }}>
            Join existing engineering teams or squads to review architecture decisions, collaborate on technical trade-offs, and participate in discussions.
          </p>
          <Link to="/teams" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.625rem 1.25rem' }}>
            <span>Explore Organization Teams & Request to Join</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  const team = workspace?.team || myTeams.find((t) => t.id === selectedTeamId) || myTeams[0];
  const decisions = workspace?.decisions || [];
  const members = team?.members || [];
  const discussions = workspace?.discussions || [];
  const documents = workspace?.documents || [];
  const activities = workspace?.recent_activity || [];

  const pendingDecisionsCount = decisions.filter((d) => d.status === 'Submitted' || d.status === 'Under Review').length;
  const approvedDecisionsCount = decisions.filter((d) => d.status === 'Approved').length;

  const leaderMember = members.find((m) => m.role?.toLowerCase() === 'lead' || m.role?.toLowerCase() === 'owner');
  const leadName = leaderMember?.user_name || team?.creator_name || 'Priya Reddy';
  const userMembership = members.find((m) => m.user_id === user?.id);

  return (
    <div className="enterprise-page-container" style={{ padding: '2rem 2.5rem', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div style={{ padding: '6px', background: '#eff6ff', borderRadius: '8px', color: '#2563eb' }}>
              <UserCheck size={20} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              My Team
            </h1>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
            Dedicated engineering workspace for your squad, decisions, architecture reviews, and team memory.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {user?.role?.name?.toLowerCase() !== 'employee' && (
            <Link to="/teams" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Users size={16} />
              <span>All Teams</span>
            </Link>
          )}
          <Link
            to={`/decisions/new?team_id=${team.id}`}
            className="btn btn-primary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <PlusCircle size={16} />
            <span>Record Decision</span>
          </Link>
        </div>
      </div>

      {/* Multi-Squad Switcher (If user belongs to more than 1 team) */}
      {myTeams.length > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem', background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Select Squad:</span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {myTeams.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTeamId(t.id)}
                style={{
                  padding: '4px 12px',
                  borderRadius: '6px',
                  border: t.id === selectedTeamId ? '1px solid #2563eb' : '1px solid #cbd5e1',
                  background: t.id === selectedTeamId ? '#eff6ff' : '#ffffff',
                  color: t.id === selectedTeamId ? '#1d4ed8' : '#475569',
                  fontWeight: t.id === selectedTeamId ? 700 : 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Team Hero Header */}
      <div
        className="card"
        style={{
          padding: '1.5rem 1.75rem',
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={28} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, color: '#0f172a' }}>
                  {team.name}
                </h2>
                <span style={{ fontSize: '0.75rem', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                  Active Squad
                </span>
              </div>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                {team.description || 'Dedicated workspace for evaluating architecture decisions and engineering trade-offs.'}
              </p>
            </div>
          </div>

          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              padding: '4px 10px',
              borderRadius: '12px',
              background: '#dbeafe',
              color: '#1e40af',
            }}
          >
            {userMembership?.role ? `Your Role: ${userMembership.role}` : 'Enrolled Member'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.85rem', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Crown size={15} style={{ color: '#eab308' }} />
            <span>Lead: <strong style={{ color: '#1e293b' }}>{leadName}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={15} />
            <span>Roster: <strong style={{ color: '#1e293b' }}>{members.length || team.member_count || 3}</strong> members</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={15} />
            <span>Decisions: <strong style={{ color: '#1e293b' }}>{decisions.length}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={15} />
            <span>Established {formatDate(team.created_at)}</span>
          </div>
        </div>
      </div>

      {/* 5 Tabs Navigation */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', gap: '0.5rem', marginBottom: '1.75rem', overflowX: 'auto' }}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.75rem 1.25rem',
                border: 'none',
                background: 'none',
                borderBottom: isActive ? '2px solid #2563eb' : '2px solid transparent',
                marginBottom: '-2px',
                color: isActive ? '#2563eb' : '#64748b',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.925rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {tab.id === 'decisions' && (
                <span style={{ fontSize: '0.75rem', background: isActive ? '#dbeafe' : '#f1f5f9', color: isActive ? '#1d4ed8' : '#64748b', padding: '1px 6px', borderRadius: '10px', fontWeight: 600 }}>
                  {decisions.length}
                </span>
              )}
              {tab.id === 'discussions' && (
                <span style={{ fontSize: '0.75rem', background: isActive ? '#dbeafe' : '#f1f5f9', color: isActive ? '#1d4ed8' : '#64748b', padding: '1px 6px', borderRadius: '10px', fontWeight: 600 }}>
                  {discussions.length}
                </span>
              )}
              {tab.id === 'documents' && (
                <span style={{ fontSize: '0.75rem', background: isActive ? '#dbeafe' : '#f1f5f9', color: isActive ? '#1d4ed8' : '#64748b', padding: '1px 6px', borderRadius: '10px', fontWeight: 600 }}>
                  {documents.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loadingWorkspace ? (
        <div className="card loading-state-card" style={{ minHeight: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 size={32} className="spinner-icon text-primary" />
        </div>
      ) : (
        <>
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div>
              {/* 4 Metric Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
                <div className="card" style={{ padding: '1.25rem', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={24} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Team Members</span>
                    <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0f172a' }}>{members.length || team.member_count || 3}</div>
                  </div>
                </div>

                <div className="card" style={{ padding: '1.25rem', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Layers size={24} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Team Decisions</span>
                    <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0f172a' }}>{decisions.length}</div>
                  </div>
                </div>

                <div className="card" style={{ padding: '1.25rem', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={24} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Pending Review</span>
                    <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0f172a' }}>{pendingDecisionsCount}</div>
                  </div>
                </div>

                <div className="card" style={{ padding: '1.25rem', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#fdf2f8', color: '#db2777', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Approved</span>
                    <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0f172a' }}>{approvedDecisionsCount}</div>
                  </div>
                </div>
              </div>

              {/* Two Column Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
                {/* Team Scope & Roster */}
                <div className="card" style={{ padding: '1.5rem', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={18} className="text-primary" />
                    <span>Team Scope & Roster</span>
                  </h3>
                  <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                    {team.description || 'Core engineering team responsible for architecture decisions and service implementation.'}
                  </p>

                  <h4 style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 0.75rem' }}>
                    Enrolled Colleagues ({members.length || 3}):
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {members.map((m) => (
                      <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#f8fafc', borderRadius: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                            {m.user?.full_name ? m.user.full_name[0].toUpperCase() : 'U'}
                          </div>
                          <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1e293b' }}>
                            {m.user?.full_name || `User #${m.user_id}`}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: m.role === 'Lead' || m.role === 'Owner' ? '#b45309' : '#475569', background: m.role === 'Lead' || m.role === 'Owner' ? '#fef3c7' : '#f1f5f9', padding: '2px 8px', borderRadius: '10px' }}>
                          {m.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Squad Activity */}
                <div className="card" style={{ padding: '1.5rem', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={18} className="text-primary" />
                    <span>Recent Squad Activity</span>
                  </h3>
                  {activities.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>No recent activity records logged.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {activities.slice(0, 5).map((act, i) => (
                        <div key={i} style={{ display: 'flex', gap: '10px', fontSize: '0.85rem' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', marginTop: '6px', flexShrink: 0 }} />
                          <div>
                            <p style={{ margin: 0, fontWeight: 600, color: '#1e293b' }}>
                              {act.user?.full_name || 'User'} {act.action}
                            </p>
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{formatDate(act.created_at)}</span>
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
            <div className="card" style={{ padding: '1.5rem', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                    Squad Architecture Decisions ({decisions.length})
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                    All decisions owned or submitted by members of {team.name}.
                  </p>
                </div>
                <Link to={`/decisions/new?team_id=${team.id}`} className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <PlusCircle size={15} />
                  <span>New Decision</span>
                </Link>
              </div>

              {decisions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                  <Layers size={36} style={{ color: '#cbd5e1', margin: '0 auto 8px' }} />
                  <p>No decisions recorded for this squad yet.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                        <th style={{ padding: '10px 12px' }}>Title</th>
                        <th style={{ padding: '10px 12px' }}>Status</th>
                        <th style={{ padding: '10px 12px' }}>Category</th>
                        <th style={{ padding: '10px 12px' }}>Creator</th>
                        <th style={{ padding: '10px 12px' }}>Created</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {decisions.map((d) => (
                        <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px', fontWeight: 600 }}>
                            <Link to={`/decisions/${d.id}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                              {d.title}
                            </Link>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <DecisionStatusBadge status={d.status} />
                          </td>
                          <td style={{ padding: '12px', color: '#475569' }}>
                            {d.category ? d.category.name : '—'}
                          </td>
                          <td style={{ padding: '12px', color: '#475569' }}>
                            {d.creator?.full_name || `User #${d.created_by}`}
                          </td>
                          <td style={{ padding: '12px', color: '#64748b' }}>
                            {formatDate(d.created_at)}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <Link to={`/decisions/${d.id}`} className="btn btn-secondary btn-xs" style={{ padding: '4px 8px' }}>
                              Replay &rarr;
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

          {/* TAB 3: DISCUSSIONS */}
          {activeTab === 'discussions' && (
            <div className="card" style={{ padding: '1.5rem', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                  Squad Discussions & Rationale ({discussions.length})
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Threaded comments and technical review commentary across all decisions in this squad.
                </p>
              </div>

              {discussions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                  <MessageSquare size={36} style={{ color: '#cbd5e1', margin: '0 auto 8px' }} />
                  <p>No discussion threads on this squad's decisions yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {discussions.map((c) => (
                    <div key={c.id} style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>
                          {c.author?.full_name || `User #${c.user_id}`}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{formatDate(c.created_at)}</span>
                      </div>
                      <p style={{ margin: '0 0 8px', color: '#334155', fontSize: '0.875rem', lineHeight: 1.5 }}>
                        {c.content}
                      </p>
                      {c.decision_id && (
                        <Link to={`/decisions/${c.decision_id}`} style={{ fontSize: '0.8rem', color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>
                          View in Decision #{c.decision_id} &rarr;
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="card" style={{ padding: '1.5rem', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                  Squad Document Blueprints ({documents.length})
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Architecture specifications, design docs, and artifacts linked to this squad's decisions.
                </p>
              </div>

              {documents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                  <Paperclip size={36} style={{ color: '#cbd5e1', margin: '0 auto 8px' }} />
                  <p>No documents attached to this squad's decisions yet.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                        <th style={{ padding: '10px 12px' }}>Document Name</th>
                        <th style={{ padding: '10px 12px' }}>Decision</th>
                        <th style={{ padding: '10px 12px' }}>Uploaded By</th>
                        <th style={{ padding: '10px 12px' }}>Date</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((doc) => (
                        <tr key={doc.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px', fontWeight: 600, color: '#0f172a' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Paperclip size={14} className="text-primary" />
                              <span>{doc.file_name}</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <Link to={`/decisions/${doc.decision_id}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                              Decision #{doc.decision_id}
                            </Link>
                          </td>
                          <td style={{ padding: '12px', color: '#475569' }}>
                            {doc.uploader?.full_name || `User #${doc.uploaded_by}`}
                          </td>
                          <td style={{ padding: '12px', color: '#64748b' }}>
                            {formatDate(doc.created_at)}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={() => handleDownloadDoc(doc)}
                              className="btn btn-secondary btn-xs"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px' }}
                            >
                              <Download size={12} />
                              <span>Download</span>
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

          {/* TAB 5: ACTIVITY */}
          {activeTab === 'activity' && (
            <div className="card" style={{ padding: '1.5rem', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                  Squad Activity Audit Trail ({activities.length})
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Immutable log of decisions, revisions, approvals, and actions within {team.name}.
                </p>
              </div>

              {activities.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                  <Activity size={36} style={{ color: '#cbd5e1', margin: '0 auto 8px' }} />
                  <p>No activity recorded for this squad yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {activities.map((a, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                        <Activity size={14} />
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>
                          <strong>{a.user?.full_name || `User #${a.user_id}`}</strong> {a.action}
                        </p>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
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
        </>
      )}
    </div>
  );
};

export default MyTeam;
