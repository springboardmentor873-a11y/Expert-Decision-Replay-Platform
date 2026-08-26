import React from 'react';
import { useAuth } from '../context/AuthContext';

export const Home = () => {
  const { user } = useAuth();

  const roleDescriptions = {
    Employee: 'Can create and submit decision tracks and context notes for peer review.',
    Reviewer: 'Can evaluate decision rationale, review alternatives, and provide expert feedback.',
    Manager: 'Can review, approve, override, and finalize decision lifecycle stages.',
    Administrator: 'Full platform governance, user management, and role assignment capabilities.',
  };

  const currentRole = user?.role?.name || 'Employee';

  return (
    <div className="home-container">
      <div className="hero-banner">
        <h1>Expert Decision Replay Platform</h1>
        <p className="hero-subtitle">
          Authentication and User Management are successfully configured.
        </p>
      </div>

      <div className="dashboard-grid">
        <div className="card profile-card">
          <div className="card-header">
            <h3>User Profile</h3>
            <span className={`status-pill ${user?.is_active ? 'active' : 'inactive'}`}>
              {user?.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div className="profile-details">
            <div className="profile-row">
              <span className="label">Full Name:</span>
              <span className="value font-medium">{user?.full_name}</span>
            </div>
            <div className="profile-row">
              <span className="label">Email Address:</span>
              <span className="value">{user?.email}</span>
            </div>
            <div className="profile-row">
              <span className="label">Assigned Role:</span>
              <span className="value">
                <span className={`role-tag role-${currentRole.toLowerCase()}`}>
                  {currentRole}
                </span>
              </span>
            </div>
            <div className="profile-row">
              <span className="label">Account Status:</span>
              <span className="value text-success font-medium">Active & Verified</span>
            </div>
          </div>
        </div>

        <div className="card role-card">
          <div className="card-header">
            <h3>Role Capabilities</h3>
          </div>
          <div className="role-description-box">
            <h4>{currentRole} Permissions</h4>
            <p>{roleDescriptions[currentRole] || 'Standard platform access.'}</p>
          </div>
          <div className="milestone-note">
            <p>
              🔒 <strong>JWT Authentication Active:</strong> Protected route and API requests are
              secured via signed JSON Web Tokens with Role-Based Access Control.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};