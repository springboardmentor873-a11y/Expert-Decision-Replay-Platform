import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import RoleBadge from '../components/RoleBadge';
import {
  Users,
  Search,
  Filter,
  Shield,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  UserCheck
} from 'lucide-react';

const ROLES = ['EMPLOYEE', 'REVIEWER', 'MANAGER', 'ADMINISTRATOR'];

export const AdminUsersPage = () => {
  const { user: currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [usersRes, teamsRes] = await Promise.all([
        api.get('/users'),
        api.get('/teams'),
      ]);
      setUsers(usersRes.data);
      setTeams(teamsRes.data);
    } catch (err) {
      console.error("Failed to load user management data:", err);
      setError(err.response?.data?.detail || "Failed to load user data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/users/${userId}/role`, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      setSuccessMsg(`Role updated to ${newRole} successfully.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error("Failed to change role:", err);
      alert(err.response?.data?.detail || "Failed to update role. Administrators only.");
    }
  };

  const handleTeamChange = async (userId, newTeamId) => {
    const parsedTeamId = newTeamId ? parseInt(newTeamId, 10) : null;
    try {
      const res = await api.put(`/users/${userId}/team`, { team_id: parsedTeamId });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? res.data : u))
      );
      setSuccessMsg(`Team assignment updated successfully.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error("Failed to assign team:", err);
      alert(err.response?.data?.detail || "Failed to assign team.");
    }
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter ? u.role === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-400 mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Admin Control Panel</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">User & Role Management</h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage system access, assign organizational teams, and alter user RBAC roles.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-4 justify-between">
        
        {/* Search */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by name or email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm glass-input text-slate-100 placeholder-slate-500 focus:outline-none"
          />
        </div>

        {/* Role Filter */}
        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Filter className="w-4 h-4" />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm glass-input text-slate-100 focus:outline-none appearance-none bg-slate-900"
          >
            <option value="">All Roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* Users Table */}
      <div className="glass-card rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-bold">User</th>
                <th className="px-6 py-4 font-bold">Current Role</th>
                <th className="px-6 py-4 font-bold">Assigned Team</th>
                <th className="px-6 py-4 font-bold">Status</th>
                {isAdmin && <th className="px-6 py-4 font-bold text-right">Role Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                      <span>Loading user directory...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No users found matching query criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-200 text-sm shrink-0">
                          {u.full_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-100">{u.full_name}</div>
                          <div className="text-xs text-slate-400">{u.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <RoleBadge role={u.role} size="sm" />
                    </td>

                    <td className="px-6 py-4">
                      <select
                        value={u.team_id || ''}
                        onChange={(e) => handleTeamChange(u.id, e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
                      >
                        <option value="">No Team (Unassigned)</option>
                        {teams.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex items-center space-x-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </span>
                    </td>

                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          disabled={u.id === currentUser.id}
                          className="bg-slate-900 border border-purple-500/30 text-purple-300 text-xs font-semibold rounded-lg px-3 py-1.5 focus:outline-none disabled:opacity-50"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              Set as {r}
                            </option>
                          ))}
                        </select>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AdminUsersPage;
