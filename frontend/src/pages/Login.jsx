import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Scale, ShieldCheck, Users, RotateCcw, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, UserCheck, CheckSquare, Crown, Shield } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      await login({ email: cleanEmail, password });
      navigate('/home');
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

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
              Capture, store, review, and replay critical expert decisions across your organization.
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
              <Lock size={22} />
            </div>
            <h1 className="auth-title">Welcome Back!</h1>
            <p className="auth-subtitle">Sign in to continue to your account.</p>
          </div>

          {error && (
            <div className="alert alert-error" role="alert">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="login-email">Email Address</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-leading-icon" />
                <input
                  id="login-email"
                  type="email"
                  className="form-input-styled"
                  placeholder="Enter your work email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="login-password">Password</label>
              </div>
              <div className="input-with-icon">
                <Lock size={18} className="input-leading-icon" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input-styled"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="spinner-icon" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Quick Role Selection Strip */}
          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>
                Quick Login
              </span>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Select role to populate fields</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.625rem' }}>
              {[
                { role: 'Employee', email: 'nithin.kumar@example.com', icon: UserCheck, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
                { role: 'Reviewer', email: 'rahul.sharma@example.com', icon: CheckSquare, color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
                { role: 'Manager', email: 'priya.reddy@example.com', icon: Crown, color: '#7c3aed', bg: '#ede9fe', border: '#ddd6fe' },
                { role: 'Administrator', email: 'arjun.mehta@example.com', icon: Shield, color: '#16a34a', bg: '#dcfce7', border: '#bbf7d0' },
              ].map(({ role: roleName, email: roleEmail, icon: RoleIcon, color, bg, border }) => (
                <button
                  key={roleName}
                  type="button"
                  onClick={() => {
                    setEmail(roleEmail);
                    setPassword('Demo@123');
                    setError('');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px 14px',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    color: '#334155',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = border;
                    e.currentTarget.style.background = bg;
                    e.currentTarget.style.color = color;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.color = '#334155';
                  }}
                >
                  <RoleIcon size={16} style={{ color }} />
                  <span>{roleName}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="auth-footer-prompt">
            Don't have an account?
            <Link to="/register" className="auth-link">
              Create an account
            </Link>
          </p>
        </main>
      </div>
    </div>
  );
};
