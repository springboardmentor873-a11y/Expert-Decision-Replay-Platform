import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Brain, Home, Users, FileText, BookOpen, MessageSquare, Search, BarChart2, HelpCircle, LogOut } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Home', path: '/dashboard', icon: Home },
    { name: 'My Teams', path: '/teams', icon: Users },
    { name: 'My Decisions', path: '/my-decisions', icon: FileText },
    { name: 'Team Decisions', path: '/team-decisions', icon: FileText },
    { name: 'Knowledge Repository', path: '/knowledge', icon: BookOpen },
    { name: 'Discussions', path: '/discussions', icon: MessageSquare },
    { name: 'Search', path: '/search', icon: Search },
    { name: 'Insights', path: '/reports', icon: BarChart2 },
  ];

  return (
    <aside className="w-64 bg-[#1E293B] text-slate-300 flex flex-col fixed left-0 top-0 bottom-0 shadow-xl z-20">
      {/* Logo */}
      <div className="h-24 flex flex-col justify-center px-6 border-b border-white/5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 flex items-center justify-center">
            <Brain className="w-8 h-8 text-blue-500" />
          </div>
          <div>
            <h1 className="font-bold text-white text-xl leading-tight">DecisioHub</h1>
            <p className="text-[11px] text-slate-400 font-medium tracking-wide">Learn from Decisions</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600/20 text-blue-500 font-semibold border-l-4 border-blue-500 rounded-l-none'
                  : 'hover:bg-white/5 text-slate-400 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-sm font-medium">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer Navigation (Help & Logout) */}
      <div className="p-4 border-t border-white/5 space-y-1">
        <button className="w-full flex items-center gap-4 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
          <HelpCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Help & Support</span>
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
