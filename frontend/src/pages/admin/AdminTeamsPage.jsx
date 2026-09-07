import React, { useState, useEffect } from 'react';
import { Layers, Plus, Users, Trash2, UserPlus, X, Shield, Mail, CheckCircle2 } from 'lucide-react';
import { RoleBadge } from '../../components/ui/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

export const AdminTeamsPage = () => {
  const { isAdmin, isManager } = useAuth();
  const [teams, setTeams] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [teamForm, setTeamForm] = useState({ name: '', description: '' });

  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedUserIdToAdd, setSelectedUserIdToAdd] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  const fetchData = async () => {
    try {
      const [teamsRes, usersRes] = await Promise.all([
        api.get('/teams'),
        api.get('/users'),
      ]);
      setTeams(teamsRes.data);
      setAllUsers(usersRes.data);

      // Keep selectedTeam synced if modal is open
      if (selectedTeam) {
        const updated = teamsRes.data.find((t) => t.id === selectedTeam.id);
        if (updated) setSelectedTeam(updated);
      }
    } catch (e) {
      console.error('Error fetching teams:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      await api.post('/teams', teamForm);
      setTeamForm({ name: '', description: '' });
      setShowCreateModal(false);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.detail || 'Failed to create team.');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedTeam || !selectedUserIdToAdd) return;
    setAddingMember(true);
    try {
      await api.post(`/teams/${selectedTeam.id}/members`, {
        user_id: selectedUserIdToAdd,
      });
      setSelectedUserIdToAdd('');
      await fetchData();
      const updatedTeams = await api.get('/teams');
      setTeams(updatedTeams.data);
      const updated = updatedTeams.data.find((t) => t.id === selectedTeam.id);
      if (updated) setSelectedTeam(updated);
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.detail || 'Failed to add member.');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (teamId, userId) => {
    if (!window.confirm('Remove this member from the team?')) return;
    try {
      await api.delete(`/teams/${teamId}/members/${userId}`);
      await fetchData();
      const updatedTeams = await api.get('/teams');
      setTeams(updatedTeams.data);
      const updated = updatedTeams.data.find((t) => t.id === teamId);
      if (updated) setSelectedTeam(updated);
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.detail || 'Failed to remove member.');
    }
  };

  const canManageTeams = isAdmin || isManager;

  // Filter users not already in selected team
  const availableUsersToAdd = allUsers.filter(
    (u) => !selectedTeam?.members?.some((m) => m.user_id === u.id)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Enterprise Teams & Groups</h1>
          <p className="text-sm text-slate-500 mt-1">
            Organize functional departments, assign members, and manage decision ownership boundaries
          </p>
        </div>
        {canManageTeams && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Team</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : teams.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-xs">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No teams created yet</h3>
          <p className="text-xs text-slate-400 mt-1">Create a team to start grouping members.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((t) => (
            <div
              key={t.id}
              className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-slate-300 shadow-xs space-y-5 flex flex-col justify-between transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Layers className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
                    {t.members?.length || 0} Members
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base">{t.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                    {t.description || 'No description provided.'}
                  </p>
                </div>

                {/* Member Avatars preview */}
                <div className="pt-2">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Team Members
                  </span>
                  <div className="flex items-center -space-x-2 overflow-hidden py-1">
                    {t.members?.slice(0, 5).map((m) => (
                      <div
                        key={m.user_id}
                        title={`${m.full_name} (${m.email})`}
                        className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center ring-2 ring-white"
                      >
                        {m.full_name?.charAt(0) || m.email?.charAt(0)}
                      </div>
                    ))}
                    {(t.members?.length || 0) > 5 && (
                      <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 font-bold text-[10px] flex items-center justify-center ring-2 ring-white">
                        +{t.members.length - 5}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Created {new Date(t.created_at).toLocaleDateString()}
                </span>
                <button
                  onClick={() => setSelectedTeam(t)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Manage Members</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manage Members Modal */}
      {selectedTeam && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedTeam.name}</h3>
                <p className="text-xs text-slate-500">Manage team members and membership list</p>
              </div>
              <button
                onClick={() => setSelectedTeam(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add Member Form (Admin/Manager only) */}
            {canManageTeams && (
              <form onSubmit={handleAddMember} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Add User to Team
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <select
                    required
                    value={selectedUserIdToAdd}
                    onChange={(e) => setSelectedUserIdToAdd(e.target.value)}
                    className="flex-1 w-full bg-white border border-slate-200 text-xs text-slate-800 px-3 py-2.5 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select a registered user to add...</option>
                    {availableUsersToAdd.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.profile?.full_name || u.email} ({u.email}) - {u.role?.name || u.role?.code}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={addingMember || !selectedUserIdToAdd}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-xs transition-colors disabled:opacity-50"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{addingMember ? 'Adding...' : 'Add Member'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Current Members List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Current Members ({selectedTeam.members?.length || 0})
              </h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                {selectedTeam.members?.length === 0 ? (
                  <p className="text-xs text-slate-400 p-4 text-center">No members in this team yet.</p>
                ) : (
                  selectedTeam.members?.map((m) => (
                    <div key={m.user_id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                          {m.full_name?.charAt(0) || m.email?.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block text-xs">{m.full_name}</span>
                          <span className="text-slate-400 text-[11px]">{m.email}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <RoleBadge role={m.role_code} />
                        {canManageTeams && (
                          <button
                            onClick={() => handleRemoveMember(selectedTeam.id, m.user_id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Remove member from team"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedTeam(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateTeam} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900">Create New Team</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Team Name *</label>
              <input
                type="text"
                required
                value={teamForm.name}
                onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                placeholder="e.g. Core Infrastructure Group"
                className="w-full bg-slate-50 border border-slate-200 text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Description</label>
              <textarea
                rows={3}
                value={teamForm.description}
                onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
                placeholder="Purpose and scope of this team..."
                className="w-full bg-slate-50 border border-slate-200 text-sm p-3 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-xs font-semibold shadow-xs"
              >
                Create Team
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
