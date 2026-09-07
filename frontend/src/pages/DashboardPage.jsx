import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import RoleBadge from '../components/RoleBadge';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import {
  User,
  Mail,
  Shield,
  Users,
  CheckCircle2,
  Calendar,
  Settings,
  ArrowRight,
  Sparkles,
  Edit3,
  Check,
  X,
  Cpu,
  GitBranch,
  Layers,
  History
} from 'lucide-react';

export const DashboardPage = () => {
  const { user, isAdmin, isManager, refreshProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/auth/me', { full_name: fullName });
      await refreshProfile();
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to update profile:", err);
    } finally {
      setSaving(false);
    }
  };

  const formattedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'N/A';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Hero Welcome Header */}
      <div className="relative overflow-hidden glass-card rounded-3xl p-8 border border-slate-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Milestone 2 - Decision Replay Active</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
              Welcome, {user?.full_name}!
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl">
              You are signed into the Expert Decision Replay Platform with active permissions as a{' '}
              <span className="text-blue-400 font-semibold">{user?.role}</span>.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <RoleBadge role={user?.role} size="lg" />
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center space-x-2">
          <Check className="w-5 h-5" />
          <span>Profile updated successfully!</span>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: User Profile Details Card */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
              <User className="w-5 h-5 text-blue-400" />
              <span>User Profile Info</span>
            </h2>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors flex items-center space-x-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-medium transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {!isEditing ? (
            <div className="space-y-4 text-sm">
              <div>
                <span className="text-xs uppercase font-semibold text-slate-300 tracking-wider">Full Name</span>
                <p className="text-slate-100 font-semibold text-base mt-0.5">{user?.full_name}</p>
              </div>

              <div>
                <span className="text-xs uppercase font-semibold text-slate-300 tracking-wider">Email Address</span>
                <p className="text-slate-300 mt-0.5 flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-slate-500" />
                  <span>{user?.email}</span>
                </p>
              </div>

              <div>
                <span className="text-xs uppercase font-semibold text-slate-300 tracking-wider">Assigned Role</span>
                <div className="mt-1">
                  <RoleBadge role={user?.role} size="md" />
                </div>
              </div>

              <div>
                <span className="text-xs uppercase font-semibold text-slate-300 tracking-wider">Team</span>
                <p className="text-slate-300 mt-0.5 flex items-center space-x-2">
                  <Users className="w-4 h-4 text-slate-500" />
                  <span>{user?.team ? user.team.name : 'Unassigned (No Team)'}</span>
                </p>
              </div>

              <div>
                <span className="text-xs uppercase font-semibold text-slate-300 tracking-wider">Account Member Since</span>
                <p className="text-slate-400 mt-0.5 flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span>{formattedDate}</span>
                </p>
              </div>

              <div>
                <span className="text-xs uppercase font-semibold text-slate-300 tracking-wider">Account Status</span>
                <div className="mt-1 flex items-center space-x-2 text-emerald-400 font-semibold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Active & Verified</span>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm glass-input text-slate-100 focus:outline-none"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right 2 Columns: Quick Actions & System Modules */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Team Overview Card */}
          <div className="glass-card rounded-3xl p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <span>My Team Overview</span>
              </h2>
              <Link
                to="/teams"
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center space-x-1"
              >
                <span>View All Teams</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {user?.team ? (
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                <h3 className="text-base font-bold text-slate-100">{user.team.name}</h3>
                <p className="text-sm text-slate-400">{user.team.description || 'No description provided.'}</p>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm">
                You are currently not assigned to any organizational team. Contact your manager or admin to assign a team.
              </div>
            )}
          </div>

          {/* Quick Action Navigation Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Decisions Knowledge Hub Card (Milestone 2) */}
            <div className="md:col-span-2 glass-card rounded-3xl p-6 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-blue-500/40 transition-all group bg-gradient-to-br from-blue-950/20 via-slate-900/40 to-slate-900/60">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                  <Cpu className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-bold text-white">Decisions Knowledge Hub</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
                      Milestone 2
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 max-w-xl">
                    Create decisions, evaluate alternatives side-by-side, inspect immutable version history snapshots, collaborate in threaded discussions, and manage attachments.
                  </p>
                </div>
              </div>
              <Link
                to="/decisions"
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shrink-0 shadow-lg shadow-blue-500/20 transition-all group-hover:scale-105"
              >
                <span>Launch Decisions Hub</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Admin Management Card */}
            {isManager && (
              <div className="glass-card rounded-3xl p-6 border border-slate-800 flex flex-col justify-between space-y-4 hover:border-blue-500/40 transition-all group">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-3">
                    <Shield className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-100">User Management</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage team members, update permissions, assign user roles (Employee, Reviewer, Manager, Admin).
                  </p>
                </div>
                <Link
                  to="/admin/users"
                  className="inline-flex items-center space-x-2 text-xs font-bold text-purple-400 hover:text-purple-300 pt-2"
                >
                  <span>Open User Admin</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            )}

            {/* Teams Management Card */}
            <div className="glass-card rounded-3xl p-6 border border-slate-800 flex flex-col justify-between space-y-4 hover:border-indigo-500/40 transition-all group">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-100">Teams & Organization</h3>
                <p className="text-xs text-slate-400 mt-1">
                  View organizational team structures, departmental groups, and member assignments.
                </p>
              </div>
              <Link
                to="/teams"
                className="inline-flex items-center space-x-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 pt-2"
              >
                <span>Explore Teams</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default DashboardPage;
