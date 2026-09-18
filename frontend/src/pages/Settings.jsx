import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile, changePassword } from '../services/userService';
import {
  User,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Mail,
  Calendar,
  Eye,
  EyeOff,
  Save,
} from 'lucide-react';

export const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  // Profile Form State
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (user?.full_name) {
      setFullName(user.full_name);
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    setProfileLoading(true);
    setProfileSuccess('');
    setProfileError('');
    try {
      const updated = await updateProfile({ full_name: fullName.trim() });
      setProfileSuccess('Profile information updated successfully.');
      if (user) {
        user.full_name = updated.full_name;
      }
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match. Please verify.');
      return;
    }

    setPasswordLoading(true);
    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordSuccess('Password changed successfully. Your account is secured.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const getRoleBadgeClass = (roleName) => {
    switch (roleName?.toLowerCase()) {
      case 'administrator':
        return 'role-badge badge-admin';
      case 'manager':
        return 'role-badge badge-manager';
      case 'reviewer':
        return 'role-badge badge-reviewer';
      default:
        return 'role-badge badge-employee';
    }
  };

  return (
    <div className="settings-page-container">
      {/* Header Bar */}
      <div className="dashboard-header-bar">
        <div className="dashboard-title-group">
          <h1>Account & Security Settings</h1>
          <p>Manage your profile credentials, account identity, and enterprise security.</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="settings-nav-tabs">
        <button
          className={`settings-nav-tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <User size={16} />
          <span>Profile & Identity</span>
        </button>
        <button
          className={`settings-nav-tab ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <Lock size={16} />
          <span>Security & Password</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="settings-tab-content">
        {activeTab === 'profile' && (
          <div className="settings-card-grid">
            {/* Profile Overview & Form */}
            <div className="card settings-main-card">
              <div className="settings-card-header">
                <div className="chart-header-title">
                  <User size={20} className="chart-header-icon" />
                  <h3>Personal Profile</h3>
                </div>
                <span className={getRoleBadgeClass(user?.role?.name)}>
                  {user?.role?.name || 'Employee'}
                </span>
              </div>

              {profileSuccess && (
                <div className="alert alert-success" style={{ marginBottom: '1.25rem' }}>
                  <CheckCircle2 size={16} />
                  <span>{profileSuccess}</span>
                </div>
              )}

              {profileError && (
                <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
                  <AlertCircle size={16} />
                  <span>{profileError}</span>
                </div>
              )}

              <div className="settings-profile-badge-row">
                <div className="settings-large-avatar">
                  {getInitials(user?.full_name)}
                </div>
                <div className="settings-profile-badge-meta">
                  <h4>{user?.full_name || 'User'}</h4>
                  <p className="settings-meta-email">{user?.email}</p>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="settings-form">
                <div className="form-group">
                  <label htmlFor="userFullName" className="form-label">
                    Full Name <span className="required-star">*</span>
                  </label>
                  <input
                    id="userFullName"
                    type="text"
                    className="form-control"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                  <small className="form-text-muted">
                    Your name appears on decisions, comments, and audit logs you create.
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="userEmail" className="form-label">
                    Email Address
                  </label>
                  <div className="input-with-leading-icon">
                    <Mail size={16} className="input-leading-icon-muted" />
                    <input
                      id="userEmail"
                      type="email"
                      className="form-control disabled-input"
                      value={user?.email || ''}
                      disabled
                    />
                  </div>
                  <small className="form-text-muted">
                    Email address is tied to enterprise SSO and cannot be modified directly.
                  </small>
                </div>

                <div className="form-actions-right">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={profileLoading || !fullName.trim() || fullName === user?.full_name}
                  >
                    {profileLoading ? (
                      <>
                        <Loader2 size={16} className="spinner-icon" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        <span>Save Profile Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Account Metadata Side Card */}
            <div className="card settings-side-card">
              <div className="settings-card-header">
                <div className="chart-header-title">
                  <Shield size={18} className="chart-header-icon" />
                  <h3>Account Details</h3>
                </div>
              </div>

              <div className="settings-meta-list">
                <div className="settings-meta-item">
                  <span className="settings-meta-label">Account Status</span>
                  <span className="status-pill-active">
                    <span className="status-dot-active" /> Active
                  </span>
                </div>

                <div className="settings-meta-item">
                  <span className="settings-meta-label">Assigned Role</span>
                  <span className="settings-meta-value">{user?.role?.name || 'Employee'}</span>
                </div>

                <div className="settings-meta-item">
                  <span className="settings-meta-label">User ID</span>
                  <span className="settings-meta-value font-mono">#{user?.id || '—'}</span>
                </div>

                <div className="settings-meta-item">
                  <span className="settings-meta-label">Account Created</span>
                  <span className="settings-meta-value">
                    {user?.created_at
                      ? new Date(user.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'Active'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="settings-card-grid">
            {/* Password Change Card */}
            <div className="card settings-main-card">
              <div className="settings-card-header">
                <div className="chart-header-title">
                  <KeyRound size={20} className="chart-header-icon" />
                  <h3>Change Password</h3>
                </div>
                <span className="badge-security-verified">Bcrypt 12 Rounds</span>
              </div>

              {passwordSuccess && (
                <div className="alert alert-success" style={{ marginBottom: '1.25rem' }}>
                  <CheckCircle2 size={16} />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              {passwordError && (
                <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
                  <AlertCircle size={16} />
                  <span>{passwordError}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="settings-form">
                <div className="form-group">
                  <label htmlFor="currentPassword" className="form-label">
                    Current Password <span className="required-star">*</span>
                  </label>
                  <div className="input-with-trailing-icon">
                    <input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      className="form-control"
                      placeholder="Enter your current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="input-trailing-btn"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      tabIndex="-1"
                    >
                      {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword" className="form-label">
                    New Password <span className="required-star">*</span>
                  </label>
                  <div className="input-with-trailing-icon">
                    <input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      className="form-control"
                      placeholder="Minimum 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="input-trailing-btn"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      tabIndex="-1"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirm New Password <span className="required-star">*</span>
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    className="form-control"
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-actions-right">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={
                      passwordLoading ||
                      !currentPassword ||
                      !newPassword ||
                      newPassword.length < 8 ||
                      newPassword !== confirmPassword
                    }
                  >
                    {passwordLoading ? (
                      <>
                        <Loader2 size={16} className="spinner-icon" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound size={16} />
                        <span>Update Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Password Policy Side Card */}
            <div className="card settings-side-card">
              <div className="settings-card-header">
                <div className="chart-header-title">
                  <Shield size={18} className="chart-header-icon" />
                  <h3>Security Requirements</h3>
                </div>
              </div>

              <ul className="settings-policy-list">
                <li className={newPassword.length >= 8 ? 'valid' : ''}>
                  <CheckCircle2 size={15} />
                  <span>Minimum 8 characters length</span>
                </li>
                <li className={newPassword && confirmPassword && newPassword === confirmPassword ? 'valid' : ''}>
                  <CheckCircle2 size={15} />
                  <span>Passwords match exactly</span>
                </li>
                <li className="valid">
                  <CheckCircle2 size={15} />
                  <span>Hashed securely via bcrypt algorithm</span>
                </li>
                <li className="valid">
                  <CheckCircle2 size={15} />
                  <span>Audited immutably in governance log</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
