import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  FolderKanban, 
  ChevronRight, 
  Tag, 
  Calendar,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { DecisionStatusBadge, ImplementationStatusBadge } from '../../components/ui/StatusBadge';
import api from '../../api/client';

export const DecisionsListPage = () => {
  const [decisions, setDecisions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const fetchCategories = async () => {
    try {
      const res = await api.get('/decisions/categories');
      setCategories(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDecisions = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedCategory) params.category_id = selectedCategory;
      if (selectedStatus) params.status = selectedStatus;

      const res = await api.get('/decisions', { params });
      setDecisions(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchDecisions();
  }, [selectedCategory, selectedStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDecisions();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Decisions Registry</h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse, manage, and track strategic organizational decision case files
          </p>
        </div>
        <Link
          to="/decisions/new"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Decision</span>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or problem statement..."
            className="w-full bg-slate-50 border border-slate-200 text-sm text-slate-900 pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white"
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-sm text-slate-700 py-2 px-3 rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-sm text-slate-700 py-2 px-3 rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="in_review">In Review</option>
            <option value="in_approval">In Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="changes_requested">Changes Requested</option>
          </select>
        </div>
      </div>

      {/* Decisions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-xs text-slate-400 mt-2">Loading decisions...</p>
          </div>
        ) : decisions.length === 0 ? (
          <div className="py-16 text-center px-4">
            <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No decisions found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              No decision records matched your search or filters. Create a new decision to start building organizational knowledge.
            </p>
            <Link
              to="/decisions/new"
              className="inline-flex items-center gap-2 mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Decision</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Decision Title & Context</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Approval Status</th>
                  <th className="py-3.5 px-4">Implementation</th>
                  <th className="py-3.5 px-4">Owner</th>
                  <th className="py-3.5 px-4">Version</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {decisions.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6 min-w-[280px]">
                      <Link
                        to={`/decisions/${d.id}`}
                        className="font-bold text-slate-900 hover:text-blue-600 transition-colors block"
                      >
                        {d.title}
                      </Link>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{d.problem_statement}</p>
                      {d.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {d.tags.map((t) => (
                            <span
                              key={t.id}
                              className="inline-flex items-center text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded"
                            >
                              #{t.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-xs font-medium text-slate-700">
                      {d.category?.name || '?'}
                    </td>
                    <td className="py-4 px-4">
                      <DecisionStatusBadge status={d.status} />
                    </td>
                    <td className="py-4 px-4">
                      <ImplementationStatusBadge status={d.implementation_status} />
                    </td>
                    <td className="py-4 px-4 text-xs">
                      <span className="font-semibold text-slate-800 block">{d.owner_name}</span>
                      <span className="text-slate-400 text-[11px]">{d.owner_email}</span>
                    </td>
                    <td className="py-4 px-4 text-xs font-mono font-semibold text-slate-600">
                      v{d.current_version_no}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        to={`/decisions/${d.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <span>Replay</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
