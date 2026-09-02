import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDecisions, submitDecision } from '../services/decisionService';
import { DecisionCard } from '../components/DecisionCard';
import { PlusCircle, Search, Layers, Loader2, X, Filter } from 'lucide-react';

export const Decisions = () => {
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const { user } = useAuth();

  const fetchDecisionsList = async (statusFilter) => {
    setLoading(true);
    setError('');
    try {
      const data = await getDecisions(statusFilter === 'ALL' ? null : statusFilter);
      setDecisions(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch decisions list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecisionsList(selectedStatus);
  }, [selectedStatus]);

  const handleSubmitDecision = async (id) => {
    if (!window.confirm('Are you sure you want to submit this draft decision for review? Core fields will be locked for editing.')) {
      return;
    }

    try {
      await submitDecision(id);
      fetchDecisionsList(selectedStatus);
    } catch (err) {
      alert(err.message || 'Failed to submit decision.');
    }
  };

  const handleClearFilters = () => {
    setSelectedStatus('ALL');
    setSearchTerm('');
  };

  const statusOptions = [
    { label: 'All', value: 'ALL' },
    { label: 'Draft', value: 'Draft' },
    { label: 'Submitted', value: 'Submitted' },
    { label: 'Under Review', value: 'Under Review' },
    { label: 'Approved', value: 'Approved' },
    { label: 'Rejected', value: 'Rejected' },
  ];

  const filteredDecisions = decisions.filter((d) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      d.title.toLowerCase().includes(term) ||
      d.problem_statement.toLowerCase().includes(term) ||
      d.decision_taken.toLowerCase().includes(term)
    );
  });

  const isFiltered = selectedStatus !== 'ALL' || searchTerm.trim() !== '';

  return (
    <div className="decisions-dashboard-container">
      {/* Header Bar */}
      <div className="dashboard-header-bar">
        <div className="dashboard-title-group">
          <h1>Decision Management</h1>
          <p>Capture and manage organizational decisions.</p>
        </div>

        <Link to="/decisions/new" className="btn btn-primary btn-lg">
          <PlusCircle size={18} />
          <span>+ New Decision</span>
        </Link>
      </div>

      {/* Filter / Search Toolbar */}
      <div className="filter-control-panel">
        <div className="status-pills-row">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              className={`status-filter-pill ${selectedStatus === opt.value ? 'active' : ''}`}
              onClick={() => setSelectedStatus(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <div className="search-field-wrapper">
            <Search size={16} className="input-leading-icon" />
            <input
              type="text"
              className="search-field-input"
              placeholder="Search decisions by title or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="input-trailing-btn"
                onClick={() => setSearchTerm('')}
                title="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {isFiltered && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleClearFilters}
              title="Reset all filters and search"
            >
              <Filter size={14} />
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          <span>{error}</span>
        </div>
      )}

      {/* Decisions Cards Grid */}
      {loading ? (
        <div className="card loading-state-card">
          <Loader2 size={36} className="spinner-icon text-primary" />
          <span>Loading decisions...</span>
        </div>
      ) : filteredDecisions.length === 0 ? (
        <div className="empty-state-card">
          <div className="empty-state-icon">
            <Layers size={32} />
          </div>
          <h3>No decisions found</h3>
          <p>
            {searchTerm
              ? `No decisions matching "${searchTerm}". Try adjusting your search query or status filter.`
              : selectedStatus !== 'ALL'
              ? `No decisions currently in "${selectedStatus}" status.`
              : 'No decisions recorded yet. Click below to capture your first decision.'}
          </p>
          <Link to="/decisions/new" className="btn btn-primary">
            <PlusCircle size={16} />
            <span>Create New Decision</span>
          </Link>
        </div>
      ) : (
        <div className="decisions-cards-grid">
          {filteredDecisions.map((decision) => (
            <DecisionCard
              key={decision.id}
              decision={decision}
              currentUser={user}
              onSubmitDecision={handleSubmitDecision}
            />
          ))}
        </div>
      )}
    </div>
  );
};
