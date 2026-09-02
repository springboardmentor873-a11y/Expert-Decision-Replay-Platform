import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Scale, ShieldCheck, Users, RotateCcw, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';

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
