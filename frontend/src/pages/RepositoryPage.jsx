import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Database, Search, Filter, Sparkles, FolderKanban, ChevronRight, Tag } from 'lucide-react';
import { DecisionStatusBadge, ImplementationStatusBadge } from '../components/ui/StatusBadge';
import api from '../api/client';

export const RepositoryPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [decisions, setDecisions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category_id') || '');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [catsRes, tagsRes] = await Promise.all([
          api.get('/decisions/categories'),
          api.get('/decisions/tags'),
        ]);
        setCategories(catsRes.data);
        setTags(tagsRes.data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchMetadata();
  }, []);

  const searchRepository = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedCategory) params.category_id = selectedCategory;
      if (selectedTag) params.tag_id = selectedTag;
      if (selectedStatus) params.status = selectedStatus;

      const res = await api.get('/repository/search', { params });
      setDecisions(res.data);
    } catch (err) {
      console.error('Error searching knowledge repository:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchRepository();
  }, [selectedCategory, selectedTag, selectedStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    searchRepository();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Organizational Memory & Institutional Knowledge</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Decision Replay Knowledge Base
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Understand not only WHAT decisions were made across the company, but WHY they were chosen through complete historical replays
          </p>
        </div>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search problem statements, outcomes, trade-offs, architecture keys..."
              className="w-full bg-slate-50 border border-slate-200 text-sm pl-10 pr-4 py-2.5 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-6 py-3 rounded-xl shadow-xs transition-colors"
          >
            Search Knowledge Base
          </button>
        </form>

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100 mt-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs text-slate-700 py-2 px-3 rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs text-slate-700 py-2 px-3 rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="">All Tags</option>
            {tags.map((t) => (
              <option key={t.id} value={t.id}>
                #{t.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs text-slate-700 py-2 px-3 rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="">All Lifecycle Statuses</option>
            <option value="approved">Approved & Executed</option>
            <option value="in_review">In Review</option>
            <option value="in_approval">In Approval</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Replay Results Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-xs text-slate-400 mt-2">Searching knowledge base...</p>
          </div>
        ) : decisions.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-xs">
            <Database className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No matching decision cases</h3>
            <p className="text-xs text-slate-400 mt-1">Try modifying your query or clearing filters.</p>
          </div>
        ) : (
          decisions.map((d) => (
            <div
              key={d.id}
              className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-slate-300 shadow-xs transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <DecisionStatusBadge status={d.status} />
                    <ImplementationStatusBadge status={d.implementation_status} />
                    <span className="text-xs text-slate-400">v{d.current_version_no}</span>
                  </div>
                  <Link
                    to={`/decisions/${d.id}`}
                    className="text-lg font-bold text-slate-900 hover:text-blue-600 block transition-colors leading-snug"
                  >
                    {d.title}
                  </Link>
                </div>
                <Link
                  to={`/decisions/${d.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-lg transition-colors flex-shrink-0"
                >
                  <span>Replay Full Rationale</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                {d.problem_statement}
              </p>

              {d.outcome_summary && (
                <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs">
                  <strong className="text-emerald-800 font-bold block mb-1">Execution Outcome:</strong>
                  <p className="text-slate-700 line-clamp-2">{d.outcome_summary}</p>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 text-xs text-slate-400">
                <div className="flex items-center gap-3">
                  <span>Author: <strong className="text-slate-700">{d.owner_name}</strong></span>
                  <span>?</span>
                  <span>{d.category?.name || 'General'}</span>
                </div>
                {d.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {d.tags.map((t) => (
                      <span key={t.id} className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        #{t.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
