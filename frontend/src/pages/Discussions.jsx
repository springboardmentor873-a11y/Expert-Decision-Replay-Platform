import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllDiscussions } from '../services/discussionService';
import {
  MessageSquare,
  Search,
  Layers,
  Calendar,
  Clock,
  User,
  ArrowRight,
  Loader2,
  RefreshCw,
  X,
  PlusCircle,
} from 'lucide-react';

export const Discussions = () => {
  const [discussions, setDiscussions] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDiscussions = async (query = '') => {
    setLoading(true);
    setError('');
    try {
      const data = await getAllDiscussions(null, query);
      setDiscussions(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load discussions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscussions();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDiscussions(search);
  };

  const handleClearSearch = () => {
    setSearch('');
    fetchDiscussions('');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // KPI Calculations
  const totalComments = discussions.length;
  const uniqueDecisions = new Set(discussions.map((d) => d.decision_id)).size;
  const uniqueParticipants = new Set(discussions.map((d) => d.user_name)).size;

  return (
    <div className="enterprise-page-container" style={{ padding: '2rem 2.5rem', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div style={{ padding: '6px', background: '#eff6ff', borderRadius: '8px', color: '#2563eb' }}>
              <MessageSquare size={20} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Discussions & Architectural Debates
            </h1>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
            Collaborative commentary, technical trade-offs, and rationale across all organization decisions.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => fetchDiscussions(search)}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
          <Link
            to="/decisions"
            className="btn btn-primary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Layers size={14} />
            <span>Explore Decisions</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <div className="card" style={{ padding: '1.25rem', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageSquare size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Total Comments</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0f172a' }}>{totalComments}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Layers size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Active Decisions</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0f172a' }}>{uniqueDecisions}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Contributors</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0f172a' }}>{uniqueParticipants}</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search discussion comments, decisions, or arguments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
              }}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-sm">
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="btn btn-secondary btn-sm"
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </form>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="alert alert-error" role="alert" style={{ marginBottom: '1.5rem' }}>
          <span>{error}</span>
        </div>
      )}

      {/* Discussion List */}
      {loading ? (
        <div className="card loading-state-card" style={{ minHeight: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 size={32} className="spinner-icon text-primary" />
        </div>
      ) : discussions.length === 0 ? (
        <div className="card" style={{ padding: '3.5rem 2rem', textAlign: 'center', color: '#64748b' }}>
          <MessageSquare size={40} style={{ color: '#cbd5e1', margin: '0 auto 12px' }} />
          <h3 style={{ margin: '0 0 6px', color: '#1e293b' }}>No discussions found</h3>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            {search ? 'Try clearing your search query to see all comments.' : 'No discussion comments have been posted yet.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {discussions.map((d) => (
            <div
              key={d.id}
              className="card"
              style={{
                padding: '1.25rem 1.5rem',
                background: '#ffffff',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}>
                    {d.user_name ? d.user_name[0].toUpperCase() : 'U'}
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{d.user_name}</strong>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {formatDate(d.created_at)}
                    </div>
                  </div>
                </div>

                <Link
                  to={`/decisions/${d.decision_id}`}
                  style={{
                    fontSize: '0.8rem',
                    color: '#2563eb',
                    background: '#eff6ff',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Layers size={13} />
                  <span>{d.decision_title}</span>
                  <ArrowRight size={13} />
                </Link>
              </div>

              <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {d.content}
              </p>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.625rem', display: 'flex', justifyContent: 'flex-end', fontSize: '0.8rem' }}>
                <Link
                  to={`/decisions/${d.decision_id}`}
                  style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <span>Reply in Decision Thread</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Discussions;
