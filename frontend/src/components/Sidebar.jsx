import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Scale,
  LayoutDashboard,
  Layers,
  PlusCircle,
  Users,
  BarChart3,
  Settings,
  LogOut,
  X,
  Bell,
  Shield,
  BookOpen,
  CheckSquare,
  UserCheck,
  MessageSquare,
  FileText,
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
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

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    return parts.map((p) => p[0]).join('').substring(0, 2).toUpperCase();
  };

  const role = user?.role?.name?.toLowerCase();
  const isEmployee = role === 'employee';
  const isReviewer = role === 'reviewer';
  const isManager = role === 'manager';
  const isAdmin = role === 'administrator';

  // Role-based visibility flags per specification
  const showCreateDecision = isEmployee || isManager || isAdmin;
  const showPendingApprovals = isReviewer || isAdmin;
  const showMyTeam = isEmployee || isReviewer || isManager;
  const showTeams = isManager || isAdmin;
  const showAuditLogs = isAdmin;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} aria-hidden="true" />}

      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Sidebar Header & Brand */}
        <div className="sidebar-header">
          <NavLink to="/dashboard" className="sidebar-brand" onClick={onClose}>
            <div className="brand-icon-box">
              <Scale size={20} strokeWidth={2.4} />
            </div>
            <div className="brand-text-block">
              <span className="brand-title">Decision Replay</span>
              <span className="brand-subtitle">Enterprise Platform</span>
            </div>
          </NavLink>

          <button
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Close navigation sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="sidebar-content">
          {/* GROUP 1: WORKSPACE */}
          <div className="sidebar-nav-group">
            <span className="nav-group-heading">WORKSPACE</span>
            <nav className="sidebar-nav-list">
              <NavLink
                to="/dashboard"
                className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </NavLink>

              <NavLink
                to="/decisions"
                end
                className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <Layers size={18} />
                <span>Decisions</span>
              </NavLink>

              {showCreateDecision && (
                <NavLink
                  to="/decisions/new"
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={onClose}
                >
                  <PlusCircle size={18} />
                  <span>Create Decision</span>
                </NavLink>
              )}

              {showPendingApprovals && (
                <NavLink
                  to="/approvals/pending"
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={onClose}
                >
                  <CheckSquare size={18} />
                  <span>Pending Approvals</span>
                </NavLink>
              )}
            </nav>
          </div>

          {/* GROUP 2: COLLABORATION */}
          <div className="sidebar-nav-group">
            <span className="nav-group-heading">COLLABORATION</span>
            <nav className="sidebar-nav-list">
              {showMyTeam && (
                <NavLink
                  to="/my-team"
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={onClose}
                >
                  <UserCheck size={18} />
                  <span>My Team</span>
                </NavLink>
              )}

              {showTeams && (
                <NavLink
                  to="/teams"
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={onClose}
                >
                  <Users size={18} />
                  <span>Teams</span>
                </NavLink>
              )}

              <NavLink
                to="/discussions"
                className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <MessageSquare size={18} />
                <span>Discussions</span>
              </NavLink>

              <NavLink
                to="/documents"
                className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <FileText size={18} />
                <span>Documents</span>
              </NavLink>
            </nav>
          </div>

          {/* GROUP 3: KNOWLEDGE */}
          <div className="sidebar-nav-group">
            <span className="nav-group-heading">KNOWLEDGE</span>
            <nav className="sidebar-nav-list">
              <NavLink
                to="/knowledge-repository"
                className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <BookOpen size={18} />
                <span>Knowledge Repository</span>
              </NavLink>
            </nav>
          </div>

          {/* GROUP 4: ANALYTICS */}
          <div className="sidebar-nav-group">
            <span className="nav-group-heading">ANALYTICS</span>
            <nav className="sidebar-nav-list">
              <NavLink
                to="/reports"
                className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <BarChart3 size={18} />
                <span>Reports & Analytics</span>
              </NavLink>

              {showAuditLogs && (
                <NavLink
                  to="/audit-logs"
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={onClose}
                >
                  <Shield size={18} />
                  <span>Audit Logs</span>
                </NavLink>
              )}
            </nav>
          </div>

          {/* GROUP 5: ACCOUNT */}
          <div className="sidebar-nav-group">
            <span className="nav-group-heading">ACCOUNT</span>
            <nav className="sidebar-nav-list">
              <NavLink
                to="/notifications"
                className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <Bell size={18} />
                <span>Notifications</span>
              </NavLink>

              <NavLink
                to="/settings"
                className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <Settings size={18} />
                <span>Settings</span>
              </NavLink>
            </nav>
          </div>
        </div>

        {/* Sidebar Footer: User Profile, Settings Shortcut & Logout */}
        <div className="sidebar-footer">
          <div className="sidebar-user-card">
            <div
              className="sidebar-user-clickable"
              onClick={() => {
                navigate('/settings');
                onClose && onClose();
              }}
              title="View Account & Profile Settings"
            >
              <div className="user-avatar">
                {getInitials(user?.full_name)}
              </div>
              <div className="sidebar-user-meta">
                <span className="sidebar-user-name" title={user?.full_name}>
                  {user?.full_name || 'User'}
                </span>
                <span className={getRoleBadgeClass(user?.role?.name)}>
                  {user?.role?.name || 'Employee'}
                </span>
              </div>
            </div>

            <button
              className="sidebar-settings-btn"
              onClick={() => {
                navigate('/settings');
                onClose && onClose();
              }}
              title="Account Settings"
              aria-label="Account Settings"
            >
              <Settings size={16} />
            </button>

            <button
              className="sidebar-logout-btn"
              onClick={handleLogout}
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
