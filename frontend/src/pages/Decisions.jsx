import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDecisions, submitDecision } from '../services/decisionService';
import { getCategories } from '../services/categoryService';
import { getTags } from '../services/tagService';
import { DecisionCard } from '../components/DecisionCard';
import { PlusCircle, Search, Layers, Loader2, X, Filter, Folder, Tag as TagIcon } from 'lucide-react';

export const Decisions = () => {
  const [searchParams] = useSearchParams();
  const [decisions, setDecisions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

  const { user } = useAuth();

  useEffect(() => {
    const urlQuery = searchParams.get('search');
    if (urlQuery !== null) {
      setSearchTerm(urlQuery);
    }
  }, [searchParams]);

  useEffect(() => {
    // Load categories and tags for filtering dropdowns
    async function loadTaxonomies() {
      try {
        const [catData, tagData] = await Promise.all([
          getCategories().catch(() => []),
          getTags().catch(() => []),
        ]);
        setCategories(catData || []);
        setTags(tagData || []);
      } catch (e) {
        console.warn('Could not load categories/tags:', e);
      }
    }
    loadTaxonomies();
  }, []);

  const fetchDecisionsList = async () => {
    setLoading(true);
    setError('');
    try {
      const filters = {
        status: selectedStatus === 'ALL' ? null : selectedStatus,
        search: searchTerm.trim() || null,
        categoryId: selectedCategory ? parseInt(selectedCategory, 10) : null,
        tagId: selectedTag ? parseInt(selectedTag, 10) : null,
      };
      const data = await getDecisions(filters);
      setDecisions(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch decisions list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecisionsList();
  }, [selectedStatus, selectedCategory, selectedTag]);

  const handleSubmitDecision = async (id) => {
    if (!window.confirm('Are you sure you want to submit this draft decision for review? Core fields will be locked for editing.')) {
      return;
    }

    try {
      await submitDecision(id);
      fetchDecisionsList();
    } catch (err) {
      alert(err.message || 'Failed to submit decision.');
    }
  };

  const handleClearFilters = () => {
    setSelectedStatus('ALL');
    setSelectedCategory('');
    setSelectedTag('');
    setSearchTerm('');
  };

  const statusOptions = [
    { label: 'All', value: 'ALL' },
    { label: 'Draft', value: 'Draft' },
    { label: 'Submitted', value: 'Submitted' },
    { label: 'Under Review', value: 'Under Review' },
    { label: 'Approved', value: 'Approved' },
    { label: 'Rejected', value: 'Rejected' },
    { label: 'Archived', value: 'Archived' },
  ];

  const filteredDecisions = decisions.filter((d) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      d.title.toLowerCase().includes(term) ||
      (d.problem_statement && d.problem_statement.toLowerCase().includes(term)) ||
      (d.decision_taken && d.decision_taken.toLowerCase().includes(term)) ||
      (d.reasoning && d.reasoning.toLowerCase().includes(term))
    );
  });

  const isFiltered = selectedStatus !== 'ALL' || selectedCategory !== '' || selectedTag !== '' || searchTerm.trim() !== '';

  return (
    <div className="decisions-dashboard-container">
      {/* Header Bar */}
      <div className="dashboard-header-bar">
        <div className="dashboard-title-group">
          <h1>Decision Management</h1>
          <p>Capture, evaluate, and trace organizational decisions across categories and workflows.</p>
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
          {/* Category Dropdown Filter */}
          {categories.length > 0 && (
            <div className="select-wrapper">
              <Folder size={14} className="input-leading-icon" />
              <select
                className="filter-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-label="Filter by category"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Tag Dropdown Filter */}
          {tags.length > 0 && (
            <div className="select-wrapper">
              <TagIcon size={14} className="input-leading-icon" />
              <select
                className="filter-select"
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                aria-label="Filter by tag"
              >
                <option value="">All Tags</option>
                {tags.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Search Bar */}
          <div className="search-field-wrapper">
            <Search size={16} className="input-leading-icon" />
            <input
              type="text"
              className="search-field-input"
              placeholder="Search decisions by title, problem, or rationale..."
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

export default Decisions;
