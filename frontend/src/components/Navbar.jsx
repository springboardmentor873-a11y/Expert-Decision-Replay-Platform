import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RoleBadge } from './RoleBadge';
import { 
  ShieldCheck, 
  Users, 
  LayoutDashboard, 
  LogOut, 
  Sparkles,
  Layers,
  Building2
} from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
                <Layers className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-base font-bold text-white tracking-tight">
                  Decision<span className="text-brand-400">Replay</span>
                </span>
                <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-semibold tracking-wider text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/50">
                  M1 Platform
                </span>
              </div>
            </Link>

            {/* Navigation Links */}
            {user && (
              <nav className="hidden md:flex items-center space-x-1">
                <Link
                  to="/dashboard"
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    isActive('/dashboard')
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>

                <Link
                  to="/decisions"
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    isActive('/decisions') || location.pathname.startsWith('/decisions/')
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Layers className="h-4 w-4" />
                  Decisions
                </Link>

                <Link
                  to="/teams"
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    isActive('/teams')
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                  Teams
                </Link>

                {user.role === 'ADMINISTRATOR' && (
                  <Link
                    to="/admin/users"
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      isActive('/admin/users')
                        ? 'bg-slate-800 text-brand-400'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <Users className="h-4 w-4" />
                    User & Role Admin
                  </Link>
                )}
              </nav>
            )}
          </div>

          {/* User Profile & Actions */}
          {user ? (
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-200">{user.full_name}</span>
                  <RoleBadge role={user.role} size="sm" />
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  {user.team ? (
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3 text-slate-500" />
                      {user.team.name}
                    </span>
                  ) : (
                    <span>No Team Assigned</span>
                  )}
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30 transition-all"
                title="Sign Out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-brand-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-brand-500 transition-colors shadow-sm shadow-brand-500/25"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
