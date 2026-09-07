import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import DecisionStatusBadge from '../components/DecisionStatusBadge';
import RoleBadge from '../components/RoleBadge';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Layers,
  History,
  GitBranch,
  MessageSquare,
  ArrowRight,
  AlertCircle,
  Loader2,
  Calendar,
  X,
  CheckCircle2,
  Clock,
  Sparkles,
  Tag
} from 'lucide-react';

export const DecisionsPage = () => {
  const { user } = useAuth();
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newProblem, setNewProblem] = useState('');
  const [newCategory, setNewCategory] = useState('Architecture');
  const [newStatus, setNewStatus] = useState('Draft');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  const fetchDecisions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/decisions');
      setDecisions(res.data);
    } catch (err) {
      console.error('Failed to fetch decisions:', err);
      setError('Unable to load organizational decisions. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecisions();
  }, []);

  const handleCreateDecision = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);

    try {
      await api.post('/decisions', {
        title: newTitle,
        problem_statement: newProblem,
        category: newCategory,
        status: newStatus
      });

      // Reset and close
      setNewTitle('');
      setNewProblem('');
      setNewCategory('Architecture');
      setNewStatus('Draft');
      setIsCreateOpen(false);
      await fetchDecisions();
    } catch (err) {
      console.error('Failed to create decision:', err);
      setCreateError(err.response?.data?.detail || 'Failed to create decision record.');
    } finally {
      setCreating(false);
    }
  };

  // Categories list
  const allCategories = Array.from(new Set(decisions.map(d => d.category).filter(Boolean)));

  // Filtered decisions
  const filteredDecisions = decisions.filter(d => {
    const matchesSearch =
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.problem_statement.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = selectedStatus === 'ALL' || d.status === selectedStatus;
    const matchesCategory = selectedCategory === 'ALL' || d.category === selectedCategory;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const counts = {
    total: decisions.length,
    underReview: decisions.filter(d => d.status === 'Under Review').length,
    approved: decisions.filter(d => d.status === 'Approved').length,
    drafts: decisions.filter(d => d.status === 'Draft').length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden glass-card rounded-3xl p-8 border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Milestone 2 - Decision Knowledge Hub</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
              Organizational Decisions
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl">
              Document, evaluate alternatives, track immutable version history, and collaborate on high-impact architectural decisions.
            </p>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition-all transform hover:-translate-y-0.5 shrink-0"
          >
            <Plus className="w-5 h-5" />
            <span>Create Decision</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <span className="text-xs uppercase font-semibold text-slate-400">Total Decisions</span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-3xl font-extrabold text-white">{counts.total}</span>
            <Layers className="w-6 h-6 text-blue-400 opacity-70" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <span className="text-xs uppercase font-semibold text-amber-400">Under Review</span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-3xl font-extrabold text-amber-400">{counts.underReview}</span>
            <Clock className="w-6 h-6 text-amber-400 opacity-70" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <span className="text-xs uppercase font-semibold text-emerald-400">Approved</span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-3xl font-extrabold text-emerald-400">{counts.approved}</span>
            <CheckCircle2 className="w-6 h-6 text-emerald-400 opacity-70" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <span className="text-xs uppercase font-semibold text-slate-400">Drafts</span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-3xl font-extrabold text-slate-300">{counts.drafts}</span>
            <FileText className="w-6 h-6 text-slate-400 opacity-70" />
          </div>
        </div>
      </div>

      {/* Search & Filters Toolbar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search decisions, problems..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-sm glass-input text-slate-100 placeholder-slate-500 focus:outline-none"
          />
        </div>

        {/* Filter Badges & Selects */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          
          {/* Status Tabs */}
          <div className="inline-flex rounded-xl bg-slate-900/80 p-1 border border-slate-800 text-xs font-semibold">
            {['ALL', 'Draft', 'Under Review', 'Approved', 'Rejected'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  selectedStatus === st
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          {allCategories.length > 0 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900/80 border border-slate-800 text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              {allCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          )}

        </div>
      </div>

      {/* Decision Cards List */}
      {loading ? (
        <div className="flex items-center justify-center py-24 space-x-3 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="text-sm font-medium">Loading decisions knowledge base...</span>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center space-x-3">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <span>{error}</span>
        </div>
      ) : filteredDecisions.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center border border-slate-800 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-200">No decisions match your query</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            {searchQuery || selectedStatus !== 'ALL' || selectedCategory !== 'ALL'
              ? 'Try clearing filters or adjusting your search query.'
              : 'Create your first organizational decision to start tracking alternatives and version replay.'}
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Decision</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredDecisions.map((d) => (
            <Link
              key={d.id}
              to={`/decisions/${d.id}`}
              className="glass-card rounded-3xl p-6 border border-slate-800 hover:border-blue-500/40 transition-all group block"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <DecisionStatusBadge status={d.status} size="sm" />
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                      <Tag className="w-3 h-3 text-slate-400" />
                      <span>{d.category}</span>
                    </span>
                    <span className="text-xs text-slate-500">#{d.id}</span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                    {d.title}
                  </h3>

                  <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed">
                    {d.problem_statement}
                  </p>
                </div>

                <div className="flex flex-row md:flex-col items-end justify-between md:justify-start gap-3 shrink-0 pt-2 md:pt-0">
                  <div className="flex items-center space-x-3 text-xs text-slate-400">
                    <span className="flex items-center space-x-1" title="Recorded Alternatives">
                      <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="font-semibold text-slate-300">{d.alternatives_count || 0}</span>
                      <span className="hidden sm:inline">alts</span>
                    </span>
                    <span className="flex items-center space-x-1" title="Version Snapshots">
                      <History className="w-3.5 h-3.5 text-blue-400" />
                      <span className="font-semibold text-slate-300">v{d.version_count || 1}</span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-1 text-xs font-bold text-blue-400 group-hover:translate-x-1 transition-transform">
                    <span>Explore Decision</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>

              </div>

              <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                <div className="flex items-center space-x-2">
                  <span>Proposed by:</span>
                  <span className="text-slate-300 font-medium">
                    {d.creator ? d.creator.full_name : `User #${d.created_by_id}`}
                  </span>
                  {d.creator?.role && <RoleBadge role={d.creator.role} size="sm" />}
                </div>

                <div className="flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {new Date(d.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* CREATE DECISION MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="glass-card rounded-3xl border border-slate-700 w-full max-w-2xl overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Create New Decision</h2>
                  <p className="text-xs text-slate-400">Initialize a decision formulation and start version replay tracking.</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateDecision} className="space-y-4">
              
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                  Decision Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Migration from Monolith to Event-Driven Microservices"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm glass-input text-slate-100 placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                    Category *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Architecture, Security, Data"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm glass-input text-slate-100 placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                    Initial Workflow Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm glass-input text-slate-100 focus:outline-none"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Approved">Approved</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                  Problem Statement & Context *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe the context, technical challenges, drivers, and constraints that necessitate this decision..."
                  value={newProblem}
                  onChange={(e) => setNewProblem(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm glass-input text-slate-100 placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center space-x-2"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Decision</span>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default DecisionsPage;
