import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  addTeamMember,
} from '../services/teamService';
import { getUserRoster } from '../services/userService';
import {
  Users,
  PlusCircle,
  Search,
  Trash2,
  Edit2,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Crown,
  Layers,
  Calendar,
  Check,
  UserPlus,
} from 'lucide-react';

export const Teams = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  // Create Team Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');
  const [newTeamPurpose, setNewTeamPurpose] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [rosterUsers, setRosterUsers] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]); // [{ userId, role }]
  const [rosterSearch, setRosterSearch] = useState('');
  const [nameError, setNameError] = useState('');
  const [modalError, setModalError] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Edit Team Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [editTeamName, setEditTeamName] = useState('');
  const [editTeamDesc, setEditTeamDesc] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Safe RBAC extraction (handles both string and object role formats)
  const userRoleName = (
    typeof user?.role === 'string'
      ? user.role
      : (user?.role?.name || user?.role_name || '')
  ).toLowerCase();
  const isAdmin = userRoleName === 'administrator';
  const isManager = userRoleName === 'manager';

  const fetchTeamsList = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getTeams();
      setTeams(data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch teams list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamsList();
  }, []);

  const handleOpenCreateModal = async () => {
    setNewTeamName('');
    setNewTeamDesc('');
    setNewTeamPurpose('');
    setSelectedLeadId(user?.id ? String(user.id) : '');
    setSelectedMembers([]);
    setRosterSearch('');
    setNameError('');
    setModalError('');
    setShowCreateModal(true);
    setRosterLoading(true);

    try {
      const roster = await getUserRoster();
      setRosterUsers(roster || []);
    } catch (err) {
      console.warn('Could not load user roster:', err);
    } finally {
      setRosterLoading(false);
    }
  };

  const handleToggleMemberSelection = (userId) => {
    setSelectedMembers(prev => {
      const exists = prev.find(m => m.userId === userId);
      if (exists) {
        return prev.filter(m => m.userId !== userId);
      } else {
        return [...prev, { userId, role: 'Member' }];
      }
    });
  };

  const handleMemberRoleChange = (userId, newRole) => {
    setSelectedMembers(prev =>
      prev.map(m => (m.userId === userId ? { ...m, role: newRole } : m))
    );
  };

  const validateNameInput = (value) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setNameError('Team name is required.');
      return false;
    }
    if (trimmed.length < 2) {
      setNameError('Team name must contain at least 2 characters.');
      return false;
    }
    setNameError('');
    return true;
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!validateNameInput(newTeamName) || createSubmitting) return;

    setCreateSubmitting(true);
    setModalError('');
    setError('');

    try {
      const payload = {
        name: newTeamName.trim(),
        description: newTeamDesc.trim() || null,
        purpose: newTeamPurpose.trim() || null,
      };

      const newTeam = await createTeam(payload);

      // 1. If a lead was explicitly designated and is different from creator
      if (selectedLeadId && Number(selectedLeadId) !== user?.id) {
        try {
          await addTeamMember(newTeam.id, {
            user_id: Number(selectedLeadId),
            role: 'Lead',
          });
        } catch (lErr) {
          console.warn(`Could not assign selected lead ${selectedLeadId}:`, lErr);
        }
      }

      // 2. Add selected team members
      if (selectedMembers.length > 0) {
        for (const member of selectedMembers) {
          // Skip if user is creator or designated lead
          if (member.userId === user?.id || (selectedLeadId && member.userId === Number(selectedLeadId))) {
            continue;
          }
          try {
            await addTeamMember(newTeam.id, {
              user_id: member.userId,
              role: member.role || 'Member',
            });
          } catch (mErr) {
            console.warn(`Could not add member ${member.userId}:`, mErr);
          }
        }
      }

      setSuccess(`Team "${newTeam.name}" created successfully.`);
      setShowCreateModal(false);

      // Reset modal fields
      setNewTeamName('');
      setNewTeamDesc('');
      setNewTeamPurpose('');
      setSelectedLeadId('');
      setSelectedMembers([]);

      // Refresh list immediately to show the new team
      await fetchTeamsList();
    } catch (err) {
      setModalError(err.message || 'Failed to create team. Please verify team name and try again.');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleOpenEditModal = (team) => {
    setEditingTeam(team);
    setEditTeamName(team.name);
    setEditTeamDesc(team.description || '');
    setShowEditModal(true);
  };

  const handleUpdateTeam = async (e) => {
    e.preventDefault();
    if (!editTeamName.trim() || !editingTeam || editSubmitting) return;

    setEditSubmitting(true);
    try {
      await updateTeam(editingTeam.id, {
        name: editTeamName.trim(),
        description: editTeamDesc.trim() || null,
      });
      setSuccess(`Team "${editTeamName}" updated successfully.`);
      setShowEditModal(false);
      setEditingTeam(null);
      await fetchTeamsList();
    } catch (err) {
      setError(err.message || 'Failed to update team.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteTeam = async (team) => {
    if (!window.confirm(`Are you sure you want to permanently delete team "${team.name}"? Team members and scoped decisions will be detached.`)) {
      return;
    }
    try {
      await deleteTeam(team.id);
      setSuccess(`Team "${team.name}" deleted successfully.`);
      await fetchTeamsList();
    } catch (err) {
      setError(err.message || 'Failed to delete team.');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recently';
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Recently';
    }
  };

  const filteredTeams = useMemo(() => {
    if (!searchFilter.trim()) return teams;
    const q = searchFilter.toLowerCase();
    return teams.filter(
      t =>
        t.name.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
    );
  }, [teams, searchFilter]);

  const filteredRoster = useMemo(() => {
    if (!rosterSearch.trim()) return rosterUsers;
    const q = rosterSearch.toLowerCase();
    return rosterUsers.filter(
      u =>
        u.full_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        (u.role?.name && u.role.name.toLowerCase().includes(q))
    );
  }, [rosterUsers, rosterSearch]);

  return (
    <div className="teams-page-container">
      {/* Redesigned Header Bar matching Specification */}
      <div
        className="dashboard-header-bar"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <div className="dashboard-title-group" style={{ minWidth: '300px', flex: '1 1 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={24} />
            </div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: '#0f172a' }}>
              Team Workspaces
            </h1>
          </div>
          <p style={{ margin: '6px 0 0 0', color: '#64748b', fontSize: '0.95rem', lineHeight: 1.5 }}>
            Collaborate across engineering squads, functional boards, and project teams on critical decisions.
          </p>
        </div>

        {/* Actions on the right: Search Teams + Create Team button */}
        <div
          className="dashboard-header-actions"
          style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}
        >
          <div className="search-field-wrapper" style={{ width: '280px', maxWidth: '100%' }}>
            <Search size={16} className="input-leading-icon" />
            <input
              type="text"
              className="search-field-input"
              placeholder="Search Teams..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              aria-label="Search Teams"
            />
            {searchFilter && (
              <button
                type="button"
                className="input-trailing-btn"
                onClick={() => setSearchFilter('')}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleOpenCreateModal}
            id="btn-create-team"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 600,
              padding: '0.625rem 1.25rem',
              whiteSpace: 'nowrap',
            }}
          >
            <PlusCircle size={18} />
            <span>+ Create Team</span>
          </button>
        </div>
      </div>

      {/* Alert Notices */}
      {error && (
        <div className="alert alert-error" role="alert" style={{ marginBottom: '1.25rem' }}>
          <AlertCircle size={18} />
          <span style={{ flex: 1 }}>{error}</span>
          <button
            type="button"
            onClick={() => setError('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {success && (
        <div className="alert alert-success" role="alert" style={{ marginBottom: '1.25rem' }}>
          <CheckCircle2 size={18} />
          <span style={{ flex: 1 }}>{success}</span>
          <button
            type="button"
            onClick={() => setSuccess('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Counter bar if teams exist */}
      {!loading && teams.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Showing <strong>{filteredTeams.length}</strong> of <strong>{teams.length}</strong> {teams.length === 1 ? 'team' : 'teams'}
          </span>
        </div>
      )}

      {/* Teams Grid / Loading / Empty State */}
      {loading ? (
        <div className="card loading-state-card" style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <Loader2 size={36} className="spinner-icon text-primary" />
          <span style={{ color: '#64748b', fontWeight: 500 }}>Loading team workspaces...</span>
        </div>
      ) : filteredTeams.length === 0 ? (
        /* Empty State Matching Specification */
        <div
          className="empty-state-card"
          style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            margin: '1.5rem 0',
          }}
        >
          <div
            className="empty-state-icon"
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}
          >
            <Users size={32} />
          </div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem' }}>
            No teams found
          </h3>
          <p style={{ color: '#64748b', maxWidth: '480px', margin: '0 auto 1.75rem', fontSize: '0.95rem', lineHeight: 1.5 }}>
            {searchFilter
              ? `No teams matching "${searchFilter}". Try clearing or adjusting your search query.`
              : 'No collaborative team workspaces created yet.'}
          </p>

          {searchFilter ? (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setSearchFilter('')}
            >
              Clear Search Query
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={handleOpenCreateModal}
              id="empty-btn-create-team"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.75rem 1.5rem',
                fontWeight: 600,
              }}
            >
              <PlusCircle size={18} />
              <span>+ Create Team</span>
            </button>
          )}
        </div>
      ) : (
        /* Modern Enterprise Card Grid */
        <div className="teams-directory-grid">
          {filteredTeams.map((team) => {
            const memberCount = team.member_count !== undefined ? team.member_count : (team.members?.length || 0);
            const leaderMember = team.members?.find(m => m.role?.toLowerCase() === 'lead' || m.role?.toLowerCase() === 'owner');
            const leadName = leaderMember?.user_name || team.creator_name || 'Unassigned';

            // User can manage team if Administrator, Manager, creator, or designated Lead
            const isCreator = team.created_by === user?.id;
            const isLead = team.members?.some(m => m.user_id === user?.id && (m.role?.toLowerCase() === 'lead' || m.role?.toLowerCase() === 'owner'));
            const canManageThisTeam = isAdmin || isManager || isCreator || isLead;

            return (
              <div key={team.id} className="team-directory-card">
                <div className="team-directory-card-top">
                  <div className="team-badge-avatar">
                    <Users size={20} />
                  </div>
                  <div className="team-directory-title-block">
                    <h3 className="team-directory-title">
                      <Link to={`/teams/${team.id}`}>{team.name}</Link>
                    </h3>
                    <div className="team-directory-stats">
                      <span className="team-stat-pill">
                        <Users size={12} /> {memberCount} {memberCount === 1 ? 'member' : 'members'}
                      </span>
                      <span className="team-stat-pill">
                        <Calendar size={12} /> {formatDate(team.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="team-directory-desc">
                  {team.description || 'Collaborative workspace for evaluating and recording team decisions.'}
                </p>

                <div className="team-leader-row">
                  <Crown size={14} className="text-warning" />
                  <span>Lead: <strong>{leadName}</strong></span>
                </div>

                <div className="team-directory-card-footer">
                  <Link
                    to={`/teams/${team.id}`}
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1, justifyContent: 'center', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span>Open Workspace</span>
                    <ChevronRight size={15} />
                  </Link>

                  {canManageThisTeam && (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(team)}
                        className="btn btn-secondary btn-sm"
                        title="Edit team details"
                        style={{ padding: '6px 8px' }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTeam(team)}
                        className="btn btn-danger btn-sm"
                        title="Delete team workspace"
                        style={{ padding: '6px 8px' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Professional Create Team Modal / Drawer */}
      {showCreateModal && (
        <div
          className="rpt-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => !createSubmitting && setShowCreateModal(false)}
        >
          <div
            className="rpt-modal"
            style={{ maxWidth: '640px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="rpt-modal-header">
              <div>
                <h2 className="rpt-modal-title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                  Create Team Workspace
                </h2>
                <span className="rpt-modal-subtitle" style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Establish a collaborative environment for squads, boards, and project initiatives
                </span>
              </div>
              <button
                type="button"
                className="rpt-modal-close"
                onClick={() => !createSubmitting && setShowCreateModal(false)}
                disabled={createSubmitting}
                title="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateTeam} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="rpt-modal-body" style={{ overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {modalError && (
                  <div className="alert alert-error" role="alert" style={{ padding: '0.75rem 1rem' }}>
                    <AlertCircle size={16} />
                    <span style={{ fontSize: '0.875rem' }}>{modalError}</span>
                  </div>
                )}

                {/* 1. Team Name */}
                <div className="form-group">
                  <label htmlFor="team_name" style={{ display: 'block', fontWeight: 600, marginBottom: '6px', color: '#1e293b' }}>
                    Team Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="team_name"
                    type="text"
                    className={`form-control-input ${nameError ? 'input-error' : ''}`}
                    placeholder="e.g. Core Infrastructure & Reliability"
                    value={newTeamName}
                    onChange={(e) => {
                      setNewTeamName(e.target.value);
                      if (nameError) validateNameInput(e.target.value);
                    }}
                    onBlur={() => validateNameInput(newTeamName)}
                    autoFocus
                    disabled={createSubmitting}
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.875rem',
                      borderRadius: '6px',
                      border: nameError ? '1px solid #ef4444' : '1px solid #cbd5e1',
                      fontSize: '0.95rem',
                    }}
                  />
                  {nameError && (
                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#ef4444' }}>
                      {nameError}
                    </p>
                  )}
                </div>

                {/* 2. Description */}
                <div className="form-group">
                  <label htmlFor="team_desc" style={{ display: 'block', fontWeight: 600, marginBottom: '6px', color: '#1e293b' }}>
                    Description
                  </label>
                  <textarea
                    id="team_desc"
                    className="form-control-textarea"
                    rows={2}
                    placeholder="Brief description of the team and domain focus..."
                    value={newTeamDesc}
                    onChange={(e) => setNewTeamDesc(e.target.value)}
                    disabled={createSubmitting}
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.875rem',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      resize: 'vertical',
                    }}
                  />
                </div>

                {/* 3. Purpose */}
                <div className="form-group">
                  <label htmlFor="team_purpose" style={{ display: 'block', fontWeight: 600, marginBottom: '6px', color: '#1e293b' }}>
                    Purpose & Charter
                  </label>
                  <input
                    id="team_purpose"
                    type="text"
                    className="form-control-input"
                    placeholder="e.g. Standardizing cloud infrastructure and decision governance"
                    value={newTeamPurpose}
                    onChange={(e) => setNewTeamPurpose(e.target.value)}
                    disabled={createSubmitting}
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.875rem',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>

                {/* 4. Team Lead Dropdown */}
                <div className="form-group">
                  <label htmlFor="team_lead" style={{ display: 'block', fontWeight: 600, marginBottom: '6px', color: '#1e293b' }}>
                    Team Lead
                  </label>
                  <select
                    id="team_lead"
                    className="form-control-select"
                    value={selectedLeadId}
                    onChange={(e) => setSelectedLeadId(e.target.value)}
                    disabled={createSubmitting || rosterLoading}
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.875rem',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      backgroundColor: '#fff',
                    }}
                  >
                    <option value="">
                      -- Select Team Lead (Defaults to You: {user?.full_name || user?.email}) --
                    </option>
                    {rosterUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name} ({u.role?.name || u.role}) - {u.email}
                      </option>
                    ))}
                  </select>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', marginTop: '4px' }}>
                    The team lead is designated with workspace management permissions.
                  </span>
                </div>

                {/* 5. Team Members Selection */}
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ margin: 0, fontWeight: 600, color: '#1e293b' }}>
                      Team Members
                    </label>
                    <span style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 600 }}>
                      {selectedMembers.length} {selectedMembers.length === 1 ? 'member' : 'members'} selected
                    </span>
                  </div>

                  {/* Filter roster input */}
                  <div className="search-field-wrapper" style={{ marginBottom: '8px' }}>
                    <Search size={14} className="input-leading-icon" />
                    <input
                      type="text"
                      className="search-field-input"
                      placeholder="Filter colleagues by name or role..."
                      value={rosterSearch}
                      onChange={(e) => setRosterSearch(e.target.value)}
                      disabled={createSubmitting || rosterLoading}
                      style={{ padding: '6px 8px 6px 32px', fontSize: '0.85rem' }}
                    />
                    {rosterSearch && (
                      <button
                        type="button"
                        className="input-trailing-btn"
                        onClick={() => setRosterSearch('')}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  {/* Roster selection box */}
                  <div
                    className="roster-selection-container"
                    style={{
                      maxHeight: '190px',
                      overflowY: 'auto',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '8px',
                      background: '#f8fafc',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    {rosterLoading ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', color: '#64748b', fontSize: '0.85rem' }}>
                        <Loader2 size={16} className="spinner-icon" />
                        <span>Loading organization roster...</span>
                      </div>
                    ) : filteredRoster.length === 0 ? (
                      <p style={{ margin: 0, padding: '12px', color: '#64748b', fontSize: '0.85rem', textAlign: 'center' }}>
                        {rosterSearch ? 'No colleagues match the filter.' : 'No users found in directory roster.'}
                      </p>
                    ) : (
                      filteredRoster.map((u) => {
                        const isSelected = selectedMembers.some(m => m.userId === u.id);
                        const selectedItem = selectedMembers.find(m => m.userId === u.id);
                        const isCurrent = u.id === user?.id;

                        return (
                          <div
                            key={u.id}
                            className={`roster-user-item ${isSelected ? 'selected' : ''}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 10px',
                              borderRadius: '6px',
                              background: isSelected ? '#eff6ff' : '#ffffff',
                              border: isSelected ? '1px solid #93c5fd' : '1px solid #e2e8f0',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <label
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                cursor: 'pointer',
                                flex: 1,
                                margin: 0,
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleMemberSelection(u.id)}
                                disabled={createSubmitting}
                              />
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>
                                  {u.full_name} {isCurrent && <span style={{ color: '#64748b', fontWeight: 400 }}>(You)</span>}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                  {u.email} • {u.role?.name || u.role}
                                </span>
                              </div>
                            </label>

                            {isSelected && (
                              <select
                                className="roster-role-select"
                                value={selectedItem?.role || 'Member'}
                                onChange={(e) => handleMemberRoleChange(u.id, e.target.value)}
                                disabled={createSubmitting}
                                style={{
                                  fontSize: '0.75rem',
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  border: '1px solid #94a3b8',
                                  backgroundColor: '#fff',
                                }}
                              >
                                <option value="Member">Member</option>
                                <option value="Lead">Lead</option>
                              </select>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div
                className="form-actions-footer"
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  padding: '1rem 1.5rem',
                  borderTop: '1px solid #e2e8f0',
                  background: '#f8fafc',
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={createSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={createSubmitting}
                  id="submit-create-team"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  {createSubmitting ? (
                    <>
                      <Loader2 size={16} className="spinner-icon" />
                      <span>Creating Team...</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle size={16} />
                      <span>Create Team</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Team Modal */}
      {showEditModal && (
        <div className="rpt-modal-overlay" role="dialog" aria-modal="true" onClick={() => !editSubmitting && setShowEditModal(false)}>
          <div className="rpt-modal" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div className="rpt-modal-header">
              <h2 className="rpt-modal-title" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                Edit Team Details
              </h2>
              <button
                type="button"
                className="rpt-modal-close"
                onClick={() => !editSubmitting && setShowEditModal(false)}
                disabled={editSubmitting}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdateTeam}>
              <div className="rpt-modal-body" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="edit_team_name" style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>
                    Team Name *
                  </label>
                  <input
                    id="edit_team_name"
                    type="text"
                    className="form-control-input"
                    value={editTeamName}
                    onChange={(e) => setEditTeamName(e.target.value)}
                    required
                    disabled={editSubmitting}
                    style={{ width: '100%', padding: '0.625rem 0.875rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit_team_desc" style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>
                    Description
                  </label>
                  <textarea
                    id="edit_team_desc"
                    className="form-control-textarea"
                    rows={4}
                    value={editTeamDesc}
                    onChange={(e) => setEditTeamDesc(e.target.value)}
                    disabled={editSubmitting}
                    style={{ width: '100%', padding: '0.625rem 0.875rem', borderRadius: '6px', border: '1px solid #cbd5e1', resize: 'vertical' }}
                  />
                </div>
              </div>

              <div
                className="form-actions-footer"
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  padding: '1rem 1.5rem',
                  borderTop: '1px solid #e2e8f0',
                  background: '#f8fafc',
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                  disabled={editSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={editSubmitting}
                >
                  {editSubmitting ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teams;
