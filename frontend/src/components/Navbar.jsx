import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
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

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <span className="brand-icon">⚖</span>
          <span className="brand-title">Expert Decision Replay Platform</span>
        </div>

        {user && (
          <div className="navbar-user">
            <div className="user-details">
              <span className="user-name">{user.full_name}</span>
              <span className={getRoleBadgeClass(user.role?.name)}>
                {user.role?.name || 'User'}
              </span>
            </div>
            <button className="btn-logout" onClick={handleLogout} title="Sign Out">
              Sign Out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};