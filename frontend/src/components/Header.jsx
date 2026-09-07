import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Menu,
  Search,
  Bell,
  PlusCircle
} from 'lucide-react';

export const Header = ({ onToggleSidebar, searchQuery = '', onSearchChange = null }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/decisions?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/decisions');
    }
  };

  return (
    <header className="app-topbar">
      <div className="topbar-left">
        <button
          className="topbar-sidebar-toggle"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation sidebar"
        >
          <Menu size={22} />
        </button>

        {/* Global Search Bar */}
        <form className="topbar-search-form" onSubmit={handleSearchSubmit}>
          <Search size={17} className="search-icon" />
          <input
            type="text"
            className="topbar-search-input"
            placeholder="Search decisions, problems, tags..."
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          />
        </form>
      </div>

      <div className="topbar-right">
        {/* Notifications Icon with Indicator */}
        <button
          className="topbar-icon-btn"
          title="Notifications"
          onClick={() => alert('Notifications will be available in Milestone 3.')}
          aria-label="View notifications"
        >
          <Bell size={19} />
          <span className="notification-dot" />
        </button>

        {/* Primary "+ New Decision" CTA */}
        <Link to="/decisions/new" className="btn btn-primary btn-sm topbar-cta-btn">
          <PlusCircle size={16} />
          <span>New Decision</span>
        </Link>
      </div>
    </header>
  );
};
