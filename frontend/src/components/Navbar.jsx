import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Brain, LogOut } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Don't render the default navbar on Dashboard, Login, or Register, since they have their own layouts or fullscreen designs
  if (['/dashboard', '/login', '/register'].includes(location.pathname)) {
    return null;
  }

  return (
    <nav className="fixed w-full z-50 top-0 transition-all duration-300 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center shadow-md shadow-brand/20 group-hover:shadow-brand/40 transition-all duration-300">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">Expert Decision</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm font-semibold text-slate-600 hover:text-brand transition-colors">Home</Link>
            <a href="#features" className="text-sm font-semibold text-slate-600 hover:text-brand transition-colors">Features</a>
            <a href="#about" className="text-sm font-semibold text-slate-600 hover:text-brand transition-colors">About</a>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link 
                  to="/dashboard"
                  className="hidden sm:block text-sm font-semibold text-slate-700 hover:text-brand transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="btn-danger"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-semibold text-slate-700 hover:text-brand transition-colors mr-2"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn-primary"
                >
                  Create New Account
                </Link>
              </>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
