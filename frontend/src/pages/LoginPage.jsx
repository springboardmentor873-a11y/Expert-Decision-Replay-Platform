import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Shield, User, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail, demoPwd) => {
    setEmail(demoEmail);
    setPassword(demoPwd);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Background Subtle Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="w-12 h-12 rounded-xl bg-blue-600 mx-auto flex items-center justify-center text-white shadow-lg shadow-blue-500/25 mb-4">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Expert Decision Replay Platform
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Organizational Knowledge & Strategic Decision Intelligence
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-slate-900 py-8 px-4 shadow-2xl rounded-2xl sm:px-10 border border-slate-800">
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center gap-2.5 text-xs text-rose-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-sm pl-9 pr-3 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="????????"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-sm pl-9 pr-3 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg text-sm font-semibold transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In to Workspace'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3 text-center">
              Quick Demo Accounts (Click to Fill)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@edrp.org', 'Password123!')}
                className="p-2 rounded-lg bg-slate-950/70 border border-purple-500/30 hover:border-purple-500 text-left transition-colors text-xs"
              >
                <span className="block font-bold text-purple-400">Administrator</span>
                <span className="text-[10px] text-slate-400">admin@edrp.org</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('manager@edrp.org', 'Password123!')}
                className="p-2 rounded-lg bg-slate-950/70 border border-blue-500/30 hover:border-blue-500 text-left transition-colors text-xs"
              >
                <span className="block font-bold text-blue-400">Manager</span>
                <span className="text-[10px] text-slate-400">manager@edrp.org</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('reviewer@edrp.org', 'Password123!')}
                className="p-2 rounded-lg bg-slate-950/70 border border-amber-500/30 hover:border-amber-500 text-left transition-colors text-xs"
              >
                <span className="block font-bold text-amber-400">Reviewer</span>
                <span className="text-[10px] text-slate-400">reviewer@edrp.org</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('employee@edrp.org', 'Password123!')}
                className="p-2 rounded-lg bg-slate-950/70 border border-emerald-500/30 hover:border-emerald-500 text-left transition-colors text-xs"
              >
                <span className="block font-bold text-emerald-400">Employee</span>
                <span className="text-[10px] text-slate-400">employee@edrp.org</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <span className="text-xs text-slate-400">Need a new account? </span>
            <Link to="/register" className="text-xs text-blue-400 hover:text-blue-300 font-semibold">
              Register as Employee
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
