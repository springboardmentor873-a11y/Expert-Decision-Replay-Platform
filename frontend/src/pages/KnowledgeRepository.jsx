import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  searchKnowledgeRepository,
  getKnowledgeTimeline,
  getKnowledgeDocuments,
} from '../services/knowledgeRepositoryService';
import { getCategories } from '../services/categoryService';
import { getTags } from '../services/tagService';
import { downloadDocument } from '../services/documentService';
import { DecisionStatusBadge } from '../components/DecisionStatusBadge';
import {
  BookOpen,
  Search,
  Folder,
  Tag as TagIcon,
  Filter,
  Calendar,
  Layers,
  Paperclip,
  Activity,
  ArrowRight,
  Download,
  Loader2,
  Sparkles,
  Users,
  X,
  FileText,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export const KnowledgeRepository = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'timeline' | 'documents'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);

  // Data states
  const [results, setResults] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initial load of categories and tags
  useEffect(() => {
    async function loadFilters() {
      try {
        const [catData, tagData] = await Promise.all([
          getCategories().catch(() => []),
          getTags().catch(() => []),
        ]);
        setCategories(catData || []);
        setTags(tagData || []);
      } catch (err) {
        console.warn('Could not load taxonomies:', err);
      }
    }
    loadFilters();
  }, []);

  // Fetch data based on active tab
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        if (activeTab === 'catalog') {
          const data = await searchKnowledgeRepository({
            query: searchQuery.trim() || undefined,
            category_id: selectedCategory ? parseInt(selectedCategory, 10) : undefined,
            tag: selectedTag || undefined,
            status: selectedStatus === 'ALL' ? undefined : selectedStatus,
          });
          setResults(data?.results || []);
        } else if (activeTab === 'timeline') {
          const events = await getKnowledgeTimeline(50);
          setTimeline(events || []);
        } else if (activeTab === 'documents') {
          const docs = await getKnowledgeDocuments(100);
          setDocuments(docs || []);
        }
      } catch (err) {
        setError(err.message || 'Failed to load knowledge repository data.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [activeTab, selectedCategory, selectedTag, selectedStatus]);

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (activeTab !== 'catalog') setActiveTab('catalog');
    setLoading(true);
    setError('');
    try {
      const data = await searchKnowledgeRepository({
        query: searchQuery.trim() || undefined,
        category_id: selectedCategory ? parseInt(selectedCategory, 10) : undefined,
        tag: selectedTag || undefined,
        status: selectedStatus === 'ALL' ? undefined : selectedStatus,
      });
      setResults(data?.results || []);
    } catch (err) {
      setError(err.message || 'Search failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedTag('');
    setSelectedStatus('ALL');
  };

  const handleDownloadDoc = async (doc) => {
    try {
      await downloadDocument(doc.decision_id, doc.id, doc.file_name);
    } catch (err) {
      alert('Failed to download document: ' + (err.message || ''));
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isFiltered = searchQuery.trim() !== '' || selectedCategory !== '' || selectedTag !== '' || selectedStatus !== 'ALL';

  return (
    <div className="knowledge-repo-container">
      {/* Page Header */}
      <div className="dashboard-header-bar">
        <div className="dashboard-title-group">
          <h1>
            <BookOpen size={24} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle', color: 'var(--primary-600)' }} />
            Knowledge Repository
          </h1>
          <p>
            Institutional memory and searchable archive of architectural decisions, justifications, and historical artifacts.
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="workspace-tabs-nav" style={{ marginBottom: '1.25rem' }}>
        <button
          type="button"
          className={`workspace-tab-btn ${activeTab === 'catalog' ? 'active' : ''}`}
          onClick={() => setActiveTab('catalog')}
        >
          <Layers size={16} />
          <span>Decision Catalog</span>
          <span className="tab-badge">{results.length}</span>
        </button>

        <button
          type="button"
          className={`workspace-tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('timeline')}
        >
          <Clock size={16} />
          <span>Organizational Timeline</span>
        </button>

        <button
          type="button"
          className={`workspace-tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          <Paperclip size={16} />
          <span>Document Archive</span>
          <span className="tab-badge">{documents.length}</span>
        </button>
      </div>

      {/* Filter / Search Bar (Relevant on Catalog tab) */}
      {activeTab === 'catalog' && (
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="search-field-wrapper" style={{ width: '100%' }}>
              <Search size={18} className="input-leading-icon" />
              <input
                type="text"
                className="search-field-input"
                style={{ fontSize: '1rem', padding: '0.65rem 0.75rem 0.65rem 2.5rem' }}
                placeholder="Search across title, context, problem, rationale, decision taken, and outcomes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="input-trailing-btn"
                  onClick={() => setSearchQuery('')}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              {/* Category Filter */}
              <div className="select-wrapper">
                <Folder size={14} className="input-leading-icon" />
                <select
                  className="filter-select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Tag Filter */}
              <div className="select-wrapper">
                <TagIcon size={14} className="input-leading-icon" />
                <select
                  className="filter-select"
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                >
                  <option value="">All Tags</option>
                  {tags.map((t) => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <select
                className="filter-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Submitted">Submitted</option>
                <option value="Under Review">Under Review</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Archived">Archived</option>
              </select>

              <button type="submit" className="btn btn-primary btn-sm">
                <Search size={14} /> Search Repository
              </button>

              {isFiltered && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleClearFilters}
                >
                  <Filter size={14} /> Clear Filters
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {error && (
        <div className="alert alert-error" role="alert" style={{ marginBottom: '1.25rem' }}>
          <span>{error}</span>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="card loading-state-card" style={{ minHeight: '300px' }}>
          <Loader2 size={36} className="spinner-icon text-primary" />
          <span>Searching knowledge repository...</span>
        </div>
      ) : activeTab === 'catalog' ? (
        /* TAB 1: DECISION CATALOG */
        results.length === 0 ? (
          <div className="empty-state-card">
            <BookOpen size={36} />
            <h3>No decisions match your search</h3>
            <p>Try refining keywords, or resetting category and tag filters.</p>
            {isFiltered && (
              <button type="button" onClick={handleClearFilters} className="btn btn-secondary btn-sm">
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="knowledge-catalog-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {results.map((d) => (
              <article key={d.id} className="card knowledge-catalog-card">
                <div className="knowledge-card-header">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                        <Link to={`/decisions/${d.id}`} style={{ color: 'var(--slate-900)', textDecoration: 'none' }}>
                          {d.title}
                        </Link>
                      </h3>
                      <DecisionStatusBadge status={d.status} />
                      {d.category && (
                        <span className="badge-category-chip">
                          <Folder size={11} /> {d.category.name}
                        </span>
                      )}
                      {d.team && (
                        <span className="badge-team-chip">
                          <Users size={11} /> {d.team.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <Link to={`/decisions/${d.id}`} className="btn btn-secondary btn-sm">
                    <span>View Replay</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>

                <div className="knowledge-card-body" style={{ marginTop: '0.75rem' }}>
                  <p style={{ color: 'var(--slate-600)', fontSize: '0.92rem', marginBottom: '0.75rem' }}>
                    <strong>Problem:</strong> {d.problem_statement}
                  </p>

                  <div className="knowledge-card-highlight">
                    <span style={{ fontWeight: 600, color: 'var(--primary-700)', fontSize: '0.85rem' }}>
                      Chosen Path:
                    </span>{' '}
                    <span style={{ fontSize: '0.9rem', color: 'var(--slate-800)' }}>{d.decision_taken}</span>
                  </div>

                  {/* Prominently Highlight Rationale */}
                  {d.reasoning && (
                    <div className="knowledge-rationale-snippet">
                      <Sparkles size={14} className="text-primary" />
                      <div>
                        <strong>Rationale:</strong> {d.reasoning.length > 220 ? `${d.reasoning.substring(0, 220)}...` : d.reasoning}
                      </div>
                    </div>
                  )}

                  {d.tags && d.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                      {d.tags.map((t) => (
                        <span key={t.id} className="tag-pill-badge">{t.name}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="knowledge-card-footer" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--slate-100)', fontSize: '0.8rem', color: 'var(--slate-400)' }}>
                  <span>Creator: {d.creator?.full_name || `User #${d.created_by}`}</span>
                  <span>Recorded: {formatDate(d.created_at)}</span>
                </div>
              </article>
            ))}
          </div>
        )
      ) : activeTab === 'timeline' ? (
        /* TAB 2: ORGANIZATIONAL TIMELINE */
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Decision Lifecycle Events Timeline
          </h2>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Chronological audit of milestones across all recorded architectural decisions.
          </p>

          {timeline.length === 0 ? (
            <div className="empty-sub-state">
              <Clock size={32} />
              <p>No lifecycle timeline events recorded yet.</p>
            </div>
          ) : (
            <div className="rpt-timeline">
              {timeline.map((ev, i) => (
                <div key={ev.id || i} className="rpt-timeline-item">
                  <div className="rpt-timeline-rail">
                    <div className="rpt-timeline-dot" style={{ background: 'var(--primary-600)', borderColor: 'var(--primary-200)' }} />
                    {i < timeline.length - 1 && <div className="rpt-timeline-line" />}
                  </div>
                  <div className="rpt-timeline-content">
                    <div className="rpt-timeline-header">
                      <span className="rpt-timeline-stage" style={{ color: 'var(--primary-600)' }}>
                        {ev.stage || ev.action}
                      </span>
                      <span className="rpt-timeline-time">{new Date(ev.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="rpt-timeline-title">
                      {ev.decision_id ? (
                        <Link to={`/decisions/${ev.decision_id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                          {ev.title} (Decision #{ev.decision_id})
                        </Link>
                      ) : (
                        ev.title
                      )}
                    </div>
                    {ev.description && <div className="rpt-timeline-desc">{ev.description}</div>}
                    {ev.actor_name && (
                      <div className="rpt-timeline-actor">
                        <Users size={12} /> {ev.actor_name}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* TAB 3: DOCUMENT ARCHIVE */
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Organization-Wide Document Archive
          </h2>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Central repository of all architectural diagrams, trade-off spreadsheets, and specs attached to decisions.
          </p>

          {documents.length === 0 ? (
            <div className="empty-sub-state">
              <Paperclip size={32} />
              <p>No documents uploaded to the repository yet.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="app-data-table">
                <thead>
                  <tr>
                    <th>File Name</th>
                    <th>Linked Decision</th>
                    <th>Uploaded By</th>
                    <th>Upload Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id}>
                      <td style={{ fontWeight: 600 }}>
                        <Paperclip size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                        {doc.file_name}
                      </td>
                      <td>
                        <Link to={`/decisions/${doc.decision_id}`} style={{ color: 'var(--primary-600)' }}>
                          Decision #{doc.decision_id}
                        </Link>
                      </td>
                      <td>{doc.uploader?.full_name || `User #${doc.uploaded_by}`}</td>
                      <td>{formatDate(doc.created_at)}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleDownloadDoc(doc)}
                          className="btn btn-secondary btn-xs"
                        >
                          <Download size={12} /> Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default KnowledgeRepository;
