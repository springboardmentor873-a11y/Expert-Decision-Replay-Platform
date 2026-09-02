import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Scale, Home, Layers, PlusCircle, LogOut, Menu, X } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <NavLink to="/home" className="navbar-brand">
            <div className="brand-icon-box">
              <Scale size={20} strokeWidth={2.4} />
            </div>
            <span className="brand-title">Expert Decision Replay</span>
            <span className="brand-tag">EDRP</span>
          </NavLink>

          {user && (
            <nav className="navbar-nav-links desktop-only-nav">
              <NavLink
                to="/home"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <Home size={16} />
                <span>Home</span>
              </NavLink>
              <NavLink
                to="/decisions"
                end
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <Layers size={16} />
                <span>Decisions</span>
              </NavLink>
              <NavLink
                to="/decisions/new"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <PlusCircle size={16} />
                <span>+ New Decision</span>
              </NavLink>
            </nav>
          )}
        </div>

        {user && (
          <div className="navbar-right-cluster">
            <div className="navbar-user desktop-only-nav">
              <div className="user-profile-summary">
                <div className="user-avatar">
                  {getInitials(user.full_name)}
                </div>
                <div className="user-text-info">
                  <span className="user-name">{user.full_name}</span>
                  <span className={getRoleBadgeClass(user.role?.name)}>
                    {user.role?.name || 'Employee'}
                  </span>
                </div>
              </div>

              <button
                className="btn-signout"
                onClick={handleLogout}
                title="Sign out of your account"
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>

            {/* Mobile Menu Toggle Button */}
            <button
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        )}
      </div>

      {/* Mobile Navigation Drawer */}
      {user && mobileMenuOpen && (
        <div className="mobile-nav-drawer">
          <div className="mobile-user-header">
            <div className="user-avatar">
              {getInitials(user.full_name)}
            </div>
            <div className="user-text-info">
              <span className="user-name">{user.full_name}</span>
              <span className={getRoleBadgeClass(user.role?.name)}>
                {user.role?.name || 'Employee'}
              </span>
            </div>
          </div>

          <nav className="mobile-nav-links-list">
            <NavLink
              to="/home"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Home size={18} />
              <span>Home</span>
            </NavLink>
            <NavLink
              to="/decisions"
              end
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Layers size={18} />
              <span>Decisions</span>
            </NavLink>
            <NavLink
              to="/decisions/new"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <PlusCircle size={18} />
              <span>+ New Decision</span>
            </NavLink>
            <button
              className="btn btn-secondary btn-sm mobile-signout-btn"
              onClick={handleLogout}
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};
