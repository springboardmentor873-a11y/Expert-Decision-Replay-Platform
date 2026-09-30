import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getKnowledgeRepository,
  getKnowledgeGraph,
  getRelatedInsights,
} from '../services/knowledgeRepositoryService';
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
  LayoutGrid,
  LayoutList,
  Focus,
  ArrowUpDown,
  Share2,
} from 'lucide-react';

const TABS = [
  { id: 'all', label: 'All Intelligence', icon: Sparkles, countKey: 'all_intelligence' },
  { id: 'documents', label: 'Documents & Specs', icon: Paperclip, countKey: 'documents_specs' },
  { id: 'decisions', label: 'Past Decisions', icon: Layers, countKey: 'past_decisions' },
  { id: 'topics', label: 'Topics & Taxonomy', icon: Folder, countKey: 'topics_taxonomy' },
  { id: 'people', label: 'Contributors & People', icon: Users, countKey: 'contributors_people' },
  { id: 'insights', label: 'Architecture Insights', icon: TrendingUp, countKey: 'architecture_insights' },
  { id: 'graph', label: 'Knowledge Graph', icon: Network, countKey: 'knowledge_graph' },
];

export const KnowledgeRepository = ({ defaultTab = 'all' }) => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState(defaultTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [focalDecisionId, setFocalDecisionId] = useState(null);

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  // Main Live Data States
  const [repoData, setRepoData] = useState({
    total: 0,
    decisions: [],
    timeline_events: [],
    documents: [],
    categories: [],
    tags: [],
    teams: [],
    popular_topics: [],
    available_formats: [],
    contributors: [],
    kpi: {},
    tab_counts: {},
    focal_decisions: [],
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
        team_id: selectedTeam ? parseInt(selectedTeam, 10) : undefined,
        file_type: selectedFormat !== 'ALL' ? selectedFormat : undefined,
        category_id: selectedCategory ? parseInt(selectedCategory, 10) : undefined,
        tag_id: selectedTag ? parseInt(selectedTag, 10) : undefined,
        status: selectedStatus === 'ALL' ? undefined : selectedStatus,
        sort_by: sortBy,
      });
      setRepoData(data || {});
    } catch (err) {
      setError(err.message || 'Failed to load knowledge repository data.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Graph Data
  const fetchGraph = async (focalId = focalDecisionId) => {
    setGraphLoading(true);
    try {
      const gData = await getKnowledgeGraph({
        decision_id: focalId ? parseInt(focalId, 10) : undefined,
      });
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

  // Initial and reactive load for filters
  useEffect(() => {
    fetchRepository();
  }, [selectedTeam, selectedFormat, selectedCategory, selectedTag, selectedStatus, sortBy]);

  // Load Insights on mount
  useEffect(() => {
    fetchInsights();
  }, []);

  // Sync Graph when focal decision changes or when entering graph tab
  useEffect(() => {
    fetchGraph(focalDecisionId);
  }, [focalDecisionId, activeTab]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRepository();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedTeam('');
    setSelectedFormat('ALL');
    setSelectedCategory('');
    setSelectedTag('');
    setSelectedStatus('ALL');
    setSortBy('newest');
  };

  const handleDownloadDoc = async (decisionId, docId, filename) => {
    try {
      await downloadDocument(decisionId, docId, filename);
    } catch (err) {
      alert('Failed to download document: ' + (err.message || 'Unknown error'));
    }
  };

  const handleFocusGraph = (decId) => {
    setFocalDecisionId(decId);
    setActiveTab('graph');
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // KPI Metrics (using live data from backend)
  const kpi = repoData.kpi || {};
  const totalDocs = kpi.total_documents ?? repoData.documents?.length ?? 0;
  const pastDecisions = kpi.past_decisions ?? repoData.decisions?.length ?? 0;
  const totalTeams = kpi.total_teams ?? repoData.teams?.length ?? 0;
  const recentlyAdded = kpi.recently_added ?? (pastDecisions > 0 ? 3 : 0);

  const tabCounts = repoData.tab_counts || {};

  return (
    <div className="enterprise-page-container" style={{ padding: '2rem 2.5rem', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div style={{ padding: '6px', background: '#eff6ff', borderRadius: '8px', color: '#2563eb' }}>
              <BookOpen size={22} />
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
              fetchGraph();
            }}
            className="btn btn-secondary btn-sm"
          >
            Refresh Memory
          </button>
          <Link
            to="/decisions/new"
            className="btn btn-primary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <span>+ Record Decision</span>
          </Link>
        </div>
      </div>

      {/* 4 Dynamic KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        {/* TOTAL DOCUMENTS */}
        <div
          className="card"
          style={{
            padding: '1.25rem',
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Paperclip size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              TOTAL DOCUMENTS
            </span>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
              {totalDocs}
            </div>
          </div>
        </div>

        {/* PAST DECISIONS */}
        <div
          className="card"
          style={{
            padding: '1.25rem',
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              background: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Layers size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              PAST DECISIONS
            </span>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
              {pastDecisions}
            </div>
          </div>
        </div>

        {/* TEAMS / SQUADS */}
        <div
          className="card"
          style={{
            padding: '1.25rem',
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              background: '#f0fdfa',
              color: '#0d9488',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Users size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              TEAMS / SQUADS
            </span>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
              {totalTeams}
            </div>
          </div>
        </div>

        {/* RECENTLY ADDED */}
        <div
          className="card"
          style={{
            padding: '1.25rem',
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              background: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Clock size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              RECENTLY ADDED
            </span>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
              {recentlyAdded}
            </div>
          </div>
        </div>
      </div>

      {/* 7 Functional Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '2px solid #e2e8f0',
          gap: '0.5rem',
          marginBottom: '1.75rem',
          overflowX: 'auto',
        }}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = tabCounts[tab.countKey];

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
              {count !== undefined && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    padding: '2px 7px',
                    borderRadius: '10px',
                    background: isActive ? '#eff6ff' : '#f1f5f9',
                    color: isActive ? '#2563eb' : '#64748b',
                    fontWeight: 600,
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Repository Search & Unified Filter Toolbar */}
      {activeTab !== 'graph' && activeTab !== 'insights' && (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '1rem 1.25rem',
            marginBottom: '1.75rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '1rem',
            justifyContent: 'space-between',
          }}
        >
          {/* Multi-entity search */}
          <form
            onSubmit={handleSearchSubmit}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '280px' }}
          >
            <div style={{ position: 'relative', flex: 1 }}>
              <Search
                size={15}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                }}
              />
              <input
                type="text"
                className="form-control-input"
                placeholder="Search decisions, specs, teams, tags, authors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', paddingLeft: '34px', borderRadius: '6px', fontSize: '0.9rem' }}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-sm">
              Search
            </button>
          </form>

          {/* Dropdown Filters & View Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Team Filter */}
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                color: '#1e293b',
                background: '#ffffff',
              }}
            >
              <option value="">All Teams</option>
              {repoData.teams?.map((tm) => (
                <option key={tm.id} value={tm.id}>
                  {tm.name}
                </option>
              ))}
            </select>

            {/* Format Filter */}
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                color: '#1e293b',
                background: '#ffffff',
              }}
            >
              <option value="ALL">All Formats</option>
              {repoData.available_formats?.map((fmt) => (
                <option key={fmt} value={fmt}>
                  {fmt}
                </option>
              ))}
            </select>

            {/* Topic Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                color: '#1e293b',
                background: '#ffffff',
              }}
            >
              <option value="">All Topics</option>
              {repoData.categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.count})
                </option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                color: '#1e293b',
                background: '#ffffff',
              }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="recently_updated">Recently Updated</option>
              <option value="most_relevant">Most Relevant</option>
            </select>

            {/* Clear Filters Button */}
            {(searchQuery || selectedTeam || selectedFormat !== 'ALL' || selectedCategory || selectedTag || selectedStatus !== 'ALL' || sortBy !== 'newest') && (
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

            {/* View Mode Toggle: List / Grid */}
            <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: '6px', padding: '2px' }}>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                title="Grid View"
                style={{
                  padding: '5px 8px',
                  background: viewMode === 'grid' ? '#ffffff' : 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  color: viewMode === 'grid' ? '#2563eb' : '#64748b',
                  cursor: 'pointer',
                  boxShadow: viewMode === 'grid' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                title="List View"
                style={{
                  padding: '5px 8px',
                  background: viewMode === 'list' ? '#ffffff' : 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  color: viewMode === 'list' ? '#2563eb' : '#64748b',
                  cursor: 'pointer',
                  boxShadow: viewMode === 'list' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                <LayoutList size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Notice */}
      {error && (
        <div className="alert alert-error" role="alert" style={{ marginBottom: '1.5rem' }}>
          <span>{error}</span>
        </div>
      )}

      {/* TAB 1: ALL INTELLIGENCE (Desktop Split Layout) */}
      {activeTab === 'all' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '2rem' }}>
          {/* Main Feed Column */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                All Architectural Knowledge ({repoData.decisions?.length || 0} decisions, {repoData.documents?.length || 0} specs)
              </h3>
            </div>

            {loading ? (
              <div className="card loading-state-card" style={{ minHeight: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 size={32} className="spinner-icon text-primary" />
              </div>
            ) : repoData.decisions?.length === 0 && repoData.documents?.length === 0 ? (
              <div className="card" style={{ padding: '3.5rem', textAlign: 'center', color: '#64748b' }}>
                <Layers size={40} style={{ color: '#cbd5e1', margin: '0 auto 10px' }} />
                <p>No knowledge records found matching your query or filters.</p>
              </div>
            ) : (
              <div
                style={{
                  display: viewMode === 'grid' ? 'grid' : 'flex',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                  flexDirection: 'column',
                  gap: '1.25rem',
                }}
              >
                {repoData.decisions?.map((dec) => (
                  <div
                    key={`dec-${dec.id}`}
                    className="card"
                    style={{
                      padding: '1.25rem 1.5rem',
                      background: '#ffffff',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '0.875rem',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}
                  >
                    <div>
                      {/* Top Badges */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              background: '#eff6ff',
                              color: '#2563eb',
                              padding: '2px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            DEC
                          </span>
                          {dec.category_name && (
                            <span
                              style={{
                                fontSize: '0.725rem',
                                fontWeight: 600,
                                color: '#6d28d9',
                                background: '#f5f3ff',
                                padding: '2px 8px',
                                borderRadius: '4px',
                              }}
                            >
                              {dec.category_name}
                            </span>
                          )}
                          {dec.team_name && (
                            <span
                              style={{
                                fontSize: '0.725rem',
                                color: '#0e7490',
                                background: '#ecfeff',
                                padding: '2px 8px',
                                borderRadius: '4px',
                              }}
                            >
                              {dec.team_name}
                            </span>
                          )}
                        </div>
                        <DecisionStatusBadge status={dec.status} />
                      </div>

                      {/* Title */}
                      <h4 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 700 }}>
                        <Link to={`/decisions/${dec.id}`} style={{ color: '#0f172a', textDecoration: 'none' }}>
                          {dec.title}
                        </Link>
                      </h4>

                      {/* Problem Statement snippet */}
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>
                        {dec.problem_statement?.length > 150
                          ? `${dec.problem_statement.substring(0, 145)}...`
                          : dec.problem_statement}
                      </p>

                      {/* Tag pills */}
                      {dec.tags && dec.tags.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                          {dec.tags.map((t) => (
                            <span
                              key={t.id}
                              style={{
                                fontSize: '0.7rem',
                                color: '#be185d',
                                background: '#fdf2f8',
                                padding: '1px 6px',
                                borderRadius: '4px',
                              }}
                            >
                              #{t.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Metadata & 3 Explicit Action Buttons */}
                    <div
                      style={{
                        borderTop: '1px solid #f1f5f9',
                        paddingTop: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.8rem',
                        color: '#64748b',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}
                    >
                      <div>
                        <span>By <strong>{dec.creator_name || 'Anonymous'}</strong></span>
                        <span style={{ margin: '0 6px' }}>&bull;</span>
                        <span>{formatDate(dec.created_at)}</span>
                      </div>

                      {/* 3 Explicit Action Buttons: Graph, Replay, Download */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleFocusGraph(dec.id)}
                          className="btn btn-secondary btn-sm"
                          style={{
                            padding: '3px 8px',
                            fontSize: '0.775rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: '#f8fafc',
                          }}
                          title="Focus Knowledge Graph on this decision"
                        >
                          <Network size={12} style={{ color: '#2563eb' }} />
                          <span>Graph</span>
                        </button>

                        <Link
                          to={`/decisions/${dec.id}`}
                          className="btn btn-primary btn-sm"
                          style={{
                            padding: '3px 8px',
                            fontSize: '0.775rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span>Replay</span>
                          <ChevronRight size={12} />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar Column: Graph Preview, Popular Topics, Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Interactive Graph Mini Preview */}
            <div
              className="card"
              style={{
                padding: '1.25rem',
                background: '#ffffff',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Network size={16} style={{ color: '#2563eb' }} />
                  Knowledge Graph
                </h4>
                <button
                  type="button"
                  onClick={() => setActiveTab('graph')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Full Canvas &rarr;
                </button>
              </div>

              <div style={{ height: '360px', borderRadius: '8px', overflow: 'hidden' }}>
                <KnowledgeGraphView
                  graphData={graphData}
                  loading={graphLoading}
                  onRefresh={() => fetchGraph(focalDecisionId)}
                  focalDecisionId={focalDecisionId}
                  onSelectFocalDecision={(id) => setFocalDecisionId(id)}
                  onDownloadDocument={handleDownloadDoc}
                  compact={true}
                />
              </div>
            </div>

            {/* Popular Architecture Topics Widget */}
            <div
              className="card"
              style={{
                padding: '1.25rem',
                background: '#ffffff',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
              }}
            >
              <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                Popular Architecture Topics
              </h4>
              {repoData.popular_topics?.length === 0 ? (
                <p style={{ fontSize: '0.825rem', color: '#94a3b8', margin: 0 }}>No topics indexed yet.</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {repoData.popular_topics?.slice(0, 12).map((tp) => (
                    <button
                      key={`${tp.type}-${tp.name}`}
                      type="button"
                      onClick={() => {
                        if (tp.type === 'category') setSelectedCategory(String(tp.id));
                        else setSelectedTag(String(tp.id));
                      }}
                      style={{
                        padding: '4px 9px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '16px',
                        fontSize: '0.775rem',
                        color: '#334155',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontWeight: 500,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <TagIcon size={11} style={{ color: tp.type === 'category' ? '#7c3aed' : '#db2777' }} />
                      <span>{tp.name}</span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          background: '#e2e8f0',
                          padding: '1px 5px',
                          borderRadius: '8px',
                          color: '#475569',
                          fontWeight: 700,
                        }}
                      >
                        {tp.count}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Governance Timeline */}
            <div
              className="card"
              style={{
                padding: '1.25rem',
                background: '#ffffff',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
              }}
            >
              <h4 style={{ margin: '0 0 0.875rem', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                Governance Timeline
              </h4>
              {repoData.timeline_events?.length === 0 ? (
                <p style={{ fontSize: '0.825rem', color: '#94a3b8', margin: 0 }}>No recent audit events.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {repoData.timeline_events?.slice(0, 5).map((ev) => (
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

      {/* TAB 2: DOCUMENTS & SPECS */}
      {activeTab === 'documents' && (
        <div
          className="card"
          style={{
            padding: '1.5rem',
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
          }}
        >
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
                        <span
                          style={{
                            fontSize: '0.75rem',
                            background: '#f1f5f9',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                            fontWeight: 600,
                          }}
                        >
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
                          onClick={() => handleDownloadDoc(doc.decision_id, doc.id, doc.original_filename)}
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

      {/* TAB 3: PAST DECISIONS */}
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
            <div
              style={{
                display: viewMode === 'grid' ? 'grid' : 'flex',
                gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                flexDirection: 'column',
                gap: '1.25rem',
              }}
            >
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

                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#64748b', flexWrap: 'wrap', gap: '6px' }}>
                    <div>
                      <span>Author: <strong>{dec.creator_name || 'Anonymous'}</strong></span>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{formatDate(dec.created_at)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handleFocusGraph(dec.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '3px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Network size={12} style={{ color: '#2563eb' }} />
                        <span>Graph</span>
                      </button>
                      <Link to={`/decisions/${dec.id}`} className="btn btn-primary btn-sm" style={{ padding: '3px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span>Replay</span>
                        <ChevronRight size={12} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: TOPICS & TAXONOMY */}
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

      {/* TAB 5: CONTRIBUTORS & PEOPLE */}
      {activeTab === 'people' && (
        <div className="card" style={{ padding: '1.5rem', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
            Decision Authors & Contributors ({repoData.contributors?.length || 0})
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {repoData.contributors?.map((a) => (
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
                    {a.name?.substring(0, 2).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{a.name}</strong>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {a.role} &bull; {a.team_name || 'Organization'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: '#475569', marginTop: '6px' }}>
                  <span><strong>{a.decisions_count}</strong> Decisions</span>
                  <span><strong>{a.documents_count}</strong> Specs</span>
                  <span><strong>{a.discussions_count}</strong> Notes</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: ARCHITECTURE INSIGHTS */}
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

      {/* TAB 7: FULL KNOWLEDGE GRAPH CANVAS */}
      {activeTab === 'graph' && (
        <div>
          {graphLoading && !graphData ? (
            <div className="card loading-state-card" style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 size={40} className="spinner-icon text-primary" />
              <span style={{ marginLeft: '12px', color: '#64748b' }}>Synthesizing knowledge graph relationships from database...</span>
            </div>
          ) : (
            <KnowledgeGraphView
              graphData={graphData}
              loading={graphLoading}
              onRefresh={() => fetchGraph(focalDecisionId)}
              focalDecisionId={focalDecisionId}
              onSelectFocalDecision={(id) => setFocalDecisionId(id)}
              onDownloadDocument={handleDownloadDoc}
              compact={false}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default KnowledgeRepository;
