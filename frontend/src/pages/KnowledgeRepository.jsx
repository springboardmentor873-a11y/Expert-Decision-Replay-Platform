import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getKnowledgeRepository,
  getKnowledgeGraph,
  getRelatedInsights,
} from '../services/knowledgeRepositoryService';
import { getCategories } from '../services/categoryService';
import { getTags } from '../services/tagService';
import { downloadDocument } from '../services/documentService';
import { DecisionStatusBadge } from '../components/DecisionStatusBadge';
import { KnowledgeGraphView } from '../components/KnowledgeGraphView';
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
  Network,
  BarChart3,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Shield,
  Briefcase,
} from 'lucide-react';

const TABS = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'decisions', label: 'Past Decisions', icon: Layers },
  { id: 'documents', label: 'Documents', icon: Paperclip },
  { id: 'topics', label: 'Topics', icon: Folder },
  { id: 'people', label: 'People', icon: Users },
  { id: 'insights', label: 'Insights', icon: TrendingUp },
  { id: 'graph', label: 'Knowledge Graph', icon: Network },
];

export const KnowledgeRepository = ({ defaultTab = 'all' }) => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState(defaultTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  // Live Data States
  const [repoData, setRepoData] = useState({
    total: 0,
    decisions: [],
    timeline_events: [],
    documents: [],
    categories: [],
    tags: [],
  });
  const [graphData, setGraphData] = useState(null);
  const [insightsData, setInsightsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [graphLoading, setGraphLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch Main Repository Data
  const fetchRepository = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getKnowledgeRepository({
        search: searchQuery.trim() || undefined,
        category_id: selectedCategory ? parseInt(selectedCategory, 10) : undefined,
        tag_id: selectedTag ? parseInt(selectedTag, 10) : undefined,
        status: selectedStatus === 'ALL' ? undefined : selectedStatus,
      });
      setRepoData(data || {});
    } catch (err) {
      setError(err.message || 'Failed to load knowledge repository data.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Graph Data
  const fetchGraph = async () => {
    setGraphLoading(true);
    try {
      const gData = await getKnowledgeGraph();
      setGraphData(gData);
    } catch (err) {
      console.warn('Could not load knowledge graph:', err);
    } finally {
      setGraphLoading(false);
    }
  };

  // Fetch Insights Data
  const fetchInsights = async () => {
    try {
      const iData = await getRelatedInsights();
      setInsightsData(iData);
    } catch (err) {
      console.warn('Could not load related insights:', err);
    }
  };

  // Initial Load
  useEffect(() => {
    fetchRepository();
    fetchInsights();
  }, [selectedCategory, selectedTag, selectedStatus]);

  // Load Graph when graph tab is clicked or on demand
  useEffect(() => {
    if (activeTab === 'graph' && !graphData) {
      fetchGraph();
    }
  }, [activeTab]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRepository();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedTag('');
    setSelectedStatus('ALL');
  };

  const handleDownloadDoc = async (doc) => {
    try {
      await downloadDocument(doc.decision_id, doc.id, doc.original_filename);
    } catch (err) {
      alert('Failed to download document: ' + (err.message || 'Unknown error'));
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

  // KPI Calculations
  const totalAssets = (repoData.total || repoData.decisions?.length || 0) + (repoData.documents?.length || 0);
  const verifiedDecisions = repoData.decisions?.filter(
    (d) => d.status === 'Approved' || d.status === 'Implemented'
  ).length || 0;
  const categoriesCount = repoData.categories?.length || 0;

  // Extract People / Authors
  const authorsList = useMemo(() => {
    const authorMap = new Map();
    repoData.decisions?.forEach((d) => {
      if (d.creator_id && d.creator_name) {
        if (!authorMap.has(d.creator_id)) {
          authorMap.set(d.creator_id, {
            id: d.creator_id,
            name: d.creator_name,
            decisionsCount: 0,
            recentDecision: d.title,
            recentDate: d.created_at,
          });
        }
        authorMap.get(d.creator_id).decisionsCount += 1;
      }
    });
    return Array.from(authorMap.values());
  }, [repoData.decisions]);

  return (
    <div className="enterprise-page-container" style={{ padding: '2rem 2.5rem', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div style={{ padding: '6px', background: '#eff6ff', borderRadius: '8px', color: '#2563eb' }}>
              <BookOpen size={20} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Knowledge Repository
            </h1>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
            Discover decisions, documents, discussions and organizational knowledge.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => {
              fetchRepository();
              fetchInsights();
              if (activeTab === 'graph') fetchGraph();
            }}
            className="btn btn-secondary btn-sm"
          >
            Refresh Memory
          </button>
          <Link to="/decisions/new" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span>Record Decision</span>
          </Link>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.25rem', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Layers size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Knowledge Assets
            </span>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0f172a' }}>
              {totalAssets}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Verified Decisions
            </span>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0f172a' }}>
              {verifiedDecisions}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Contributors
            </span>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0f172a' }}>
              {insightsData?.metrics?.active_contributors || authorsList.length || 0}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#f3e8ff', color: '#7e22ce', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Folder size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Knowledge Domains
            </span>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0f172a' }}>
              {categoriesCount}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', gap: '0.5rem', marginBottom: '1.75rem', overflowX: 'auto' }}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.75rem 1.25rem',
                border: 'none',
                background: 'none',
                borderBottom: isActive ? '2px solid #2563eb' : '2px solid transparent',
                marginBottom: '-2px',
                color: isActive ? '#2563eb' : '#64748b',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.925rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter & Search Bar (Visible for All, Decisions, Documents, Topics) */}
      {activeTab !== 'graph' && activeTab !== 'insights' && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.75rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', justifyContent: 'space-between' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '260px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                className="form-control-input"
                placeholder="Search across decisions, reasoning, context, and documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', paddingLeft: '34px', borderRadius: '6px', fontSize: '0.9rem' }}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-sm">
              Search
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#1e293b', background: '#ffffff' }}
            >
              <option value="">All Categories</option>
              {repoData.categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.count})
                </option>
              ))}
            </select>

            {/* Tag Filter */}
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#1e293b', background: '#ffffff' }}
            >
              <option value="">All Tags</option>
              {repoData.tags?.map((t) => (
                <option key={t.id} value={t.id}>
                  #{t.name} ({t.count})
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#1e293b', background: '#ffffff' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="Approved">Approved</option>
              <option value="Under Review">Under Review</option>
              <option value="Draft">Draft</option>
              <option value="Archived">Archived</option>
            </select>

            {(searchQuery || selectedCategory || selectedTag || selectedStatus !== 'ALL') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn btn-secondary btn-sm"
                title="Reset filters"
                style={{ padding: '6px 10px' }}
              >
                <X size={14} />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error Notice */}
      {error && (
        <div className="alert alert-error" role="alert" style={{ marginBottom: '1.5rem' }}>
          <span>{error}</span>
        </div>
      )}

      {/* TAB 1: ALL / UNIFIED FEED */}
      {activeTab === 'all' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          {/* Left Column: Decisions Feed */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                Latest Verified Decisions ({repoData.decisions?.length || 0})
              </h3>
            </div>

            {loading ? (
              <div className="card loading-state-card" style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 size={30} className="spinner-icon text-primary" />
              </div>
            ) : repoData.decisions?.length === 0 ? (
              <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                <Layers size={36} style={{ color: '#cbd5e1', margin: '0 auto 8px' }} />
                <p>No knowledge records found matching your filters.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {repoData.decisions?.map((dec) => (
                  <div
                    key={dec.id}
                    className="card"
                    style={{
                      padding: '1.25rem 1.5rem',
                      background: '#ffffff',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                      <div>
                        {dec.category_name && (
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4f46e5', background: '#eef2ff', padding: '2px 8px', borderRadius: '4px', display: 'inline-block', marginBottom: '4px' }}>
                            {dec.category_name}
                          </span>
                        )}
                        <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                          <Link to={`/decisions/${dec.id}`} style={{ color: '#0f172a', textDecoration: 'none' }}>
                            {dec.title}
                          </Link>
                        </h4>
                      </div>
                      <DecisionStatusBadge status={dec.status} />
                    </div>

                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#475569', lineHeight: 1.5 }}>
                      {dec.problem_statement?.length > 180 ? `${dec.problem_statement.substring(0, 175)}...` : dec.problem_statement}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '0.625rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span>Author: <strong>{dec.creator_name || 'Anonymous'}</strong></span>
                        {dec.team_name && <span>Team: <strong>{dec.team_name}</strong></span>}
                      </div>
                      <Link to={`/decisions/${dec.id}`} style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span>Replay</span>
                        <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Timeline & Recent Documents */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Recent Documents */}
            <div className="card" style={{ padding: '1.25rem', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                  Document Blueprints ({repoData.documents?.length || 0})
                </h4>
                <button type="button" onClick={() => setActiveTab('documents')} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>
                  View All
                </button>
              </div>

              {repoData.documents?.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>No attached documents.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {repoData.documents?.slice(0, 4).map((doc) => (
                    <div
                      key={doc.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 8px',
                        background: '#f8fafc',
                        borderRadius: '6px',
                        fontSize: '0.825rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                        <Paperclip size={13} style={{ color: '#64748b' }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '170px' }}>
                          {doc.original_filename}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownloadDoc(doc)}
                        style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: '2px' }}
                        title="Download"
                      >
                        <Download size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Timeline Stream */}
            <div className="card" style={{ padding: '1.25rem', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 0.875rem', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                Governance Timeline
              </h4>
              {repoData.timeline_events?.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>No recent audit events.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {repoData.timeline_events?.slice(0, 6).map((ev) => (
                    <div key={ev.id} style={{ display: 'flex', gap: '8px', fontSize: '0.825rem' }}>
                      <Activity size={14} style={{ color: '#3b82f6', marginTop: '2px', flexShrink: 0 }} />
                      <div>
                        <span style={{ color: '#1e293b', fontWeight: 500 }}>{ev.description || ev.action}</span>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {ev.actor_name} &bull; {formatDate(ev.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PAST DECISIONS */}
      {activeTab === 'decisions' && (
        <div>
          {loading ? (
            <div className="card loading-state-card" style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 size={36} className="spinner-icon text-primary" />
            </div>
          ) : repoData.decisions?.length === 0 ? (
            <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center', color: '#64748b' }}>
              <Layers size={40} style={{ color: '#cbd5e1', margin: '0 auto 12px' }} />
              <h3>No past decisions found</h3>
              <p>Adjust your search filters or check back later.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
              {repoData.decisions?.map((dec) => (
                <div
                  key={dec.id}
                  className="card"
                  style={{
                    padding: '1.5rem',
                    background: '#ffffff',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4f46e5', background: '#eef2ff', padding: '2px 8px', borderRadius: '4px' }}>
                        {dec.category_name || 'General Architecture'}
                      </span>
                      <DecisionStatusBadge status={dec.status} />
                    </div>

                    <h4 style={{ margin: '0 0 8px', fontSize: '1.05rem', fontWeight: 700 }}>
                      <Link to={`/decisions/${dec.id}`} style={{ color: '#0f172a', textDecoration: 'none' }}>
                        {dec.title}
                      </Link>
                    </h4>

                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#475569', lineHeight: 1.5 }}>
                      {dec.problem_statement?.length > 140 ? `${dec.problem_statement.substring(0, 135)}...` : dec.problem_statement}
                    </p>

                    {/* Tags */}
                    {dec.tags && dec.tags.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '10px' }}>
                        {dec.tags.map((t) => (
                          <span key={t.id} style={{ fontSize: '0.725rem', color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                            #{t.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#64748b' }}>
                    <div>
                      <span>Author: <strong>{dec.creator_name || 'Anonymous'}</strong></span>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{formatDate(dec.created_at)}</div>
                    </div>
                    <Link to={`/decisions/${dec.id}`} className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span>Replay</span>
                      <ChevronRight size={13} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="card" style={{ padding: '1.5rem', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
              Attached Architectural Blueprints & Specifications ({repoData.documents?.length || 0})
            </h3>
          </div>

          {repoData.documents?.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
              <Paperclip size={36} style={{ color: '#cbd5e1', margin: '0 auto 8px' }} />
              <p>No document archives found in the repository.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                    <th style={{ padding: '10px 12px' }}>Document Name</th>
                    <th style={{ padding: '10px 12px' }}>Associated Decision</th>
                    <th style={{ padding: '10px 12px' }}>Type</th>
                    <th style={{ padding: '10px 12px' }}>File Size</th>
                    <th style={{ padding: '10px 12px' }}>Uploader</th>
                    <th style={{ padding: '10px 12px' }}>Date</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {repoData.documents?.map((doc) => (
                    <tr key={doc.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', fontWeight: 600, color: '#0f172a' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Paperclip size={15} className="text-primary" />
                          <span>{doc.original_filename}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <Link to={`/decisions/${doc.decision_id}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                          {doc.decision_title || `Decision #${doc.decision_id}`}
                        </Link>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                          {doc.file_type ? doc.file_type.split('/')[1] || doc.file_type : 'DOC'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: '#64748b' }}>
                        {(doc.file_size / 1024).toFixed(1)} KB
                      </td>
                      <td style={{ padding: '12px', color: '#475569' }}>
                        {doc.uploader_name || 'System'}
                      </td>
                      <td style={{ padding: '12px', color: '#64748b' }}>
                        {formatDate(doc.created_at)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleDownloadDoc(doc)}
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px' }}
                        >
                          <Download size={13} />
                          <span>Download</span>
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

      {/* TAB 4: TOPICS (Categories & Tags) */}
      {activeTab === 'topics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Categories Grid */}
          <div>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
              Architecture Categories & Domains ({repoData.categories?.length || 0})
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {repoData.categories?.map((c) => (
                <div
                  key={c.id}
                  className="card"
                  onClick={() => {
                    setSelectedCategory(String(c.id));
                    setActiveTab('decisions');
                  }}
                  style={{
                    padding: '1.25rem',
                    background: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Folder size={18} style={{ color: '#7c3aed' }} />
                      <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{c.name}</strong>
                    </div>
                    <span style={{ fontSize: '0.8rem', background: '#f3e8ff', color: '#7e22ce', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
                      {c.count} decisions
                    </span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '12px' }}>
                    Explore Category &rarr;
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tags Grid */}
          <div>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
              Taxonomy Tags ({repoData.tags?.length || 0})
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {repoData.tags?.map((t) => (
                <span
                  key={t.id}
                  onClick={() => {
                    setSelectedTag(String(t.id));
                    setActiveTab('decisions');
                  }}
                  style={{
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    background: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #e2e8f0',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 500,
                  }}
                >
                  <TagIcon size={12} style={{ color: '#db2777' }} />
                  <span>#{t.name}</span>
                  <span style={{ fontSize: '0.75rem', background: '#e2e8f0', padding: '1px 6px', borderRadius: '10px' }}>
                    {t.count}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PEOPLE */}
      {activeTab === 'people' && (
        <div className="card" style={{ padding: '1.5rem', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
            Decision Authors & Contributors ({authorsList.length})
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {authorsList.map((a) => (
              <div
                key={a.id}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: '#eff6ff',
                      color: '#2563eb',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.95rem',
                    }}
                  >
                    {a.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{a.name}</strong>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {a.decisionsCount} authored {a.decisionsCount === 1 ? 'decision' : 'decisions'}
                    </div>
                  </div>
                </div>

                {a.recentDecision && (
                  <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '4px' }}>
                    Latest: <em>"{a.recentDecision}"</em>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: INSIGHTS */}
      {activeTab === 'insights' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Top Row: Portfolio Breakdown & Key Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="card" style={{ padding: '1.5rem', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 1rem', fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                Architecture Portfolio Distribution
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {insightsData?.top_categories?.map((cat) => (
                  <div key={cat.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                      <strong style={{ color: '#1e293b' }}>{cat.name}</strong>
                      <span style={{ color: '#64748b' }}>
                        {cat.decisions_count} ({cat.portfolio_share}%)
                      </span>
                    </div>
                    <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${cat.portfolio_share}%`,
                          background: '#3b82f6',
                          borderRadius: '4px',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ padding: '1.5rem', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 1rem', fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                Team Collaboration & Squad Activity
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {insightsData?.teams_overview?.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      background: '#f8fafc',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '0.925rem', color: '#0f172a' }}>{t.name}</strong>
                      <div style={{ fontSize: '0.775rem', color: '#64748b' }}>
                        {t.members_count} enrolled members
                      </div>
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2563eb' }}>
                      {t.decisions_count} decisions
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* High-Impact Decisions Table */}
          <div className="card" style={{ padding: '1.5rem', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 1rem', fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
              High-Impact Architectural Decisions (By Activity & Alternatives)
            </h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                    <th style={{ padding: '10px' }}>Decision Title</th>
                    <th style={{ padding: '10px' }}>Category</th>
                    <th style={{ padding: '10px' }}>Owner Team</th>
                    <th style={{ padding: '10px' }}>Selected Alternative</th>
                    <th style={{ padding: '10px' }}>Alternatives</th>
                    <th style={{ padding: '10px' }}>Documents</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Impact Score</th>
                  </tr>
                </thead>
                <tbody>
                  {insightsData?.high_impact_decisions?.map((d) => (
                    <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px', fontWeight: 600 }}>
                        <Link to={`/decisions/${d.id}`} style={{ color: '#0f172a', textDecoration: 'none' }}>
                          {d.title}
                        </Link>
                      </td>
                      <td style={{ padding: '10px', color: '#475569' }}>{d.category}</td>
                      <td style={{ padding: '10px', color: '#475569' }}>{d.team}</td>
                      <td style={{ padding: '10px', color: '#16a34a', fontWeight: 500 }}>
                        {d.selected_alternative || 'N/A'}
                      </td>
                      <td style={{ padding: '10px', color: '#64748b' }}>{d.alternatives_count} evaluated</td>
                      <td style={{ padding: '10px', color: '#64748b' }}>{d.documents_count} attached</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700, color: '#2563eb' }}>
                        {d.impact_score}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: KNOWLEDGE GRAPH */}
      {activeTab === 'graph' && (
        <div>
          {graphLoading ? (
            <div className="card loading-state-card" style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 size={40} className="spinner-icon text-primary" />
              <span style={{ marginLeft: '12px', color: '#64748b' }}>Synthesizing knowledge graph relationships from database...</span>
            </div>
          ) : (
            <KnowledgeGraphView
              graphData={graphData}
              loading={graphLoading}
              onRefresh={fetchGraph}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default KnowledgeRepository;
