import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Scale, ShieldCheck, Users, RotateCcw, Mail, Lock, User, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';

export const Register = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'Employee'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleSelect = (roleName) => {
    setFormData((prev) => ({ ...prev, role: roleName }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    setLoading(true);

    try {
      await register(formData);
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Failed to register account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { name: 'Employee', desc: 'Create and submit draft decisions' },
    { name: 'Reviewer', desc: 'Analyze alternatives and review' },
    { name: 'Manager', desc: 'Evaluate and approve decisions' },
    { name: 'Administrator', desc: 'Full system and user governance' }
  ];

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card-container">
        {/* Left Brand Panel */}
        <aside className="auth-brand-panel">
          <div className="brand-header-group">
            <div className="brand-logo-badge">
              <div className="brand-icon-hero">
                <Scale size={28} strokeWidth={2.3} />
              </div>
              <h2 className="brand-hero-title">Expert Decision Replay</h2>
            </div>
            <p className="brand-hero-desc">
              Join your organization's decision intelligence hub to capture rationale and learn from outcomes.
            </p>
          </div>

          <div className="auth-features-list">
            <div className="auth-feature-item">
              <div className="feature-icon-wrapper">
                <ShieldCheck size={20} />
              </div>
              <div className="feature-text-block">
                <h4>Secure & Reliable</h4>
                <p>Protect critical organizational decisions with enterprise encryption.</p>
              </div>
            </div>

            <div className="auth-feature-item">
              <div className="feature-icon-wrapper">
                <Users size={20} />
              </div>
              <div className="feature-text-block">
                <h4>Role-Based Access</h4>
                <p>Granular governance for Employees, Reviewers, Managers & Admins.</p>
              </div>
            </div>

            <div className="auth-feature-item">
              <div className="feature-icon-wrapper">
                <RotateCcw size={20} />
              </div>
              <div className="feature-text-block">
                <h4>Track & Replay</h4>
                <p>Capture deep decision reasoning and replay context for institutional learning.</p>
              </div>
            </div>
          </div>

          <div className="brand-footer-note">
            Enterprise Decision Intelligence Platform • Version 0.2.0
          </div>
        </aside>

        {/* Right Form Panel */}
        <main className="auth-form-panel">
          <div className="auth-form-header">
            <div className="auth-form-icon-pill">
              <User size={22} />
            </div>
            <h1 className="auth-title">Create an Account</h1>
            <p className="auth-subtitle">Get started with the Decision Replay Platform.</p>
          </div>

          {error && (
            <div className="alert alert-error" role="alert">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="reg-name">Full Name</label>
              <div className="input-with-icon">
                <User size={18} className="input-leading-icon" />
                <input
                  id="reg-name"
                  type="text"
                  name="full_name"
                  className="form-input-styled"
                  placeholder="e.g. Alice Johnson"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-email">Work Email</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-leading-icon" />
                <input
                  id="reg-email"
                  type="email"
                  name="email"
                  className="form-input-styled"
                  placeholder="e.g. alice@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-password">Password</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-leading-icon" />
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="form-input-styled"
                  placeholder="Minimum 8 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  className="input-trailing-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Select Organizational Role</label>
              <div className="role-select-grid">
                {roles.map((r) => (
                  <div
                    key={r.name}
                    className={`role-radio-card ${formData.role === r.name ? 'selected' : ''}`}
                    onClick={() => handleRoleSelect(r.name)}
                  >
                    <span className="role-card-title">{r.name}</span>
                    <span className="role-card-desc">{r.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="spinner-icon" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="auth-footer-prompt">
            Already have an account?
            <Link to="/login" className="auth-link">
              Sign In
            </Link>
          </p>
        </main>
      </div>
    </div>
  );
};
