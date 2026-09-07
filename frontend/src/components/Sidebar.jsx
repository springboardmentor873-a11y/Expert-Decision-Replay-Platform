import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Scale,
  LayoutDashboard,
  Layers,
  PlusCircle,
  Users,
  MessageSquare,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  X
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
    return parts.map(p => p[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleUpcomingClick = (e, featureName) => {
    e.preventDefault();
    alert(`${featureName} workspace will be available in Milestone 3.`);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} aria-hidden="true" />}

      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Sidebar Header & Brand */}
        <div className="sidebar-header">
          <NavLink to="/home" className="sidebar-brand" onClick={onClose}>
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
          <div className="sidebar-nav-group">
            <span className="nav-group-heading">MAIN MENU</span>
            <nav className="sidebar-nav-list">
              <NavLink
                to="/home"
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

              <NavLink
                to="/decisions/new"
                className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <PlusCircle size={18} />
                <span>Create Decision</span>
              </NavLink>
            </nav>
          </div>

          <div className="sidebar-nav-group">
            <span className="nav-group-heading">COLLABORATION</span>
            <nav className="sidebar-nav-list">
              <a
                href="#teams"
                className="sidebar-nav-item item-upcoming"
                onClick={(e) => handleUpcomingClick(e, 'Teams')}
                title="Teams collaboration (Milestone 3)"
              >
                <Users size={18} />
                <span>Teams</span>
                <span className="nav-upcoming-tag">M3</span>
              </a>

              <a
                href="#discussions"
                className="sidebar-nav-item item-upcoming"
                onClick={(e) => handleUpcomingClick(e, 'Discussions')}
                title="Discussions (Milestone 3)"
              >
                <MessageSquare size={18} />
                <span>Discussions</span>
                <span className="nav-upcoming-tag">M3</span>
              </a>

              <a
                href="#documents"
                className="sidebar-nav-item item-upcoming"
                onClick={(e) => handleUpcomingClick(e, 'Documents')}
                title="Documents (Milestone 3)"
              >
                <FileText size={18} />
                <span>Documents</span>
                <span className="nav-upcoming-tag">M3</span>
              </a>
            </nav>
          </div>

          <div className="sidebar-nav-group">
            <span className="nav-group-heading">SYSTEM & INSIGHTS</span>
            <nav className="sidebar-nav-list">
              <a
                href="#analytics"
                className="sidebar-nav-item item-upcoming"
                onClick={(e) => handleUpcomingClick(e, 'Analytics')}
                title="Analytics (Milestone 3)"
              >
                <BarChart3 size={18} />
                <span>Analytics</span>
                <span className="nav-upcoming-tag">M3</span>
              </a>

              <a
                href="#settings"
                className="sidebar-nav-item item-upcoming"
                onClick={(e) => handleUpcomingClick(e, 'Settings')}
                title="Settings (Milestone 3)"
              >
                <Settings size={18} />
                <span>Settings</span>
                <span className="nav-upcoming-tag">M3</span>
              </a>
            </nav>
          </div>
        </div>

        {/* Sidebar Footer: User Profile & Logout */}
        <div className="sidebar-footer">
          <div className="sidebar-user-card">
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
