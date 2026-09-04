import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Brain, LayoutDashboard, User, Users, FileText, PlayCircle, LogOut } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'My Profile', path: '/profile', icon: User },
    { name: 'Teams', path: '/teams', icon: Users },
    { name: 'Decisions', path: '/decisions', icon: FileText },
    { name: 'Decision Replay', path: '/replay', icon: PlayCircle },
  ];

  return (
    <aside className="w-64 bg-sidebar text-slate-300 flex flex-col fixed left-0 top-0 bottom-0 shadow-xl z-20">
      {/* Logo */}
      <div className="h-24 flex flex-col justify-center px-6 border-b border-white/5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center shadow-lg shadow-brand/20">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-md leading-tight">Expert Decision</h1>
            <p className="text-[10px] text-slate-400">Replay Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-8 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-brand text-white font-semibold shadow-lg shadow-brand/30'
                  : 'hover:bg-white/5 text-slate-400 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-sm">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-white/5">
        {user && (
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center font-bold text-lg shadow-md shadow-brand/20">
              {user.full_name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-white text-sm truncate">
                {user.full_name}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {user.role === 'EMPLOYEE' ? 'Employee' : user.role}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors border border-white/10"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
