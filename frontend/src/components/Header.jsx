import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { searchDecisions } from '../services/decisionService';
import {
  Menu,
  Search,
  PlusCircle,
  X,
  Loader2,
  FileText,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import NotificationBell from './notifications/NotificationBell';
import { DecisionStatusBadge } from './DecisionStatusBadge';

export const Header = ({ onToggleSidebar }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const containerRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Debounced search effect
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      setError('');
      return;
    }

    setLoading(true);
    setError('');

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const data = await searchDecisions(trimmed, 6);
        setResults(data);
        setShowDropdown(true);
      } catch (err) {
        setError(err.message || 'Search failed');
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  // Close dropdown on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setShowDropdown(false);
    if (query.trim()) {
      navigate('/decisions?search=' + encodeURIComponent(query.trim()));
    } else {
      navigate('/decisions');
    }
  };

  const handleSelectDecision = (id) => {
    setShowDropdown(false);
    setQuery('');
    navigate('/decisions/' + id);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setShowDropdown(false);
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

        {/* Global Search Bar with Live Results Dropdown */}
        <div className="topbar-search-container" ref={containerRef}>
          <form className="topbar-search-form" onSubmit={handleSearchSubmit}>
            <Search size={17} className="search-icon" />
            <input
              type="text"
              className="topbar-search-input"
              placeholder="Search decisions by title, problem, or status..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => {
                if (query.trim().length >= 2) setShowDropdown(true);
              }}
              aria-label="Search decisions"
            />
            {loading ? (
              <Loader2 size={16} className="search-status-spinner" />
            ) : query ? (
              <button
                type="button"
                className="search-clear-btn"
                onClick={handleClear}
                aria-label="Clear search input"
              >
                <X size={15} />
              </button>
            ) : null}
          </form>

          {/* Interactive Live Search Dropdown */}
          {showDropdown && query.trim().length >= 2 && (
            <div className="search-dropdown-menu">
              {loading && results.length === 0 ? (
                <div className="search-dropdown-loading">
                  <Loader2 size={18} className="spinner-icon text-primary" />
                  <span>Searching decisions across title, problem, and context...</span>
                </div>
              ) : error ? (
                <div className="search-dropdown-error">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              ) : results.length === 0 ? (
                <div className="search-dropdown-empty">
                  <p>No decisions match "<strong>{query.trim()}</strong>"</p>
                  <small>Try searching by keywords, status (e.g., Approved), or context.</small>
                </div>
              ) : (
                <div className="search-dropdown-results-list">
                  <div className="search-dropdown-header">
                    <span>Decisions ({results.length})</span>
                    <button
                      type="button"
                      className="search-view-all-btn"
                      onClick={handleSearchSubmit}
                    >
                      View all results &rarr;
                    </button>
                  </div>
                  {results.map((d) => (
                    <div
                      key={d.id}
                      className="search-result-item"
                      onClick={() => handleSelectDecision(d.id)}
                    >
                      <div className="search-result-leading">
                        <FileText size={18} className="search-result-icon" />
                      </div>
                      <div className="search-result-body">
                        <div className="search-result-title-row">
                          <span className="search-result-title">{d.title}</span>
                          <DecisionStatusBadge status={d.status} />
                        </div>
                        <p className="search-result-snippet">
                          {d.problem_statement || d.context || 'No problem statement recorded.'}
                        </p>
                      </div>
                      <ChevronRight size={16} className="search-result-arrow" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="topbar-right">
        {/* Real-time In-App Notification Bell */}
        <NotificationBell />

        {/* Primary "+ New Decision" CTA */}
        <Link to="/decisions/new" className="btn btn-primary btn-sm topbar-cta-btn">
          <PlusCircle size={16} />
          <span>New Decision</span>
        </Link>
      </div>
    </header>
  );
};

export default Header;
