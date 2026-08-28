import React, { useState } from 'react';
import { User, Mail, Briefcase, Building, Phone, Lock, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { RoleBadge } from '../components/ui/StatusBadge';
import api from '../api/client';

export const ProfilePage = () => {
  const { user, refreshUser } = useAuth();

  const [formData, setFormData] = useState({
    full_name: user?.profile?.full_name || '',
    job_title: user?.profile?.job_title || '',
    department: user?.profile?.department || '',
    phone: user?.profile?.phone || '',
  });

  const [pwdData, setPwdData] = useState({
    current_password: '',
    new_password: '',
  });

  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });
  const [pwdMsg, setPwdMsg] = useState({ text: '', type: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg({ text: '', type: '' });
    try {
      await api.put('/users/profile/me', formData);
      setProfileMsg({ text: 'Profile updated successfully!', type: 'success' });
      await refreshUser();
    } catch (err) {
      setProfileMsg({ text: err.response?.data?.message || 'Failed to update profile.', type: 'error' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setSavingPwd(true);
    setPwdMsg({ text: '', type: '' });
    try {
      await api.post('/auth/change-password', pwdData);
      setPwdMsg({ text: 'Password changed successfully!', type: 'success' });
      setPwdData({ current_password: '', new_password: '' });
    } catch (err) {
      setPwdMsg({ text: err.response?.data?.message || 'Failed to change password.', type: 'error' });
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account & Profile Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage personal details, department assignments, and security</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-center">
          <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-700 font-bold text-2xl mx-auto flex items-center justify-center border-2 border-blue-200">
            {user?.profile?.full_name?.charAt(0) || user?.email?.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">{user?.profile?.full_name || 'Anonymous User'}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
          </div>
          <div className="pt-2">
            <RoleBadge role={user?.role?.code} />
          </div>
        </div>

        {/* Profile Edit Form (2 Cols) */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleProfileSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">Personal Information</h3>

            {profileMsg.text && (
              <div
                className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                  profileMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {profileMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{profileMsg.text}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 text-sm px-3.5 py-2 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Job Title</label>
                <input
                  type="text"
                  value={formData.job_title}
                  onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-sm px-3 py-2 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-sm px-3 py-2 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 text-sm px-3.5 py-2 rounded-lg"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg text-xs shadow-xs disabled:opacity-50"
              >
                {savingProfile ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>

          {/* Change Password Form */}
          <form onSubmit={handlePasswordSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">Security & Password</h3>

            {pwdMsg.text && (
              <div
                className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                  pwdMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {pwdMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{pwdMsg.text}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Current Password</label>
              <input
                type="password"
                required
                value={pwdData.current_password}
                onChange={(e) => setPwdData({ ...pwdData, current_password: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 text-sm px-3.5 py-2 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">New Password (min 8 chars)</label>
              <input
                type="password"
                required
                minLength={8}
                value={pwdData.new_password}
                onChange={(e) => setPwdData({ ...pwdData, new_password: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 text-sm px-3.5 py-2 rounded-lg"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingPwd}
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-5 py-2 rounded-lg text-xs shadow-xs disabled:opacity-50"
              >
                {savingPwd ? 'Updating...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
